import fs from 'node:fs';
import { Client as SshClient } from 'ssh2';
import type { WebSocket } from 'ws';
import { config } from '../config.js';

/**
 * Full interactive shell access — intentionally no command whitelist here,
 * unlike every other service in this repo. See CLAUDE.md before touching
 * this file. Targets come only from config.sshTargets (.env), never from a
 * client-supplied host/user/port.
 */
export class TerminalService {
  public getTargetNames(): string[] {
    return config.sshTargets.map((t) => t.name);
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
