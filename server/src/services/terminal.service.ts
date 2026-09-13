import fs from 'node:fs';
import { Client as SshClient } from 'ssh2';
import type { WebSocket } from 'ws';
import { config } from '../config.js';
import { ProcessMetric } from '../types.js';

const REMOTE_PROCESS_CACHE_TTL_MS = 4000;
// Fixed, read-only, hardcoded — the one exception to "no command whitelist"
// this service otherwise carries. This does not widen the blast radius:
// every target here already grants the owner's key full interactive shell
// access, so a single read-only `ps` is strictly narrower, not an escalation.
const REMOTE_PROCESS_COMMAND = 'ps -eo pid,%cpu,%mem,rss,user,comm --no-headers --sort=-%cpu | head -50';

/**
 * Full interactive shell access — intentionally no command whitelist here,
 * unlike every other service in this repo. See CLAUDE.md before touching
 * this file. Targets come only from config.sshTargets (.env), never from a
 * client-supplied host/user/port.
 */
export class TerminalService {
  private remoteProcessCache: Map<string, { data: ProcessMetric[]; timestamp: number }> = new Map();

  public getTargetNames(): string[] {
    return config.sshTargets.map((t) => t.name);
  }

  /**
   * One-shot `ps` over SSH for the Processes page — see REMOTE_PROCESS_COMMAND
   * above for why this is safe despite every other service in this repo
   * running only pre-registered commands. Cached briefly since the page
   * polls every few seconds and a fresh SSH connection per poll is wasteful.
   */
  public async getRemoteProcesses(targetName: string): Promise<ProcessMetric[]> {
    const cached = this.remoteProcessCache.get(targetName);
    if (cached && Date.now() - cached.timestamp < REMOTE_PROCESS_CACHE_TTL_MS) {
      return cached.data;
    }

    const target = config.sshTargets.find((t) => t.name === targetName);
    if (!target) return [];

    let privateKey: Buffer;
    try {
      privateKey = fs.readFileSync(config.sshPrivateKeyPath);
    } catch {
      return [];
    }

    const result = await new Promise<ProcessMetric[]>((resolve) => {
      const client = new SshClient();
      let settled = false;
      const finish = (value: ProcessMetric[]) => {
        if (settled) return;
        settled = true;
        client.end();
        resolve(value);
      };

      client
        .on('ready', () => {
          client.exec(REMOTE_PROCESS_COMMAND, (err, stream) => {
            if (err) return finish([]);
            let output = '';
            stream.on('data', (chunk: Buffer) => (output += chunk.toString()));
            stream.on('close', () => finish(this.parsePsOutput(output, targetName)));
            stream.stderr.on('data', () => {});
          });
        })
        .on('error', () => finish([]))
        .connect({ host: target.host, port: target.port, username: target.user, privateKey, readyTimeout: 8000 });
    });

    this.remoteProcessCache.set(targetName, { data: result, timestamp: Date.now() });
    return result;
  }

  private parsePsOutput(output: string, hostLabel: string): ProcessMetric[] {
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line): ProcessMetric | null => {
        const parts = line.split(/\s+/);
        if (parts.length < 6) return null;
        const [pid, cpu, mem, rss, user, ...commParts] = parts;
        return {
          pid: Number(pid),
          name: commParts.join(' '),
          command: `${hostLabel}: ${commParts.join(' ')}`,
          user,
          cpuPercent: Number(cpu) || 0,
          memPercent: Number(mem) || 0,
          memBytes: (Number(rss) || 0) * 1024,
          state: 'running',
          source: `ssh:${hostLabel}`,
        };
      })
      .filter((p): p is ProcessMetric => p !== null);
  }

  public openSession(targetName: string, ws: WebSocket) {
    const target = config.sshTargets.find((t) => t.name === targetName);
    if (!target) {
      ws.send(JSON.stringify({ type: 'error', message: `Unknown SSH target "${targetName}"` }));
      ws.close();
      return;
    }

    let privateKey: Buffer;
    try {
      privateKey = fs.readFileSync(config.sshPrivateKeyPath);
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'SSH private key not found on the daemon' }));
      ws.close();
      return;
    }

    const client = new SshClient();

    client
      .on('ready', () => {
        client.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, stream) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
            ws.close();
            client.end();
            return;
          }

          stream.on('data', (data: Buffer) => {
            if (ws.readyState === ws.OPEN) ws.send(data);
          });

          stream.on('close', () => {
            client.end();
            ws.close();
          });

          ws.on('message', (raw: Buffer) => {
            try {
              const msg = JSON.parse(raw.toString());
              if (msg.type === 'input') {
                stream.write(msg.data);
              } else if (msg.type === 'resize' && msg.cols && msg.rows) {
                stream.setWindow(msg.rows, msg.cols, 0, 0);
              }
            } catch {
              // ignore malformed frames
            }
          });

          ws.on('close', () => {
            stream.end();
            client.end();
          });
        });
      })
      .on('error', (err) => {
        ws.send(JSON.stringify({ type: 'error', message: `SSH connection failed: ${err.message}` }));
        ws.close();
      })
      .connect({
        host: target.host,
        port: target.port,
        username: target.user,
        privateKey,
      });
  }
}
