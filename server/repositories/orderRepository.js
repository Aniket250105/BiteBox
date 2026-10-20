import db from '../db.js';

export const orderRepository = {
  findById(id) {
    const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
    if (!order) return null;

    const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(id);
    const payment = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(id);
    const history = db.prepare(`SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC`).all(id);
    const agent = order.delivery_agent_id 
      ? db.prepare(`SELECT id, name, phone, vehicle_model, vehicle_plate, rating FROM delivery_agents WHERE id = ?`).get(order.delivery_agent_id) 
      : null;
    const restaurant = db.prepare(`SELECT id, name, cuisine, image_url, emoji, lat, lng FROM restaurants WHERE id = ?`).get(order.restaurant_id);

    return {
      ...order,
      items,
      payment,
      history,
      agent,
      restaurant
    };
  },

  findByOrderNumber(orderNumber) {
    return db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber);
  },

  createOrder({
    orderNumber,
    customerId,
    restaurantId,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    couponCode,
    itemTotal,
    taxAmount,
    deliveryFee,
    discountAmount,
    totalAmount,
    items
  }) {
    const insertTransaction = db.transaction(() => {
      // 1. Insert into orders
      const orderStmt = db.prepare(`
        INSERT INTO orders (
          order_number, customer_id, restaurant_id, coupon_code,
          delivery_address, delivery_lat, delivery_lng,
          item_total, tax_amount, delivery_fee, discount_amount, total_amount,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLACED')
      `);

      const info = orderStmt.run(
        orderNumber,
        customerId,
        restaurantId,
        couponCode || null,
        deliveryAddress,
        deliveryLat || null,
        deliveryLng || null,
        itemTotal,
        taxAmount,
        deliveryFee,
        discountAmount,
        totalAmount
      );

      const orderId = info.lastInsertRowid;

      // 2. Insert order items
      const itemStmt = db.prepare(`
        INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        itemStmt.run(
          orderId,
          item.menuItemId,
          item.name,
          item.unitPrice,
          item.quantity,
          item.unitPrice * item.quantity
        );
      }

      // 3. Insert initial status history
      const historyStmt = db.prepare(`
        INSERT INTO order_status_history (order_id, stage, title, description)
        VALUES (?, 'placed', 'Order Placed', 'Order placed, awaiting payment confirmation.')
      `);
      historyStmt.run(orderId);

      // 4. Insert initial payment record
      const paymentStmt = db.prepare(`
        INSERT INTO payments (order_id, payment_method, amount, status, attempts)
        VALUES (?, 'PENDING', ?, 'PENDING', 0)
      `);
      paymentStmt.run(orderId, totalAmount);

      return orderId;
    });

    const newOrderId = insertTransaction();
    return this.findById(newOrderId);
  },

  applyRestaurantDecision({ orderId, decision, reason }) {
    const runDecisionTx = db.transaction(() => {
      const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
      if (!order) {
        const err = new Error('Order not found.');
        err.statusCode = 404;
        throw err;
      }

      const cleanDecision = (decision || '').toUpperCase();
      if (!['ACCEPT', 'REJECT'].includes(cleanDecision)) {
        const err = new Error('Invalid decision. Must be ACCEPT or REJECT.');
        err.statusCode = 400;
        throw err;
      }

      // Idempotency: if already in the target state, return without re-processing
      if (cleanDecision === 'ACCEPT' && order.status === 'confirmed') {
        return {
          idempotent: true,
          decision: 'ACCEPT',
          status: 'confirmed',
          order: this.findById(orderId)
        };
      }
      if (cleanDecision === 'REJECT' && order.status === 'rejected') {
        return {
          idempotent: true,
          decision: 'REJECT',
          status: 'rejected',
          order: this.findById(orderId)
        };
      }

      // Must be currently awaiting restaurant decision
      if (order.status !== 'paid, awaiting restaurant decision') {
        const err = new Error(`Cannot make decision. Order is currently in "${order.status}" status.`);
        err.statusCode = 400;
        throw err;
      }

      if (cleanDecision === 'ACCEPT') {
        // Find active delivery agent to assign at that moment
        const agent = db.prepare(`SELECT * FROM delivery_agents WHERE is_active = 1 ORDER BY id ASC LIMIT 1`).get();
        const agentId = agent ? agent.id : null;

        db.prepare(`
          UPDATE orders 
          SET status = 'confirmed', delivery_agent_id = ?
          WHERE id = ?
        `).run(agentId, orderId);

        db.prepare(`
          INSERT INTO order_status_history (order_id, agent_id, stage, title, description)
          VALUES (?, ?, 'confirmed', 'Order Confirmed', ?)
        `).run(
          orderId,
          agentId,
          agent ? `Restaurant accepted your order. Delivery partner ${agent.name} has been assigned.` : 'Restaurant accepted your order.'
        );

        return {
          success: true,
          decision: 'ACCEPT',
          status: 'confirmed',
          agentAssigned: agent || null,
          order: this.findById(orderId)
        };
      } else {
        // REJECT
        const finalReason = reason && reason.trim() ? reason.trim() : 'Kitchen overloaded or out of ingredients.';

        // 1. Update order status to rejected with reason
        db.prepare(`
          UPDATE orders 
          SET status = 'rejected', rejection_reason = ?
          WHERE id = ?
        `).run(finalReason, orderId);

        // 2. Atomically restore stock for every item in this order
        const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(orderId);
        const restoreStockStmt = db.prepare(`
          UPDATE menu_items 
          SET stock_quantity = stock_quantity + ?
          WHERE id = ?
        `);
        for (const it of items) {
          restoreStockStmt.run(it.quantity, it.menu_item_id);
        }

        // 3. Handle money based on payment method
        const payment = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(orderId);
        let refundInfo = { status: 'NONE', amount: 0, message: 'No charge made' };

        if (payment && payment.status === 'SUCCESS') {
          // UPI or Card was paid -> Refund in full
          db.prepare(`
            UPDATE payments 
            SET status = 'REFUNDED', refund_status = 'REFUNDED', refund_amount = amount, refund_reason = ?, refunded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(finalReason, payment.id);

          refundInfo = {
            status: 'REFUNDED',
            amount: payment.amount,
            message: `₹${payment.amount} refunded`
          };
        } else if (payment && payment.payment_method === 'COD') {
          // COD -> No money was collected, so no refund
          db.prepare(`
            UPDATE payments 
            SET refund_status = 'NONE', refund_amount = 0, refund_reason = 'COD - No charge made', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(payment.id);

          refundInfo = {
            status: 'NONE',
            amount: 0,
            message: 'No charge made'
          };
        }

        // 4. Record status history
        db.prepare(`
          INSERT INTO order_status_history (order_id, stage, title, description)
          VALUES (?, 'rejected', 'Order Rejected', ?)
        `).run(orderId, `Order rejected by restaurant: ${finalReason}. (${refundInfo.message})`);

        return {
          success: true,
          decision: 'REJECT',
          status: 'rejected',
          reason: finalReason,
          refund: refundInfo,
          order: this.findById(orderId)
        };
      }
    });

    return runDecisionTx();
  },

  advanceOrderStage({ orderId, targetStage }) {
    const transitionMap = {
      'confirmed': 'preparing',
      'preparing': 'picked_up',
      'picked_up': 'out_for_delivery',
      'out_for_delivery': 'delivered'
    };

    const runAdvanceTx = db.transaction(() => {
      const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
      if (!order) {
        const err = new Error('Order not found.');
        err.statusCode = 404;
        throw err;
      }

      if (order.status === 'rejected' || order.status === 'cancelled') {
        const err = new Error(`Cannot advance an order with status "${order.status}".`);
        err.statusCode = 400;
        throw err;
      }

      if (order.status === 'delivered') {
        const err = new Error('Order has already reached final stage: delivered.');
        err.statusCode = 400;
        throw err;
      }

      const nextExpected = transitionMap[order.status];
      if (!nextExpected) {
        const err = new Error(`Cannot advance order currently in "${order.status}". Waiting for restaurant confirmation first.`);
        err.statusCode = 400;
        throw err;
      }

      const desiredStage = targetStage ? targetStage.toLowerCase().trim() : nextExpected;
      if (desiredStage !== nextExpected) {
        const err = new Error(`Invalid stage transition: cannot jump from "${order.status}" to "${desiredStage}". Expected next stage is "${nextExpected}".`);
        err.statusCode = 400;
        throw err;
      }

      // If transition is to delivered and payment was COD, mark payment as SUCCESS
      if (desiredStage === 'delivered') {
        const payment = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(orderId);
        if (payment && payment.payment_method === 'COD') {
          db.prepare(`
            UPDATE payments 
            SET status = 'SUCCESS', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(payment.id);
        }
      }

      // Update order status
      db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(desiredStage, orderId);

      // Status history meta
      const meta = {
        preparing: { title: 'Preparing Food', desc: 'The kitchen is preparing your dishes fresh.' },
        picked_up: { title: 'Picked Up', desc: 'Delivery partner has collected the order from the restaurant.' },
        out_for_delivery: { title: 'Out for Delivery', desc: 'Delivery partner is on the way to your doorstep.' },
        delivered: { title: 'Delivered', desc: 'Order delivered successfully. Enjoy your meal!' }
      }[desiredStage] || { title: desiredStage, desc: `Order advanced to ${desiredStage}` };

      db.prepare(`
        INSERT INTO order_status_history (order_id, agent_id, stage, title, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(orderId, order.delivery_agent_id || null, desiredStage, meta.title, meta.desc);

      return this.findById(orderId);
    });

    return runAdvanceTx();
  },

  getAllOrders() {
    const orders = db.prepare(`
      SELECT o.id, o.order_number, o.status, o.created_at, o.rejection_reason,
             o.item_total, o.tax_amount, o.delivery_fee, o.discount_amount, o.total_amount,
             r.name as restaurant_name, r.emoji as restaurant_emoji,
             p.payment_method, p.status as payment_status
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN payments p ON o.id = p.order_id
      ORDER BY o.created_at DESC
    `).all();

    return orders.map(ord => ({
      id: ord.id,
      order_number: ord.order_number,
      status: ord.status,
      created_at: ord.created_at,
      rejection_reason: ord.rejection_reason,
      item_total: ord.item_total,
      tax_amount: ord.tax_amount,
      delivery_fee: ord.delivery_fee,
      discount_amount: ord.discount_amount,
      total_amount: ord.total_amount,
      restaurant_name: ord.restaurant_name,
      restaurant_emoji: ord.restaurant_emoji,
      payment_method: ord.payment_method,
      payment_status: ord.payment_status,
      items: db.prepare(`SELECT id, menu_item_id, item_name, unit_price, quantity, subtotal FROM order_items WHERE order_id = ?`).all(ord.id)
    }));
  }
};

