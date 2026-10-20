import { Router } from 'express';
import { orderRepository } from '../repositories/orderRepository.js';
import { restaurantRepository } from '../repositories/restaurantRepository.js';
import { couponRepository } from '../repositories/couponRepository.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import db from '../db.js';

const router = Router();

// Helper to compute quote from database
function computeOrderQuote({ restaurantId, items, deliveryAddress, couponCode }) {
  if (!restaurantId) {
    const err = new Error('Please select a restaurant.');
    err.statusCode = 400;
    throw err;
  }

  const restaurant = restaurantRepository.findById(restaurantId);
  if (!restaurant) {
    const err = new Error('Restaurant not found.');
    err.statusCode = 404;
    throw err;
  }

  // Verify restaurant serves the delivery area if address provided
  if (deliveryAddress && deliveryAddress.trim()) {
    const matchingRestaurants = restaurantRepository.findByArea(deliveryAddress);
    const servesArea = matchingRestaurants.some(r => r.id === restaurantId);
    if (!servesArea) {
      const err = new Error(`${restaurant.name} does not deliver to ${deliveryAddress}.`);
      err.statusCode = 400;
      throw err;
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Cart is empty. Please add items to your cart.');
    err.statusCode = 400;
    throw err;
  }

  // Validate items and compute item total from database prices
  let itemTotal = 0;
  const quoteItems = [];

  for (const item of items) {
    const menuItemId = item.menuItemId || item.id;
    const quantity = Number(item.quantity || item.qty);

    if (!menuItemId) {
      const err = new Error('Invalid item specified in cart.');
      err.statusCode = 400;
      throw err;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      const err = new Error('Item quantity must be a positive whole number.');
      err.statusCode = 400;
      throw err;
    }

    const dbItem = db.prepare(`SELECT * FROM menu_items WHERE id = ?`).get(menuItemId);
    if (!dbItem) {
      const err = new Error('Menu item not found in database.');
      err.statusCode = 404;
      throw err;
    }

    if (dbItem.restaurant_id !== restaurantId) {
      const err = new Error(`Item "${dbItem.name}" does not belong to ${restaurant.name}.`);
      err.statusCode = 400;
      throw err;
    }

    // Check item availability
    if (!dbItem.is_available || dbItem.stock_quantity <= 0) {
      const err = new Error(`${dbItem.name} is currently out of stock.`);
      err.statusCode = 400;
      err.itemUnavailable = true;
      err.itemName = dbItem.name;
      throw err;
    }

    if (dbItem.stock_quantity < quantity) {
      const err = new Error(`${dbItem.name} has only ${dbItem.stock_quantity} left in stock.`);
      err.statusCode = 400;
      err.itemUnavailable = true;
      err.itemName = dbItem.name;
      throw err;
    }

    const price = Number(dbItem.price);
    const subtotal = price * quantity;
    itemTotal += subtotal;

    quoteItems.push({
      menuItemId: dbItem.id,
      name: dbItem.name,
      unitPrice: price,
      quantity,
      subtotal,
      image: dbItem.image_url,
      isVeg: Boolean(dbItem.is_veg)
    });
  }

  // 5% Tax rounded to nearest rupee
  const taxAmount = Math.round(itemTotal * 0.05);

  // Delivery fee (flat ₹40 if order has items)
  const deliveryFee = itemTotal > 0 ? 40 : 0;

  // Coupon discount calculation server-side
  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = couponRepository.findByCode(cleanCode);

    if (!coupon) {
      const err = new Error('Invalid coupon code.');
      err.statusCode = 400;
      throw err;
    }

    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
    if (!coupon.is_active || isExpired) {
      const err = new Error('This coupon has expired or is inactive.');
      err.statusCode = 400;
      throw err;
    }

    if (itemTotal < coupon.min_order_amount) {
      const err = new Error(`Minimum order amount of ₹${coupon.min_order_amount} required for this coupon.`);
      err.statusCode = 400;
      throw err;
    }

    if (coupon.discount_type === 'FLAT') {
      discountAmount = coupon.discount_value;
    } else if (coupon.discount_type === 'PERCENT') {
      discountAmount = Math.round((itemTotal * coupon.discount_value) / 100);
    }

    discountAmount = Math.min(discountAmount, itemTotal);
    appliedCoupon = {
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount
    };
  }

  const totalAmount = Math.max(0, itemTotal + deliveryFee + taxAmount - discountAmount);

  return {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    deliveryAddress: deliveryAddress || '',
    itemTotal,
    taxAmount,
    deliveryFee,
    discountAmount,
    totalAmount,
    coupon: appliedCoupon,
    items: quoteItems
  };
}

