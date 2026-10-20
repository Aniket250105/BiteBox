import db from './db.js';
import { initSchema } from './schema.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

export function seedDatabase(targetDb = db) {
  // Clear existing tables in reverse dependency order
  targetDb.exec(`
    DROP TABLE IF EXISTS order_status_history;
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS delivery_agents;
    DROP TABLE IF EXISTS coupons;
    DROP TABLE IF EXISTS menu_items;
    DROP TABLE IF EXISTS restaurant_delivery_areas;
    DROP TABLE IF EXISTS restaurants;
    DROP TABLE IF EXISTS customers;
  `);

  // Re-initialize schema
  initSchema(targetDb);

  // 1. Seed Demo Customer
  const passwordHash = bcrypt.hashSync('password123', 10);
  const insertCustomer = targetDb.prepare(`
    INSERT INTO customers (name, email, phone, password_hash, default_address)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertCustomer.run(
    'Aniket Sharma',
    'aniket@bitebox.com',
    '9876543210',
    passwordHash,
    'Presidency University, Itgalpur, Rajanakunte, Bengaluru'
  );

  // 2. Seed Delivery Agents
  const insertAgent = targetDb.prepare(`
    INSERT INTO delivery_agents (id, name, phone, vehicle_model, vehicle_plate, rating, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAgent.run(1, 'Ramesh Kumar', '+91 98765 43210', 'Ather 450X (Electric)', 'KA 03 JJ 9182', 4.9, 1);
  insertAgent.run(2, 'Suresh Patel', '+91 98123 45678', 'Ola S1 Pro (Electric)', 'KA 01 EK 2049', 4.8, 1);

  // 3. Seed Restaurants
  const insertRestaurant = targetDb.prepare(`
    INSERT INTO restaurants (id, name, cuisine, rating, delivery_time_est, is_open, image_url, emoji, price_for_two, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRestaurant.run('r1', 'Spicy Symphony', 'North Indian, Chinese', 4.5, '25-30 min', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', '🍛', 250, 13.1585, 77.5385);
  insertRestaurant.run('r2', 'Burger & Co.', 'American, Fast Food', 4.2, '15-20 min', 1, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', '🍔', 250, 12.9719, 77.6412);
  insertRestaurant.run('r3', 'Green Leaf (Pure Veg)', 'South Indian, Desserts', 4.8, '30-40 min', 1, 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aW5kaWFuJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D', '🌿', 250, 12.9345, 77.6265);
  insertRestaurant.run('r4', 'Midnight Munchies', 'Snacks, Beverages', 3.9, '45-55 min', 0, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80', '🍕', 250, 12.9755, 77.6050);

  // 4. Seed Restaurant Delivery Areas
  const insertArea = targetDb.prepare(`
    INSERT INTO restaurant_delivery_areas (restaurant_id, area_name)
    VALUES (?, ?)
  `);
  // r1 delivers to all 4 hubs
  insertArea.run('r1', 'Presidency University');
  insertArea.run('r1', 'Indiranagar 100ft Rd');
  insertArea.run('r1', 'Koramangala 4th Block');
  insertArea.run('r1', 'MG Road / Church St');

  // r2 delivers to Indiranagar, Koramangala, MG Road
  insertArea.run('r2', 'Indiranagar 100ft Rd');
  insertArea.run('r2', 'Koramangala 4th Block');
  insertArea.run('r2', 'MG Road / Church St');

  // r3 delivers to Presidency, Indiranagar, Koramangala
  insertArea.run('r3', 'Presidency University');
  insertArea.run('r3', 'Indiranagar 100ft Rd');
  insertArea.run('r3', 'Koramangala 4th Block');

  // r4 delivers to Indiranagar, MG Road
  insertArea.run('r4', 'Indiranagar 100ft Rd');
  insertArea.run('r4', 'MG Road / Church St');

  // 5. Seed Menu Items (Matching UI categories: Starters, Mains, Breads, Desserts)
  const insertMenuItem = targetDb.prepare(`
    INSERT INTO menu_items (id, restaurant_id, category, name, price, is_veg, is_available, stock_quantity, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Items for Spicy Symphony (r1)
  insertMenuItem.run('m1', 'r1', 'Starters', 'Paneer Tikka', 240, 1, 1, 40, 'Soft paneer cubes marinated in spices and grilled to perfection.', 'https://c.ndtvimg.com/2024-07/9fe2b05g_paneer-tikka_625x300_01_July_24.jpg');
  insertMenuItem.run('m2', 'r1', 'Starters', 'Chicken Wings 6pcs', 320, 0, 1, 30, 'Crispy fried wings tossed in our signature hot sauce.', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80');
  insertMenuItem.run('m3', 'r1', 'Starters', 'Mushroom Galouti', 280, 1, 0, 0, 'Melt-in-mouth mushroom kebabs (Out of Stock).', 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=300&q=80');
  insertMenuItem.run('m4', 'r1', 'Mains', 'Butter Chicken', 450, 0, 1, 25, 'Classic creamy tomato gravy with roasted chicken.', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80');
  insertMenuItem.run('m5', 'r1', 'Mains', 'Dal Makhani', 310, 1, 1, 35, 'Slow-cooked black lentils in butter and cream.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80');
  insertMenuItem.run('m6', 'r1', 'Breads', 'Garlic Naan', 75, 1, 1, 100, 'Tandoori flatbread topped with garlic and butter.', 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80');
  insertMenuItem.run('m7', 'r1', 'Desserts', 'Gulab Jamun (2pcs)', 90, 1, 1, 50, 'Soft berry-sized balls soaked in rose-flavored sugar syrup.', 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=');

  // Items for Burger & Co. (r2)
  insertMenuItem.run('m201', 'r2', 'Mains', 'Classic Cheeseburger', 220, 0, 1, 30, 'Grilled chicken patty, melted cheddar cheese, and signature relish.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80');
  insertMenuItem.run('m202', 'r2', 'Mains', 'Crispy Veg Burger', 180, 1, 1, 30, 'Crispy potato-peas patty with spicy mayo and lettuce.', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80');
  insertMenuItem.run('m203', 'r2', 'Starters', 'Peri Peri Fries', 130, 1, 1, 50, 'Golden crispy french fries sprinkled with spicy peri peri seasoning.', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80');
  insertMenuItem.run('m204', 'r2', 'Desserts', 'Chocolate Lava Cake', 140, 1, 1, 20, 'Warm chocolate cake with a gooey molten chocolate core.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80');

  // Items for Green Leaf (Pure Veg) (r3)
  insertMenuItem.run('m301', 'r3', 'Mains', 'Masala Dosa', 110, 1, 1, 50, 'Golden crispy crepe filled with spiced potato masala, served with chutneys.', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80');
  insertMenuItem.run('m302', 'r3', 'Starters', 'Idli Vada Combo', 95, 1, 1, 40, 'Two steamed rice cakes and one crispy medu vada with hot sambar.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80');
  insertMenuItem.run('m303', 'r3', 'Breads', 'Malabar Parotta (2pcs)', 60, 1, 1, 60, 'Flaky layered South Indian flatbread.', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80');
  insertMenuItem.run('m304', 'r3', 'Desserts', 'Filter Coffee', 50, 1, 1, 100, 'Authentic frothy South Indian chicory filter coffee.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80');

  // 6. Seed Coupons
  const insertCoupon = targetDb.prepare(`
    INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, is_active, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertCoupon.run('WELCOME50', 'FLAT', 50, 150, 1, '2028-12-31 23:59:59');
  insertCoupon.run('FESTIVE20', 'PERCENT', 20, 200, 1, '2028-12-31 23:59:59');
  insertCoupon.run('BITE100', 'FLAT', 100, 400, 1, '2028-12-31 23:59:59');
}

// Auto-run if executed directly via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.log('🌱 Starting BiteBox database reset and seeding...');
  seedDatabase(db);
  console.log('✅ BiteBox database seeded successfully with:');
  console.log('   - 1 Demo Customer (aniket@bitebox.com / password123)');
  console.log('   - 2 Delivery Agents');
  console.log('   - 4 Restaurants with delivery area constraints');
  console.log('   - 15 Menu Items across Starters, Mains, Breads, Desserts');
  console.log('   - 3 Active Coupons (WELCOME50, FESTIVE20, BITE100)');
}
