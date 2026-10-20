import { Router } from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Middleware: all demo endpoints return 404 unless DEMO_MODE=true
router.use((req, res, next) => {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  next();
});

// POST /api/demo/toggle-item-stock
// Allows evaluator to simulate "Mark item out of stock" between cart and payment
router.post('/toggle-item-stock', (req, res) => {
  try {
    const { menuItemId, isAvailable } = req.body;
    if (!menuItemId) {
      return res.status(400).json({ error: 'menuItemId is required.' });
    }

    const item = db.prepare(`SELECT * FROM menu_items WHERE id = ?`).get(menuItemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const newAvailable = isAvailable !== undefined ? (isAvailable ? 1 : 0) : (item.is_available ? 0 : 1);
    const newStock = newAvailable ? 50 : 0;

    db.prepare(`
      UPDATE menu_items 
      SET is_available = ?, stock_quantity = ?
      WHERE id = ?
    `).run(newAvailable, newStock, menuItemId);

    const updated = db.prepare(`SELECT id, name, is_available, stock_quantity FROM menu_items WHERE id = ?`).get(menuItemId);

    return res.status(200).json({
      message: `Item "${updated.name}" is now ${updated.is_available ? 'in stock' : 'OUT OF STOCK'}.`,
      item: {
        id: updated.id,
        name: updated.name,
        isAvailable: Boolean(updated.is_available),
        stockQuantity: updated.stock_quantity
      }
    });
  } catch (err) {
    console.error('Demo stock toggle error:', err);
    return res.status(500).json({ error: 'Failed to toggle item stock.' });
  }
});

// POST /api/demo/reset-database (also aliased as /reset-demo-data)
const handleResetDemoData = (req, res) => {
  try {
    const runReset = db.transaction(() => {
      // 1. Clear all customer orders, items, payments, status history
      db.prepare(`DELETE FROM order_status_history`).run();
      db.prepare(`DELETE FROM payments`).run();
      db.prepare(`DELETE FROM order_items`).run();
      db.prepare(`DELETE FROM orders`).run();

      // 2. Restore menu item availability and initial stock quantities
      // Spicy Symphony (r1)
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 40 WHERE id = 'm1'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 30 WHERE id = 'm2'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 0, stock_quantity = 0 WHERE id = 'm3'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 25 WHERE id = 'm4'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 35 WHERE id = 'm5'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 100 WHERE id = 'm6'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 50 WHERE id = 'm7'`).run();

      // Burger & Co (r2)
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 30 WHERE id = 'm201'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 30 WHERE id = 'm202'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 50 WHERE id = 'm203'`).run();
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 20 WHERE id = 'm204'`).run();

      // Any other menu items
      db.prepare(`UPDATE menu_items SET is_available = 1, stock_quantity = 50 WHERE id NOT IN ('m1','m2','m3','m4','m5','m6','m7','m201','m202','m203','m204')`).run();

      // 3. Ensure demo user (aniket@bitebox.com) is present and has default password
      const demoUser = db.prepare(`SELECT id FROM customers WHERE email = 'aniket@bitebox.com'`).get();
      if (!demoUser) {
        const passwordHash = bcrypt.hashSync('password123', 10);
        db.prepare(`
          INSERT INTO customers (id, name, email, phone, password_hash, default_address)
          VALUES (1, 'Aniket Sharma', 'aniket@bitebox.com', '9876543210', ?, 'Presidency University, Itgalpur, Rajanakunte, Bengaluru')
        `).run(passwordHash);
      }

      // 4. Ensure delivery agents are active
      db.prepare(`UPDATE delivery_agents SET is_active = 1`).run();
    });

    runReset();

    return res.status(200).json({
      success: true,
      message: 'Demo database re-seeded successfully. Stock restored, orders cleared, demo account preserved.'
    });
  } catch (err) {
    console.error('Demo reset database error:', err);
    return res.status(500).json({ error: 'Failed to reset demo database.' });
  }
};

router.post('/reset-database', handleResetDemoData);
router.post('/reset-demo-data', handleResetDemoData);

// POST /api/demo/reset-demo-state (backwards compatibility for stock-only reset)
router.post('/reset-demo-state', handleResetDemoData);

export default router;
