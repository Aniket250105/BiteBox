import db from '../db.js';
import { getOrGenerateMenu } from '../services/menuGenerator.js';

export const restaurantRepository = {
  findAll() {
    return db.prepare(`
      SELECT * FROM restaurants 
      ORDER BY rating DESC
    `).all();
  },

  findById(id) {
    return db.prepare(`
      SELECT * FROM restaurants 
      WHERE id = ?
    `).get(id);
  },

  findByArea(area) {
    const clean = (area || '').trim().toLowerCase();
    if (!clean) {
      return this.findAll();
    }

    let keyword = clean;
    if (clean.includes('presidency')) keyword = 'presidency';
    else if (clean.includes('indiranagar')) keyword = 'indiranagar';
    else if (clean.includes('koramangala')) keyword = 'koramangala';
    else if (clean.includes('mg road') || clean.includes('church')) keyword = 'mg road';

    return db.prepare(`
      SELECT DISTINCT r.* 
      FROM restaurants r
      JOIN restaurant_delivery_areas rda ON r.id = rda.restaurant_id
      WHERE LOWER(rda.area_name) LIKE ? 
         OR LOWER(?) LIKE '%' || LOWER(rda.area_name) || '%'
      ORDER BY r.rating DESC
    `).all('%' + keyword + '%', clean);
  },

  getMenuByRestaurantId(restaurantId) {
    const restaurant = this.findById(restaurantId);
    if (restaurant && restaurant.source === 'osm') {
      return getOrGenerateMenu(db, restaurant);
    }

    return db.prepare(`
      SELECT * FROM menu_items 
      WHERE restaurant_id = ?
      ORDER BY 
        CASE category 
          WHEN 'Starters' THEN 1 
          WHEN 'Mains' THEN 2 
          WHEN 'Breads' THEN 3 
          WHEN 'Desserts' THEN 4 
          ELSE 5 
        END,
        name ASC
    `).all(restaurantId);
  }
};
