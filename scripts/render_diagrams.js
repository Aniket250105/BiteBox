import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9255;
const rootDir = "C:\\Users\\MAHESH\\OneDrive\\Desktop\\BiteBox";
const SCRATCH_DIR = "C:\\Users\\MAHESH\\.gemini\\antigravity\\brain\\340260bd-0a7f-44d8-8816-74df513eb9d1\\scratch";

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function renderDiagrams() {
  const profileDir = path.join(SCRATCH_DIR, `edge_diagrams_${Date.now()}`);
  fs.mkdirSync(profileDir, { recursive: true });

  const proc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1400,800',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ]);

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      versionData = await res.json();
      if (versionData && versionData.length > 0) break;
    } catch {}
  }

  const page = versionData.find(p => p.type === 'page') || versionData[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 800,
    deviceScaleFactor: 2,
    mobile: false
  });

  const diagrams = [
    { html: 'architecture_diagram.html', png: 'architecture_diagram.png' },
    { html: 'usecase_diagram.html', png: 'usecase_diagram.png' },
    { html: 'activity_diagram.html', png: 'activity_diagram.png' }
  ];

  try {
    for (const d of diagrams) {
      const fileUrl = 'file:///' + path.join(rootDir, 'docs', d.html).replace(/\\/g, '/');
      console.log(`Rendering ${d.html}...`);
      await send('Page.navigate', { url: fileUrl });
      await sleep(1500);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const outPath = path.join(rootDir, 'docs', d.png);
      fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
      console.log(`✅ Saved ${d.png} (${fs.statSync(outPath).size} bytes)`);
    }
  } finally {
    try {
      ws.close();
      proc.kill();
    } catch {}
  }
}

renderDiagrams().catch(console.error);

