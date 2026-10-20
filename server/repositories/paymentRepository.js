import db from '../db.js';

export const paymentRepository = {
  findByOrderId(orderId) {
    return db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(orderId);
  },

  processPaymentTransaction({ orderId, customerId, paymentMethod, forceFailure, isDemoMode }) {
    const runTransaction = db.transaction(() => {
      // 1. Fetch order and verify ownership
      const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
      if (!order) {
        const err = new Error('Order not found.');
        err.statusCode = 404;
        throw err;
      }

      if (order.customer_id !== customerId) {
        const err = new Error('Unauthorized: Order belongs to a different account.');
        err.statusCode = 403;
        throw err;
      }

      // 2. Fetch current payment row
      const payment = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(orderId);
      if (!payment) {
        const err = new Error('Payment record not found for this order.');
        err.statusCode = 404;
        throw err;
      }

      // 3. Idempotency check: if order is already paid, return existing success state
      if (
        order.status === 'paid, awaiting restaurant decision' || 
        payment.status === 'SUCCESS' ||
        (payment.payment_method === 'COD' && order.status.includes('awaiting'))
      ) {
        return {
          idempotent: true,
          success: true,
          status: payment.status,
          paymentMethod: payment.payment_method,
          transactionRef: payment.transaction_ref,
          orderStatus: order.status,
          orderId: order.id,
          orderNumber: order.order_number,
          attempts: payment.attempts
        };
      }

      const nextAttempts = (payment.attempts || 0) + 1;

      // 4. Forced Payment Failure (UPI & CARD only, enabled when DEMO_MODE=true)
      if (paymentMethod !== 'COD' && forceFailure && isDemoMode) {
        db.prepare(`
          UPDATE payments 
          SET status = 'FAILED', payment_method = ?, attempts = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(paymentMethod, nextAttempts, payment.id);

        db.prepare(`
          INSERT INTO order_status_history (order_id, stage, title, description)
          VALUES (?, 'placed', 'Payment Failed', 'Transaction failed at payment gateway. Attempt ' || ?)
        `).run(orderId, nextAttempts);

        // DO NOT deduct stock. Return failed state.
        return {
          success: false,
          status: 'FAILED',
          paymentMethod,
          attempts: nextAttempts,
          orderId: order.id,
          orderNumber: order.order_number,
          error: 'Payment failed at payment gateway. Please retry or choose another payment method.'
        };
      }

      // 5. Fetch order items and re-check stock and availability
      const orderItems = db.prepare(`
        SELECT oi.*, mi.name, mi.stock_quantity, mi.is_available
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `).all(orderId);

      for (const item of orderItems) {
        if (!item.is_available || item.stock_quantity <= 0) {
          const err = new Error(`${item.name} is currently out of stock.`);
          err.statusCode = 400;
          err.itemUnavailable = true;
          err.itemName = item.name;
          throw err;
        }

        if (item.stock_quantity < item.quantity) {
          const err = new Error(`${item.name} has only ${item.stock_quantity} left in stock.`);
          err.statusCode = 400;
          err.itemUnavailable = true;
          err.itemName = item.name;
          throw err;
        }
      }

      // 6. Deduct stock atomically
      const deductStmt = db.prepare(`
        UPDATE menu_items 
        SET stock_quantity = stock_quantity - ? 
        WHERE id = ? AND stock_quantity >= ?
      `);

      for (const item of orderItems) {
        const result = deductStmt.run(item.quantity, item.menu_item_id, item.quantity);
        if (result.changes === 0) {
          const err = new Error(`Stock deduction failed for ${item.name}. Insufficient stock.`);
          err.statusCode = 400;
          err.itemUnavailable = true;
          err.itemName = item.name;
          throw err;
        }
      }

      // 7. Update Payment and Order based on Payment Method
      if (paymentMethod === 'COD') {
        // COD: payment stays PENDING until delivery
        db.prepare(`
          UPDATE payments 
          SET payment_method = 'COD', status = 'PENDING', attempts = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(nextAttempts, payment.id);

        db.prepare(`
          UPDATE orders 
          SET status = 'paid, awaiting restaurant decision'
          WHERE id = ?
        `).run(orderId);

        db.prepare(`
          INSERT INTO order_status_history (order_id, stage, title, description)
          VALUES (?, 'awaiting_decision', 'Order Placed (Cash on Delivery)', 'Payment pending on delivery. Awaiting restaurant confirmation.')
        `).run(orderId);

        return {
          success: true,
          status: 'PENDING',
          paymentMethod: 'COD',
          orderStatus: 'paid, awaiting restaurant decision',
          orderId: order.id,
          orderNumber: order.order_number,
          attempts: nextAttempts
        };
      } else {
        // UPI / CARD: payment is SUCCESS
        const txnRef = `TXN_${Date.now().toString(36).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;

        db.prepare(`
          UPDATE payments 
          SET payment_method = ?, status = 'SUCCESS', transaction_ref = ?, attempts = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(paymentMethod, txnRef, nextAttempts, payment.id);

        db.prepare(`
          UPDATE orders 
          SET status = 'paid, awaiting restaurant decision'
          WHERE id = ?
        `).run(orderId);

        db.prepare(`
          INSERT INTO order_status_history (order_id, stage, title, description)
          VALUES (?, 'awaiting_decision', 'Paid, Awaiting Restaurant Decision', 'Payment confirmed via ' || ? || '. Awaiting restaurant confirmation.')
        `).run(orderId, paymentMethod);

        return {
          success: true,
          status: 'SUCCESS',
          paymentMethod,
          transactionRef: txnRef,
          orderStatus: 'paid, awaiting restaurant decision',
          orderId: order.id,
          orderNumber: order.order_number,
          attempts: nextAttempts
        };
      }
    });

    return runTransaction();
  }
};
