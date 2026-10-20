import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Isolate test database via environment variable (default: bitebox.test.db)
const TEST_DB_FILE = process.env.TEST_DB_FILE || process.env.DB_FILE || process.env.DATABASE_FILE || 'bitebox.test.db';
process.env.DB_FILE = TEST_DB_FILE;
process.env.DATABASE_FILE = TEST_DB_FILE;
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
const TEST_PORT = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : 3099;

// 2. Dynamically import database and server so they bind to the test database
const { default: db } = await import('../server/db.js');
const { seedDatabase } = await import('../server/seed.js');
const { default: app } = await import('../server/server.js');

const JWT_SECRET = process.env.JWT_SECRET || 'bitebox_jwt_secret_dev_key_2026';
const API_URL = `http://localhost:${TEST_PORT}/api`;

// Freshly seed the dedicated test database
seedDatabase(db);

// Tokens
const tokenCustomer1 = jwt.sign(
  { id: 1, email: 'aniket@bitebox.com', name: 'Aniket Sharma' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

// Ensure a second customer exists for access-control checks
db.prepare(`
  INSERT OR IGNORE INTO customers (id, name, email, phone, password_hash, default_address)
  VALUES (2, 'Priya Singh', 'priya@bitebox.com', '9812345678', 'dummy_hash', 'Koramangala')
`).run();

const tokenCustomer2 = jwt.sign(
  { id: 2, email: 'priya@bitebox.com', name: 'Priya Singh' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

async function runRegressionSuite() {
  console.log('===============================================================');
  console.log('🚀 BITEBOX CONSOLIDATED REGRESSION & HARDENING TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // =========================================================================
  // STAGE 1: Schema, Seed Data & Repository Integrity
  // =========================================================================
  console.log('📌 [Stage 1] Database Schema, Seeds & Repository Hygiene');
  const expectedTables = [
    'customers', 'restaurants', 'restaurant_delivery_areas', 'menu_items',
    'coupons', 'orders', 'order_items', 'payments', 'order_status_history', 'delivery_agents'
  ];
  for (const table of expectedTables) {
    const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    assert(Boolean(row), `Table "${table}" exists in SQLite database`);
  }

  const gitignoreContent = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
  assert(gitignoreContent.includes('.env'), '.gitignore excludes .env file');
  assert(gitignoreContent.includes('bitebox.db'), '.gitignore excludes bitebox.db SQLite database');
  assert(gitignoreContent.includes('bitebox.test.db'), '.gitignore excludes bitebox.test.db test database');
  assert(db.name.includes(TEST_DB_FILE), `Tests running against isolated test database "${TEST_DB_FILE}"`);

  const demoCustomer = db.prepare(`SELECT * FROM customers WHERE email = 'aniket@bitebox.com'`).get();
  assert(Boolean(demoCustomer), 'Demo customer Aniket Sharma exists in database');

  const agent1 = db.prepare(`SELECT * FROM delivery_agents WHERE id = 1`).get();
  assert(agent1 && agent1.name === 'Ramesh Kumar', 'Default delivery agent #1 is Ramesh Kumar');

  // =========================================================================
  // STAGE 2: Authentication & Token Security
  // =========================================================================
  console.log('\n📌 [Stage 2] Authentication, Input Validation & Token Security');
  // 2a. Generic invalid credentials
  const badLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'aniket@bitebox.com', password: 'wrongpassword' })
  });
  const badLoginData = await badLoginRes.json();
  assert(badLoginRes.status === 401, 'Invalid password returns HTTP 401');
  assert(badLoginData.error === 'Invalid credentials.', `Returns generic "Invalid credentials." error: "${badLoginData.error}"`);

  // 2b. Missing input validation on registration
  const missingRegRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', identifier: 'test@example.com' })
  });
  assert(missingRegRes.status === 400, 'Registration missing password rejected with HTTP 400');

  // Missing password on login returns generic 401
  const missingLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'aniket@bitebox.com' })
  });
  assert(missingLoginRes.status === 401, 'Login missing password returns generic HTTP 401 Invalid credentials');

  // 2c. Successful login
  const validLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'aniket@bitebox.com', password: 'password123' })
  });
  const validLoginData = await validLoginRes.json();
  assert(validLoginRes.status === 200, 'Valid login returns HTTP 200');
  assert(Boolean(validLoginData.token), 'Valid login returns JWT token');
  assert(validLoginData.user?.email === 'aniket@bitebox.com', 'Returns user email in payload');

  // 2d. GET /api/auth/me
  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${tokenCustomer1}` }
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, 'GET /api/auth/me returns HTTP 200');
  assert(meData.user?.id === 1, 'Token correctly resolves customer ID 1');

  // 2e. Expired token rejection
  const expiredToken = jwt.sign(
    { id: 1, email: 'aniket@bitebox.com' },
    JWT_SECRET,
    { expiresIn: '-1s' }
  );
  const expiredRes = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${expiredToken}` }
  });
  assert(expiredRes.status === 401, 'Expired token rejected with HTTP 401');

  // =========================================================================
  // STAGE 3: Restaurants, Menus & Server-Side Coupons
  // =========================================================================
  console.log('\n📌 [Stage 3] Catalog, Service Area Filtering & Coupon Validation');
  // 3a. Delivery area filtering
  const presRes = await fetch(`${API_URL}/restaurants?area=${encodeURIComponent('Presidency University')}`);
  const presData = await presRes.json();
  assert(presRes.status === 200, 'GET /api/restaurants returns HTTP 200 for Presidency University');
  assert(presData.restaurants.length === 2, `Presidency University returns 2 delivery restaurants: ${presData.restaurants.length}`);

  const indRes = await fetch(`${API_URL}/restaurants?area=${encodeURIComponent('Indiranagar 100ft Rd')}`);
  const indData = await indRes.json();
  assert(indData.restaurants.length === 4, `Indiranagar returns 4 restaurants: ${indData.restaurants.length}`);

  // 3b. Menu retrieval
  const menuRes = await fetch(`${API_URL}/restaurants/r1/menu`);
  const menuData = await menuRes.json();
  assert(menuRes.status === 200, 'GET /api/restaurants/r1/menu returns HTTP 200');
  assert(menuData.menu?.length >= 7, `Spicy Symphony has ${menuData.menu?.length} seeded items`);

  // 3c. Coupon server validation
  const fakeCouponRes = await fetch(`${API_URL}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'NONEXISTENT', itemTotal: 500 })
  });
  assert(fakeCouponRes.status === 400, 'Invalid coupon rejected with HTTP 400');

  const minOrderCouponRes = await fetch(`${API_URL}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'BITE100', itemTotal: 250 }) // requires min 400
  });
  assert(minOrderCouponRes.status === 400, 'Sub-minimum order coupon rejected with HTTP 400');

  const validCouponRes = await fetch(`${API_URL}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'WELCOME50', itemTotal: 300 })
  });
  const validCouponData = await validCouponRes.json();
  assert(validCouponRes.status === 200, 'Valid coupon WELCOME50 returns HTTP 200');
  assert(validCouponData.discountAmount === 50, `Calculated discount amount ₹50: ${validCouponData.discountAmount}`);

  // =========================================================================
  // STAGE 4a: Quotes, Order Creation & Payment Transactions
  // =========================================================================
  console.log('\n📌 [Stage 4a] Quotes, Order Placement & Atomic Payments');
  // 4a. Out of stock rejection naming item
  const oosQuoteRes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'r1',
      items: [{ menuItemId: 'm3', quantity: 1 }], // Mushroom Galouti (out of stock)
      deliveryAddress: 'Indiranagar 100ft Rd'
    })
  });
  const oosQuoteData = await oosQuoteRes.json();
  assert(oosQuoteRes.status === 400, 'Out of stock item rejected with HTTP 400');
  assert(oosQuoteData.itemUnavailable === true && oosQuoteData.itemName === 'Mushroom Galouti', 'Names out-of-stock item "Mushroom Galouti"');

  // 4b. Area mismatch rejection
  const areaMismatchRes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'r2', // Burger & Co doesn't deliver to Presidency
      items: [{ menuItemId: 'm201', quantity: 1 }],
      deliveryAddress: 'Presidency University, Itgalpur, Rajanakunte, Bengaluru'
    })
  });
  assert(areaMismatchRes.status === 400, 'Non-service delivery area rejected with HTTP 400');

  // 4c. Order creation takes customer from JWT
  const unauthOrderRes = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'r1',
      items: [{ menuItemId: 'm1', quantity: 1 }],
      deliveryAddress: 'Indiranagar 100ft Rd'
    })
  });
  assert(unauthOrderRes.status === 401, 'Order creation without JWT returns HTTP 401');

  // =========================================================================
  // BILL ARITHMETIC VERIFICATION (User Polish Request)
  // =========================================================================
  console.log('\n📌 [Polish Pass] Bill Arithmetic & Pricing Bug Verification');
  // Verification Scenario 1: Paneer Tikka (m1, ₹240)
  // Base Price: ₹240
  // 5% Tax rounded: Math.round(240 * 0.05) = ₹12
  // Delivery Fee: ₹40
  // Discount: ₹0
  // Expected Total: 240 + 12 + 40 - 0 = ₹292
  const paneerQuoteRes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'r1',
      items: [{ menuItemId: 'm1', quantity: 1 }],
      deliveryAddress: 'Indiranagar 100ft Rd'
    })
  });
  const paneerQuote = await paneerQuoteRes.json();
  assert(paneerQuoteRes.status === 200, 'Paneer Tikka quote returns HTTP 200');
  assert(paneerQuote.itemTotal === 240, `Paneer Tikka base price is ₹240: ${paneerQuote.itemTotal}`);
  assert(paneerQuote.taxAmount === 12, `5% GST rounded is ₹12: ${paneerQuote.taxAmount}`);
  assert(paneerQuote.deliveryFee === 40, `Flat delivery fee is ₹40: ${paneerQuote.deliveryFee}`);
  assert(paneerQuote.discountAmount === 0, `Discount is ₹0: ${paneerQuote.discountAmount}`);
  assert(
    paneerQuote.totalAmount === paneerQuote.itemTotal + paneerQuote.taxAmount + paneerQuote.deliveryFee - paneerQuote.discountAmount,
    `Arithmetic: itemTotal (${paneerQuote.itemTotal}) + tax (${paneerQuote.taxAmount}) + delivery (${paneerQuote.deliveryFee}) - discount (${paneerQuote.discountAmount}) = ${paneerQuote.totalAmount}`
  );
  assert(paneerQuote.totalAmount === 292, `Paneer Tikka grand total is strictly ₹292 (Walkthrough ₹318 was a textual typo): ${paneerQuote.totalAmount}`);

  // Verification Scenario 2: Butter Chicken (m4, ₹450)
  // Base Price: ₹450
  // 5% Tax rounded: Math.round(450 * 0.05) = ₹23 (22.5 rounded)
  // Delivery Fee: ₹40
  // Discount: ₹0
  // Expected Total: 450 + 23 + 40 - 0 = ₹513
  const butterChickenQuoteRes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'r1',
      items: [{ menuItemId: 'm4', quantity: 1 }],
      deliveryAddress: 'Indiranagar 100ft Rd'
    })
  });
  const butterChickenQuote = await butterChickenQuoteRes.json();
  assert(butterChickenQuoteRes.status === 200, 'Butter Chicken quote returns HTTP 200');
  assert(butterChickenQuote.itemTotal === 450, `Butter Chicken base price is ₹450: ${butterChickenQuote.itemTotal}`);
  assert(butterChickenQuote.taxAmount === 23, `5% GST rounded is ₹23: ${butterChickenQuote.taxAmount}`);
  assert(butterChickenQuote.deliveryFee === 40, `Flat delivery fee is ₹40: ${butterChickenQuote.deliveryFee}`);
  assert(butterChickenQuote.discountAmount === 0, `Discount is ₹0: ${butterChickenQuote.discountAmount}`);
  assert(
    butterChickenQuote.totalAmount === butterChickenQuote.itemTotal + butterChickenQuote.taxAmount + butterChickenQuote.deliveryFee - butterChickenQuote.discountAmount,
    `Arithmetic: itemTotal (${butterChickenQuote.itemTotal}) + tax (${butterChickenQuote.taxAmount}) + delivery (${butterChickenQuote.deliveryFee}) - discount (${butterChickenQuote.discountAmount}) = ${butterChickenQuote.totalAmount}`
  );
  assert(butterChickenQuote.totalAmount === 513, `Butter Chicken grand total is strictly ₹513: ${butterChickenQuote.totalAmount}`);

  // Verification Scenario 3: Multiple Items with Coupon
  // 2x Butter Chicken (₹900) + BITE100 coupon (Flat ₹100 off)
  // itemTotal: 900
  // 5% Tax: Math.round(900 * 0.05) = ₹45
  // Delivery Fee: ₹40
  // Discount: ₹100
  // Grand Total: 900 + 45 + 40 - 100 = ₹885
  const multiQuoteRes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'r1',
      items: [{ menuItemId: 'm4', quantity: 2 }],
      deliveryAddress: 'Indiranagar 100ft Rd',
      couponCode: 'BITE100'
    })
  });
  const multiQuote = await multiQuoteRes.json();
  assert(multiQuote.itemTotal === 900, `Multi item total is ₹900: ${multiQuote.itemTotal}`);
  assert(multiQuote.taxAmount === 45, `Tax is ₹45: ${multiQuote.taxAmount}`);
  assert(multiQuote.discountAmount === 100, `Discount is ₹100: ${multiQuote.discountAmount}`);
  assert(
    multiQuote.totalAmount === multiQuote.itemTotal + multiQuote.taxAmount + multiQuote.deliveryFee - multiQuote.discountAmount,
    `Multi-item arithmetic holds: 900 + 45 + 40 - 100 = ${multiQuote.totalAmount}`
  );
  assert(multiQuote.totalAmount === 885, `Multi-item total is strictly ₹885: ${multiQuote.totalAmount}`);

  // =========================================================================
  // STAGE 4b: Decision, Refunds & State Machine
  // =========================================================================
  console.log('\n📌 [Stage 4b] Restaurant Decision, State Machine & Refund Equality');

  // Helper to place and pay for an order
  async function placeAndPayOrder({ menuItemId, qty, paymentMethod = 'UPI' }) {
    const createRes = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCustomer1}`
      },
      body: JSON.stringify({
        restaurantId: 'r1',
        items: [{ menuItemId, quantity: qty }],
        deliveryAddress: '12th Main, Defence Colony, Indiranagar, Bengaluru'
      })
    });
    const orderData = await createRes.json();

    const payRes = await fetch(`${API_URL}/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCustomer1}`
      },
      body: JSON.stringify({
        orderId: orderData.orderId,
        paymentMethod,
        forceFailure: false
      })
    });
    const payData = await payRes.json();
    return { orderId: orderData.orderId, orderNumber: orderData.orderNumber, orderData, payData };
  }

  // 5a. Happy Path Accept & Ramesh Kumar Assignment
  const acceptOrder = await placeAndPayOrder({ menuItemId: 'm1', qty: 1, paymentMethod: 'UPI' });
  const acceptRes = await fetch(`${API_URL}/orders/${acceptOrder.orderId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'ACCEPT' })
  });
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200, 'Accept decision returns HTTP 200');
  assert(acceptData.status === 'confirmed', `Order status is "confirmed": ${acceptData.status}`);
  assert(acceptData.order.delivery_agent_id === 1, `Agent #1 assigned: ${acceptData.order.delivery_agent_id}`);
  assert(acceptData.order.agent?.name === 'Ramesh Kumar', `Assigned partner is Ramesh Kumar: ${acceptData.order.agent?.name}`);

  // 5b. State Machine & Invalid Stage Transition
  const invalidJumpRes = await fetch(`${API_URL}/orders/${acceptOrder.orderId}/advance-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'delivered' }) // Cannot skip preparing, picked_up, out_for_delivery
  });
  assert(invalidJumpRes.status === 400, 'State machine rejects skipping stages with HTTP 400');

  // Valid forward progression
  const sequence = ['preparing', 'picked_up', 'out_for_delivery', 'delivered'];
  for (const st of sequence) {
    const advRes = await fetch(`${API_URL}/orders/${acceptOrder.orderId}/advance-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: st })
    });
    const advData = await advRes.json();
    assert(advRes.status === 200, `Advanced forward to "${st}"`);
    assert(advData.order.status === st, `Order status is "${st}"`);
  }

  // 5c. Rejection with Refund for Butter Chicken (₹513 charged -> ₹513 refunded)
  const m4StockBefore = db.prepare(`SELECT stock_quantity FROM menu_items WHERE id = 'm4'`).get().stock_quantity;
  const rejectOrder = await placeAndPayOrder({ menuItemId: 'm4', qty: 1, paymentMethod: 'CARD' });
  const m4StockDuring = db.prepare(`SELECT stock_quantity FROM menu_items WHERE id = 'm4'`).get().stock_quantity;
  assert(m4StockDuring === m4StockBefore - 1, `Stock deducted when placed: ${m4StockDuring} === ${m4StockBefore - 1}`);

  const rejectRes = await fetch(`${API_URL}/orders/${rejectOrder.orderId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'REJECT', reason: 'Kitchen closed for deep cleaning' })
  });
  const rejectData = await rejectRes.json();
  assert(rejectRes.status === 200, 'Reject decision returns HTTP 200');
  assert(rejectData.status === 'rejected', `Order status is "rejected": ${rejectData.status}`);

  // Verify stock restored
  const m4StockAfter = db.prepare(`SELECT stock_quantity FROM menu_items WHERE id = 'm4'`).get().stock_quantity;
  assert(m4StockAfter === m4StockBefore, `Stock restored atomically on reject: ${m4StockAfter} === ${m4StockBefore}`);

  // REFUND EQUALITY ASSERTION: Refund amount must strictly equal amount charged
  const paymentRow = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(rejectOrder.orderId);
  const orderRow = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(rejectOrder.orderId);
  assert(paymentRow.status === 'REFUNDED', `Payment status is REFUNDED: ${paymentRow.status}`);
  assert(paymentRow.refund_amount === paymentRow.amount, `Refund amount equals amount charged: ₹${paymentRow.refund_amount} === ₹${paymentRow.amount}`);
  assert(paymentRow.refund_amount === orderRow.total_amount, `Refund amount equals order total: ₹${paymentRow.refund_amount} === ₹${orderRow.total_amount}`);
  assert(paymentRow.refund_amount === 513, `Butter Chicken online refund is exactly ₹513: ₹${paymentRow.refund_amount}`);

  // 5d. Cash on Delivery Rejection (No charge made, refund amount = 0)
  const codOrder = await placeAndPayOrder({ menuItemId: 'm6', qty: 2, paymentMethod: 'COD' });
  const rejectCodRes = await fetch(`${API_URL}/orders/${codOrder.orderId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'REJECT', reason: 'COD limit exceeded' })
  });
  const rejectCodData = await rejectCodRes.json();
  assert(rejectCodRes.status === 200, 'COD rejection returns HTTP 200');
  assert(rejectCodData.refund.amount === 0, `COD refund amount is 0: ${rejectCodData.refund.amount}`);
  assert(rejectCodData.refund.message === 'No charge made', `Message confirms "No charge made": "${rejectCodData.refund.message}"`);

  // 5e. Access Control on GET /api/orders/:id
  const strangerRes = await fetch(`${API_URL}/orders/${acceptOrder.orderId}`, {
    headers: { 'Authorization': `Bearer ${tokenCustomer2}` }
  });
  assert(strangerRes.status === 403, 'Unauthorized customer access to order returns HTTP 403');

  // =========================================================================
  // RESTAURANT PORTAL PRIVACY & DEMO GATING
  // =========================================================================
  console.log('\n📌 [Polish Pass] Restaurant Portal Privacy & Endpoint Protection');
  const portalRes = await fetch(`${API_URL}/orders/restaurant/all`);
  assert(portalRes.status === 200, 'GET /api/orders/restaurant/all returns HTTP 200 in DEMO_MODE');
  const portalData = await portalRes.json();
  assert(Array.isArray(portalData.orders) && portalData.orders.length > 0, 'Returns list of orders for kitchen dispatch');

  for (const ord of portalData.orders) {
    assert(ord.order_number !== undefined, `Order includes order number: #${ord.order_number}`);
    assert(Array.isArray(ord.items), 'Order includes items list');
    assert(ord.total_amount !== undefined, `Order includes total amount: ₹${ord.total_amount}`);
    assert(ord.payment_method !== undefined, `Order includes payment type: ${ord.payment_method}`);
    // Privacy assertions: customer names and phone numbers MUST NOT be present
    assert(ord.customer_name === undefined, `Privacy: ord.customer_name is not exposed`);
    assert(ord.customer_phone === undefined, `Privacy: ord.customer_phone is not exposed`);
  }

  // =========================================================================
  // RESET DEMO DATA ENDPOINT
  // =========================================================================
  console.log('\n📌 [Polish Pass] Reset Demo Data Endpoint (POST /api/demo/reset-database)');
  const resetRes = await fetch(`${API_URL}/demo/reset-database`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const resetData = await resetRes.json();
  assert(resetRes.status === 200, 'POST /api/demo/reset-database returns HTTP 200');
  assert(resetData.success === true, 'Returns success: true');

  // Verify all orders and payments are cleared
  const ordersCount = db.prepare(`SELECT COUNT(*) as cnt FROM orders`).get().cnt;
  const paymentsCount = db.prepare(`SELECT COUNT(*) as cnt FROM payments`).get().cnt;
  const orderItemsCount = db.prepare(`SELECT COUNT(*) as cnt FROM order_items`).get().cnt;
  const historyCount = db.prepare(`SELECT COUNT(*) as cnt FROM order_status_history`).get().cnt;
  assert(ordersCount === 0, `All orders cleared: count = ${ordersCount}`);
  assert(paymentsCount === 0, `All payments cleared: count = ${paymentsCount}`);
  assert(orderItemsCount === 0, `All order items cleared: count = ${orderItemsCount}`);
  assert(historyCount === 0, `All status history cleared: count = ${historyCount}`);

  // Verify stock restored
  const m1Stock = db.prepare(`SELECT stock_quantity, is_available FROM menu_items WHERE id = 'm1'`).get();
  const m3Stock = db.prepare(`SELECT stock_quantity, is_available FROM menu_items WHERE id = 'm3'`).get();
  const m4Stock = db.prepare(`SELECT stock_quantity, is_available FROM menu_items WHERE id = 'm4'`).get();
  assert(m1Stock.stock_quantity === 40 && m1Stock.is_available === 1, `Paneer Tikka stock restored to 40`);
  assert(m3Stock.stock_quantity === 0 && m3Stock.is_available === 0, `Mushroom Galouti remains out of stock (0)`);
  assert(m4Stock.stock_quantity === 25 && m4Stock.is_available === 1, `Butter Chicken stock restored to 25`);

  // Verify demo account preserved and login still works
  const postResetLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'aniket@bitebox.com', password: 'password123' })
  });
  assert(postResetLoginRes.status === 200, 'Demo account aniket@bitebox.com logs in successfully after reset');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n===============================================================');
  const total = passed + failed;
  const percentage = Math.round((passed / total) * 100);
  console.log(`📊 CONSOLIDATED REGRESSION SUMMARY: ${passed}/${total} PASSED (${percentage}%)`);
  if (failed === 0) {
    console.log('🎉 ALL BACKEND ASSERTIONS PASSED ACROSS ALL STAGES!');
  } else {
    console.error(`💥 ${failed} ASSERTION(S) FAILED!`);
  }
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  let testServer;
  try {
    await new Promise((resolve, reject) => {
      testServer = app.listen(TEST_PORT, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await runRegressionSuite();
  } catch (err) {
    console.error('Fatal regression suite error:', err);
    process.exit(1);
  } finally {
    if (testServer) {
      await new Promise(resolve => testServer.close(resolve));
    }
    try { db.close(); } catch {}
  }
}

main();
