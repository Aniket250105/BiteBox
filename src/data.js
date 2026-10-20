export const RESTAURANTS = [
  {
    id: 'r1',
    name: 'Spicy Symphony',
    cuisines: ['North Indian', 'Chinese'],
    rating: 4.5,
    deliveryTime: '25-30 min',
    isOpen: true,
    emoji: '🍛',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80' // Indian food
  },
  {
    id: 'r2',
    name: 'Burger & Co.',
    cuisines: ['American', 'Fast Food'],
    rating: 4.2,
    deliveryTime: '15-20 min',
    isOpen: true,
    emoji: '🍔',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' // Burger
  },
  {
    id: 'r3',
    name: 'Green Leaf (Pure Veg)',
    cuisines: ['South Indian', 'Desserts'],
    rating: 4.8,
    deliveryTime: '30-40 min',
    isOpen: true,
    emoji: '🌿',
    image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aW5kaWFuJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D' // Working Indian food
  },
  {
    id: 'r4',
    name: 'Midnight Munchies',
    cuisines: ['Snacks', 'Beverages'],
    rating: 3.9,
    deliveryTime: '45-55 min',
    isOpen: false,
    emoji: '🍕',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80' // Pizza
  }
];

export const MENU_ITEMS = [
  {
    id: 'm1',
    category: 'Starters',
    name: 'Paneer Tikka',
    price: 240,
    isVeg: true,
    isAvailable: true,
    description: 'Soft paneer cubes marinated in spices and grilled to perfection.',
    image: 'https://c.ndtvimg.com/2024-07/9fe2b05g_paneer-tikka_625x300_01_July_24.jpg' // Indian starter
  },
  {
    id: 'm2',
    category: 'Starters',
    name: 'Chicken Wings 6pcs',
    price: 320,
    isVeg: false,
    isAvailable: true,
    description: 'Crispy fried wings tossed in our signature hot sauce.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80' // Wings/Meat
  },
  {
    id: 'm3',
    category: 'Starters',
    name: 'Mushroom Galouti',
    price: 280,
    isVeg: true,
    isAvailable: false,
    description: 'Melt-in-mouth mushroom kebabs.',
    image: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=300&q=80' // Pizza
  },
  {
    id: 'm4',
    category: 'Mains',
    name: 'Butter Chicken',
    price: 450,
    isVeg: false,
    isAvailable: true,
    description: 'Classic creamy tomato gravy with roasted chicken.',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' // Curry
  },
  {
    id: 'm5',
    category: 'Mains',
    name: 'Dal Makhani',
    price: 310,
    isVeg: true,
    isAvailable: true,
    description: 'Slow-cooked black lentils in butter and cream.',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' // Dal
  },
  {
    id: 'm6',
    category: 'Breads',
    name: 'Garlic Naan',
    price: 75,
    isVeg: true,
    isAvailable: true,
    description: 'Tandoori flatbread topped with garlic and butter.',
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' // Naan
  },
  {
    id: 'm7',
    category: 'Desserts',
    name: 'Gulab Jamun (2pcs)',
    price: 90,
    isVeg: true,
    isAvailable: true,
    description: 'Soft berry-sized balls soaked in rose-flavored sugar syrup.',
    image: 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=' // Indian sweet
  }
];

export const ORDER_STATUS_LIST = [
  'placed',
  'paid, awaiting restaurant decision',
  'confirmed',
  'preparing',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'rejected',
  'cancelled'
];

export const ORDER_STATUSES = {
  PLACED: 'placed',
  PAID_AWAITING_RESTAURANT_DECISION: 'paid, awaiting restaurant decision',
  AWAITING_DECISION: 'paid, awaiting restaurant decision',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  PICKED_UP: 'picked_up',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

