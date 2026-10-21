import Database from 'better-sqlite3';
import { getOrGenerateMenu } from '../services/menuGenerator.js';

const db = new Database('bitebox.db');
db.pragma('foreign_keys = OFF');

console.log('Clearing old generated OSM menu items from bitebox.db...');
db.prepare("DELETE FROM menu_items WHERE restaurant_id LIKE 'osm_%'").run();

const osmRests = db.prepare("SELECT * FROM restaurants WHERE id LIKE 'osm_%'").all();
console.log(`Found ${osmRests.length} OSM restaurants in bitebox.db. Regenerating menus...`);

for (const r of osmRests) {
  const menu = getOrGenerateMenu(db, r);
  console.log(`- ${r.name} (${r.id}): ${menu.length} items generated (Pool: ${menu[0]?.category} -> ${menu[0]?.name})`);
}

console.log('Finished regenerating all OSM menus in bitebox.db.');
