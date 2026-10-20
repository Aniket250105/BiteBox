import db from '../db.js';

export const customerRepository = {
  findByEmailOrPhone(identifier) {
    const clean = (identifier || '').trim().toLowerCase();
    if (!clean) return null;
    return db.prepare(`
      SELECT * FROM customers 
      WHERE LOWER(email) = ? OR (phone IS NOT NULL AND phone != '' AND phone = ?)
    `).get(clean, clean);
  },

  findById(id) {
    return db.prepare(`
      SELECT id, name, email, phone, default_address, created_at 
      FROM customers 
      WHERE id = ?
    `).get(id);
  },

  create({ name, email, phone, passwordHash, defaultAddress }) {
    const stmt = db.prepare(`
      INSERT INTO customers (name, email, phone, password_hash, default_address)
      VALUES (?, ?, ?, ?, ?)
    `);
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim() : null;
    const info = stmt.run(
      name.trim(),
      cleanEmail,
      cleanPhone,
      passwordHash,
      defaultAddress ? defaultAddress.trim() : null
    );
    return this.findById(info.lastInsertRowid);
  },

  updateDefaultAddress(id, address) {
    db.prepare(`
      UPDATE customers 
      SET default_address = ? 
      WHERE id = ?
    `).run(address.trim(), id);
    return this.findById(id);
  }
};
