// Menu generator for OpenStreetMap restaurants
// Builds deterministic, realistic menus based on cuisine tags, pure-veg status, and OSM ID.

function createPRNG(seedNumber) {
  let s = Math.abs(Number(seedNumber) || 42);
  if (s === 0) s = 12345;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const CUISINE_POOLS = {
  north_indian: {
    Starters: [
      { name: 'Paneer Tikka Angara', veg: true, basePrice: 240, desc: 'Smoky spiced cottage cheese skewers with mint chutney.', img: 'https://c.ndtvimg.com/2024-07/9fe2b05g_paneer-tikka_625x300_01_July_24.jpg' },
      { name: 'Dahi Ke Kebab', veg: true, basePrice: 220, desc: 'Melt-in-mouth hung curd patties infused with green chilies.', img: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=300&q=80' },
      { name: 'Hara Bhara Kebab', veg: true, basePrice: 200, desc: 'Spinach and green pea patties shallow fried with cashews.', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
      { name: 'Tandoori Soya Chaap', veg: true, basePrice: 230, desc: 'Tender marinated soya chunks roasted in a clay tandoor.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Chicken Malai Tikka', veg: false, basePrice: 320, desc: 'Creamy cardamom-scented boneless chicken kebabs.', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80' },
      { name: 'Mutton Seekh Kebab', veg: false, basePrice: 380, desc: 'Minced lamb spiced with royal garam masala, grilled on skewers.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' },
      { name: 'Tandoori Chicken Half', veg: false, basePrice: 340, desc: 'Classic bone-in roasted chicken with Punjabi marinade.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' }
    ],
    Mains: [
      { name: 'Paneer Butter Masala', veg: true, basePrice: 320, desc: 'Cottage cheese cubes in rich tomato, butter, and cashew gravy.', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
      { name: 'Dal Makhani', veg: true, basePrice: 290, desc: 'Overnight slow cooked whole urad lentils with dairy butter and cream.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Kadai Paneer', veg: true, basePrice: 310, desc: 'Paneer cubes tossed with bell peppers and crushed coriander seeds.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Yellow Dal Tadka', veg: true, basePrice: 220, desc: 'Yellow lentils tempered with ghee, garlic, cumin, and dry chilies.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Butter Chicken', veg: false, basePrice: 420, desc: 'Tender tandoori chicken simmered in rich creamy velvet gravy.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Kashmiri Mutton Rogan Josh', veg: false, basePrice: 460, desc: 'Slow braised lamb shank in aromatic Kashmiri red chili gravy.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Murgh Tikka Masala', veg: false, basePrice: 410, desc: 'Chargrilled chicken tikka in spiced onion-tomato curry.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' }
    ],
    Breads: [
      { name: 'Garlic Butter Naan', veg: true, basePrice: 75, desc: 'Freshly baked leavened flatbread brushed with garlic butter.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' },
      { name: 'Butter Roti', veg: true, basePrice: 35, desc: 'Whole wheat tandoori roti with pure ghee.', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
      { name: 'Laccha Paratha', veg: true, basePrice: 60, desc: 'Multi-layered flaky wheat bread.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Cheese Chili Naan', veg: true, basePrice: 95, desc: 'Naan stuffed with melted cheddar and chopped green chilies.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Gulab Jamun (2pcs)', veg: true, basePrice: 90, desc: 'Golden khoya dumplings steeped in warm rose syrup.', img: 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=' },
      { name: 'Rasmalai (2pcs)', veg: true, basePrice: 110, desc: 'Soft chenna patties soaked in chilled saffron infused milk.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Kesar Pista Kulfi', veg: true, basePrice: 100, desc: 'Traditional slow churned dense ice cream with pistachios.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Patiala Sweet Lassi', veg: true, basePrice: 85, desc: 'Thick chilled sweet yogurt beverage with clotted cream.', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80' },
      { name: 'Masala Spiced Chaas', veg: true, basePrice: 60, desc: 'Refreshing buttermilk with roasted cumin and mint.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  south_indian: {
    Starters: [
      { name: 'Ghee Podi Idli (10pcs)', veg: true, basePrice: 110, desc: 'Mini steamed rice cakes tossed in fiery gunpowder and ghee.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Medu Vada (2pcs)', veg: true, basePrice: 90, desc: 'Crispy lentil donuts served with coconut chutney and sambar.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Paneer Pepper Fry', veg: true, basePrice: 220, desc: 'Tender paneer cubes tossed with fresh curry leaves and pepper.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Chicken 65', veg: false, basePrice: 260, desc: 'Crispy deep fried chicken tossed with yogurt, curry leaves and chilies.', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80' },
      { name: 'Mangalore Fish Fry', veg: false, basePrice: 310, desc: 'Fresh fish fillets rava fried in coastal spices.', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80' }
    ],
    Mains: [
      { name: 'Masala Dosa', veg: true, basePrice: 110, desc: 'Crispy fermented crepe with potato masala and trio of chutneys.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Ghee Roast Paper Dosa', veg: true, basePrice: 130, desc: 'Ultra-crispy golden dosa drizzled with pure desi ghee.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Bisi Bele Bath', veg: true, basePrice: 120, desc: 'Hearty Karnataka spiced rice, lentils, and garden vegetables.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'South Indian Royal Thali', veg: true, basePrice: 220, desc: 'Full platter with rice, sambar, rasam, 2 poriyals, curd and payasam.', img: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=300&q=80' },
      { name: 'Chettinad Chicken Curry', veg: false, basePrice: 340, desc: 'Fiery chicken gravy infused with star anise and roasted spices.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Malabar Prawn Roast', veg: false, basePrice: 380, desc: 'Coastal style prawns cooked in thick onion-tomato gravy.', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80' }
    ],
    Breads: [
      { name: 'Malabar Parotta (2pcs)', veg: true, basePrice: 60, desc: 'Flaky layered Kerala flatbread.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Appam with Coconut Milk (2pcs)', veg: true, basePrice: 90, desc: 'Soft-centered bowl-shaped fermented rice pancakes.', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
      { name: 'Poori with Potato Saagu (3pcs)', veg: true, basePrice: 95, desc: 'Puffy whole-wheat bread served with vegetable saagu.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Ghee Mysore Pak', veg: true, basePrice: 80, desc: 'Rich golden sweet made from gram flour and pure ghee.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Pineapple Kesari Bath', veg: true, basePrice: 65, desc: 'Warm semolina pudding infused with pineapple and cashews.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Elaneer Payasam', veg: true, basePrice: 95, desc: 'Delicate pudding made with tender coconut pulp and milk.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Degree Filter Coffee', veg: true, basePrice: 50, desc: 'Authentic frothy South Indian chicory brew in steel tumbler.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Chilled Buttermilk', veg: true, basePrice: 45, desc: 'Cooling drink flavored with curry leaves, ginger and hing.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  chinese: {
    Starters: [
      { name: 'Crispy Veg Spring Rolls (4pcs)', veg: true, basePrice: 190, desc: 'Golden fried wrappers filled with shredded vegetables.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' },
      { name: 'Chilli Paneer Dry', veg: true, basePrice: 240, desc: 'Wok-tossed paneer with bell peppers, green chilies, and soy glaze.', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
      { name: 'Crispy Corn Salt & Pepper', veg: true, basePrice: 200, desc: 'Fried sweet corn kernels tossed with crushed peppercorns.', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80' },
      { name: 'Chicken Lollipop (6pcs)', veg: false, basePrice: 280, desc: 'Crispy spiced chicken wings served with fiery Schezwan dip.', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80' },
      { name: 'Dragon Chicken', veg: false, basePrice: 300, desc: 'Stir fried crispy chicken strips with cashews and fiery red chilies.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Veg Hakka Noodles', veg: true, basePrice: 210, desc: 'Classic wok tossed noodles with julienned vegetables.', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
      { name: 'Chili Garlic Fried Rice', veg: true, basePrice: 220, desc: 'Fragrant fried rice loaded with burnt garlic and red chili.', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80' },
      { name: 'Veg Manchurian Gravy', veg: true, basePrice: 230, desc: 'Fried vegetable rounds in savory ginger-garlic soy gravy.', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
      { name: 'Chicken Schezwan Noodles', veg: false, basePrice: 260, desc: 'Spicy noodles tossed with shredded chicken in Schezwan sauce.', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
      { name: 'Kung Pao Chicken Gravy', veg: false, basePrice: 320, desc: 'Stir fried diced chicken with roasted peanuts and bell peppers.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Breads: [
      { name: 'Steamed Bao Buns (2pcs)', veg: true, basePrice: 120, desc: 'Soft pillowy steamed Asian buns with pickled slaw.', img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80' },
      { name: 'Crispy Fried Wonton Chips', veg: true, basePrice: 90, desc: 'Crunchy golden wonton crisps with sweet chili sauce.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Honey Darsaan with Vanilla', veg: true, basePrice: 140, desc: 'Fried crisp noodles coated in warm honey and sesame with ice cream.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Sweet Sesame Balls', veg: true, basePrice: 120, desc: 'Glutinous rice balls filled with sweet red bean paste.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Jasmine Iced Tea', veg: true, basePrice: 90, desc: 'Chilled brewed jasmine green tea with lemon splash.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Lemon Mint Cooler', veg: true, basePrice: 85, desc: 'Sparkling citrus soda with crushed mint.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' }
    ]
  },

  fast_food: {
    Starters: [
      { name: 'Peri Peri Crinkle Fries', veg: true, basePrice: 130, desc: 'Crispy cut potatoes tossed in spicy African peri peri rub.', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80' },
      { name: 'Mozzarella Cheese Sticks (4pcs)', veg: true, basePrice: 180, desc: 'Golden breaded mozzarella fingers with marinara dip.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
      { name: 'Crispy Onion Rings', veg: true, basePrice: 130, desc: 'Batter dipped whole onion rings fried golden brown.', img: 'https://images.unsplash.com/photo-1639024471287-032f66453916?w=300&q=80' },
      { name: 'BBQ Chicken Popcorn', veg: false, basePrice: 200, desc: 'Bite sized crunchy spiced chicken with smoky barbecue dip.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Buffalo Chicken Wings (6pcs)', veg: false, basePrice: 290, desc: 'Crispy wings tossed in tangy cayenne pepper glaze.', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80' }
    ],
    Mains: [
      { name: 'Crispy Veggie Deluxe Burger', veg: true, basePrice: 180, desc: 'Spiced potato pea patty with cheddar slice, mayo and lettuce.', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80' },
      { name: 'Spicy Paneer Tikka Burger', veg: true, basePrice: 210, desc: 'Crusted cottage cheese patty with tandoori mayo in toasted bun.', img: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&q=80' },
      { name: 'Classic Chicken Cheeseburger', veg: false, basePrice: 220, desc: 'Grilled chicken patty, melted cheddar, pickles and signature sauce.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
      { name: 'Double Smash Bacon Burger', veg: false, basePrice: 320, desc: 'Twin chicken patties with double cheese and caramelized onions.', img: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&q=80' }
    ],
    Breads: [
      { name: 'Cheesy Jalapeno Loaded Fries', veg: true, basePrice: 170, desc: 'Skin-on fries smothered in hot liquid cheddar and pickled jalapenos.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Garlic Parmesan Rolls', veg: true, basePrice: 110, desc: 'Warm herb infused mini rolls with whipped garlic butter.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Molten Chocolate Lava Cake', veg: true, basePrice: 140, desc: 'Warm individual chocolate cake with a molten fudge center.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'Fudge Brownie with Choco Chips', veg: true, basePrice: 130, desc: 'Dense dark chocolate brownie.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Oreo Cream Milkshake', veg: true, basePrice: 150, desc: 'Thick shake made with whole dairy cream and crushed Oreos.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' },
      { name: 'Cold Brew Frappe', veg: true, basePrice: 140, desc: 'Rich espresso blended with vanilla and chilled milk.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Iced Lemon Mint Soda', veg: true, basePrice: 85, desc: 'Sparkling lemon beverage with fresh herbs.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  pizza_italian: {
    Starters: [
      { name: 'Cheesy Garlic Bread Baguette', veg: true, basePrice: 150, desc: 'Crusty loaf loaded with garlic herbs and melted mozzarella.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Classic Tomato Bruschetta (4pcs)', veg: true, basePrice: 170, desc: 'Toasted baguette rounds topped with diced tomatoes, basil, and olive oil.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Crispy Arancini Balls', veg: true, basePrice: 190, desc: 'Golden fried risotto balls filled with mozzarella core.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
      { name: 'BBQ Chicken Bruschetta', veg: false, basePrice: 230, desc: 'Toasted bread topped with smoky chicken and melted cheese.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Margherita Basil Pizza (8-inch)', veg: true, basePrice: 230, desc: 'San Marzano tomato sauce, fresh mozzarella and sweet basil.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Farmhouse Veggie Pizza (8-inch)', veg: true, basePrice: 280, desc: 'Bell peppers, mushrooms, sweet corn, black olives, and mozzarella.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Creamy Alfredo Penne Pasta', veg: true, basePrice: 270, desc: 'Penne pasta in rich Parmesan garlic cream sauce.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Fiery Arrabbiata Penne', veg: true, basePrice: 250, desc: 'Spicy tomato sauce with garlic, chili flakes and fresh basil.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Smoked Chicken Pepperoni Pizza', veg: false, basePrice: 340, desc: 'Thin crust pizza loaded with chicken pepperoni and mozzarella.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Creamy Chicken Alfredo Pasta', veg: false, basePrice: 320, desc: 'Grilled chicken strips in velvety Alfredo Parmesan sauce.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' }
    ],
    Breads: [
      { name: 'Stuffed Garlic Pockets (3pcs)', veg: true, basePrice: 140, desc: 'Puff pastry crust pockets stuffed with corn and jalapeño cheese.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Herb Focaccia with Olive Dip', veg: true, basePrice: 120, desc: 'Rosemary and sea salt focaccia bread slices.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Classic Tiramisu Cup', veg: true, basePrice: 170, desc: 'Espresso soaked ladyfingers layered with mascarpone cream.', img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&q=80' },
      { name: 'Choco Chip Panna Cotta', veg: true, basePrice: 140, desc: 'Silky vanilla cream pudding with chocolate reduction.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Italian Espresso Roast', veg: true, basePrice: 90, desc: 'Bold double shot espresso.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Sparkling Peach Soda', veg: true, basePrice: 110, desc: 'Italian fruit soda over crushed ice.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  cafe_desserts: {
    Starters: [
      { name: 'Avocado Toast with Cherry Tomatoes', veg: true, basePrice: 220, desc: 'Toasted multigrain sourdough topped with crushed seasoned avocado.', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80' },
      { name: 'Cheese Stuffed Butter Croissant', veg: true, basePrice: 160, desc: 'Flaky baked Parisian croissant stuffed with warm gouda.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Creamy Mushroom Sourdough Melt', veg: true, basePrice: 210, desc: 'Sauteed button mushrooms in thyme cheese on sourdough.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Grilled Chicken Caesar Salad', veg: false, basePrice: 250, desc: 'Romaine lettuce, grilled chicken, garlic croutons and Parmesan.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' }
    ],
    Mains: [
      { name: 'Pesto Basil Penne Bowl', veg: true, basePrice: 260, desc: 'Al dente penne tossed with genovese basil pesto and pine nuts.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Spinach & Sweet Corn Panini', veg: true, basePrice: 190, desc: 'Pressed focaccia sandwich filled with creamed spinach and mozzarella.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Grilled Herb Chicken Panini', veg: false, basePrice: 240, desc: 'Herb roasted chicken breast, caramelized onions, and dijonnaise.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' }
    ],
    Breads: [
      { name: 'Artisan Sourdough Toast & Butter', veg: true, basePrice: 90, desc: 'Thick sourdough toast served with churned salted butter.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Cinnamon Swirl Brioche', veg: true, basePrice: 110, desc: 'Warm sweet brioche pastry rolled with cinnamon glaze.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Belgian Dark Chocolate Waffle', veg: true, basePrice: 160, desc: 'Crispy warm waffle smothered in melted Belgian chocolate.', img: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=300&q=80' },
      { name: 'Blueberry Swirl Cheesecake', veg: true, basePrice: 180, desc: 'Smooth New York style baked cheesecake with blueberry compote.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Warm Walnut Chocolate Brownie', veg: true, basePrice: 140, desc: 'Rich chocolate walnut brownie with chocolate drizzle.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Hazelnut Cafe Latte', veg: true, basePrice: 140, desc: 'Espresso with steamed milk and roasted hazelnut syrup.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Chilled Caramel Frappuccino', veg: true, basePrice: 160, desc: 'Blended espresso, cream and caramel drizzle.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' },
      { name: 'Belgian Hot Chocolate', veg: true, basePrice: 150, desc: 'Steaming thick real chocolate drink topped with cocoa dust.', img: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&q=80' }
    ]
  }
};

/**
 * Determines appropriate cuisine pool from cuisine tags
 */
export function detectCuisineGroup(cuisineString = '', name = '') {
  const text = `${cuisineString} ${name}`.toLowerCase();

  if (text.includes('south indian') || text.includes('dosa') || text.includes('idli') || text.includes('udupi') || text.includes('karnataka')) {
    return 'south_indian';
  }
  if (text.includes('chinese') || text.includes('asian') || text.includes('noodles') || text.includes('momos')) {
    return 'chinese';
  }
  if (text.includes('pizza') || text.includes('italian') || text.includes('pasta')) {
    return 'pizza_italian';
  }
  if (text.includes('burger') || text.includes('fast_food') || text.includes('sandwich') || text.includes('fries')) {
    return 'fast_food';
  }
  if (text.includes('cafe') || text.includes('coffee') || text.includes('bakery') || text.includes('dessert') || text.includes('cake')) {
    return 'cafe_desserts';
  }
  if (text.includes('biryani')) {
    return 'north_indian';
  }
  // Default to North Indian as most common casual Indian dining
  return 'north_indian';
}

/**
 * Deterministically generates 18 to 28 menu items for an OSM restaurant
 */
export function generateMenuForRestaurant({ restaurantId, osmId, osmType = 'node', cuisine = '', name = '', isPureVeg = false }) {
  const seedNum = Number(osmId) || 98765;
  const prng = createPRNG(seedNum);

  const primaryGroupKey = detectCuisineGroup(cuisine, name);
  const primaryPool = CUISINE_POOLS[primaryGroupKey] || CUISINE_POOLS.north_indian;
  const fallbackPool = CUISINE_POOLS.fast_food;

  const categories = ['Starters', 'Mains', 'Breads', 'Desserts', 'Beverages'];
  const generatedItems = [];
  let itemIndex = 1;

  for (const cat of categories) {
    let poolItems = (primaryPool[cat] || []).concat(fallbackPool[cat] || []);

    // If pure veg, filter strictly
    if (isPureVeg) {
      poolItems = poolItems.filter(item => item.veg);
    }

    // Determine target count for this category (e.g. 3-6 items each)
    let minPerCat = cat === 'Mains' ? 6 : (cat === 'Starters' ? 5 : (cat === 'Desserts' ? 3 : 2));
    let maxPerCat = cat === 'Mains' ? 8 : (cat === 'Starters' ? 7 : (cat === 'Desserts' ? 4 : 3));
    let targetCount = minPerCat + Math.floor(prng() * (maxPerCat - minPerCat + 1));

    // Shuffle pool deterministically
    const shuffled = [...poolItems].sort(() => prng() - 0.5);
    const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    for (const raw of selected) {
      // Deterministic price variation between -20 and +20 rounded to 10
      const priceOffset = (Math.floor(prng() * 5) - 2) * 10;
      const finalPrice = Math.max(30, raw.basePrice + priceOffset);

      // Unique deterministic ID: e.g. osm_node_12345_1
      const id = `${restaurantId}_${itemIndex}`;

      generatedItems.push({
        id,
        restaurant_id: restaurantId,
        category: cat,
        name: raw.name,
        price: finalPrice,
        is_veg: raw.veg ? 1 : 0,
        is_available: 1,
        stock_quantity: 50,
        description: raw.desc,
        image_url: raw.img
      });

      itemIndex++;
    }
  }

  // Ensure total items between 18 and 28
  // If fewer than 18, pad with generic starters/mains
  while (generatedItems.length < 18) {
    const padItem = {
      id: `${restaurantId}_${itemIndex}`,
      restaurant_id: restaurantId,
      category: 'Starters',
      name: `Chef Special Platter ${itemIndex}`,
      price: 210,
      is_veg: 1,
      is_available: 1,
      stock_quantity: 50,
      description: 'Handcrafted seasonal assortment prepared fresh daily.',
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80'
    };
    generatedItems.push(padItem);
    itemIndex++;
  }

  // Deterministically mark 1 to 2 items as unavailable (stock 0) for testing out-of-stock flows
  const oosIndex1 = 2 + Math.floor(prng() * 3); // item at index 2, 3, or 4
  const oosIndex2 = 8 + Math.floor(prng() * 4); // item at index 8, 9, 10, or 11
  if (generatedItems[oosIndex1]) {
    generatedItems[oosIndex1].is_available = 0;
    generatedItems[oosIndex1].stock_quantity = 0;
    generatedItems[oosIndex1].description += ' (Currently Out of Stock)';
  }
  if (generatedItems[oosIndex2]) {
    generatedItems[oosIndex2].is_available = 0;
    generatedItems[oosIndex2].stock_quantity = 0;
    generatedItems[oosIndex2].description += ' (Currently Out of Stock)';
  }

  return generatedItems;
}

/**
 * Generates and persists menu items into SQLite if not already present
 */
export function getOrGenerateMenu(targetDb, restaurant) {
  const existing = targetDb.prepare(`
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
  `).all(restaurant.id);

  if (existing.length > 0) {
    return existing;
  }

  // Ensure parent restaurant exists in restaurants table before inserting child menu items
  const restInDb = targetDb.prepare(`SELECT id FROM restaurants WHERE id = ?`).get(restaurant.id);
  if (!restInDb) {
    targetDb.prepare(`
      INSERT OR REPLACE INTO restaurants (
        id, name, cuisine, rating, delivery_time_est, is_open, image_url, emoji, price_for_two, lat, lng, source, osm_type, osm_id, address
      ) VALUES (
        ?, ?, ?, NULL, NULL, 1, ?, '🍛', NULL, ?, ?, 'osm', ?, ?, ?
      )
    `).run(
      restaurant.id,
      restaurant.name || 'Sample Restaurant',
      restaurant.cuisine || 'Restaurant',
      restaurant.image_url || null,
      restaurant.lat || 13.1625,
      restaurant.lng || 77.5360,
      restaurant.osm_type || 'node',
      restaurant.osm_id || null,
      restaurant.address || null
    );
  }

  const isPureVeg = (restaurant.cuisine || '').toLowerCase().includes('pure veg') || 
                    (restaurant.name || '').toLowerCase().includes('pure veg') ||
                    restaurant.is_pure_veg === true;

  const generated = generateMenuForRestaurant({
    restaurantId: restaurant.id,
    osmId: restaurant.osm_id,
    osmType: restaurant.osm_type || 'node',
    cuisine: restaurant.cuisine || '',
    name: restaurant.name || '',
    isPureVeg
  });

  const insertStmt = targetDb.prepare(`
    INSERT OR REPLACE INTO menu_items (id, restaurant_id, category, name, price, is_veg, is_available, stock_quantity, description, image_url)
    VALUES (@id, @restaurant_id, @category, @name, @price, @is_veg, @is_available, @stock_quantity, @description, @image_url)
  `);

  const runBatch = targetDb.transaction((items) => {
    for (const item of items) {
      insertStmt.run(item);
    }
  });

  runBatch(generated);

  return targetDb.prepare(`
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
  `).all(restaurant.id);
}
