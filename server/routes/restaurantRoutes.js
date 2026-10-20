import { Router } from 'express';
import { restaurantRepository } from '../repositories/restaurantRepository.js';

const router = Router();

function formatRestaurant(r) {
  return {
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    cuisines: r.cuisine ? r.cuisine.split(',').map(s => s.trim()) : [],
    rating: Number(r.rating) || 4.0,
    deliveryTime: r.delivery_time_est,
    delivery_time_est: r.delivery_time_est,
    isOpen: Boolean(r.is_open),
    is_open: r.is_open,
    emoji: r.emoji,
    image: r.image_url,
    image_url: r.image_url,
    priceForTwo: r.price_for_two || 250,
    lat: r.lat,
    lng: r.lng
  };
}

function formatMenuItem(m) {
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
    console.error('Error fetching restaurants:', err);
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
    console.error('Error fetching menu:', err);
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
    console.error('Error fetching restaurant details:', err);
    return res.status(500).json({ error: 'Failed to retrieve restaurant details.' });
  }
});

export default router;
