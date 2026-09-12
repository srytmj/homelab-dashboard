import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { AuthService } from './services/auth.service.js';
import { DockerService } from './services/docker.service.js';
import { ProxmoxService } from './services/proxmox.service.js';
import { SystemService } from './services/system.service.js';
import { TailscaleService } from './services/tailscale.service.js';
import { SslService } from './services/ssl.service.js';
import { CollectorService } from './services/collector.service.js';
import { SentinelService } from './services/sentinel.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  await app.register(fastifyWebsocket);

  // Initialize services
  const authService = new AuthService();
  const dockerService = new DockerService();
  const proxmoxService = new ProxmoxService();
  const systemService = new SystemService();
  const tailscaleService = new TailscaleService();
  const sslService = new SslService();

  let sentinelService: SentinelService | null = null;

  const collectorService = new CollectorService(
    dockerService,
    proxmoxService,
    systemService,
    tailscaleService,
    sslService,
    () => sentinelService?.getStatus()
  );

  sentinelService = new SentinelService(
    dockerService,
    () => collectorService.getLastSnapshot()
  );

  collectorService.start();
  sentinelService.start();

  // Helper to extract bearer token
  const extractToken = (req: any): string => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    if (req.query && req.query.token) {
      return req.query.token as string;
    }
    return '';
  };

  // Auth Protection Hook for /api/*
  app.addHook('preHandler', async (request, reply) => {
    const url = request.url.split('?')[0];

    // Allow public health & auth routes
    if (url === '/api/health' || url.startsWith('/api/auth/')) {
      return;
    }

    // Only protect /api routes
    if (url.startsWith('/api/')) {
      // If no owner is registered yet, prompt client to register
      if (!authService.isRegistered()) {
        reply.status(401).send({ error: 'Initial owner registration required', code: 'SETUP_REQUIRED' });
        return;
      }

      const token = extractToken(request);
      if (!authService.validateToken(token)) {
        reply.status(401).send({ error: 'Unauthorized access. Please login.', code: 'AUTH_REQUIRED' });
        return;
      }
    }
  });

  // WebSocket Route with Auth Check
  app.get('/ws', { websocket: true }, (socket, req) => {
    if (!authService.isRegistered()) {
      socket.send(JSON.stringify({ type: 'ERROR', message: 'Owner setup required' }));
      socket.close();
      return;
    }

    const token = extractToken(req);
    if (!authService.validateToken(token)) {
      socket.send(JSON.stringify({ type: 'ERROR', message: 'Unauthorized WebSocket' }));
      socket.close();
      return;
    }

    collectorService.addClient(socket);
  });

  // REST API: Public Auth Routes
  app.get('/api/auth/status', async (req) => {
    const token = extractToken(req);
    const isAuthenticated = authService.validateToken(token);
    return {
      registered: authService.isRegistered(),
      authenticated: isAuthenticated,
    };
  });

  app.post('/api/auth/register', async (req, reply) => {
    const body = req.body as { username?: string; password?: string };
    const result = authService.registerOwner(body?.username || '', body?.password || '');
    if (!result.success) {
      reply.status(400);
    }
    return result;
  });

  app.post('/api/auth/login', async (req, reply) => {
    const body = req.body as { username?: string; password?: string; rememberMe?: boolean };
    const result = authService.login(body?.username || '', body?.password || '', body?.rememberMe ?? true);
    if (!result.success) {
      reply.status(401);
    }
    return result;
  });

  app.post('/api/auth/logout', async (req) => {
    const token = extractToken(req);
    if (token) {
      authService.logout(token);
    }
    return { success: true, message: 'Logged out successfully.' };
  });

  // REST API: Protected Cockpit Routes
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  });

  app.get('/api/snapshot', async () => {
    const snapshot = await collectorService.collect();
    return snapshot;
  });

  app.get('/api/tailscale', async () => {
    const status = await tailscaleService.getStatus();
    return status;
  });

  app.get('/api/ssl', async () => {
    const certs = await sslService.getCertificates();
    return certs;
  });

  app.get('/api/sentinel', async () => {
    return sentinelService?.getStatus() || { enabled: false, polling: false };
  });

  app.post('/api/docker/prune', async () => {
    const result = await dockerService.pruneSystem();
    return result;
  });

  app.get('/api/containers/:id/logs', async (request) => {
    const { id } = request.params as { id: string };
    const { tail } = request.query as { tail?: string };
    const tailCount = tail ? parseInt(tail, 10) : 100;
    const logs = await dockerService.getLogs(id, tailCount);
    return logs;
  });

  app.post('/api/containers/:id/restart', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await dockerService.restartContainer(id);
    if (!result.success) {
      reply.status(400);
    }
    return result;
  });

  // Serve Client SPA in Production
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    console.log(`[Fastify] Serving static production frontend from ${clientDist}`);
    await app.register(fastifyStatic, {
      root: clientDist,
      prefix: '/',
    });

    app.setNotFoundHandler((req, reply) => {
      if (!req.raw.url?.startsWith('/api') && !req.raw.url?.startsWith('/ws')) {
        reply.sendFile('index.html');
      } else {
        reply.status(404).send({ error: 'Endpoint not found' });
      }
    });
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Server] Shutting down gracefully...');
    sentinelService?.stop();
    collectorService.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`🚀 Homelab Cockpit Server ready at http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap().catch(err => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
