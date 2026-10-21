import db from './db.js';
import { initSchema } from './schema.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

export function seedDatabase(targetDb = db) {
  // Ensure all tables exist without dropping geo_cache or OSM data
  initSchema(targetDb);

  // Clear operational tables and seeded records only
  targetDb.exec(`
    DELETE FROM order_status_history;
    DELETE FROM payments;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM delivery_agents;
    DELETE FROM coupons;
    DELETE FROM restaurant_delivery_areas WHERE restaurant_id IN ('r1', 'r2', 'r3', 'r4');
    DELETE FROM menu_items WHERE restaurant_id IN ('r1', 'r2', 'r3', 'r4');
    DELETE FROM restaurants WHERE source = 'seed' OR id IN ('r1', 'r2', 'r3', 'r4');
    DELETE FROM customers WHERE id = 1;
  `);

  // 1. Seed Demo Customer
  const passwordHash = bcrypt.hashSync('password123', 10);
  const insertCustomer = targetDb.prepare(`
    INSERT OR REPLACE INTO customers (id, name, email, phone, password_hash, default_address)
    VALUES (1, ?, ?, ?, ?, ?)
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
    INSERT OR REPLACE INTO delivery_agents (id, name, phone, vehicle_model, vehicle_plate, rating, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAgent.run(1, 'Ramesh Kumar', '+91 98765 43210', 'Ather 450X (Electric)', 'KA 03 JJ 9182', 4.9, 1);
  insertAgent.run(2, 'Suresh Patel', '+91 98123 45678', 'Ola S1 Pro (Electric)', 'KA 01 EK 2049', 4.8, 1);

  // 3. Seed Restaurants (source = 'seed')
  const insertRestaurant = targetDb.prepare(`
    INSERT OR REPLACE INTO restaurants (id, name, cuisine, rating, delivery_time_est, is_open, image_url, emoji, price_for_two, lat, lng, source, osm_type, osm_id, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'seed', NULL, NULL, ?)
  `);
  insertRestaurant.run('r1', 'Spicy Symphony', 'North Indian, Chinese', 4.5, '25-30 min', 1, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', '🍛', 250, 13.1585, 77.5385, 'Doddaballapur Main Rd, Rajanakunte, Bengaluru');
  insertRestaurant.run('r2', 'Burger & Co.', 'American, Fast Food', 4.2, '15-20 min', 1, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', '🍔', 250, 12.9719, 77.6412, '100 Feet Rd, Indiranagar, Bengaluru');
  insertRestaurant.run('r3', 'Green Leaf (Pure Veg)', 'South Indian, Desserts', 4.8, '30-40 min', 1, 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aW5kaWFuJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D', '🌿', 250, 12.9345, 77.6265, '80 Feet Rd, 4th Block, Koramangala, Bengaluru');
  insertRestaurant.run('r4', 'Midnight Munchies', 'Snacks, Beverages', 3.9, '45-55 min', 0, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80', '🍕', 250, 12.9755, 77.6050, 'Church Street, near MG Road Metro, Bengaluru');

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

  // 5. Seed Menu Items
  const insertMenuItem = targetDb.prepare(`
    INSERT INTO menu_items (id, restaurant_id, category, name, price, is_veg, is_available, stock_quantity, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // --- Items for Spicy Symphony (r1) - 20 items ---
  // Starters
  insertMenuItem.run('m1', 'r1', 'Starters', 'Paneer Tikka', 240, 1, 1, 40, 'Soft paneer cubes marinated in spices and grilled to perfection.', 'https://c.ndtvimg.com/2024-07/9fe2b05g_paneer-tikka_625x300_01_July_24.jpg');
  insertMenuItem.run('m2', 'r1', 'Starters', 'Chicken Wings 6pcs', 320, 0, 1, 30, 'Crispy fried wings tossed in our signature hot sauce.', 'https://images.unsplash.com/photo-1527477378408-1bc0939525e9?w=300&q=80');
  insertMenuItem.run('m3', 'r1', 'Starters', 'Mushroom Galouti', 280, 1, 0, 0, 'Melt-in-mouth mushroom kebabs (Out of Stock).', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80');
  insertMenuItem.run('m108', 'r1', 'Starters', 'Chilli Paneer Dry', 260, 1, 1, 35, 'Wok-tossed paneer with bell peppers, spring onions and soy chili glaze.', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80');
  insertMenuItem.run('m109', 'r1', 'Starters', 'Crispy Corn Salt & Pepper', 210, 1, 1, 40, 'Golden fried sweet corn kernels tossed with crushed pepper and herbs.', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80');
  insertMenuItem.run('m110', 'r1', 'Starters', 'Tandoori Chicken (Half)', 360, 0, 1, 25, 'Classic clay-oven roasted chicken with Punjabi spices.', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80');
  // Mains
  insertMenuItem.run('m4', 'r1', 'Mains', 'Butter Chicken', 450, 0, 1, 25, 'Classic creamy tomato gravy with roasted chicken.', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80');
  insertMenuItem.run('m5', 'r1', 'Mains', 'Dal Makhani', 310, 1, 1, 35, 'Slow-cooked black lentils in butter and cream.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80');
  insertMenuItem.run('m111', 'r1', 'Mains', 'Paneer Butter Masala', 340, 1, 1, 30, 'Cottage cheese simmered in rich buttery makhani gravy.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80');
  insertMenuItem.run('m112', 'r1', 'Mains', 'Kadai Veg Melange', 290, 1, 1, 30, 'Assorted fresh garden vegetables cooked in freshly ground kadai masala.', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80');
  insertMenuItem.run('m113', 'r1', 'Mains', 'Chicken Dum Biryani', 380, 0, 1, 35, 'Fragrant aged basmati rice cooked with spiced chicken and saffron aromatics.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80');
  insertMenuItem.run('m114', 'r1', 'Mains', 'Veg Fried Rice', 230, 1, 1, 40, 'Wok-tossed rice with shredded seasonal greens and garlic.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80');
  insertMenuItem.run('m115', 'r1', 'Mains', 'Hakka Chili Garlic Noodles', 240, 1, 1, 40, 'Stir-fried noodles with crisp veggies and hot chili oil.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80');
  // Breads
  insertMenuItem.run('m6', 'r1', 'Breads', 'Garlic Naan', 75, 1, 1, 100, 'Tandoori flatbread topped with garlic and butter.', 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80');
  insertMenuItem.run('m116', 'r1', 'Breads', 'Butter Tandoori Roti', 35, 1, 1, 100, 'Whole wheat flatbread baked crisp in tandoor with butter.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80');
  insertMenuItem.run('m117', 'r1', 'Breads', 'Laccha Paratha', 60, 1, 1, 80, 'Multi-layered flaky butter paratha.', 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80');
  // Desserts
  insertMenuItem.run('m7', 'r1', 'Desserts', 'Gulab Jamun (2pcs)', 90, 1, 1, 50, 'Soft berry-sized balls soaked in rose-flavored sugar syrup.', 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=');
  insertMenuItem.run('m118', 'r1', 'Desserts', 'Rasmalai (2pcs)', 110, 1, 1, 40, 'Soft cottage cheese patties steeped in cardamom infused saffron milk.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80');
  insertMenuItem.run('m119', 'r1', 'Desserts', 'Kesar Pista Kulfi', 120, 1, 1, 35, 'Traditional Indian dense ice cream with pistachios and saffron.', 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80');
  // Beverages
  insertMenuItem.run('m120', 'r1', 'Beverages', 'Punjabi Sweet Lassi', 80, 1, 1, 50, 'Thick chilled sweet yogurt drink garnished with malai.', 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80');

  // --- Items for Burger & Co. (r2) - 17 items ---
  // Starters
  insertMenuItem.run('m203', 'r2', 'Starters', 'Peri Peri Fries', 130, 1, 1, 50, 'Golden crispy french fries sprinkled with spicy peri peri seasoning.', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80');
  insertMenuItem.run('m205', 'r2', 'Starters', 'Cheese Garlic Bread', 140, 1, 1, 40, 'Toasted artisan baguette with roasted garlic and melted mozzarella.', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80');
  insertMenuItem.run('m206', 'r2', 'Starters', 'Crispy Onion Rings', 120, 1, 1, 40, 'Batter-fried golden onion rings served with barbecue dip.', 'https://images.unsplash.com/photo-1639024471287-032f66453916?w=300&q=80');
  insertMenuItem.run('m207', 'r2', 'Starters', 'BBQ Chicken Popcorn', 190, 0, 1, 35, 'Bite-sized crispy spiced chicken poppers with smoky dip.', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80');
  // Mains
  insertMenuItem.run('m201', 'r2', 'Mains', 'Classic Cheeseburger', 220, 0, 1, 30, 'Grilled chicken patty, melted cheddar cheese, and signature relish.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80');
  insertMenuItem.run('m202', 'r2', 'Mains', 'Crispy Veg Burger', 180, 1, 1, 30, 'Crispy potato-peas patty with spicy mayo and lettuce.', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80');
  insertMenuItem.run('m208', 'r2', 'Mains', 'Double Smash Chicken Burger', 320, 0, 1, 25, 'Twin grilled patties, double cheddar cheese, caramelized onions and jalapeños.', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&q=80');
  insertMenuItem.run('m209', 'r2', 'Mains', 'Spicy Paneer Tikka Burger', 210, 1, 1, 30, 'Crispy crusted paneer steak with tandoori mayo and lettuce.', 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&q=80');
  insertMenuItem.run('m210', 'r2', 'Mains', 'Grilled Chicken Sub Sandwich', 240, 0, 1, 30, 'Herbed chicken breast, honey mustard sauce in a 6-inch sub.', 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80');
  insertMenuItem.run('m211', 'r2', 'Mains', 'Triple Decker Veg Club', 170, 1, 1, 35, 'Toasted sandwich layered with cucumber, tomatoes, cheese slice and mint chutney.', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80');
  // Breads / Sides
  insertMenuItem.run('m212', 'r2', 'Breads', 'Cheesy Loaded Jalapeño Fries', 170, 1, 1, 40, 'Crispy fries smothered in liquid cheese and pickled jalapeños.', 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80');
  insertMenuItem.run('m213', 'r2', 'Breads', 'Mozzarella Cheese Sticks (4pcs)', 190, 1, 1, 35, 'Crumbed mozzarella sticks with marinara dip.', 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80');
  // Desserts
  insertMenuItem.run('m204', 'r2', 'Desserts', 'Chocolate Lava Cake', 140, 1, 1, 20, 'Warm chocolate cake with a gooey molten chocolate core.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80');
  insertMenuItem.run('m214', 'r2', 'Desserts', 'Fudge Walnut Brownie', 150, 1, 1, 25, 'Rich dark chocolate brownie loaded with roasted walnuts.', 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80');
  // Beverages
  insertMenuItem.run('m215', 'r2', 'Beverages', 'Oreo Overload Milkshake', 160, 1, 1, 40, 'Thick creamy shake blended with crushed Oreo cookies and chocolate drizzle.', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80');
  insertMenuItem.run('m216', 'r2', 'Beverages', 'Classic Cold Coffee', 130, 1, 1, 50, 'Creamy iced coffee shaken to perfection.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80');
  insertMenuItem.run('m217', 'r2', 'Beverages', 'Lemon Mint Iced Tea', 90, 1, 1, 50, 'Refreshing chilled iced tea infused with fresh mint and lemon.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80');

  // --- Items for Green Leaf (Pure Veg) (r3) - 17 items (100% vegetarian) ---
  // Starters
  insertMenuItem.run('m302', 'r3', 'Starters', 'Idli Vada Combo', 95, 1, 1, 40, 'Two steamed rice cakes and one crispy medu vada with hot sambar.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80');
  insertMenuItem.run('m305', 'r3', 'Starters', 'Crispy Gobi Manchurian', 180, 1, 1, 35, 'Crispy cauliflower florets tossed in zesty garlic sauce.', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80');
  insertMenuItem.run('m306', 'r3', 'Starters', 'Baby Corn Pepper Fry', 190, 1, 1, 30, 'Tender baby corn spears stir-fried with crushed black pepper and curry leaves.', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80');
  insertMenuItem.run('m307', 'r3', 'Starters', 'Paneer 65', 220, 1, 1, 35, 'South Indian style spiced batter fried paneer with curry leaves.', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80');
  // Mains
  insertMenuItem.run('m301', 'r3', 'Mains', 'Masala Dosa', 110, 1, 1, 50, 'Golden crispy crepe filled with spiced potato masala, served with chutneys.', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80');
  insertMenuItem.run('m308', 'r3', 'Mains', 'Rava Onion Dosa', 130, 1, 1, 40, 'Crispy semolina crepe studded with chopped onions and green chilies.', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80');
  insertMenuItem.run('m309', 'r3', 'Mains', 'Bisi Bele Bath', 120, 1, 1, 40, 'Traditional Karnataka spiced rice and lentil dish topped with boondi.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80');
  insertMenuItem.run('m310', 'r3', 'Mains', 'South Indian Special Thali', 220, 1, 1, 30, 'Rice, sambar, rasam, 2 vegetable curries, curd, papad and sweet.', 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=300&q=80');
  insertMenuItem.run('m311', 'r3', 'Mains', 'Curd Rice with Mustard Tadka', 90, 1, 1, 40, 'Comforting yogurt rice tempered with mustard, ginger and pomegranate.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80');
  insertMenuItem.run('m312', 'r3', 'Mains', 'Ghee Podi Mini Idli (12pcs)', 110, 1, 1, 35, 'Bite-sized steamed idlis tossed in gun powder spice and aromatic pure ghee.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80');
  // Breads
  insertMenuItem.run('m303', 'r3', 'Breads', 'Malabar Parotta (2pcs)', 60, 1, 1, 60, 'Flaky layered South Indian flatbread.', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80');
  insertMenuItem.run('m313', 'r3', 'Breads', 'Poori Saagu (3pcs)', 100, 1, 1, 45, 'Puffed deep-fried bread served with mixed vegetable saagu.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80');
  insertMenuItem.run('m314', 'r3', 'Breads', 'Chapati Kurma (2pcs)', 80, 1, 1, 50, 'Whole wheat flatbread served with rich vegetable coconut kurma.', 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80');
  // Desserts
  insertMenuItem.run('m315', 'r3', 'Desserts', 'Mysore Pak (2pcs)', 70, 1, 1, 50, 'Melt-in-mouth traditional gram flour sweet cooked with pure desi ghee.', 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80');
  insertMenuItem.run('m316', 'r3', 'Desserts', 'Pineapple Rava Kesari', 60, 1, 1, 40, 'Warm semolina pudding infused with pineapple chunks and roasted cashews.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80');
  // Beverages
  insertMenuItem.run('m304', 'r3', 'Beverages', 'Filter Coffee', 50, 1, 1, 100, 'Authentic frothy South Indian chicory filter coffee.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80');
  insertMenuItem.run('m317', 'r3', 'Beverages', 'Chilled Badam Milk', 80, 1, 1, 40, 'Slow-simmered almond milk flavored with saffron and crushed cardamom.', 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80');

  // --- Items for Midnight Munchies (r4) - 16 items ---
  // Starters
  insertMenuItem.run('m401', 'r4', 'Starters', 'Crispy Cheese Poppers', 160, 1, 1, 40, 'Crisp golden bites packed with molten jalapeño cheese.', 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80');
  insertMenuItem.run('m402', 'r4', 'Starters', 'Crispy Chicken Nuggets (6pcs)', 180, 0, 1, 35, 'Tender chicken nuggets with chipotle dip.', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80');
  insertMenuItem.run('m403', 'r4', 'Starters', 'Paneer Kathi Roll', 150, 1, 1, 40, 'Flaky paratha roll stuffed with spiced paneer tikka and mint mayo.', 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80');
  insertMenuItem.run('m404', 'r4', 'Starters', 'Chicken Tikka Roll', 190, 0, 1, 35, 'Succulent tandoori chicken wrapped in egg paratha with pickled onions.', 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80');
  // Mains
  insertMenuItem.run('m405', 'r4', 'Mains', 'Midnight Special Cheese Maggi', 90, 1, 1, 50, 'Hot comforting masala noodles loaded with melted cheese.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80');
  insertMenuItem.run('m406', 'r4', 'Mains', 'Egg Bhurji Cheese Maggi', 120, 0, 1, 40, 'Spicy scrambled eggs tossed with cheese Maggi.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80');
  insertMenuItem.run('m407', 'r4', 'Mains', 'Butter Chicken Wrap', 210, 0, 1, 30, 'Creamy shredded butter chicken rolled in soft roomali roti.', 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80');
  insertMenuItem.run('m408', 'r4', 'Mains', 'Grilled Paneer Sandwich', 170, 1, 1, 35, 'Grilled brown bread sandwich loaded with spiced paneer and mozzarella.', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80');
  insertMenuItem.run('m409', 'r4', 'Mains', 'Margherita Pizza (8-inch)', 220, 1, 1, 30, 'Classic hand-tossed pizza with fresh basil and mozzarella.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80');
  insertMenuItem.run('m410', 'r4', 'Mains', 'Chicken Pepperoni Pizza (8-inch)', 290, 0, 1, 25, 'Loaded with smoky chicken pepperoni and extra cheese.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80');
  // Breads
  insertMenuItem.run('m411', 'r4', 'Breads', 'Garlic Breadsticks with Dip', 120, 1, 1, 40, 'Freshly baked soft breadsticks seasoned with garlic butter.', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80');
  insertMenuItem.run('m412', 'r4', 'Breads', 'Stuffed Cheesy Garlic Pockets', 140, 1, 1, 35, 'Crisp pastry crust filled with sweet corn and liquid cheddar.', 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80');
  // Desserts
  insertMenuItem.run('m413', 'r4', 'Desserts', 'Dark Chocolate Brownie', 130, 1, 1, 30, 'Decadent chocolate brownie served warm.', 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80');
  insertMenuItem.run('m414', 'r4', 'Desserts', 'Nutella Hazelnut Waffle', 160, 1, 1, 25, 'Crisp Belgian waffle smothered with pure Nutella.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80');
  // Beverages
  insertMenuItem.run('m415', 'r4', 'Beverages', 'Vanilla Cold Coffee', 130, 1, 1, 40, 'Smooth cold coffee blended with vanilla cream.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80');
  insertMenuItem.run('m416', 'r4', 'Beverages', 'Fresh Mint Lime Soda', 80, 1, 1, 50, 'Fizzy soda with hand-crushed mint leaves and lemon.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80');

  // 6. Seed Coupons
  const insertCoupon = targetDb.prepare(`
    INSERT OR REPLACE INTO coupons (code, discount_type, discount_value, min_order_amount, is_active, expires_at)
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
  console.log('   - 4 Seeded Restaurants with expanded menus (16-20 items each)');
  console.log('   - Geo cache and OSM restaurants preserved');
  console.log('   - 3 Active Coupons (WELCOME50, FESTIVE20, BITE100)');
}
