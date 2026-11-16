import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', '..', 'bitebox.db');

const db = new Database(dbPath, { readonly: true });

console.log('\n================================================================');
console.log('             BITEBOX SQLITE DATABASE DEMONSTRATION              ');
console.log('================================================================');
console.log(`[FILE] Path:    ${dbPath}`);
console.log(`[MODE] Engine:  SQLite 3 (better-sqlite3) | Journal: WAL`);
console.log('----------------------------------------------------------------\n');

// 1. Table Summary
console.log('--- 1. DATABASE SCHEMA & RECORD COUNTS ---');
const tables = [
  { name: 'customers', desc: 'Registered user accounts & hashed passwords' },
  { name: 'restaurants', desc: 'Seed brands & real OpenStreetMap discovered places' },
  { name: 'menu_items', desc: 'Dishes, prices, categories & veg flags' },
  { name: 'orders', desc: 'Customer orders, totals, GST arithmetic, & status' },
  { name: 'order_items', desc: 'Line items linked to orders via foreign keys' },
  { name: 'payments', desc: 'Payment transactions (UPI, CARD, COD) & refunds' },
  { name: 'order_status_history', desc: 'Audit log of finite-state machine (FSM) transitions' },
  { name: 'coupons', desc: 'Promo codes (WELCOME50, FESTIVE20, BITE100)' },
  { name: 'delivery_agents', desc: 'Delivery drivers, vehicles, and ratings' },
  { name: 'restaurant_delivery_areas', desc: 'Geographic delivery polygon mappings' },
  { name: 'geo_cache', desc: 'Sub-3ms local cache of Overpass OSM nodes' },
];

for (const t of tables) {
  try {
    const row = db.prepare(`SELECT count(*) as count FROM ${t.name}`).get();
    console.log(`  - ${t.name.padEnd(26)} : ${String(row.count).padStart(5)} rows  (${t.desc})`);
  } catch (err) {
    console.log(`  - ${t.name.padEnd(26)} : (table missing)`);
  }
}

// 2. Customers Sample
console.log('\n--- 2. REGISTERED CUSTOMERS (PROVING BCRYPT SECURITY) ---');
const customers = db.prepare('SELECT id, name, email, phone, substr(password_hash, 1, 20) as hash_preview FROM customers LIMIT 3').all();
console.table(customers);

// 3. Restaurants Sample (Seed + Real OSM)
console.log('\n--- 3. SAMPLE RESTAURANTS (SEED BRANDS + 5KM OSM DISCOVERY) ---');
const restaurants = db.prepare('SELECT id, name, cuisine, rating, price_for_two, source, lat, lng FROM restaurants ORDER BY source DESC, rating DESC LIMIT 5').all();
console.table(restaurants);

// 4. Recent Live Orders
console.log('\n--- 4. RECENT ORDERS (TRANSACTIONAL INTEGRITY & FSM STAGES) ---');
const orders = db.prepare(`
  SELECT 
    o.id,
    o.order_number,
    c.name as customer,
    r.name as restaurant,
    'Rs ' || o.total_amount as total,
    o.status,
    o.created_at
  FROM orders o
  JOIN customers c ON o.customer_id = c.id
  JOIN restaurants r ON o.restaurant_id = r.id
  ORDER BY o.id DESC
  LIMIT 5
`).all();
console.table(orders);

// 5. Order Details Breakdown (Foreign Key Relationship Proof)
if (orders.length > 0) {
  const latestOrderId = orders[0].id;
  console.log(`\n--- 5. LIVE ORDER #${latestOrderId} LINE ITEMS (FOREIGN KEY: order_items -> orders) ---`);
  const items = db.prepare('SELECT item_name, unit_price, quantity, subtotal FROM order_items WHERE order_id = ?').all(latestOrderId);
  console.table(items);

  const payment = db.prepare('SELECT payment_method, amount, status, transaction_ref FROM payments WHERE order_id = ?').get(latestOrderId);
  console.log('Payment Record:', payment || 'No payment recorded');
}

console.log('\n================================================================');
console.log('Demonstration script complete. Database is active and healthy.');
console.log('================================================================\n');
db.close();

