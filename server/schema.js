// BiteBox SQLite Relational Schema Definition

export const SCHEMA_SQL = `
-- 1. Customers (Users)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  default_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  rating REAL DEFAULT 4.0,
  delivery_time_est TEXT NOT NULL,
  is_open INTEGER DEFAULT 1,
  image_url TEXT,
  emoji TEXT,
  price_for_two INTEGER DEFAULT 250,
  lat REAL NOT NULL,
  lng REAL NOT NULL
);

-- 3. Restaurant Delivery Areas (Relationship: Which areas each restaurant serves)
CREATE TABLE IF NOT EXISTS restaurant_delivery_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  UNIQUE(restaurant_id, area_name)
);

-- 4. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'Starters', 'Mains', 'Breads', 'Desserts'
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  is_veg INTEGER DEFAULT 1,
  is_available INTEGER DEFAULT 1,
  stock_quantity INTEGER DEFAULT 50,
  description TEXT,
  image_url TEXT
);

-- 5. Coupons
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount_type TEXT NOT NULL, -- 'FLAT' or 'PERCENT'
  discount_value INTEGER NOT NULL,
  min_order_amount INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  expires_at DATETIME
);

-- 6. Delivery Agents
CREATE TABLE IF NOT EXISTS delivery_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  rating REAL DEFAULT 4.9,
  is_active INTEGER DEFAULT 1
);

-- 7. Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  delivery_agent_id INTEGER REFERENCES delivery_agents(id),
  coupon_code TEXT REFERENCES coupons(code),
  delivery_address TEXT NOT NULL,
  delivery_lat REAL,
  delivery_lng REAL,
  item_total INTEGER NOT NULL,
  tax_amount INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'PLACED', 'AWAITING_DECISION', 'CONFIRMED', 'PREPARING', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

-- 9. Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL, -- 'UPI', 'CARD', 'COD'
  amount INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
  transaction_ref TEXT UNIQUE,
  attempts INTEGER DEFAULT 1, -- Allows retries on same order
  refund_status TEXT DEFAULT 'NONE', -- 'NONE', 'REFUNDED'
  refund_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  refunded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES delivery_agents(id),
  stage TEXT NOT NULL, -- 'placed', 'awaiting_decision', 'confirmed', 'preparing', 'picked_up', 'out_delivery', 'delivered', 'rejected'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export function initSchema(db) {
  db.exec(SCHEMA_SQL);
}

// Explicit Order Status List
export const ORDER_STATUS_LIST = [
  'placed',
  'paid, awaiting restaurant decision',
  'confirmed',
  'preparing',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'rejected',
  'cancelled'
];

export const ORDER_STATUSES = {
  PLACED: 'placed',
  PAID_AWAITING_RESTAURANT_DECISION: 'paid, awaiting restaurant decision',
  AWAITING_DECISION: 'paid, awaiting restaurant decision',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  PICKED_UP: 'picked_up',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

