import db from '../db.js';

export const couponRepository = {
  findByCode(code) {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return null;
    return db.prepare(`
      SELECT * FROM coupons 
      WHERE UPPER(code) = ?
    `).get(clean);
  },

  findAllActive() {
    return db.prepare(`
      SELECT * FROM coupons 
      WHERE is_active = 1
    `).all();
  }
};
