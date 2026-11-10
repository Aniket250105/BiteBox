/**
 * N5.2 Verification: Sustained Load Test
 * - 50 Virtual Users sustained for 60 seconds browsing menus and fetching quotes
 * - 10 Concurrent Full Order Flows (Create Order -> Payment Processing)
 * Reports: Total requests, throughput (req/sec), p95 latency, error rate.
 */

import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:3001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'bitebox_dev_jwt_secret_academic_2026_xyz';
const token = jwt.sign({ id: 1, email: 'aniket@bitebox.com', name: 'Aniket Sharma' }, JWT_SECRET, { expiresIn: '2h' });

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function runSustainedLoad() {
  console.log('===============================================================');
  console.log('⚡ N5.2 SUSTAINED LOAD TEST: 50 VUs for 60s + 10 Order Flows');
  console.log('===============================================================\n');

  const DURATION_MS = 60 * 1000; // 60 seconds
  const NUM_VUS = 50;
  const latencies = [];
  let totalRequests = 0;
  let successfulRequests = 0;
  let errorRequests = 0;

  const tStart = performance.now();
  const tEnd = tStart + DURATION_MS;

  console.log(`🚀 Spawning ${NUM_VUS} Virtual Users for 60 seconds...`);

  // Worker loop for each Virtual User
  async function runVU(vuId) {
    while (performance.now() < tEnd) {
      const isQuote = Math.random() > 0.5;
      const t0 = performance.now();
      try {
        if (isQuote) {
          const res = await fetch(`${API_BASE}/orders/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: 'r1',
              items: [{ id: 'm1', quantity: 1 }],
              deliveryAddress: 'Presidency University, Itgalpur, Rajanakunte, Bengaluru',
              deliveryLat: 13.1693,
              deliveryLng: 77.5348
            })
          });
          if (res.ok) successfulRequests++;
          else errorRequests++;
        } else {
          const res = await fetch(`${API_BASE}/restaurants/r1/menu`);
          if (res.ok) successfulRequests++;
          else errorRequests++;
        }
      } catch (err) {
        errorRequests++;
      }
      const t1 = performance.now();
      latencies.push(t1 - t0);
      totalRequests++;

      // Small 50-100ms think time per VU
      await new Promise(r => setTimeout(r, 60));
    }
  }

  // Launch all 50 VUs concurrently
  await Promise.all(Array.from({ length: NUM_VUS }, (_, i) => runVU(i + 1)));

  const tActualDuration = (performance.now() - tStart) / 1000;
  const throughput = (totalRequests / tActualDuration).toFixed(1);
  const p50 = percentile(latencies, 50).toFixed(1);
  const p95 = percentile(latencies, 95).toFixed(1);
  const max = Math.max(...latencies).toFixed(1);
  const errorRate = ((errorRequests / totalRequests) * 100).toFixed(2);

  console.log(`\n📊 60s Browsing & Quoting Load Summary:`);
  console.log(`- Duration: ${tActualDuration.toFixed(1)} seconds`);
  console.log(`- Total Requests: ${totalRequests}`);
  console.log(`- Successful Requests: ${successfulRequests}`);
  console.log(`- Errors: ${errorRequests} (${errorRate}%)`);
  console.log(`- Throughput: ${throughput} req/sec`);
  console.log(`- Latency: p50 = ${p50} ms, p95 = ${p95} ms, max = ${max} ms`);

  // --- Part 2: 10 Concurrent Full Order Flows ---
  console.log('\n🚀 Executing 10 Concurrent Full Order Flows (Create Order -> Pay)...');
  const orderLatencies = [];
  let orderSuccesses = 0;
  let orderFailures = 0;

  const tStartOrders = performance.now();
  const orderPromises = Array.from({ length: 10 }).map(async (_, idx) => {
    const t0 = performance.now();
    try {
      // 1. Create Order
      const createRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          restaurantId: 'r1',
          items: [{ id: 'm1', quantity: 1 }],
          deliveryAddress: 'Presidency University, Itgalpur, Rajanakunte, Bengaluru',
          deliveryLat: 13.1693,
          deliveryLng: 77.5348
        })
      });
      const orderData = await createRes.json();
      if (!orderData.orderId) {
        orderFailures++;
        return;
      }

      // 2. Pay Order
      const payRes = await fetch(`${API_BASE}/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId: orderData.orderId, paymentMethod: 'UPI' })
      });
      const payData = await payRes.json();
      if (payData.success) {
        orderSuccesses++;
      } else {
        orderFailures++;
      }
    } catch {
      orderFailures++;
    }
    const t1 = performance.now();
    orderLatencies.push(t1 - t0);
  });

  await Promise.all(orderPromises);
  const tOrdersDuration = (performance.now() - tStartOrders) / 1000;
  const ordersP95 = percentile(orderLatencies, 95).toFixed(1);

  console.log(`\n📊 10 Concurrent Order Flows Summary:`);
  console.log(`- Completed in ${tOrdersDuration.toFixed(2)}s`);
  console.log(`- Order Successes: ${orderSuccesses}/10`);
  console.log(`- Order Failures: ${orderFailures}/10`);
  console.log(`- Order Flow p95: ${ordersP95} ms`);

  console.log('\n===============================================================');
  console.log('📌 N5.2 Verdict: PARTIAL (as instructed: single-node SQLite write locking limitation)');
  console.log('===============================================================');

  return {
    totalRequests,
    throughput,
    p50,
    p95,
    max,
    errorRate,
    orderSuccesses,
    orderFailures,
    ordersP95
  };
}

runSustainedLoad();