// POST /api/orders/quote
router.post('/quote', (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, couponCode } = req.body;
    const quote = computeOrderQuote({ restaurantId, items, deliveryAddress, couponCode });
    return res.status(200).json(quote);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Failed to calculate quote.',
      itemUnavailable: err.itemUnavailable || false,
      itemName: err.itemName || null
    });
  }
});

// POST /api/orders (Protected: customer from JWT)
router.post('/', authMiddleware, (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      restaurantId,
      items,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      couponCode
    } = req.body;

    const finalAddress = deliveryAddress || req.user.default_address || '';
    if (!finalAddress.trim()) {
      return res.status(400).json({ error: 'Delivery address is required.' });
    }

    // Compute quote to enforce server prices and availability
    const quote = computeOrderQuote({
      restaurantId,
      items,
      deliveryAddress: finalAddress,
      couponCode
    });

    const orderNumber = `BB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = orderRepository.createOrder({
      orderNumber,
      customerId,
      restaurantId: quote.restaurantId,
      deliveryAddress: finalAddress,
      deliveryLat: Number(deliveryLat) || null,
      deliveryLng: Number(deliveryLng) || null,
      couponCode: quote.coupon?.code || null,
      itemTotal: quote.itemTotal,
      taxAmount: quote.taxAmount,
      deliveryFee: quote.deliveryFee,
      discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount,
      items: quote.items
    });

    return res.status(201).json({
      message: 'Order created successfully.',
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
      itemTotal: newOrder.item_total,
      taxAmount: newOrder.tax_amount,
      deliveryFee: newOrder.delivery_fee,
      discountAmount: newOrder.discount_amount,
      totalAmount: newOrder.total_amount,
      status: newOrder.status,
      items: newOrder.items
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Failed to create order.',
      itemUnavailable: err.itemUnavailable || false,
      itemName: err.itemName || null
    });
  }
});

// POST /api/orders/:id/decision (ACCEPT or REJECT)
// Allowed only when DEMO_MODE=true
router.post('/:id/decision', (req, res) => {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }

  try {
    const orderId = Number(req.params.id);
    const { decision, reason } = req.body;

    const result = orderRepository.applyRestaurantDecision({
      orderId,
      decision,
      reason
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Decision processing failed.' });
  }
});

// POST /api/orders/:id/advance-stage
// Advances order through valid stage transitions
router.post('/:id/advance-stage', (req, res) => {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }

  try {
    const orderId = Number(req.params.id);
    const { stage } = req.body;

    const updated = orderRepository.advanceOrderStage({
      orderId,
      targetStage: stage
    });

    return res.status(200).json({
      message: `Order advanced to "${updated.status}".`,
      order: updated
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ error: err.message || 'Stage transition failed.' });
  }
});

// GET /api/orders/restaurant/all (For /restaurant minimal portal in demo mode)
router.get('/restaurant/all', (req, res) => {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }

  try {
    const orders = orderRepository.getAllOrders();
    return res.status(200).json({ orders });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to retrieve restaurant orders.' });
  }
});

// GET /api/orders/:id (Protected: checks customer ownership)
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const order = orderRepository.findById(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this order.' });
    }

    return res.status(200).json({ order });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to retrieve order.' });
  }
});

export default router;

