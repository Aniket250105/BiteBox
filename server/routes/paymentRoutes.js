import { Router } from 'express';
import { paymentRepository } from '../repositories/paymentRepository.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/payments/process (Protected: customer from JWT)
router.post('/process', authMiddleware, (req, res) => {
  try {
    const customerId = req.user.id;
    const { orderId, paymentMethod, forceFailure } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    const validMethods = ['UPI', 'CARD', 'COD'];
    const cleanMethod = (paymentMethod || '').trim().toUpperCase();
    if (!validMethods.includes(cleanMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Must be UPI, CARD, or COD.' });
    }

    const isDemoMode = process.env.DEMO_MODE === 'true';

    const result = paymentRepository.processPaymentTransaction({
      orderId: Number(orderId),
      customerId,
      paymentMethod: cleanMethod,
      forceFailure: Boolean(forceFailure),
      isDemoMode
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Payment processing error:', err.message);
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Payment processing failed.',
      itemUnavailable: err.itemUnavailable || false,
      itemName: err.itemName || null
    });
  }
});

// GET /api/payments/:orderId (Protected)
router.get('/:orderId', authMiddleware, (req, res) => {
  try {
    const payment = paymentRepository.findByOrderId(Number(req.params.orderId));
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }
    return res.status(200).json({ payment });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to retrieve payment status.' });
  }
});

export default router;
