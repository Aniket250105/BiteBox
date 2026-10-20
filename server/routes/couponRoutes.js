import { Router } from 'express';
import { couponRepository } from '../repositories/couponRepository.js';

const router = Router();

// POST /api/coupons/validate
router.post('/validate', (req, res) => {
  try {
    const { code, orderAmount, itemTotal } = req.body;
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanCode) {
      return res.status(400).json({ error: 'Please enter a coupon code.' });
    }

    const coupon = couponRepository.findByCode(cleanCode);
    if (!coupon) {
      return res.status(400).json({ error: 'Invalid coupon code.' });
    }

    // Inactive code check
    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
    if (!coupon.is_active || isExpired) {
      return res.status(400).json({ error: 'This coupon has expired or is inactive.' });
    }

    // Minimum order check (supports orderAmount or itemTotal)
    const total = Number(orderAmount !== undefined ? orderAmount : itemTotal) || 0;
    if (total < coupon.min_order_amount) {
      return res.status(400).json({
        error: `Minimum order amount of ₹${coupon.min_order_amount} required for this coupon.`
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discount_type === 'FLAT') {
      discountAmount = coupon.discount_value;
    } else if (coupon.discount_type === 'PERCENT') {
      discountAmount = Math.round((total * coupon.discount_value) / 100);
    }

    discountAmount = Math.min(discountAmount, total);

    return res.status(200).json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      minOrderAmount: coupon.min_order_amount,
      message: `${coupon.code} applied! Saved ₹${discountAmount}.`
    });
  } catch (err) {
    console.error('Error validating coupon:', err);
    return res.status(500).json({ error: 'Internal error validating coupon.' });
  }
});

// GET /api/coupons (List available active coupons)
router.get('/', (req, res) => {
  try {
    const coupons = couponRepository.findAllActive();
    return res.status(200).json({
      coupons: coupons.map(c => ({
        code: c.code,
        discountType: c.discount_type,
        discountValue: c.discount_value,
        minOrderAmount: c.min_order_amount
      }))
    });
  } catch (err) {
    console.error('Error listing coupons:', err);
    return res.status(500).json({ error: 'Failed to retrieve coupons.' });
  }
});

export default router;
