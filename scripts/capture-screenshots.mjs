import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from '../server/node_modules/ws/index.js';

const token = '7c6d44d0b7c8c4e5c478d0c4ffbb9f430a7ebf6e53a840ac97ab477d60ac6044';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const screenshotsDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Start the server if not already running
  let serverProc = null;
  try {
    const res = await fetch('http://127.0.0.1:3000/api/health');
    if (!res.ok) throw new Error('Not healthy');
  } catch {
    console.log('Starting backend server on port 3000...');
    serverProc = spawn('node', ['server/dist/index.js'], {
      env: { ...process.env, PORT: '3000' },
      stdio: 'inherit'
    });
    await wait(3000);
  }

  console.log('Starting Chromium...');
  const chrome = spawn('chromium', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    'about:blank'
  ]);

  await wait(2000);

  const res = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await res.json();
  const pageTarget = targets.find((t) => t.type === 'page');
  if (!pageTarget) throw new Error('No page target found');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  await new Promise((resolve) => ws.on('open', resolve));

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1.5,
    mobile: false
  });

  // Navigate to set domain context for localStorage
  await send('Page.navigate', { url: 'http://127.0.0.1:3000' });
  await wait(2000);

  // Set tokens and theme
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('cockpit_token', '${token}');
      localStorage.setItem('cockpit_user', 'admin');
      localStorage.setItem('cockpit_theme', 'dark');
      document.documentElement.classList.remove('light');
    `
  });

  // Overview Page
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
  await wait(3500);
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'overview.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved docs/screenshots/overview.png');

  // Fleet Page
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/fleet' });
  await wait(2500);
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'fleet.png'), Buffer.from(ss2.data, 'base64'));
  console.log('Saved docs/screenshots/fleet.png');

  // Infra Page
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/infra' });
  await wait(2500);
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'infra.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved docs/screenshots/infra.png');

  ws.close();
  chrome.kill();
  if (serverProc) serverProc.kill();
  console.log('Screenshot capture finished successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
