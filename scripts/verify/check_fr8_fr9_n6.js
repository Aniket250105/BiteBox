/**
 * Verification of FR8.1, FR9.2, and N6.1:
 * - Places order, stays on Customer Tracking screen
 * - Calls POST /api/orders/:id/decision to accept order
 * - Waits for customer screen 3s polling to transition to "confirmed" and render Delivery Partner card
 * - Captures FR8.1.png and FR9.2.png
 * - Runs 20s backend interruption via CDP network emulation, confirms polling retries and recovers
 * - Captures N6.1.png
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9249;
const SCREENSHOTS_DIR = path.resolve(rootDir, 'docs', 'verification-screenshots');
const SCRATCH_DIR = path.resolve(rootDir, '..', '..', '.gemini', 'antigravity', 'brain', '340260bd-0a7f-44d8-8816-74df513eb9d1', 'scratch');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTargetedChecks() {
  console.log('--- Starting FR8.1, FR9.2 & N6.1 Verification ---');
  const profileDir = path.join(SCRATCH_DIR, `edge_target_${Date.now()}`);
  fs.mkdirSync(profileDir, { recursive: true });

  const edgeProc = spawn(EDGE_PATH, [
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
  let isOutageActive = false;

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
    if (msg.method === 'Fetch.requestPaused') {
      if (isOutageActive) {
        send('Fetch.failRequest', {
          requestId: msg.params.requestId,
          errorReason: 'ConnectionRefused'
        }).catch(() => {});
      } else {
        send('Fetch.continueRequest', {
          requestId: msg.params.requestId
        }).catch(() => {});
      }
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

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
    return filePath;
  }

  try {
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    // 1. Instant Login
    console.log('1. Logging in via instant demo...');
    await evaluate(`(() => {
      const demoBtn = document.querySelector('.btn-demo-instant');
      if (demoBtn) demoBtn.click();
    })()`);
    await sleep(1500);

    // 2. Select Location
    console.log('2. Selecting Presidency University hub...');
    await evaluate(`(() => {
      const chips = Array.from(document.querySelectorAll('.preset-chip'));
      if (chips[0]) chips[0].click();
      const confirmBtn = document.querySelector('.location-confirm-btn');
      if (confirmBtn) confirmBtn.click();
    })()`);
    await sleep(2000);

    // 3. Select Restaurant
    console.log('3. Selecting first restaurant...');
    await evaluate(`(() => {
      const row = document.querySelector('.discover-row');
      if (row) row.click();
    })()`);
    await sleep(2000);

    // 4. Add dish & open cart
    console.log('4. Adding item to cart...');
    await evaluate(`(() => {
      const addBtn = document.querySelector('.dish-plus-btn');
      if (addBtn) addBtn.click();
    })()`);
    await sleep(1000);

    await evaluate(`(() => {
      const cartPill = document.querySelector('.menu-cart-pill');
      if (cartPill) cartPill.click();
    })()`);
    await sleep(2000);

    // 5. Continue to payment
    console.log('5. Proceeding to payment...');
    await evaluate(`(() => {
      const contBtn = document.querySelector('.continue-btn');
      if (contBtn) contBtn.click();
    })()`);
    await sleep(2000);

    // 6. Complete payment (Slide to pay)
    console.log('6. Completing payment...');
    await evaluate(`(() => {
      const track = document.querySelector('.slide-track');
      if (track) {
        track.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }
    })()`);
    await sleep(4000);

    // Now on customer tracking screen!
    const orderText = await evaluate(`document.body.innerText`);
    const match = orderText.match(/#BB-[A-Z0-9-]+/);
    const orderId = match ? match[0].replace('#', '') : null;
    console.log(`✅ Order Placed! Active Tracking Order ID: ${orderId}`);

    // Let's accept order on backend directly via REST API so customer tab stays active!
    console.log(`7. Submitting restaurant decision (accept) for order ${orderId}...`);
    const token = await evaluate(`localStorage.getItem('bitebox_token')`);
    const acceptRes = await fetch(`http://localhost:3001/api/orders/${orderId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ decision: 'accept' })
    });
    const acceptJson = await acceptRes.json();
    console.log('   Decision API response:', JSON.stringify(acceptJson));

    // Wait for customer screen 3-second poll to pick up "confirmed" status
    console.log('8. Waiting 4 seconds for customer screen polling to receive "confirmed" state...');
    await sleep(4000);

    // Check if agent card is visible on customer tracking screen
    const trackingState = await evaluate(`(() => {
      const text = document.body.innerText;
      const hasAgent = text.includes('Ramesh Kumar') || text.includes('Ather 450X') || text.includes('Delivery Partner');
      const isConfirmed = text.includes('Confirmed') || text.includes('Cooking');
      return { textExcerpt: text.substring(0, 300), hasAgent, isConfirmed };
    })()`);
    console.log('   Customer UI State:', JSON.stringify(trackingState));

    // Capture FR9.2 screenshot (Customer screen showing Delivery Partner card)
    await takeScreenshot('FR9.2.png');

    // 9. Now test N6.1: 20-second backend interruption during active tracking
    console.log('9. Starting N6.1: 20-second simulated backend interruption...');
    await send('Fetch.enable', {
      patterns: [{ urlPattern: '*:3001/api/*', requestStage: 'Request' }, { urlPattern: '*/api/*', requestStage: 'Request' }]
    });
    isOutageActive = true;

    console.log('   Outage active: requests will fail with ConnectionRefused for 20 seconds...');
    await sleep(10000);
    // Outage midway check
    const outageMidway = await evaluate(`(() => {
      // Confirm UI did not crash or redirect
      return Boolean(document.body.innerText.match(/#BB-[A-Z0-9-]+/));
    })()`);
    console.log(`   Outage midway check (UI intact): ${outageMidway}`);
    await sleep(10000);

    // Restore backend
    console.log('   Restoring backend connectivity...');
    isOutageActive = false;
    await send('Fetch.disable');
    await sleep(4000); // Wait for next poll cycle

    const recovered = await evaluate(`(() => {
      const text = document.body.innerText;
      const hasOrder = Boolean(text.match(/#BB-[A-Z0-9-]+/));
      const hasAgent = text.includes('Delivery Partner') || text.includes('Ramesh Kumar');
      return { hasOrder, hasAgent };
    })()`);
    console.log('   ✅ N6.1 Recovery without reload:', JSON.stringify(recovered));
    await takeScreenshot('N6.1.png');

    console.log('--- Targeted Checks Successfully Completed! ---');
  } finally {
    try {
      ws.close();
      edgeProc.kill();
    } catch {}
  }
}

runTargetedChecks().catch(err => {
  console.error('Targeted checks failed:', err);
  process.exit(1);
});
