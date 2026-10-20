// Warm cache script: Fetches and stores OSM places for 4 Bengaluru hubs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { initSchema } from '../schema.js';
import {
  HUB_COORDINATES,
  fetchFromOverpass,
  normalizeOsmElement,
  upsertOsmRestaurants
} from '../services/overpassService.js';
import { getOrGenerateMenu } from '../services/menuGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function warmHub(key, hub) {
  console.log(`\n🌐 Warming cache for ${hub.name} (${hub.lat}, ${hub.lng})...`);
  const cellKey = `${hub.lat.toFixed(3)}_${hub.lng.toFixed(3)}_3`;
  const snapshotPath = path.join(DATA_DIR, hub.snapshotFile);

  let rawElements = null;

  try {
    console.log(`   Attempting live Overpass API query for ${hub.name}...`);
    rawElements = await fetchFromOverpass(hub.lat, hub.lng, 3);
    console.log(`   ✅ Live Overpass returned ${rawElements.length} raw elements.`);

    // Update snapshot file with fresh elements
    fs.writeFileSync(snapshotPath, JSON.stringify(rawElements, null, 2), 'utf8');
    console.log(`   💾 Updated snapshot file: ${hub.snapshotFile}`);
  } catch (err) {
    console.log(`   ⚠️ Live Overpass query unavailable (${err.message}). Using local snapshot...`);
    if (fs.existsSync(snapshotPath)) {
      rawElements = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      console.log(`   📂 Loaded ${rawElements.length} elements from ${hub.snapshotFile}`);
    } else {
      console.log(`   ❌ No snapshot file found for ${hub.name}. Skipping.`);
      return;
    }
  }

  // Normalize elements
  const normalized = [];
  for (const elem of rawElements) {
    const item = normalizeOsmElement(elem, hub.lat, hub.lng);
    if (item && item.distanceKm <= 3.0) {
      normalized.push(item);
    }
  }

  normalized.sort((a, b) => a.distanceKm - b.distanceKm);
  const capped = normalized.slice(0, 40);

  // Upsert into SQLite restaurants
  if (capped.length > 0) {
    upsertOsmRestaurants(db, capped);
    console.log(`   🏢 Upserted ${capped.length} restaurants into database.`);

    // Pre-generate menus for each restaurant
    for (const r of capped) {
      getOrGenerateMenu(db, r);
    }
    console.log(`   🍽️ Pre-generated sample menus for ${capped.length} restaurants.`);
  }

  // Store in geo_cache
  db.prepare(`
    INSERT OR REPLACE INTO geo_cache (cell_key, fetched_at, payload)
    VALUES (?, CURRENT_TIMESTAMP, ?)
  `).run(cellKey, JSON.stringify(capped));

  console.log(`   ⚡ Stored cache entry in geo_cache with cell_key: ${cellKey}`);
}

async function runWarmCache() {
  console.log('====================================================');
  console.log('🚀 BITEBOX WARM CACHE & OFFLINE RESILIENCE INITIALIZER');
  console.log('====================================================');

  initSchema(db);

  for (const [key, hub] of Object.entries(HUB_COORDINATES)) {
    await warmHub(key, hub);
  }

  console.log('\n====================================================');
  console.log('🎉 WARM CACHE COMPLETED FOR ALL 4 HUBS!');
  console.log('====================================================\n');
}

runWarmCache().catch(err => {
  console.error('Fatal warm-cache error:', err);
  process.exit(1);
});
