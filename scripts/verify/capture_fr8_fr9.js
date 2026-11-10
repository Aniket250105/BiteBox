import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9249;
const SCREENSHOTS_DIR = "C:\\Users\\MAHESH\\OneDrive\\Desktop\\BiteBox\\docs\\verification-screenshots";
const SCRATCH_DIR = "C:\\Users\\MAHESH\\.gemini\\antigravity\\brain\\340260bd-0a7f-44d8-8816-74df513eb9d1\\scratch";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  const profileDir = path.join(SCRATCH_DIR, `edge_fr8_${Date.now()}`);
  fs.mkdirSync(profileDir, { recursive: true });

  const proc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=390,844',
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

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Runtime.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  async function takeScreenshot(filename) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    console.log(`📸 Saved screenshot: ${filename}`);
  }

  try {
    // 1. Capture FR8.1 in Restaurant Portal
    console.log('1. Navigating to Restaurant Portal: http://localhost:5173/?view=restaurant');
    await send('Page.navigate', { url: 'http://localhost:5173/?view=restaurant' });
    await sleep(3000);
    await takeScreenshot('FR8.1.png');

    // 2. Capture FR9.2 in Customer Tracking with Confirmed Order & Agent Card
    console.log('2. Navigating to Customer App and setting active confirmed order 101...');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    // Instant login
    await evaluate(`(() => {
      const demoBtn = document.querySelector('.btn-demo-instant');
      if (demoBtn) demoBtn.click();
    })()`);
    await sleep(1500);

    // Set active order 101 in session and trigger tracking view
    await evaluate(`(() => {
      sessionStorage.setItem('bitebox_active_screen', 'tracking');
      sessionStorage.setItem('bitebox_active_order', JSON.stringify({
        id: 101,
        orderId: 101,
        orderNumber: 'BB-MWA9PV14-6302',
        status: 'confirmed',
        restaurant: {
          id: 'osm_node_13463527993',
          name: 'Cafe Coffee Day',
          cuisine: 'coffee_shop',
          emoji: '☕',
          lat: 13.1686336,
          lng: 77.5352766
        }
      }));
    })()`);
    await send('Page.reload');
    await sleep(3000);

    const trackingText = await evaluate(`document.body.innerText`);
    console.log('Tracking text preview:', trackingText.substring(0, 250).replace(/\n/g, ' '));
    await takeScreenshot('FR9.2.png');
    console.log('Done!');
  } finally {
    try {
      ws.close();
      proc.kill();
    } catch {}
  }
}

capture();

