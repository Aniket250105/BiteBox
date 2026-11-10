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
const { default: Database } = await import('better-sqlite3');
const { initSchema } = await import('../server/schema.js');
const { seedDatabase } = await import('../server/seed.js');
const { default: app } = await import('../server/server.js');
const {
  normalizeOsmElement,
  haversineDistanceKm,
  getNearbyRestaurants,
  upsertOsmRestaurants
} = await import('../server/services/overpassService.js');
const {
  generateMenuForRestaurant,
  getOrGenerateMenu
} = await import('../server/services/menuGenerator.js');

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
  VALUES (2, 'Priya Singh', 'priya@bitebox.com', '9812345678', '$2b$10$/sOtJBOMluDquDz56jKSSuAVZ6JywHY2AcdxYhPZsbP7hanGr8oAW', 'Koramangala')
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
  // STAGE 5a: Live Nearby Restaurants (OSM), Caching & Expanded Menus
  // =========================================================================
  console.log('\n📌 [Stage 5a] Live Nearby Restaurants (OSM), Caching & Expanded Menus');

  // 1a. Authentication required on GET /api/restaurants/nearby
  const unauthNearbyRes = await fetch(`${API_URL}/restaurants/nearby`);
  assert(unauthNearbyRes.status === 401, 'Unauthenticated GET /api/restaurants/nearby rejected with HTTP 401');

  // 1b. Validation of lat/lng query parameters with authenticated JWT
  const nearbyHeaders = { 'Authorization': `Bearer ${tokenCustomer1}` };

  const noCoordsRes = await fetch(`${API_URL}/restaurants/nearby`, { headers: nearbyHeaders });
  assert(noCoordsRes.status === 400, 'Missing lat/lng returns HTTP 400');

  const nanCoordsRes = await fetch(`${API_URL}/restaurants/nearby?lat=invalid&lng=77.53`, { headers: nearbyHeaders });
  assert(nanCoordsRes.status === 400, 'Non-numeric lat returns HTTP 400');

  const outOfRangeRes = await fetch(`${API_URL}/restaurants/nearby?lat=95&lng=77.53`, { headers: nearbyHeaders });
  assert(outOfRangeRes.status === 400, 'Out-of-range lat (>90) returns HTTP 400');

  const outOfRangeLngRes = await fetch(`${API_URL}/restaurants/nearby?lat=13.16&lng=210`, { headers: nearbyHeaders });
  assert(outOfRangeLngRes.status === 400, 'Out-of-range lng (>180) returns HTTP 400');

  // 1c. Basic Rate Limiting: 30 requests/minute per IP
  const rateLimitIp = '198.51.100.77';
  db.prepare(`
    INSERT OR REPLACE INTO geo_cache (cell_key, fetched_at, payload)
    VALUES ('13.160_77.530_3', CURRENT_TIMESTAMP, '[]')
  `).run();
  let allUnderLimitOk = true;
  for (let i = 0; i < 30; i++) {
    const rlRes = await fetch(`${API_URL}/restaurants/nearby?lat=13.16&lng=77.53`, {
      headers: { ...nearbyHeaders, 'x-forwarded-for': rateLimitIp }
    });
    if (rlRes.status === 429) {
      allUnderLimitOk = false;
      break;
    }
  }
  assert(allUnderLimitOk, 'First 30 nearby requests within 1 minute succeed without 429');

  const rateLimitedRes = await fetch(`${API_URL}/restaurants/nearby?lat=13.16&lng=77.53`, {
    headers: { ...nearbyHeaders, 'x-forwarded-for': rateLimitIp }
  });
  assert(rateLimitedRes.status === 429, '31st nearby request from same IP returns HTTP 429 Too Many Requests');

  // 1d. Idempotent Schema Migration from Old Schema
  const oldDb = new Database(':memory:');
  oldDb.exec(`
    CREATE TABLE customers (id INTEGER PRIMARY KEY);
    CREATE TABLE delivery_agents (id INTEGER PRIMARY KEY);
    CREATE TABLE coupons (code TEXT PRIMARY KEY);
    CREATE TABLE orders (id INTEGER PRIMARY KEY);
    CREATE TABLE restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      rating REAL NOT NULL,
      delivery_time_est TEXT NOT NULL,
      is_open INTEGER NOT NULL DEFAULT 1,
      image_url TEXT,
      emoji TEXT,
      price_for_two INTEGER NOT NULL,
      lat REAL,
      lng REAL
    );
    INSERT INTO restaurants VALUES ('old_1', 'Old Legacy Eatery', 'North Indian', 4.3, '20-25 min', 1, null, '🍲', 300, 13.16, 77.53);
  `);

  initSchema(oldDb);
  const oldCols = oldDb.prepare(`PRAGMA table_info(restaurants)`).all();
  const oldColNames = oldCols.map(c => c.name);
  assert(oldColNames.includes('osm_type'), 'Schema migration adds osm_type column');
  assert(oldColNames.includes('osm_id'), 'Schema migration adds osm_id column');
  assert(oldColNames.includes('source'), 'Schema migration adds source column');
  const dteCol = oldCols.find(c => c.name === 'delivery_time_est');
  assert(dteCol && dteCol.notnull === 0, 'Schema migration makes delivery_time_est nullable');

  // Test inserting OSM restaurant with NULL rating and delivery_time_est
  oldDb.prepare(`
    INSERT INTO restaurants (id, name, cuisine, rating, delivery_time_est, is_open, image_url, emoji, price_for_two, lat, lng, source, osm_type, osm_id)
    VALUES ('osm_node_1001', 'OSM Test Cafe', 'Cafe', NULL, NULL, 1, NULL, '☕', NULL, 13.165, 77.532, 'osm', 'node', 1001)
  `).run();
  const osmCheckRow = oldDb.prepare(`SELECT * FROM restaurants WHERE id = 'osm_node_1001'`).get();
  assert(osmCheckRow && osmCheckRow.rating === null && osmCheckRow.delivery_time_est === null, 'Migrated schema allows NULL rating and delivery_time_est');

  // Assert idempotency by running initSchema a second time
  let migrationError = null;
  try {
    initSchema(oldDb);
  } catch (err) {
    migrationError = err;
  }
  assert(migrationError === null, 'initSchema is idempotent and does not fail on subsequent runs');
  oldDb.close();

  // 2. Overpass normalization, radius filtering (<=3km), and sorting
  const mockCustomerLat = 13.1693;
  const mockCustomerLng = 77.5348;
  const sampleElements = [
    {
      type: 'node',
      id: 88801,
      lat: 13.1650, // ~0.5 km away
      lon: 77.5350,
      tags: { name: 'Close Veg Cafe', amenity: 'cafe', cuisine: 'Cafe', 'diet:vegetarian': 'only' }
    },
    {
      type: 'node',
      id: 88802,
      lat: 13.1550, // ~1.6 km away
      lon: 77.5360,
      tags: { name: 'Mid Distance Diner', amenity: 'restaurant', cuisine: 'North Indian' }
    },
    {
      type: 'node',
      id: 88803,
      lat: 13.1200, // ~5.7 km away (beyond 3 km)
      lon: 77.5300,
      tags: { name: 'Far Away Eatery', amenity: 'restaurant', cuisine: 'Chinese' }
    },
    {
      type: 'node',
      id: 88804,
      lat: 13.1660,
      lon: 77.5340,
      tags: { amenity: 'restaurant' } // Unnamed place
    }
  ];

  const norm1 = normalizeOsmElement(sampleElements[0], mockCustomerLat, mockCustomerLng);
  const norm3 = normalizeOsmElement(sampleElements[2], mockCustomerLat, mockCustomerLng);
  const norm4 = normalizeOsmElement(sampleElements[3], mockCustomerLat, mockCustomerLng);

  assert(norm4 === null, 'Unnamed OSM place is skipped (returns null)');
  assert(norm1 !== null && norm1.distanceKm <= 3.0, 'Nearby restaurant is within 3 km');
  assert(norm3 !== null && norm3.distanceKm > 3.0, 'Distant restaurant correctly calculated > 3 km');
  assert(norm1.isPureVeg === true, 'Pure veg correctly detected from diet:vegetarian=only');
  assert(norm1.rating === null, 'OSM restaurant rating is strictly NULL for honesty');
  assert(norm1.price_for_two === null, 'OSM restaurant price_for_two is strictly NULL');

  // 3. ID collision test: osm_type + osm_id uniqueness
  const insertCollisionTest = db.prepare(`
    INSERT OR REPLACE INTO restaurants (id, name, cuisine, rating, delivery_time_est, is_open, image_url, emoji, price_for_two, lat, lng, source, osm_type, osm_id, address)
    VALUES (?, ?, ?, NULL, NULL, 1, NULL, '🍴', NULL, ?, ?, 'osm', ?, ?, 'Test Address')
  `);
  // Node with id 99991
  insertCollisionTest.run('osm_node_99991', 'Node Place', 'Fast Food', 13.169, 77.534, 'node', 99991);
  // Way with identical numeric id 99991
  insertCollisionTest.run('osm_way_99991', 'Way Place', 'Bakery', 13.169, 77.534, 'way', 99991);

  const nodeRow = db.prepare(`SELECT id, osm_type, osm_id FROM restaurants WHERE id = 'osm_node_99991'`).get();
  const wayRow = db.prepare(`SELECT id, osm_type, osm_id FROM restaurants WHERE id = 'osm_way_99991'`).get();
  assert(nodeRow.osm_type === 'node' && nodeRow.osm_id === 99991, 'osm_node_99991 inserted successfully');
  assert(wayRow.osm_type === 'way' && wayRow.osm_id === 99991, 'osm_way_99991 with same numeric id coexists without collision');

  // 4. Seed and Reset NOT touching geo_cache
  db.prepare(`
    INSERT OR REPLACE INTO geo_cache (cell_key, fetched_at, payload)
    VALUES ('test_protected_cell', CURRENT_TIMESTAMP, '[]')
  `).run();

  // Run seedDatabase
  seedDatabase(db);
  const cacheAfterSeed = db.prepare(`SELECT count(*) as c FROM geo_cache WHERE cell_key = 'test_protected_cell'`).get();
  assert(cacheAfterSeed.c === 1, 'seedDatabase() preserves geo_cache without dropping or deleting it');

  // Call POST /api/demo/reset-database
  const resetCacheRes = await fetch(`${API_URL}/demo/reset-database`, { method: 'POST' });
  assert(resetCacheRes.status === 200, 'POST /api/demo/reset-database returns HTTP 200');
  const cacheAfterReset = db.prepare(`SELECT count(*) as c FROM geo_cache WHERE cell_key = 'test_protected_cell'`).get();
  assert(cacheAfterReset.c === 1, 'Reset Demo Data preserves geo_cache');

  // Clean test key
  db.prepare(`DELETE FROM geo_cache WHERE cell_key = 'test_protected_cell'`).run();

  // 5. Deterministic Menu Generator
  const menuRunA = generateMenuForRestaurant({
    restaurantId: 'osm_node_88801',
    osmId: 88801,
    osmType: 'node',
    cuisine: 'South Indian',
    name: 'Close Veg Cafe',
    isPureVeg: true
  });
  const menuRunB = generateMenuForRestaurant({
    restaurantId: 'osm_node_88801',
    osmId: 88801,
    osmType: 'node',
    cuisine: 'South Indian',
    name: 'Close Veg Cafe',
    isPureVeg: true
  });

  assert(menuRunA.length >= 18 && menuRunA.length <= 28, `Menu generator builds 18-28 items: count = ${menuRunA.length}`);
  assert(JSON.stringify(menuRunA) === JSON.stringify(menuRunB), 'Menu generator is strictly deterministic across runs with same seed');
  const allVeg = menuRunA.every(item => item.is_veg === 1);
  assert(allVeg === true, 'Pure-veg restaurant generates 100% vegetarian menu items');

  const categoriesSet = new Set(menuRunA.map(i => i.category));
  assert(categoriesSet.has('Starters') && categoriesSet.has('Mains') && categoriesSet.has('Desserts'), 'Menu covers required categories');

  const oosItems = menuRunA.filter(i => i.is_available === 0 && i.stock_quantity === 0);
  assert(oosItems.length >= 1, `Deterministically includes out-of-stock items: count = ${oosItems.length}`);

  // Brand-Specific Authentic Menus Verification
  const sagarMenu = generateMenuForRestaurant({
    restaurantId: 'osm_node_11276467448',
    osmId: 11276467448,
    name: 'Vijay Sagar Grand',
    cuisine: 'Restaurant',
    isPureVeg: true
  });
  assert(sagarMenu.every(item => item.is_veg === 1), 'Vijay Sagar Grand generates 100% pure veg South Indian items');
  const sagarNames = sagarMenu.map(i => i.name).join(' ');
  assert(/dosa|idli|vada|coffee|bath/i.test(sagarNames), 'Vijay Sagar Grand menu contains authentic South Indian Sagar dishes');
  assert(!/chicken|mutton|fish|kebab/i.test(sagarNames), 'Vijay Sagar Grand menu contains zero meat or kebabs');

  const dominosMenu = generateMenuForRestaurant({
    restaurantId: 'osm_node_11998178516',
    osmId: 11998178516,
    name: "Domino's",
    cuisine: 'pizza'
  });
  const dominosNames = dominosMenu.map(i => i.name).join(' ');
  assert(/pizza|garlic bread|choco lava/i.test(dominosNames), "Domino's menu contains authentic pizza and breadsticks");

  const presiMenu = generateMenuForRestaurant({
    restaurantId: 'osm_node_7120103',
    osmId: 7120103,
    name: 'Presi Cafe & Bakery',
    cuisine: 'Cafe, Bakery'
  });
  const presiNames = presiMenu.map(i => i.name).join(' ');
  assert(/puff|sandwich|pastry|cappuccino|maggi/i.test(presiNames), 'Presi Cafe & Bakery contains campus cafe & bakery offerings');
  assert(!/wings|biryani|rogan josh/i.test(presiNames), 'Presi Cafe & Bakery contains zero wings or curries');

  // Biryani Specialty Verification (e.g. Rajanakunte Biryani House)
  const biryaniMenu = generateMenuForRestaurant({
    restaurantId: 'osm_node_7120102',
    osmId: 7120102,
    name: 'Rajanakunte Biryani House',
    cuisine: 'Biryani, North Indian'
  });
  const biryaniMains = biryaniMenu.filter(i => i.category === 'Mains');
  const biryaniMainNames = biryaniMains.map(i => i.name).join(' ');
  const biryaniCount = biryaniMains.filter(i => /biryani/i.test(i.name)).length;
  assert(biryaniCount >= 3, `Rajanakunte Biryani House Mains contain multiple biryanis: count = ${biryaniCount}`);
  assert(/dum biryani|chicken biryani|mutton dum biryani/i.test(biryaniMainNames), 'Rajanakunte Biryani House serves authentic biryanis');
  const biryaniImages = biryaniMenu.map(i => i.image_url);
  const hasPizzaImage = biryaniImages.some(img => img.includes('photo-1565299624946-b28f40a0ae38') || img.includes('photo-1593504049359-74330189a345'));
  assert(!hasPizzaImage, 'Rajanakunte Biryani House contains zero mismatched pizza images');

  // 6. Generated-menu stock restore on Reset
  const testOsmRest = {
    id: 'osm_node_7120101',
    osm_id: 7120101,
    osm_type: 'node',
    name: 'New Udupi Grand',
    cuisine: 'South Indian',
    is_pure_veg: true
  };
  const persistedMenu = getOrGenerateMenu(db, testOsmRest);
  const testAvailItem = persistedMenu.find(i => i.is_available === 1);
  assert(Boolean(testAvailItem), 'Found available item in generated menu');

  // Simulate order stock decrement: 50 -> 3
  db.prepare(`UPDATE menu_items SET stock_quantity = 3 WHERE id = ?`).run(testAvailItem.id);
  const stockBeforeReset = db.prepare(`SELECT stock_quantity FROM menu_items WHERE id = ?`).get(testAvailItem.id);
  assert(stockBeforeReset.stock_quantity === 3, 'Simulated stock decrement to 3');

  // Call Reset Demo Data
  await fetch(`${API_URL}/demo/reset-database`, { method: 'POST' });
  const stockAfterReset = db.prepare(`SELECT stock_quantity FROM menu_items WHERE id = ?`).get(testAvailItem.id);
  assert(stockAfterReset.stock_quantity === 50, 'Reset Demo Data restores generated OSM menu items stock to 50');

  // Out of stock item remains 0
  const oosInDb = db.prepare(`SELECT stock_quantity FROM menu_items WHERE id = ?`).get(oosItems[0].id);
  if (oosInDb) {
    assert(oosInDb.stock_quantity === 0, 'Reset Demo Data keeps deterministically out-of-stock items at 0');
  }

  // 7. Multi-tier Cache & Fallback Cascade
  // Clear geo_cache so snapshot fallback is tested on cache miss
  db.prepare(`DELETE FROM geo_cache`).run();

  // 7a. Mock fetcher throwing network error within 1km of Presidency -> Snapshot fallback
  const snapshotRes = await getNearbyRestaurants({
    lat: 13.1693,
    lng: 77.5348,
    radiusKm: 3,
    targetDb: db,
    overpassFetcher: async () => { throw new Error('Overpass network offline'); }
  });
  assert(snapshotRes.source === 'snapshot', `Network failure within 1km falls back to snapshot: ${snapshotRes.source}`);
  assert(snapshotRes.notice === 'Showing saved restaurants', `Snapshot returns notice: "${snapshotRes.notice}"`);
  assert(snapshotRes.restaurants.length > 0, `Snapshot loaded restaurants: count = ${snapshotRes.restaurants.length}`);

  // 7b. Mock fetcher throwing network error > 1km from any hub (e.g. 13.50, 77.90) -> Seeded demo fallback
  const seedFallbackRes = await getNearbyRestaurants({
    lat: 13.5000,
    lng: 77.9000,
    radiusKm: 3,
    targetDb: db,
    overpassFetcher: async () => { throw new Error('Overpass network offline'); }
  });
  assert(seedFallbackRes.source === 'seed-fallback', `Network failure far from hubs falls back to seeded demo: ${seedFallbackRes.source}`);
  assert(seedFallbackRes.notice === 'Live data unavailable. Showing demo restaurants', 'Seeded fallback returns "Live data unavailable. Showing demo restaurants" notice');
  assert(seedFallbackRes.restaurants.some(r => r.id === 'r1'), 'Seeded fallback contains Spicy Symphony (r1)');

  // 7c. Cached cell ~80m away: Recompute exact haversine distance and filter strictly <= 3.0 km
  // Customer requested coordinates:
  const customerExactLat = 13.1693;
  const customerExactLng = 77.5348;
  const targetCellKey = `${Number(customerExactLat).toFixed(3)}_${Number(customerExactLng).toFixed(3)}_3`;

  // Restaurant A: ~2.3 km away from customer (well within 3 km)
  // Restaurant B: ~3.03 km away from customer (beyond 3 km from customer, even if within 3 km of cell center ~80m away)
  const cachedRestA = {
    id: 'osm_node_cache_80m_a',
    name: 'Cached Inside Eatery',
    cuisine: 'Fast Food',
    rating: null,
    delivery_time_est: null,
    is_open: 1,
    image_url: null,
    emoji: '🍕',
    price_for_two: null,
    lat: 13.1900,
    lng: 77.5348,
    source: 'osm',
    osm_type: 'node',
    osm_id: 888001
  };
  const cachedRestB = {
    id: 'osm_node_cache_80m_b',
    name: 'Cached Borderline Eatery',
    cuisine: 'Bakery',
    rating: null,
    delivery_time_est: null,
    is_open: 1,
    image_url: null,
    emoji: '🥐',
    price_for_two: null,
    lat: 13.1966,
    lng: 77.5348,
    source: 'osm',
    osm_type: 'node',
    osm_id: 888002
  };

  upsertOsmRestaurants(db, [cachedRestA, cachedRestB]);
  getOrGenerateMenu(db, cachedRestA);
  getOrGenerateMenu(db, cachedRestB);

  // Seed fresh cache entry with both elements
  db.prepare(`
    INSERT OR REPLACE INTO geo_cache (cell_key, fetched_at, payload)
    VALUES (?, CURRENT_TIMESTAMP, ?)
  `).run(targetCellKey, JSON.stringify([cachedRestA, cachedRestB]));

  const cachedCellRes = await getNearbyRestaurants({
    lat: customerExactLat,
    lng: customerExactLng,
    radiusKm: 3,
    targetDb: db
  });

  const idsInResponse = cachedCellRes.restaurants.map(r => r.id);
  assert(idsInResponse.includes('osm_node_cache_80m_a'), 'Cached restaurant within 3 km is listed');
  assert(!idsInResponse.includes('osm_node_cache_80m_b'), 'Cached restaurant beyond 3 km from customer coordinates in cell 80m away is filtered out');

  // Verify that the listed restaurant is accepted at quote (never listed and then rejected)
  const menuA = db.prepare(`SELECT id FROM menu_items WHERE restaurant_id = ? AND is_available = 1`).all('osm_node_cache_80m_a');
  const quoteCachedARes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCustomer1}` },
    body: JSON.stringify({
      restaurantId: 'osm_node_cache_80m_a',
      items: [{ menuItemId: menuA[0].id, quantity: 1 }],
      deliveryAddress: 'Presidency University, Bengaluru',
      deliveryLat: customerExactLat,
      deliveryLng: customerExactLng
    })
  });
  assert(quoteCachedARes.status === 200, 'Listed cached restaurant within 3 km is accepted at quote without rejection');

  // 8. Server-side Delivery Eligibility: OSM vs Seeded
  // 8a. OSM restaurant within 3 km -> Quote accepted (200)
  const nearbyOsmQuoteRes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'osm_node_7120101',
      items: [{ menuItemId: testAvailItem.id, quantity: 2 }],
      deliveryAddress: 'Presidency University, Bengaluru',
      deliveryLat: 13.1693,
      deliveryLng: 77.5348
    })
  });
  assert(nearbyOsmQuoteRes.status === 200, 'OSM restaurant quote within 3 km accepted with HTTP 200');

  // 8b. OSM restaurant beyond 3 km -> Quote rejected with 400
  const distantOsmQuoteRes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'osm_node_7120101', // At Presidency (13.16)
      items: [{ menuItemId: testAvailItem.id, quantity: 1 }],
      deliveryAddress: 'Koramangala 4th Block, Bengaluru',
      deliveryLat: 12.9345, // ~28 km away
      deliveryLng: 77.6265
    })
  });
  assert(distantOsmQuoteRes.status === 400, 'OSM restaurant beyond 3 km rejected by server quote with HTTP 400');
  const distantQuoteData = await distantOsmQuoteRes.json();
  assert(distantQuoteData.error.includes('delivery radius'), `Clear delivery radius error: "${distantQuoteData.error}"`);

  // 8c. Seeded restaurant with GPS coordinates in fallback mode is accepted
  const seedGpsQuoteRes = await fetch(`${API_URL}/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'r1',
      items: [{ menuItemId: 'm1', quantity: 1 }],
      deliveryAddress: 'GPS Detected Location, Karnataka',
      deliveryLat: 13.1693,
      deliveryLng: 77.5348
    })
  });
  assert(seedGpsQuoteRes.status === 200, 'Seeded restaurant in GPS fallback mode is accepted by server quote');

  // 9. Complete Order Lifecycle on an OSM Restaurant (Quote -> Order -> Pay -> Reject -> Refund & Stock restore)
  // Step 9a: Create Order
  const createOsmOrderRes = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCustomer1}`
    },
    body: JSON.stringify({
      restaurantId: 'osm_node_7120101',
      items: [{ menuItemId: testAvailItem.id, quantity: 2 }],
      deliveryAddress: 'Presidency Gate 2, Bengaluru',
      deliveryLat: 13.1693,
      deliveryLng: 77.5348
    })
  });
  assert(createOsmOrderRes.status === 201, 'OSM restaurant order creation returns HTTP 201');
  const osmOrderData = await createOsmOrderRes.json();
  const osmOrderId = osmOrderData.orderId || osmOrderData.order?.id;
  const osmTotalAmount = osmOrderData.totalAmount || osmOrderData.order?.total_amount || osmOrderData.order?.totalAmount;
  assert(Boolean(osmOrderId), 'Received valid order ID for OSM order');

  // Step 9b: Process UPI Payment
  const osmPayRes = await fetch(`${API_URL}/payments/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCustomer1}`
    },
    body: JSON.stringify({
      orderId: osmOrderId,
      paymentMethod: 'UPI'
    })
  });
  assert(osmPayRes.status === 200, 'OSM order UPI payment processed successfully');
  const osmPayData = await osmPayRes.json();
  assert(osmPayData.status === 'SUCCESS', 'OSM order payment status is SUCCESS');

  // Stock deducted: 50 - 2 = 48
  const stockAfterPay = db.prepare(`SELECT stock_quantity FROM menu_items WHERE id = ?`).get(testAvailItem.id);
  assert(stockAfterPay.stock_quantity === 48, 'Stock deducted atomically on payment (50 - 2 = 48)');

  // Step 9c: Kitchen Rejection & Atomic Refund
  const osmRejectRes = await fetch(`${API_URL}/orders/${osmOrderId}/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCustomer1}`
    },
    body: JSON.stringify({
      decision: 'reject',
      reason: 'Kitchen at full capacity'
    })
  });
  assert(osmRejectRes.status === 200, 'OSM restaurant order rejection returns HTTP 200');
  const osmRejectData = await osmRejectRes.json();
  assert(osmRejectData.order?.status === 'rejected' || osmRejectData.status === 'rejected', 'OSM order status transitioned to "rejected"');
  const refundStatus = osmRejectData.refund?.status || osmRejectData.payment?.refundStatus;
  const refundAmount = osmRejectData.refund?.amount ?? osmRejectData.payment?.refundAmount;
  assert(refundStatus === 'REFUNDED', 'Payment status marked REFUNDED');
  assert(refundAmount === osmTotalAmount, `Full order total refunded (₹${refundAmount} === ₹${osmTotalAmount})`);

  // Stock restored: 48 + 2 = 50
  const stockAfterReject = db.prepare(`SELECT stock_quantity FROM menu_items WHERE id = ?`).get(testAvailItem.id);
  assert(stockAfterReject.stock_quantity === 50, 'Stock restored atomically upon order rejection (48 -> 50)');

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
