// Menu generator for OpenStreetMap restaurants
// Builds deterministic, authentic, restaurant-specific menus based on cuisine tags, pure-veg status, and OSM ID.
import { BRAND_POOLS } from './brandMenus.js';

function createPRNG(seedNumber) {
  let s = Math.abs(Number(seedNumber) || 42);
  if (s === 0) s = 12345;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const CUISINE_POOLS = {
  north_indian: {
    Starters: [
      { name: 'Paneer Tikka Angara', veg: true, basePrice: 240, desc: 'Smoky spiced cottage cheese skewers roasted in clay tandoor with mint chutney.', img: 'https://c.ndtvimg.com/2024-07/9fe2b05g_paneer-tikka_625x300_01_July_24.jpg' },
      { name: 'Dahi Ke Kebab', veg: true, basePrice: 220, desc: 'Melt-in-mouth hung curd patties infused with green chilies and roasted cumin.', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
      { name: 'Hara Bhara Kebab', veg: true, basePrice: 200, desc: 'Spinach and green pea patties shallow fried with cashews.', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
      { name: 'Tandoori Soya Chaap', veg: true, basePrice: 230, desc: 'Tender marinated soya chunks roasted in a clay tandoor.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Corn Cheese Tikki', veg: true, basePrice: 210, desc: 'Golden patties of sweet corn and molten processed cheese.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
      { name: 'Mushroom Galouti Kebab', veg: true, basePrice: 240, desc: 'Velvety minced button mushroom patties pan-seared with Awadhi potli spices.', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
      { name: 'Chicken Malai Tikka', veg: false, basePrice: 320, desc: 'Creamy cardamom-scented boneless chicken kebabs.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Mutton Seekh Kebab', veg: false, basePrice: 380, desc: 'Minced lamb spiced with royal garam masala, grilled on skewers.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' },
      { name: 'Tandoori Chicken Half', veg: false, basePrice: 340, desc: 'Classic bone-in roasted chicken with Punjabi marinade.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Murgh Rozali Kebab', veg: false, basePrice: 350, desc: 'Chicken breast rolls stuffed with spiced minced lamb and saffron.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' }
    ],
    Mains: [
      { name: 'Paneer Butter Masala', veg: true, basePrice: 320, desc: 'Cottage cheese cubes in rich tomato, butter, and cashew gravy.', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
      { name: 'Dal Makhani', veg: true, basePrice: 290, desc: 'Overnight slow cooked whole urad lentils with dairy butter and cream.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Kadai Paneer', veg: true, basePrice: 310, desc: 'Paneer cubes tossed with bell peppers and crushed coriander seeds.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Yellow Dal Tadka', veg: true, basePrice: 220, desc: 'Yellow lentils tempered with ghee, garlic, cumin, and dry chilies.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Malai Kofta in White Gravy', veg: true, basePrice: 330, desc: 'Stuffed cottage cheese and potato dumplings in cashew nut cream gravy.', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
      { name: 'Dum Aloo Kashmiri', veg: true, basePrice: 270, desc: 'Baby potatoes simmered in curd and fennel scented Kashmiri red gravy.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Butter Chicken', veg: false, basePrice: 420, desc: 'Tender tandoori chicken simmered in rich creamy velvet gravy.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Kashmiri Mutton Rogan Josh', veg: false, basePrice: 460, desc: 'Slow braised lamb shank in aromatic Kashmiri red chili gravy.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Murgh Tikka Masala', veg: false, basePrice: 410, desc: 'Chargrilled chicken tikka in spiced onion-tomato curry.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Awadhi Chicken Dum Biryani', veg: false, basePrice: 370, desc: 'Aromatic long grain basmati rice layered with spiced marinated chicken in sealed handi.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Subz Dum Handi Biryani', veg: true, basePrice: 270, desc: 'Layered basmati rice with spiced seasonal vegetables, saffron, and fried onions.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Hyderabadi Chicken Biryani', veg: false, basePrice: 360, desc: 'Tender chicken and fragrant basmati dum cooked with authentic spices.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' }
    ],
    Breads: [
      { name: 'Garlic Butter Naan', veg: true, basePrice: 75, desc: 'Freshly baked leavened flatbread brushed with garlic butter.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' },
      { name: 'Butter Roti', veg: true, basePrice: 35, desc: 'Whole wheat tandoori roti with pure ghee.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Laccha Paratha', veg: true, basePrice: 60, desc: 'Multi-layered flaky wheat bread.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Cheese Chili Naan', veg: true, basePrice: 95, desc: 'Naan stuffed with melted cheddar and chopped green chilies.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' },
      { name: 'Amritsari Kulcha', veg: true, basePrice: 85, desc: 'Stuffed potato and onion bread crisped in clay oven.', img: 'https://images.unsplash.com/photo-1788602564560-9bcbf0f9acb6?w=300&q=80' },
      { name: 'Roomali Roti', veg: true, basePrice: 50, desc: 'Paper thin handkerchief soft bread tossed on inverted wok.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Gulab Jamun (2pcs)', veg: true, basePrice: 90, desc: 'Golden khoya dumplings steeped in warm rose cardamom syrup.', img: 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=' },
      { name: 'Rasmalai (2pcs)', veg: true, basePrice: 110, desc: 'Soft chenna patties soaked in chilled saffron infused milk.', img: '/dishes/kesar_rasmalai.jpg' },
      { name: 'Kesar Pista Kulfi', veg: true, basePrice: 100, desc: 'Traditional slow churned dense ice cream with pistachios.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Warm Gajar Ka Halwa', veg: true, basePrice: 120, desc: 'Slow cooked grated carrots in whole milk, mawa and cashew nuts.', img: 'https://images.unsplash.com/photo-1760263216784-a4ca9a841ff5?w=300&q=80' },
      { name: 'Shahi Tukda', veg: true, basePrice: 130, desc: 'Crispy ghee-fried bread rounds soaked in sugar syrup and topped with rabdi.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Patiala Sweet Lassi', veg: true, basePrice: 85, desc: 'Thick chilled sweet yogurt beverage topped with clotted malai.', img: '/dishes/sweet_lassi.jpg' },
      { name: 'Masala Spiced Chaas', veg: true, basePrice: 60, desc: 'Refreshing buttermilk with roasted cumin and mint.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Mango Alphonso Lassi', veg: true, basePrice: 100, desc: 'Rich blended yogurt shake with pure Ratnagiri Alphonso pulp.', img: '/dishes/sweet_lassi.jpg' },
      { name: 'Kulhad Masala Chai', veg: true, basePrice: 45, desc: 'Brewed ginger cardamom tea served piping hot.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' }
    ]
  },

  south_indian: {
    Starters: [
      { name: 'Ghee Podi Idli (10pcs)', veg: true, basePrice: 110, desc: 'Mini steamed rice cakes tossed in fiery gunpowder and desi ghee.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Medu Vada (2pcs)', veg: true, basePrice: 90, desc: 'Crispy golden lentil donuts served with coconut chutney and sambar.', img: 'https://images.unsplash.com/photo-1730191843435-073792ba22bc?w=300&q=80' },
      { name: 'Paneer Pepper Fry', veg: true, basePrice: 220, desc: 'Tender paneer cubes tossed with fresh curry leaves and crushed black pepper.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Crispy Onion Pakoda', veg: true, basePrice: 100, desc: 'Thinly sliced onions coated in spiced besan, deep fried crunchy.', img: 'https://images.unsplash.com/photo-1765360024331-25b63e85272e?w=300&q=80' },
      { name: 'Mushroom Sukka', veg: true, basePrice: 210, desc: 'Button mushrooms sauteed in dry roasted Mangalorean coconut masala.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Mirchi Bajji (3pcs)', veg: true, basePrice: 85, desc: 'Batter dipped mild green peppers fried and served with tangy onion relish.', img: 'https://images.unsplash.com/photo-1765360024331-25b63e85272e?w=300&q=80' },
      { name: 'Chicken 65', veg: false, basePrice: 260, desc: 'Crispy deep fried chicken tossed with yogurt, curry leaves and green chilies.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Mangalore Fish Fry', veg: false, basePrice: 310, desc: 'Fresh fish fillets rava fried in fiery Byadgi coastal spices.', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80' },
      { name: 'Mutton Sukka Roast', veg: false, basePrice: 380, desc: 'Tender lamb chunks dry cooked with caramelized shallots and ground spices.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' }
    ],
    Mains: [
      { name: 'Masala Dosa', veg: true, basePrice: 110, desc: 'Crispy fermented rice crepe filled with potato masala and trio of chutneys.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Ghee Roast Paper Dosa', veg: true, basePrice: 130, desc: 'Ultra-crispy golden dosa drizzled with pure desi ghee.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Bisi Bele Bath with Boondi', veg: true, basePrice: 120, desc: 'Hearty Karnataka spiced rice, lentils, and garden vegetables with ghee.', img: 'https://plus.unsplash.com/premium_photo-1694506374757-632d818eb023?w=300&q=80' },
      { name: 'South Indian Royal Thali', veg: true, basePrice: 220, desc: 'Full platter with rice, sambar, rasam, 2 poriyals, curd, papad, and payasam.', img: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=300&q=80' },
      { name: 'Onion Rava Masala Dosa', veg: true, basePrice: 125, desc: 'Crisp semolina crepe embedded with toasted onions and green chilies.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Curd Rice with Pomegranate', veg: true, basePrice: 95, desc: 'Comforting mashed rice with fresh yogurt, tempered with mustard and ginger.', img: '/dishes/curd_rice.jpg' },
      { name: 'Chettinad Chicken Curry', veg: false, basePrice: 340, desc: 'Fiery chicken gravy infused with stone flower, black pepper and roasted coconut.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Malabar Prawn Curry', veg: false, basePrice: 380, desc: 'Coastal style prawns gently poached in coconut milk and kokum gravy.', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80' },
      { name: 'Kerala Mutton Stew', veg: false, basePrice: 390, desc: 'Tender mutton cooked in mild coconut cream with peppercorns and potatoes.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' }
    ],
    Breads: [
      { name: 'Malabar Parotta (2pcs)', veg: true, basePrice: 60, desc: 'Flaky multi-layered Kerala flatbread cooked golden brown.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Appam with Coconut Milk (2pcs)', veg: true, basePrice: 90, desc: 'Soft-centered bowl-shaped fermented rice pancakes with sweet coconut milk.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Poori with Potato Saagu (3pcs)', veg: true, basePrice: 95, desc: 'Puffy whole-wheat bread served with Bengaluru style spiced vegetable saagu.', img: 'https://images.unsplash.com/photo-1789990642068-0840cf55e1cf?w=300&q=80' },
      { name: 'Thatte Idli with Ghee (2pcs)', veg: true, basePrice: 80, desc: 'Large plate-sized soft steamed rice cakes smothered in butter and chutney.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Neer Dosa with Chutney (3pcs)', veg: true, basePrice: 90, desc: 'Delicate lace-like rice crepes originating from Mangalorean coastal cuisine.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Ghee Mysore Pak', veg: true, basePrice: 80, desc: 'Rich melt-in-mouth golden sweet made from gram flour and pure ghee.', img: 'https://plus.unsplash.com/premium_photo-1698500035173-fdea60f9294e?w=300&q=80' },
      { name: 'Pineapple Kesari Bath', veg: true, basePrice: 65, desc: 'Warm roasted semolina pudding infused with pineapple chunks and cashews.', img: 'https://images.unsplash.com/photo-1760263216784-a4ca9a841ff5?w=300&q=80' },
      { name: 'Elaneer Payasam', veg: true, basePrice: 95, desc: 'Chilled delicate pudding made with fresh tender coconut pulp and milk.', img: '/dishes/elaneer_payasam.jpg' },
      { name: 'Rava Kesari with Dry Fruits', veg: true, basePrice: 70, desc: 'Classic saffron semolina sweet enriched with golden raisins.', img: 'https://images.unsplash.com/photo-1760263216784-a4ca9a841ff5?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Degree Filter Coffee', veg: true, basePrice: 50, desc: 'Authentic frothy South Indian chicory brew served in a traditional dabara set.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Chilled Spiced Buttermilk', veg: true, basePrice: 45, desc: 'Cooling drink flavored with curry leaves, ginger, hing and green chilies.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Saffron Badam Milk', veg: true, basePrice: 75, desc: 'Warm sweetened milk infused with crushed almonds and saffron strands.', img: '/dishes/sweet_lassi.jpg' },
      { name: 'Tender Coconut Cooler', veg: true, basePrice: 70, desc: 'Pure hydrating tender coconut water with lime splash.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  chinese: {
    Starters: [
      { name: 'Crispy Veg Spring Rolls (4pcs)', veg: true, basePrice: 190, desc: 'Golden fried wrappers filled with shredded vegetables and glass noodles.', img: 'https://images.unsplash.com/photo-1581438761655-ebb4e43add30?w=300&q=80' },
      { name: 'Chilli Paneer Dry', veg: true, basePrice: 240, desc: 'Wok-tossed paneer with bell peppers, green chilies, and soy glaze.', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
      { name: 'Crispy Corn Salt & Pepper', veg: true, basePrice: 200, desc: 'Fried sweet corn kernels tossed with crushed peppercorns and spring onions.', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80' },
      { name: 'Veg Steamed Momos (6pcs)', veg: true, basePrice: 170, desc: 'Thin-skinned Himalayan dumplings stuffed with minced vegetables and herbs.', img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80' },
      { name: 'Honey Chilli Crispy Potato', veg: true, basePrice: 190, desc: 'Crispy potato batons coated in sweet and spicy sesame honey glaze.', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80' },
      { name: 'Chicken Lollipop (6pcs)', veg: false, basePrice: 280, desc: 'Crispy frenched spiced chicken wings served with fiery Schezwan dip.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Dragon Chicken', veg: false, basePrice: 300, desc: 'Stir fried crispy chicken strips with cashews and fiery red chilies.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Chicken Steamed Momos (6pcs)', veg: false, basePrice: 210, desc: 'Steamed dumplings packed with juicy seasoned chicken and spicy chutney.', img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80' }
    ],
    Mains: [
      { name: 'Veg Hakka Noodles', veg: true, basePrice: 210, desc: 'Classic wok tossed noodles with shredded cabbage, carrots and capsicum.', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
      { name: 'Chili Garlic Fried Rice', veg: true, basePrice: 220, desc: 'Fragrant fried rice loaded with golden burnt garlic and crushed red chili.', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80' },
      { name: 'Veg Manchurian in Gravy', veg: true, basePrice: 230, desc: 'Fried vegetable rounds in savory ginger-garlic soy coriander gravy.', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
      { name: 'Schezwan Veg Noodles', veg: true, basePrice: 225, desc: 'Spicy noodles tossed in bold house-made red pepper Schezwan sauce.', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
      { name: 'Kung Pao Tofu & Peanuts', veg: true, basePrice: 250, desc: 'Crispy tofu cubes stir-fried with dry red chilies and roasted peanuts.', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80' },
      { name: 'Chicken Schezwan Noodles', veg: false, basePrice: 260, desc: 'Spicy noodles tossed with shredded chicken and eggs in Schezwan sauce.', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
      { name: 'Kung Pao Chicken Gravy', veg: false, basePrice: 320, desc: 'Stir fried diced chicken with roasted peanuts, bell peppers and scallions.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Chilli Chicken Gravy', veg: false, basePrice: 310, desc: 'Boneless chicken cubes tossed with diced bell peppers in hot soy sauce.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Breads: [
      { name: 'Steamed Bao Buns (2pcs)', veg: true, basePrice: 120, desc: 'Soft pillowy steamed Asian buns served with sweet plum sauce.', img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80' },
      { name: 'Crispy Fried Wonton Chips', veg: true, basePrice: 90, desc: 'Crunchy golden wonton crisps served with sweet chili dip.', img: 'https://images.unsplash.com/photo-1781332147547-1f0edb2a78a4?w=300&q=80' },
      { name: 'Pan Fried Veg Gyoza (4pcs)', veg: true, basePrice: 160, desc: 'Crispy bottom potstickers stuffed with cabbage and mushrooms.', img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80' },
      { name: 'Scallion Flaky Pancakes', veg: true, basePrice: 140, desc: 'Pan-fried Chinese layered flatbreads seasoned with chopped spring onions.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Honey Darsaan with Vanilla', veg: true, basePrice: 140, desc: 'Fried crisp noodles coated in warm honey and sesame seeds with vanilla scoop.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Sweet Red Bean Sesame Balls (4pcs)', veg: true, basePrice: 120, desc: 'Crispy glutinous rice balls filled with sweet red bean paste.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Crispy Date Wontons with Honey', veg: true, basePrice: 130, desc: 'Crisp pastry triangles stuffed with sweetened mashed dates.', img: 'https://images.unsplash.com/photo-1781332147547-1f0edb2a78a4?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Jasmine Iced Tea', veg: true, basePrice: 90, desc: 'Chilled brewed jasmine green tea with fresh lemon slices.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Sparkling Lychee Cooler', veg: true, basePrice: 95, desc: 'Refreshing fizzy drink infused with sweet lychee fruit puree.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Ginger Lemongrass Brew', veg: true, basePrice: 85, desc: 'Iced botanical refresher with crushed ginger and lemongrass.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  pizza_italian: {
    Starters: [
      { name: 'Cheesy Garlic Bread Baguette', veg: true, basePrice: 150, desc: 'Crusty loaf loaded with garlic butter herbs and melted mozzarella.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Classic Tomato Basil Bruschetta (4pcs)', veg: true, basePrice: 170, desc: 'Toasted baguette rounds topped with diced tomatoes, fresh basil, and extra virgin olive oil.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Crispy Arancini Rice Balls (4pcs)', veg: true, basePrice: 190, desc: 'Golden fried arborio risotto rounds filled with mozzarella molten center.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
      { name: 'Caprese Salad with Pesto', veg: true, basePrice: 210, desc: 'Fresh bocconcini mozzarella, heirloom tomatoes, and basil pesto glaze.', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80' },
      { name: 'Stuffed Garlic Mushrooms', veg: true, basePrice: 195, desc: 'Oven-baked button mushrooms stuffed with herbs and parmesan.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'BBQ Chicken Bruschetta', veg: false, basePrice: 230, desc: 'Toasted bread topped with herb chicken, melted cheese, and barbecue glaze.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Pollo Fritto Chicken Tenders', veg: false, basePrice: 240, desc: 'Italian herb breaded chicken strips with garlic parmesan aioli.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Margherita Basil Pizza (8-inch)', veg: true, basePrice: 230, desc: 'San Marzano tomato sauce, fresh mozzarella cheese and sweet basil.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Farmhouse Veggie Pizza (8-inch)', veg: true, basePrice: 280, desc: 'Bell peppers, mushrooms, sweet corn, black olives, and mozzarella.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Creamy Alfredo Penne Pasta', veg: true, basePrice: 270, desc: 'Al dente penne pasta in rich Parmesan garlic dairy cream sauce.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Fiery Arrabbiata Penne', veg: true, basePrice: 250, desc: 'Penne tossed in spicy San Marzano tomato sauce with garlic and red chili flakes.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Quattro Formaggi Pizza (8-inch)', veg: true, basePrice: 320, desc: 'Artisan crust topped with mozzarella, cheddar, gouda, and blue cheese.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Mushroom Truffle Risotto', veg: true, basePrice: 310, desc: 'Creamy slow-simmered arborio rice with porcini mushrooms and truffle oil.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Smoked Chicken Pepperoni Pizza', veg: false, basePrice: 340, desc: 'Thin crust pizza loaded with chicken pepperoni, mozzarella, and oregano.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Creamy Chicken Alfredo Pasta', veg: false, basePrice: 320, desc: 'Grilled chicken breast strips tossed in velvety Alfredo Parmesan sauce.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Lasagna Bolognese al Forno', veg: false, basePrice: 360, desc: 'Baked pasta sheets layered with minced meat ragu, bechamel, and mozzarella.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' }
    ],
    Breads: [
      { name: 'Herb Focaccia with Olive Dip', veg: true, basePrice: 120, desc: 'Rosemary, thyme, and sea salt infused focaccia bread slices.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Cheesy Garlic Pull-Apart Bread', veg: true, basePrice: 145, desc: 'Warm pull-apart loaf baked with roasted garlic and melted mozzarella.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Rosemary Sea Salt Breadsticks', veg: true, basePrice: 95, desc: 'Crunchy baked grissini breadsticks served with marinara dip.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Stuffed Garlic Pockets (3pcs)', veg: true, basePrice: 140, desc: 'Flaky crust pockets stuffed with corn and jalapeño cheese.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Classic Tiramisu Cup', veg: true, basePrice: 170, desc: 'Espresso soaked ladyfingers layered with velvety mascarpone cheese cream.', img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&q=80' },
      { name: 'Choco Chip Panna Cotta', veg: true, basePrice: 140, desc: 'Silky vanilla dairy cream pudding with chocolate reduction drizzle.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Warm Sicilian Cannoli (2pcs)', veg: true, basePrice: 160, desc: 'Crisp pastry tubes filled with sweetened ricotta and chocolate chips.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Italian Espresso Roast Double', veg: true, basePrice: 90, desc: 'Bold extraction of dark roasted Arabica beans.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Sparkling Peach Soda', veg: true, basePrice: 110, desc: 'Chilled Italian sparkling soda with white peach syrup.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'San Pellegrino Lemonade', veg: true, basePrice: 105, desc: 'Effervescent citrus soda with lemon twist.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' }
    ]
  },

  cafe_desserts: {
    Starters: [
      { name: 'Cheese Stuffed Butter Croissant', veg: true, basePrice: 160, desc: 'Flaky baked Parisian croissant stuffed with warm creamy gouda cheese.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Avocado Toast with Cherry Tomatoes', veg: true, basePrice: 220, desc: 'Toasted multigrain sourdough topped with crushed seasoned avocado and balsamic drizzle.', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80' },
      { name: 'Creamy Mushroom Sourdough Melt', veg: true, basePrice: 210, desc: 'Sauteed button mushrooms in thyme cheese on crusty sourdough.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Almond Flaked Butter Croissant', veg: true, basePrice: 170, desc: 'Twice-baked butter croissant filled with almond frangipane and toasted nuts.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Classic Spinach & Corn Puff', veg: true, basePrice: 90, desc: 'Flaky bakery puff pastry stuffed with creamy sweet corn and spinach.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Paneer Tikka Herb Puff', veg: true, basePrice: 110, desc: 'Crispy golden bake filled with spiced cottage cheese and peppers.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Chicken & Thyme Savory Puff', veg: false, basePrice: 120, desc: 'Flaky golden puff with seasoned minced chicken filling.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Grilled Chicken Caesar Salad', veg: false, basePrice: 250, desc: 'Romaine lettuce, grilled chicken breast, garlic croutons and Parmesan shavings.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' },
      { name: 'Smoked Chicken & Mayo Croissant', veg: false, basePrice: 210, desc: 'Butter croissant stuffed with smoked shredded chicken, dill, and herb aioli.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' }
    ],
    Mains: [
      { name: 'Spinach & Sweet Corn Panini', veg: true, basePrice: 190, desc: 'Pressed focaccia sandwich filled with creamed spinach and mozzarella cheese.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Pesto Basil Penne Bowl', veg: true, basePrice: 260, desc: 'Al dente penne tossed with genovese basil pesto, cherry tomatoes, and pine nuts.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Roasted Vegetable & Hummus Bagel', veg: true, basePrice: 210, desc: 'Toasted sesame bagel with garlic hummus, grilled zucchini, and bell peppers.', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80' },
      { name: 'Four Cheese Sourdough Toastie', veg: true, basePrice: 230, desc: 'Aged cheddar, mozzarella, gouda, and parmesan grilled to perfection on sourdough.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Truffle Mushroom Cream Pasta', veg: true, basePrice: 280, desc: 'Fettuccine pasta in rich white truffle infused cream sauce with parmesan.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Sundried Tomato & Mozzarella Bagel', veg: true, basePrice: 220, desc: 'Warm bagel with bocconcini mozzarella, sundried tomato paste, and wild rocket.', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80' },
      { name: 'Grilled Herb Chicken Panini', veg: false, basePrice: 240, desc: 'Herb roasted chicken breast, caramelized onions, and dijonnaise in grilled ciabatta.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Smoked Turkey Club Sandwich', veg: false, basePrice: 270, desc: 'Triple-decker toasted sandwich with smoked turkey, egg, crisp lettuce, and mustard.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Chicken Pesto Alfredo Bowl', veg: false, basePrice: 310, desc: 'Grilled chicken breast over creamy penne with fragrant basil pesto swirl.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' }
    ],
    Breads: [
      { name: 'Artisan Sourdough Loaf (Whole)', veg: true, basePrice: 140, desc: 'Naturally fermented rustic loaf with a chewy crumb and blistered golden crust.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Cinnamon Swirl Brioche', veg: true, basePrice: 110, desc: 'Warm sweet brioche pastry rolled with fragrant cinnamon sugar glaze.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Garlic & Rosemary Focaccia', veg: true, basePrice: 120, desc: 'Olive oil infused Italian flatbread topped with sea salt and fresh rosemary.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Blueberry Crumble Muffin', veg: true, basePrice: 100, desc: 'Moist bakery muffin bursting with fresh blueberries and buttery sugar streusel.', img: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&q=80' },
      { name: 'Chocolate Chip Brioche Bun', veg: true, basePrice: 90, desc: 'Soft sweet bakery bun studded with Belgian dark chocolate chips.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Butter Brioche Toast with Jam', veg: true, basePrice: 80, desc: 'Two thick golden brioche slices served with strawberry preserve and salted butter.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Belgian Dark Chocolate Waffle', veg: true, basePrice: 160, desc: 'Crispy warm waffle smothered in melted 70% Belgian dark chocolate.', img: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=300&q=80' },
      { name: 'Blueberry Swirl Cheesecake', veg: true, basePrice: 180, desc: 'Smooth New York style baked cheesecake with real blueberry compote.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Warm Walnut Chocolate Brownie', veg: true, basePrice: 140, desc: 'Rich fudgy chocolate walnut brownie served warm with chocolate sauce.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' },
      { name: 'Red Velvet Cream Cheese Pastry', veg: true, basePrice: 150, desc: 'Velvety crimson sponge layered with silky cream cheese frosting.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Dutch Truffle Cake Slice', veg: true, basePrice: 160, desc: 'Decadent dark chocolate ganache layered with moist cocoa sponge.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'French Macarons Box (4pcs)', veg: true, basePrice: 200, desc: 'Delicate almond meringue shells with pistachio, chocolate, and raspberry ganache.', img: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=300&q=80' },
      { name: 'Salted Caramel Banoffee Pie', veg: true, basePrice: 170, desc: 'Buttery biscuit crust topped with sliced bananas, dulce de leche, and whipped cream.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Hazelnut Cafe Latte', veg: true, basePrice: 140, desc: 'Double espresso with silky steamed milk and roasted hazelnut syrup.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Chilled Caramel Frappuccino', veg: true, basePrice: 160, desc: 'Blended espresso, dairy cream, and golden caramel drizzle.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' },
      { name: 'Belgian Hot Chocolate', veg: true, basePrice: 150, desc: 'Steaming thick real chocolate drink topped with cocoa dust.', img: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&q=80' },
      { name: 'Classic Flat White', veg: true, basePrice: 130, desc: 'Rich double ristretto shot poured with velvety microfoam.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Iced Peach Green Tea', veg: true, basePrice: 120, desc: 'Chilled brewed green tea infused with peach puree and fresh mint.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Vanilla Sweet Cream Cold Brew', veg: true, basePrice: 150, desc: '16-hour slow steeped cold brew coffee topped with vanilla sweet cream.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' }
    ]
  },

  fast_food: {
    Starters: [
      { name: 'Peri Peri Crinkle Fries', veg: true, basePrice: 130, desc: 'Crispy cut potatoes tossed in spicy African peri peri rub.', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80' },
      { name: 'Mozzarella Cheese Sticks (4pcs)', veg: true, basePrice: 180, desc: 'Golden breaded mozzarella fingers with marinara dip.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
      { name: 'Crispy Golden Onion Rings', veg: true, basePrice: 130, desc: 'Batter dipped whole sweet onion rings fried golden brown.', img: 'https://images.unsplash.com/photo-1639024471287-032f66453916?w=300&q=80' },
      { name: 'Cheesy Jalapeno Poppers (5pcs)', veg: true, basePrice: 170, desc: 'Breaded jalapeno peppers stuffed with melted cream cheese.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
      { name: 'Loaded Nachos with Salsa & Queso', veg: true, basePrice: 190, desc: 'Crispy tortilla chips smothered in warm cheddar cheese sauce and pico de gallo.', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80' },
      { name: 'BBQ Chicken Popcorn', veg: false, basePrice: 200, desc: 'Bite sized crunchy spiced chicken with smoky barbecue dip.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Buffalo Chicken Wings (6pcs)', veg: false, basePrice: 290, desc: 'Crispy wings tossed in tangy cayenne pepper glaze.', img: 'https://images.unsplash.com/photo-1527477378408-1bc0939525e9?w=300&q=80' },
      { name: 'Crispy Chicken Tenders (4pcs)', veg: false, basePrice: 240, desc: 'Golden fried seasoned chicken tenders with honey mustard dip.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Crispy Veggie Deluxe Burger', veg: true, basePrice: 180, desc: 'Spiced potato pea patty with cheddar slice, mayo and lettuce.', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80' },
      { name: 'Spicy Paneer Tikka Burger', veg: true, basePrice: 210, desc: 'Crusted cottage cheese patty with tandoori mayo in toasted bun.', img: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&q=80' },
      { name: 'Mexican Black Bean Burger', veg: true, basePrice: 195, desc: 'Hearty spiced black bean and corn patty with chipotle mayo.', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80' },
      { name: 'Classic American Cheeseburger', veg: false, basePrice: 220, desc: 'Grilled seasoned chicken patty, melted cheddar, pickles and signature sauce.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
      { name: 'Double Smash Bacon Burger', veg: false, basePrice: 320, desc: 'Twin chicken patties with double cheese, crispy bacon, and caramelized onions.', img: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&q=80' },
      { name: 'Crispy Fried Chicken Burger', veg: false, basePrice: 240, desc: 'Southern-style buttermilk fried chicken thigh with spicy coleslaw.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' }
    ],
    Breads: [
      { name: 'Cheesy Jalapeno Loaded Fries', veg: true, basePrice: 170, desc: 'Skin-on fries smothered in hot liquid cheddar and pickled jalapenos.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Garlic Parmesan Rolls (2pcs)', veg: true, basePrice: 110, desc: 'Warm herb infused mini rolls with whipped garlic butter.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Buttered Sweet Corn on the Cob', veg: true, basePrice: 90, desc: 'Sweet golden corn cob slathered in salted butter and cracked pepper.', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80' },
      { name: 'Salted French Fries Regular', veg: true, basePrice: 100, desc: 'Classic golden salted fries fried to crisp perfection.', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Molten Chocolate Lava Cake', veg: true, basePrice: 140, desc: 'Warm individual chocolate cake with a molten fudge center.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'Fudge Brownie with Choco Chips', veg: true, basePrice: 130, desc: 'Dense dark chocolate brownie packed with melted chocolate chunks.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' },
      { name: 'Soft Serve Chocolate Sundae Cup', veg: true, basePrice: 95, desc: 'Chilled creamy vanilla soft serve topped with hot chocolate fudge.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Oreo Cream Milkshake', veg: true, basePrice: 150, desc: 'Thick shake made with whole dairy cream and crushed Oreos.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' },
      { name: 'Cold Brew Frappe', veg: true, basePrice: 140, desc: 'Rich espresso blended with vanilla and chilled milk.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Iced Lemon Mint Soda', veg: true, basePrice: 85, desc: 'Sparkling lemon beverage with fresh mint leaves.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Chocolate Malt Thickshake', veg: true, basePrice: 145, desc: 'Classic thick ice cream shake blended with rich chocolate malt.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' }
    ]
  }
};

/**
 * Determines appropriate cuisine pool strictly based on name and cuisine tags
 */
export function detectCuisineGroup(cuisineString = '', name = '') {
  const text = `${cuisineString} ${name}`.toLowerCase();

  // 1. Biryani Specialty (Highest priority: Any restaurant with Biryani in its name/cuisine)
  if (text.includes('biryani') || text.includes('biriyani') || text.includes('briyani') || text.includes('behrouz') || text.includes('ammi') || text.includes('paradise') || text.includes('donne')) {
    if (text.includes('meghana') || text.includes('nagarjuna')) {
      return 'meghana_foods';
    }
    return 'biryani_house';
  }

  // 2. Specific Brand Matches & Fast Food Chains
  if (text.includes('domino') || text.includes('papa john')) {
    return 'dominos';
  }
  if (text.includes('ikea')) {
    return 'ikea';
  }
  if (text.includes('chai point') || text.includes('chaayos') || text.includes('tea post') || text.includes('chai')) {
    return 'chai_point';
  }
  if (text.includes('presi')) {
    return 'presi_cafe';
  }
  if (text.includes('glen') || text.includes('bakehouse') || text.includes('bakery') || text.includes('cake') || text.includes('pastry') || text.includes('patisserie') || text.includes('bakes') || text.includes('brownie')) {
    return 'glens_bakehouse';
  }
  if (text.includes('truffles') || text.includes('leon') || text.includes('burger') || text.includes('burger king') || text.includes('mcdonald') || text.includes('wendy')) {
    return 'truffles';
  }
  if (text.includes('meghana') || text.includes('nagarjuna')) {
    return 'meghana_foods';
  }
  if (text.includes('empire') || text.includes('kebab') || text.includes('kabab')) {
    return 'hotel_empire';
  }
  if (text.includes('agarwal') || text.includes('anand sweet') || text.includes('mithai') || text.includes('sweets and restaurant') || text.includes('sweets & savouries') || text.includes('sweet') || text.includes('sweets') || text.includes('halwai')) {
    return 'agarwal_sweets';
  }
  if (text.includes('dhaba') || text.includes('highway')) {
    return 'dhaba';
  }

  // 3. Sagar, Darshini, Upahara, Udupi & Bengaluru Pure Veg South Indian
  if (
    text.includes('sagar') ||
    text.includes('darshani') ||
    text.includes('darshini') ||
    text.includes('upahara') ||
    text.includes('bhavan') ||
    text.includes('udupi') ||
    text.includes('tiffin') ||
    text.includes('mandira') ||
    text.includes('mess') ||
    text.includes('airlines hotel') ||
    text.includes('filter coffee') ||
    text.includes('south indian') ||
    text.includes('dosa') ||
    text.includes('idli') ||
    text.includes('vada') ||
    text.includes('karnataka') ||
    text.includes('meals') ||
    text.includes('thali') ||
    text.includes('ಅಮೋಘ') ||
    text.includes('ಸಾಗರ್')
  ) {
    return 'sagar_darshini';
  }

  // 4. Pizza / Italian / Pasta
  if (text.includes('pizza') || text.includes('pizzeria') || text.includes('italian') || text.includes('pasta')) {
    return 'pizza_italian';
  }

  // 5. Chinese / Asian / Noodles / Momos
  if (text.includes('chinese') || text.includes('asian') || text.includes('noodles') || text.includes('noodle') || text.includes('momos') || text.includes('momo') || text.includes('tibetan') || text.includes('wok') || text.includes('chopstick')) {
    return 'chinese';
  }

  // 6. Fast Food / Burgers / Fries / Snacks
  if (text.includes('fast_food') || text.includes('fast food') || text.includes('fries') || text.includes('chaat') || text.includes('rolls') || text.includes('fried chicken') || text.includes('sandwich') || text.includes('subway') || text.includes('canteen')) {
    return 'fast_food';
  }

  // 7. Cafe / Desserts / Beverages / Salads / Juices
  if (text.includes('cafe') || text.includes('coffee') || text.includes('dessert') || text.includes('waffle') || text.includes('ice cream') || text.includes('salad') || text.includes('juice') || text.includes('corn') || text.includes('smoothie')) {
    return 'cafe_desserts';
  }

  // 8. North Indian / Mughlai / Punjabi / Tandoor
  if (text.includes('mughlai') || text.includes('north indian') || text.includes('punjabi') || text.includes('tandoor') || text.includes('curry')) {
    return 'north_indian';
  }

  // Default to North Indian casual dining
  return 'north_indian';
}

/**
 * Deterministically generates 18 to 28 authentic menu items tailored strictly to the restaurant's cuisine
 */
export function generateMenuForRestaurant({ restaurantId, osmId, osmType = 'node', cuisine = '', name = '', isPureVeg = false }) {
  const seedNum = Number(osmId) || 98765;
  const prng = createPRNG(seedNum);

  const primaryGroupKey = detectCuisineGroup(cuisine, name);
  const primaryPool = BRAND_POOLS[primaryGroupKey] || CUISINE_POOLS[primaryGroupKey] || CUISINE_POOLS.north_indian;

  const categories = ['Starters', 'Mains', 'Breads', 'Desserts', 'Beverages'];
  const generatedItems = [];
  let itemIndex = 1;

  for (const cat of categories) {
    // Strictly take items belonging to this restaurant's detected cuisine pool (NEVER cross-mix fast food or other cuisines)
    let poolItems = [...(primaryPool[cat] || [])];

    // If pure veg, filter strictly
    if (isPureVeg) {
      poolItems = poolItems.filter(item => item.veg);
    }

    // Determine target count for this category
    const minPerCat = cat === 'Mains' ? 5 : (cat === 'Starters' ? 4 : 3);
    const maxPerCat = cat === 'Mains' ? 7 : (cat === 'Starters' ? 6 : 4);
    const targetCount = minPerCat + Math.floor(prng() * (maxPerCat - minPerCat + 1));

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
  // If fewer than 18, pad with extra unselected items strictly from this restaurant's own cuisine pool
  while (generatedItems.length < 18) {
    const existingNames = new Set(generatedItems.map(i => i.name));
    let candidate = null;
    let candidateCat = 'Mains';

    for (const cat of ['Mains', 'Starters', 'Desserts', 'Beverages', 'Breads']) {
      let pool = primaryPool[cat] || [];
      if (isPureVeg) pool = pool.filter(i => i.veg);
      const unselected = pool.find(i => !existingNames.has(i.name));
      if (unselected) {
        candidate = unselected;
        candidateCat = cat;
        break;
      }
    }

    if (!candidate) {
      // Fallback to pure veg items from sagar_darshini or north_indian if primary pool exhausted
      const fallbackPool = BRAND_POOLS.sagar_darshini || CUISINE_POOLS.south_indian;
      for (const cat of ['Mains', 'Starters', 'Desserts', 'Beverages', 'Breads']) {
        let pool = fallbackPool[cat] || [];
        if (isPureVeg) pool = pool.filter(i => i.veg);
        const unselected = pool.find(i => !existingNames.has(i.name));
        if (unselected) {
          candidate = unselected;
          candidateCat = cat;
          break;
        }
      }
    }

    if (candidate) {
      generatedItems.push({
        id: `${restaurantId}_${itemIndex}`,
        restaurant_id: restaurantId,
        category: candidateCat,
        name: candidate.name,
        price: candidate.basePrice,
        is_veg: candidate.veg ? 1 : 0,
        is_available: 1,
        stock_quantity: 50,
        description: candidate.desc,
        image_url: candidate.img
      });
      itemIndex++;
    } else {
      break;
    }
  }

  // Deterministically mark 1 to 2 items as unavailable (stock 0) for testing out-of-stock flows
  const oosIndex1 = 2 + Math.floor(prng() * 3); // item at index 2, 3, or 4
  const oosIndex2 = 8 + Math.floor(prng() * 4); // item at index 8, 9, 10, or 11
  if (generatedItems[oosIndex1]) {
    generatedItems[oosIndex1].is_available = 0;
    generatedItems[oosIndex1].stock_quantity = 0;
    generatedItems[oosIndex1].description += ' (Currently Out of Stock)';
  }
  if (generatedItems[oosIndex2] && oosIndex2 !== oosIndex1) {
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

  const isSagarOrDarshiniOrSweet = /sagar|darshini|darshani|upahara|bhavan|udupi|tiffin|anand sweet|agarwal sweet|ಅಮೋಘ|ಸಾಗರ್/i.test(`${restaurant.name || ''} ${restaurant.cuisine || ''}`);
  const isPureVeg = (restaurant.cuisine || '').toLowerCase().includes('pure veg') || 
                    (restaurant.name || '').toLowerCase().includes('pure veg') ||
                    restaurant.is_pure_veg === true ||
                    isSagarOrDarshiniOrSweet;

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
