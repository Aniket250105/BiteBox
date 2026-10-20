// OpenStreetMap Overpass API Service with resilient multi-tier caching and fallback cascade
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_DIR = path.resolve(__dirname, '..', 'data');

export const HUB_COORDINATES = {
  presidency: { name: 'Presidency University', lat: 13.1693, lng: 77.5348, snapshotFile: 'snapshot_presidency.json' },
  indiranagar: { name: 'Indiranagar 100ft Rd', lat: 12.9830, lng: 77.6350, snapshotFile: 'snapshot_indiranagar.json' },
  koramangala: { name: 'Koramangala 4th Block', lat: 12.9345, lng: 77.6265, snapshotFile: 'snapshot_koramangala.json' },
  mgroad: { name: 'MG Road / Church St', lat: 12.9755, lng: 77.6050, snapshotFile: 'snapshot_mgroad.json' }
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

/**
 * Calculates haversine distance between two coordinates in kilometers
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes estimated delivery time in minutes from distance:
 * ~15 mins preparation + 4 mins per km
 */
export function computeDeliveryTimeEst(distanceKm) {
  const travelMins = Math.round(distanceKm * 4);
  const minTime = 15 + travelMins;
  const maxTime = minTime + 7;
  return `${minTime}-${maxTime} min`;
}

/**
 * Selects an image and emoji based on cuisine
 */
export function getCuisineVisuals(cuisineStr = '', amenity = '') {
  const c = `${cuisineStr} ${amenity}`.toLowerCase();
  if (c.includes('south indian') || c.includes('dosa') || c.includes('idli')) {
    return {
      emoji: '🌿',
      image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=500&q=80'
    };
  }
  if (c.includes('chinese') || c.includes('asian') || c.includes('noodle')) {
    return {
      emoji: '🥢',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&q=80'
    };
  }
  if (c.includes('burger') || c.includes('fast_food') || c.includes('sandwich')) {
    return {
      emoji: '🍔',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'
    };
  }
  if (c.includes('pizza') || c.includes('italian')) {
    return {
      emoji: '🍕',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80'
    };
  }
  if (c.includes('cafe') || c.includes('coffee') || c.includes('bakery')) {
    return {
      emoji: '☕',
      image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80'
    };
  }
  return {
    emoji: '🍛',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80'
  };
}

/**
 * Formats address components from OSM tags
 */
export function formatAddress(tags = {}) {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:suburb']) parts.push(tags['addr:suburb']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Normalizes an OSM element into a BiteBox restaurant object
 */
export function normalizeOsmElement(element, customerLat, customerLng) {
  const tags = element.tags || {};
  const name = tags.name ? tags.name.trim() : '';
  if (!name) return null;

  // Exclude hotels / lodging (Karnataka convention where "hotel" can mean eatery, but avoid actual lodging)
  if (tags.tourism === 'hotel' || tags.tourism === 'guest_house' || tags.tourism === 'hostel') {
    return null;
  }

  const lat = element.lat !== undefined ? element.lat : (element.center ? element.center.lat : null);
  const lng = element.lon !== undefined ? element.lon : (element.center ? element.center.lon : null);
  if (lat === null || lng === null) return null;

  const osmType = element.type || 'node';
  const osmId = element.id;
  const id = `osm_${osmType}_${osmId}`;

  // Pure veg detection
  const isPureVeg = tags['diet:vegetarian'] === 'only' || 
                    name.toLowerCase().includes('pure veg') || 
                    tags.cuisine?.toLowerCase().includes('pure veg');

  // Cuisine default
  let cuisine = tags.cuisine ? tags.cuisine.replace(/;/g, ', ') : '';
  if (!cuisine) {
    if (tags.amenity === 'cafe') cuisine = 'Cafe, Beverages';
    else if (tags.amenity === 'fast_food') cuisine = 'Fast Food, Snacks';
    else cuisine = 'Restaurant';
  }
  if (isPureVeg && !cuisine.toLowerCase().includes('pure veg')) {
    cuisine = `${cuisine} (Pure Veg)`;
  }

  const visuals = getCuisineVisuals(cuisine, tags.amenity);
  const address = formatAddress(tags);
  const distanceKm = haversineDistanceKm(customerLat, customerLng, lat, lng);

  return {
    id,
    osm_type: osmType,
    osm_id: osmId,
    name,
    cuisine,
    cuisines: cuisine.split(',').map(s => s.trim()),
    rating: null, // Stored as explicit NULL for honesty
    price_for_two: null, // Stored as explicit NULL for honesty
    priceForTwo: null,
    delivery_time_est: computeDeliveryTimeEst(distanceKm),
    deliveryTime: computeDeliveryTimeEst(distanceKm),
    is_open: 1, // OSM places default to open
    isOpen: true,
    image_url: visuals.image,
    image: visuals.image,
    emoji: visuals.emoji,
    lat,
    lng,
    source: 'osm',
    address,
    opening_hours: tags.opening_hours || null,
    rawDist: distanceKm,
    distanceKm: Math.round(distanceKm * 10) / 10,
    distanceText: `${(Math.round(distanceKm * 10) / 10).toFixed(1)} km`,
    isPureVeg
  };
}

/**
 * Upserts normalized OSM places into SQLite `restaurants` table
 */
export function upsertOsmRestaurants(targetDb, restaurants) {
  const stmt = targetDb.prepare(`
    INSERT INTO restaurants (
      id, name, cuisine, rating, delivery_time_est, is_open, image_url, emoji, price_for_two, lat, lng, source, osm_type, osm_id, address
    ) VALUES (
      @id, @name, @cuisine, NULL, NULL, @is_open, @image_url, @emoji, NULL, @lat, @lng, 'osm', @osm_type, @osm_id, @address
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      cuisine = excluded.cuisine,
      lat = excluded.lat,
      lng = excluded.lng,
      address = excluded.address
  `);

  const runBatch = targetDb.transaction((rows) => {
    for (const r of rows) {
      stmt.run({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        is_open: r.is_open ? 1 : 0,
        image_url: r.image_url,
        emoji: r.emoji,
        lat: r.lat,
        lng: r.lng,
        osm_type: r.osm_type,
        osm_id: r.osm_id,
        address: r.address
      });
    }
  });

  runBatch(restaurants);
}

/**
 * Executes an Overpass query with timeout and mirror fallback
 */
export async function fetchFromOverpass(lat, lng, radiusKm = 3) {
  const radiusMeters = Math.min(radiusKm, 3) * 1000;
  const query = `[out:json][timeout:10];(nwr["amenity"~"^(restaurant|fast_food|cafe)$"](around:${radiusMeters},${lat},${lng}););out center tags;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BiteBox/1.0 (https://github.com/bitebox; demo prototype)'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.elements)) {
          return json.elements;
        }
      }
    } catch (_err) {
      // Mirror fallback continues to next endpoint
    }
  }

  throw new Error('Overpass network request timed out or failed on all mirrors.');
}

/**
 * Finds the closest snapshot within 1 km of the target coordinates
 */
export function getSnapshotIfWithin1Km(lat, lng) {
  for (const [key, hub] of Object.entries(HUB_COORDINATES)) {
    const dist = haversineDistanceKm(lat, lng, hub.lat, hub.lng);
    if (dist <= 1.0) {
      const filePath = path.join(SNAPSHOT_DIR, hub.snapshotFile);
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(raw);
          return { data, hubKey: key, hubName: hub.name, distanceKm: dist };
        } catch (_err) {
          // File read error
        }
      }
    }
  }
  return null;
}

/**
 * Retrieves seeded demo restaurants with dynamically calculated distance and delivery time
 */
export function getSeededFallbackRestaurants(targetDb, lat, lng) {
  const rows = targetDb.prepare(`
    SELECT * FROM restaurants 
    WHERE source = 'seed' OR id IN ('r1', 'r2', 'r3', 'r4')
  `).all();

  return rows.map(r => {
    const dist = haversineDistanceKm(lat, lng, r.lat, r.lng);
    const estTime = computeDeliveryTimeEst(dist);
    return {
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      cuisines: r.cuisine ? r.cuisine.split(',').map(s => s.trim()) : [],
      rating: Number(r.rating) || 4.0,
      priceForTwo: r.price_for_two || 250,
      price_for_two: r.price_for_two || 250,
      deliveryTime: estTime,
      delivery_time_est: estTime,
      isOpen: Boolean(r.is_open),
      is_open: r.is_open,
      emoji: r.emoji,
      image: r.image_url,
      image_url: r.image_url,
      lat: r.lat,
      lng: r.lng,
      source: 'seed',
      address: r.address || 'Bengaluru',
      distanceKm: Math.round(dist * 10) / 10,
      distanceText: `${(Math.round(dist * 10) / 10).toFixed(1)} km`,
      isDemoFallback: true
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Main coordinator function for nearby restaurants
 * Fallback Cascade: Fresh Cache -> Overpass API -> Stale Cache -> Snapshot (<= 1 km) -> Seeded demo
 */
export async function getNearbyRestaurants({
  lat,
  lng,
  radiusKm = 3,
  targetDb = db,
  overpassFetcher = fetchFromOverpass
}) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  const effectiveRadius = Math.min(Math.max(0.5, Number(radiusKm) || 3), Number(process.env.DELIVERY_RADIUS_KM) || 3);
  const cellKey = `${numLat.toFixed(3)}_${numLng.toFixed(3)}_${effectiveRadius}`;

  // 1. Fresh Cache Check (24 hours TTL)
  const cachedRow = targetDb.prepare(`
    SELECT * FROM geo_cache 
    WHERE cell_key = ?
  `).get(cellKey);

  if (cachedRow) {
    const fetchedAt = new Date(cachedRow.fetched_at).getTime();
    const isFresh = (Date.now() - fetchedAt) < 24 * 60 * 60 * 1000;
    if (isFresh) {
      try {
        const payload = JSON.parse(cachedRow.payload);
        // Recalculate dynamic distance & ETA from customer position, strictly filtered using exact haversineDistanceKm <= effectiveRadius
        const processed = payload
          .map(r => {
            const rawDist = haversineDistanceKm(numLat, numLng, r.lat, r.lng);
            return {
              ...r,
              rawDist,
              delivery_time_est: computeDeliveryTimeEst(rawDist),
              deliveryTime: computeDeliveryTimeEst(rawDist),
              distanceKm: Math.round(rawDist * 10) / 10,
              distanceText: `${(Math.round(rawDist * 10) / 10).toFixed(1)} km`
            };
          })
          .filter(r => r.rawDist <= effectiveRadius)
          .sort((a, b) => a.rawDist - b.rawDist);

        return {
          source: 'cache-fresh',
          count: processed.length,
          restaurants: processed,
          notice: null
        };
      } catch (_e) {
        // Corrupted cache payload, continue to next step
      }
    }
  }

  // 2. Overpass API Live Query (query with slight buffer of 0.3 km to cover the cell)
  try {
    const rawElements = await overpassFetcher(numLat, numLng, effectiveRadius + 0.3);
    const normalized = [];

    for (const elem of rawElements) {
      const item = normalizeOsmElement(elem, numLat, numLng);
      if (item && item.rawDist <= (effectiveRadius + 0.3)) {
        normalized.push(item);
      }
    }

    normalized.sort((a, b) => a.rawDist - b.rawDist);

    // Filter strictly to effectiveRadius using unrounded distance for the returned result
    const forResponse = normalized.filter(r => r.rawDist <= effectiveRadius).slice(0, 40);

    // Upsert places into restaurants table
    if (forResponse.length > 0) {
      upsertOsmRestaurants(targetDb, forResponse);
    }

    // Persist cell elements into geo_cache (capped at 50)
    targetDb.prepare(`
      INSERT OR REPLACE INTO geo_cache (cell_key, fetched_at, payload)
      VALUES (?, CURRENT_TIMESTAMP, ?)
    `).run(cellKey, JSON.stringify(normalized.slice(0, 50)));

    return {
      source: 'overpass-live',
      count: forResponse.length,
      restaurants: forResponse,
      notice: null
    };
  } catch (_netErr) {
    // 3. Stale Cache Fallback
    if (cachedRow) {
      try {
        const payload = JSON.parse(cachedRow.payload);
        const processed = payload
          .map(r => {
            const rawDist = haversineDistanceKm(numLat, numLng, r.lat, r.lng);
            return {
              ...r,
              rawDist,
              delivery_time_est: computeDeliveryTimeEst(rawDist),
              deliveryTime: computeDeliveryTimeEst(rawDist),
              distanceKm: Math.round(rawDist * 10) / 10,
              distanceText: `${(Math.round(rawDist * 10) / 10).toFixed(1)} km`
            };
          })
          .filter(r => r.rawDist <= effectiveRadius)
          .sort((a, b) => a.rawDist - b.rawDist);

        return {
          source: 'cache-stale',
          count: processed.length,
          restaurants: processed,
          notice: 'Showing saved restaurants'
        };
      } catch (_e) {
        // Fall through
      }
    }

    // 4. Snapshot Fallback (only within 1 km of a hub)
    const snapshotMatch = getSnapshotIfWithin1Km(numLat, numLng);
    if (snapshotMatch && Array.isArray(snapshotMatch.data)) {
      const processed = snapshotMatch.data.map(elem => normalizeOsmElement(elem, numLat, numLng))
        .filter(r => r && r.rawDist <= effectiveRadius)
        .sort((a, b) => a.rawDist - b.rawDist)
        .slice(0, 40);

      if (processed.length > 0) {
        upsertOsmRestaurants(targetDb, processed);
        return {
          source: 'snapshot',
          count: processed.length,
          restaurants: processed,
          notice: 'Showing saved restaurants'
        };
      }
    }

    // 5. Seeded Demo Restaurants Fallback
    const seedFallback = getSeededFallbackRestaurants(targetDb, numLat, numLng);
    return {
      source: 'seed-fallback',
      count: seedFallback.length,
      restaurants: seedFallback,
      notice: 'Live data unavailable. Showing demo restaurants'
    };
  }
}
