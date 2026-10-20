import { Router } from 'express';
import { restaurantRepository } from '../repositories/restaurantRepository.js';
import { getNearbyRestaurants } from '../services/overpassService.js';
import db from '../db.js';

const router = Router();

export function formatRestaurant(r) {
  return {
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    cuisines: r.cuisine ? r.cuisine.split(',').map(s => s.trim()) : [],
    // Explicit null for OSM restaurants without ratings
    rating: (r.rating === null || r.rating === undefined) ? null : Number(r.rating),
    // Explicit null for OSM restaurants without price_for_two
    priceForTwo: (r.price_for_two === null || r.price_for_two === undefined) ? null : Number(r.price_for_two),
    price_for_two: (r.price_for_two === null || r.price_for_two === undefined) ? null : Number(r.price_for_two),
    deliveryTime: r.delivery_time_est || null,
    delivery_time_est: r.delivery_time_est || null,
    isOpen: Boolean(r.is_open),
    is_open: r.is_open,
    emoji: r.emoji,
    image: r.image_url,
    image_url: r.image_url,
    lat: r.lat,
    lng: r.lng,
    source: r.source || 'seed',
    osm_type: r.osm_type || null,
    osm_id: r.osm_id || null,
    address: r.address || null,
    distanceKm: r.distanceKm !== undefined ? r.distanceKm : null,
    distanceText: r.distanceText || null,
    isDemoFallback: Boolean(r.isDemoFallback)
  };
}

export function formatMenuItem(m) {
  return {
    id: m.id,
    restaurantId: m.restaurant_id,
    restaurant_id: m.restaurant_id,
    category: m.category,
    name: m.name,
    price: Number(m.price),
    isVeg: Boolean(m.is_veg),
    is_veg: m.is_veg,
    isAvailable: Boolean(m.is_available),
    is_available: m.is_available,
    stockQuantity: m.stock_quantity,
    description: m.description || '',
    image: m.image_url,
    image_url: m.image_url
  };
}

// GET /api/restaurants/nearby?lat=&lng=&radiusKm=3
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radiusKm } = req.query;

    if (lat === undefined || lng === undefined || lat === '' || lng === '') {
      return res.status(400).json({ error: 'Latitude and longitude query parameters are required.' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

    // Validate lat and lng as finite numbers in valid geographical ranges (-90 to 90, -180 to 180)
    // Note: Do not log raw coordinates for privacy
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' });
    }

    const maxRadius = Number(process.env.DELIVERY_RADIUS_KM) || 3;
    const requestedRadius = Number(radiusKm) || 3;
    const effectiveRadius = Math.min(Math.max(0.5, requestedRadius), maxRadius);

    const result = await getNearbyRestaurants({
      lat: numLat,
      lng: numLng,
      radiusKm: effectiveRadius,
      targetDb: db
    });

    const formattedList = result.restaurants.map(formatRestaurant);

    return res.status(200).json({
      source: result.source,
      count: formattedList.length,
      notice: result.notice,
      radiusKm: effectiveRadius,
      restaurants: formattedList
    });
  } catch (err) {
    console.error('Error fetching nearby restaurants:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve nearby restaurants.' });
  }
});

// GET /api/restaurants?area=
router.get('/', (req, res) => {
  try {
    const { area } = req.query;
    const rows = restaurantRepository.findByArea(area);
    const restaurants = rows.map(formatRestaurant);
    return res.status(200).json({
      area: area || null,
      count: restaurants.length,
      restaurants
    });
  } catch (err) {
    console.error('Error fetching restaurants:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve restaurants.' });
  }
});

// GET /api/restaurants/:id/menu
router.get('/:id/menu', (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = restaurantRepository.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    const rows = restaurantRepository.getMenuByRestaurantId(id);
    const menuItems = rows.map(formatMenuItem);

    return res.status(200).json({
      restaurant: formatRestaurant(restaurant),
      count: menuItems.length,
      menu: menuItems
    });
  } catch (err) {
    console.error('Error fetching menu:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve menu items.' });
  }
});

// GET /api/restaurants/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = restaurantRepository.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }
    return res.status(200).json({
      restaurant: formatRestaurant(restaurant)
    });
  } catch (err) {
    console.error('Error fetching restaurant details:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve restaurant details.' });
  }
});

export default router;
