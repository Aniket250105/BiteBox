// Authentic brand and restaurant-specific menu definitions
// Modeled directly from authentic restaurant offerings in Bengaluru

export const BRAND_POOLS = {
  dominos: {
    Starters: [
      { name: 'Garlic Breadsticks', veg: true, basePrice: 129, desc: 'Crisp on outside, soft inside, brushed with savory garlic butter and herbs.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Stuffed Garlic Bread (Jalapeno & Corn)', veg: true, basePrice: 169, desc: 'Freshly baked garlic bread stuffed with mozzarella, sweet corn, and spicy jalapenos.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Paneer Zingy Parcel', veg: true, basePrice: 139, desc: 'Golden pastry pocket filled with paneer chunks tossed in spicy harissa sauce.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Cheesy Jalapeno Dip', veg: true, basePrice: 40, desc: 'Velvety cheese dip infused with pickled jalapenos for pizza crusts.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
      { name: 'Chicken Zingy Parcel', veg: false, basePrice: 159, desc: 'Golden flaky crust parcel filled with spicy seasoned chicken and creamy dip.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Spicy BBQ Chicken Meatballs (8pcs)', veg: false, basePrice: 199, desc: 'Tender chicken meatballs glazed in smoky barbecue sauce with cracked black pepper.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Boneless Peri Peri Wings (6pcs)', veg: false, basePrice: 219, desc: 'Crispy boneless chicken bites tossed in fiery African peri peri seasoning.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Farmhouse Pizza (Medium)', veg: true, basePrice: 389, desc: 'Delightful combination of onion, crisp capsicum, grilled mushroom, and fresh tomatoes.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Peppy Paneer Pizza (Medium)', veg: true, basePrice: 429, desc: 'Chunky paneer cubes, crisp capsicum, and spicy red paprika with 100% mozzarella.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Margherita Double Cheese (Medium)', veg: true, basePrice: 299, desc: 'Classic crust layered with herb tomato sauce and loaded with molten mozzarella.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Veggie Paradise Pizza (Medium)', veg: true, basePrice: 399, desc: 'Gold corn, black olives, crisp capsicum, and red paprika on signature hand-tossed crust.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Pepper Barbecue Chicken Pizza', veg: false, basePrice: 449, desc: 'Tender pepper barbecue chicken chunks with onion and mozzarella cheese.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Chicken Golden Delight (Medium)', veg: false, basePrice: 479, desc: 'Barbecue chicken, seasoned chicken meatballs, and sweet golden corn.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Indi Chicken Tikka Pizza', veg: false, basePrice: 499, desc: 'Tandoori chicken tikka, onion, red paprika, and mint mayo on spicy crust.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Non-Veg Supreme Pizza', veg: false, basePrice: 549, desc: 'Black olives, grilled mushrooms, pepper barbecue chicken, and peri peri chicken.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' }
    ],
    Breads: [
      { name: 'Classic Garlic Bread', veg: true, basePrice: 119, desc: 'Soft baked baguette slathered in fragrant garlic herb butter.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Crinkle Peri Peri Fries', veg: true, basePrice: 119, desc: 'Crispy crinkle cut potatoes sprinkled with peri peri masala.', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80' },
      { name: 'Cheesy Garlic Breadsticks', veg: true, basePrice: 159, desc: 'Breadsticks baked with mozzarella cheese and Italian seasoning.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Cheesy Dip with Garlic Herb', veg: true, basePrice: 45, desc: 'Creamy melted cheese dip with herbs and roasted garlic notes.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Choco Lava Cake', veg: true, basePrice: 129, desc: 'Iconic warm chocolate cake with molten chocolate fudge center.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'Butterscotch Mousse Cake', veg: true, basePrice: 119, desc: 'Layers of airy butterscotch mousse and moist vanilla sponge.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Red Velvet Lava Cake', veg: true, basePrice: 139, desc: 'Velvety crimson crust filled with hot melted white chocolate cream.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Chocolate Brownie Fantasy', veg: true, basePrice: 109, desc: 'Rich chocolate walnut brownie drizzled with warm chocolate sauce.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Pepsi Black Can (330ml)', veg: true, basePrice: 60, desc: 'Chilled zero-sugar sparkling cola.', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80' },
      { name: 'Mirinda Orange Bottle (500ml)', veg: true, basePrice: 60, desc: 'Tangy sweet fizzy orange drink.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Mountain Dew Bottle (500ml)', veg: true, basePrice: 60, desc: 'Refreshing citrus beverage served chilled.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: '7UP Lemon Fizz (500ml)', veg: true, basePrice: 60, desc: 'Clear crisp lemon lime soda.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  ikea: {
    Starters: [
      { name: 'IKEA Garlic Bread Baguette (2pcs)', veg: true, basePrice: 120, desc: 'Toasted Nordic sourdough baguette brushed with parsley garlic butter.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Swedish Vegetable Spring Roll (2pcs)', veg: true, basePrice: 140, desc: 'Crisp golden wraps filled with cabbage, leeks, and carrots with sweet chili dip.', img: 'https://images.unsplash.com/photo-1581438761655-ebb4e43add30?w=300&q=80' },
      { name: 'Roasted Tomato Basil Bisque', veg: true, basePrice: 130, desc: 'Warm creamy European tomato soup topped with croutons and basil oil.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Nordic Garden Salad with Vinaigrette', veg: true, basePrice: 160, desc: 'Mixed organic greens, cherry tomatoes, pickled beets, and honey-mustard dressing.', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80' },
      { name: 'Soft Bavarian Pretzel with Mustard', veg: true, basePrice: 110, desc: 'Oven-warm salted Bavarian pretzel served with whipped Dijon butter.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Crispy Potato Rösti', veg: true, basePrice: 130, desc: 'Traditional Swiss-style golden pan-fried grated potato cakes.', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80' },
      { name: 'Chicken Sausage with Mashed Potato', veg: false, basePrice: 180, desc: 'Grilled chicken frankfurter served with potato puree and Swedish brown mustard.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' }
    ],
    Mains: [
      { name: 'Swedish Plant Balls (8pcs)', veg: true, basePrice: 280, desc: 'Plant-based meatballs with mashed potatoes, lingonberry sauce, and rich mushroom gravy.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Dal Makhani with Jeera Rice (IKEA)', veg: true, basePrice: 220, desc: 'Slow cooked black lentils in cream butter served with aromatic basmati rice.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Vegetable Biryani with Raita', veg: true, basePrice: 240, desc: 'Fragrant long grain rice with spiced vegetables, cashews, and refreshing cucumber raita.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Swedish Vegetable Penne Bake', veg: true, basePrice: 260, desc: 'Baked penne pasta with zucchini, bell peppers, mozzarella, and herb cream.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Traditional Swedish Meatballs (8pcs)', veg: false, basePrice: 340, desc: 'Iconic meatballs with creamy brown gravy, buttery mashed potatoes, and tart lingonberry jam.', img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&q=80' },
      { name: 'Poached Atlantic Salmon Fillet', veg: false, basePrice: 490, desc: 'Tender salmon fillet served with lemon hollandaise, steamed broccoli, and parsley potatoes.', img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&q=80' },
      { name: 'Chicken Meatballs in Cream Sauce', veg: false, basePrice: 320, desc: 'Juicy chicken meatballs with creamy gravy, lingonberry preserve, and potato mash.', img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&q=80' },
      { name: 'Chicken Tikka Biryani Platter', veg: false, basePrice: 320, desc: 'Spiced basmati rice layered with tandoori chicken chunks and mint raita.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' }
    ],
    Breads: [
      { name: 'Nordic Garlic Herb Baguette', veg: true, basePrice: 90, desc: 'Crusty artisan loaf baked fresh with salted European butter and herbs.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Multigrain Soft Dinner Roll (2pcs)', veg: true, basePrice: 70, desc: 'Nutritious oat and rye rolls served with salted butter pats.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Salted Bavarian Pretzel', veg: true, basePrice: 85, desc: 'Traditional twisted pretzel with crunchy sea salt grains.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Sourdough Slices with Herb Butter', veg: true, basePrice: 95, desc: 'Rustic open-crumb sourdough slices lightly toasted.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Swedish Cinnamon Bun (Kanelbulle)', veg: true, basePrice: 95, desc: 'Freshly baked fragrant pastry twisted with cinnamon butter and pearl sugar.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Daim Cake Slice with Caramel', veg: true, basePrice: 160, desc: 'Famous Swedish chocolate cake with crunchy almond butterscotch caramel.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'Princess Cake (Prinsesstårta)', veg: true, basePrice: 175, desc: 'Layers of sponge cake, raspberry jam, and pastry cream wrapped in green marzipan.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Apple Crumble Pie with Vanilla', veg: true, basePrice: 140, desc: 'Spiced tart apples baked with a golden buttery crumble crust.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Lingonberry Sparkling Fruit Drink', veg: true, basePrice: 95, desc: 'Swedish sparkling beverage made with wild Scandinavian lingonberries.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Elderflower Cordial Fizz', veg: true, basePrice: 95, desc: 'Delicate floral Swedish beverage with sparkling spring water and lemon.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'IKEA Nordic Roast Filter Coffee', veg: true, basePrice: 70, desc: 'Medium roasted Arabica blend brewed hot.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Swedish Pear Sparkling Cider', veg: true, basePrice: 110, desc: 'Sweet and crisp Scandinavian non-alcoholic sparkling pear juice.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  sagar_darshini: {
    Starters: [
      { name: 'Medu Vada (2pcs) with Sambar & Chutney', veg: true, basePrice: 80, desc: 'Crispy golden lentil donuts served with hot drumstick sambar and fresh coconut chutney.', img: 'https://images.unsplash.com/photo-1730191843435-073792ba22bc?w=300&q=80' },
      { name: 'Ghee Podi Idli (10 Mini Idlis)', veg: true, basePrice: 95, desc: 'Bite-sized steamed rice idlis tossed in fiery spiced gunpowder and pure desi ghee.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Button Idli in Sambar (12pcs)', veg: true, basePrice: 90, desc: 'Mini idlis submerged in a piping hot bowl of aromatic drumstick sambar with ghee.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Crispy Mangalore Bonda (4pcs)', veg: true, basePrice: 75, desc: 'Crisp outside, fluffy soft inside fritters with cumin, ginger, and coconut bits.', img: 'https://images.unsplash.com/photo-1765360024331-25b63e85272e?w=300&q=80' },
      { name: 'Maddur Vada (2pcs)', veg: true, basePrice: 70, desc: 'Karnataka heritage crispy snack with roasted onions, semolina, rice flour, and curry leaves.', img: 'https://images.unsplash.com/photo-1730191843435-073792ba22bc?w=300&q=80' },
      { name: 'Mirchi Bajji with Spiced Onions (3pcs)', veg: true, basePrice: 65, desc: 'Golden batter-fried mild peppers slit and stuffed with tangy chopped onion relish.', img: 'https://images.unsplash.com/photo-1765360024331-25b63e85272e?w=300&q=80' },
      { name: 'Crispy Rava Vada (2pcs)', veg: true, basePrice: 80, desc: 'Semolina and lentil patties spiced with crushed black pepper, ginger, and green chilies.', img: 'https://images.unsplash.com/photo-1730191843435-073792ba22bc?w=300&q=80' }
    ],
    Mains: [
      { name: 'Bengaluru Masala Dosa', veg: true, basePrice: 105, desc: 'Crispy golden rice crepe smeared with red garlic chutney, filled with potato palya and butter.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Davangere Benne Dosa', veg: true, basePrice: 125, desc: 'Spongy thick dosa loaded with fresh white churned butter, served with potato palya and chutney.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Ghee Roast Masala Dosa', veg: true, basePrice: 130, desc: 'Thin wafer-crisp crepe roasted in fragrant desi ghee until mahogany brown.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Thatte Idli with Ghee & Chutney (2pcs)', veg: true, basePrice: 85, desc: 'Plate-sized spongy steamed rice cakes bathed in melted desi ghee and red chutney.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Onion Rava Masala Dosa', veg: true, basePrice: 120, desc: 'Lacy crisp semolina crepe studded with caramelized onions and green chilies.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Bisi Bele Bath with Boondi & Ghee', veg: true, basePrice: 100, desc: 'Hearty Karnataka spiced rice and lentils simmered with garden vegetables, topped with boondi.', img: 'https://plus.unsplash.com/premium_photo-1694506374757-632d818eb023?w=300&q=80' },
      { name: 'Chow Chow Bath (Khara + Kesari)', veg: true, basePrice: 110, desc: 'Classic darshini duo: spiced vegetable semolina upma paired with warm saffron kesari bath.', img: 'https://plus.unsplash.com/premium_photo-1694506374757-632d818eb023?w=300&q=80' },
      { name: 'South Indian Royal Thali (Meals)', veg: true, basePrice: 180, desc: 'Steamed rice, Udupi sambar, Mysore rasam, 2 vegetable palyas, kootu, curd, papad, and payasam.', img: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=300&q=80' },
      { name: 'Curd Rice with Tadka & Pomegranate', veg: true, basePrice: 85, desc: 'Tempered mashed rice with fresh homemade curd, mustard seeds, curry leaves, and pomegranate.', img: 'https://plus.unsplash.com/premium_photo-1694141252026-3df1de888a21?w=300&q=80' }
    ],
    Breads: [
      { name: 'Poori with Potato Saagu (3pcs)', veg: true, basePrice: 95, desc: 'Puffy golden wheat pooris served with authentic Bengaluru mixed vegetable saagu.', img: 'https://images.unsplash.com/photo-1789990642068-0840cf55e1cf?w=300&q=80' },
      { name: 'Akki Rotti with Chutney (2pcs)', veg: true, basePrice: 90, desc: 'Traditional Karnataka rice flour flatbreads with dill leaves, onions, and cumin.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Ragi Rotti with Butter (2pcs)', veg: true, basePrice: 90, desc: 'Nutritious finger millet flatbreads cooked with green chilies, onions and white butter.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Set Dosa with Veg Kurma (3pcs)', veg: true, basePrice: 95, desc: 'Trio of soft, pillowy, spongy dosas served with rich coconut vegetable kurma.', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Kerala Parotta with Veg Kurma (2pcs)', veg: true, basePrice: 85, desc: 'Flaky, layered griddled flatbreads accompanied by spiced vegetable stew.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Desi Ghee Mysore Pak', veg: true, basePrice: 75, desc: 'Melt-in-mouth royal sweet made from roasted besan, sugar, and generous pure ghee.', img: 'https://plus.unsplash.com/premium_photo-1698500035173-fdea60f9294e?w=300&q=80' },
      { name: 'Pineapple Kesari Bath', veg: true, basePrice: 65, desc: 'Warm roasted semolina pudding cooked with real pineapple chunks, saffron, and cashews.', img: 'https://images.unsplash.com/photo-1760263216784-a4ca9a841ff5?w=300&q=80' },
      { name: 'Badam Halwa (Royal Cup)', veg: true, basePrice: 110, desc: 'Rich, velvety sweet paste of ground California almonds, pure ghee, and saffron.', img: 'https://plus.unsplash.com/premium_photo-1698500035173-fdea60f9294e?w=300&q=80' },
      { name: 'Elaneer Tender Coconut Payasam', veg: true, basePrice: 90, desc: 'Chilled delicate dessert made with fresh tender coconut flesh, coconut milk, and cardamom.', img: 'https://plus.unsplash.com/premium_photo-1707413391465-82ac03dd5555?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Degree Filter Coffee (Dabara Set)', veg: true, basePrice: 40, desc: 'Traditional frothy brew of freshly roasted chicory coffee and boiled milk in brass dabara.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Hot Badam Milk with Saffron', veg: true, basePrice: 65, desc: 'Steaming thickened milk infused with ground almonds, cardamom, and Kashmiri saffron.', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80' },
      { name: 'Masala Spiced Chaas (Majjege)', veg: true, basePrice: 40, desc: 'Cooling churned buttermilk seasoned with ginger, green chili, curry leaves, and asafoetida.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Pure Tender Coconut Water', veg: true, basePrice: 60, desc: 'Fresh, naturally sweet hydrating water with tender pulp.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  agarwal_sweets: {
    Starters: [
      { name: 'Special Delhi Samosa (2pcs)', veg: true, basePrice: 60, desc: 'Crisp golden triangles stuffed with spiced potato, peas and whole coriander with saunth chutney.', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
      { name: 'Royal Raj Kachori Chaat', veg: true, basePrice: 120, desc: 'Crispy large puri filled with sprouted beans, potato, sweetened curd, tamarind, and sev.', img: 'https://images.unsplash.com/photo-1649140041688-0f75446e707e?w=300&q=80' },
      { name: 'Dahi Puri (6pcs)', veg: true, basePrice: 95, desc: 'Crisp puffed puris stuffed with potato mash and smothered in chilled sweet yogurt.', img: 'https://images.unsplash.com/photo-1649140041688-0f75446e707e?w=300&q=80' },
      { name: 'Pani Puri / Golgappe (8pcs)', veg: true, basePrice: 80, desc: 'Crispy puris with spiced potato-chickpea mash, tangy mint water and sweet tamarind pani.', img: 'https://images.unsplash.com/photo-1649140041688-0f75446e707e?w=300&q=80' },
      { name: 'Aloo Tikki Chhole Chaat', veg: true, basePrice: 110, desc: 'Pan-fried crisp potato patties topped with spiced Amritsari chhole and whipped curd.', img: 'https://images.unsplash.com/photo-1649140041688-0f75446e707e?w=300&q=80' },
      { name: 'Paneer Pakoda Platter (4pcs)', veg: true, basePrice: 120, desc: 'Cottage cheese slices layered with mint chutney, batter-fried crisp with chaat masala.', img: 'https://images.unsplash.com/photo-1765360024331-25b63e85272e?w=300&q=80' },
      { name: 'Khaman Dhokla (4pcs)', veg: true, basePrice: 70, desc: 'Soft, spongy steamed gram flour cakes tempered with mustard seeds and green chilies.', img: 'https://plus.unsplash.com/premium_photo-1713370407756-acedc62f5fbb?w=300&q=80' }
    ],
    Mains: [
      { name: 'Amritsari Chole Bhature (2 Bhature)', veg: true, basePrice: 160, desc: 'Fluffy fried bhaturas served with spicy dark Pindi chole, pickled onions, and green chili.', img: 'https://images.unsplash.com/photo-1788602564560-9bcbf0f9acb6?w=300&q=80' },
      { name: 'Special Butter Pav Bhaji', veg: true, basePrice: 150, desc: 'Spiced mashed vegetables cooked in butter on tawa, served with 2 butter-toasted pavs.', img: 'https://plus.unsplash.com/premium_photo-1691030658477-1c8decbdfb18?w=300&q=80' },
      { name: 'Paneer Butter Masala', veg: true, basePrice: 240, desc: 'Fresh malai paneer cubes simmered in rich creamy tomato, butter, and cashew nut gravy.', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
      { name: 'Dal Makhani Desi Ghee', veg: true, basePrice: 220, desc: 'Overnight slow-cooked black urad lentils infused with ginger, butter, cream, and pure ghee.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Kadhai Paneer', veg: true, basePrice: 235, desc: 'Cottage cheese chunks tossed with crunchy bell peppers, onions, and freshly ground spices.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Deluxe North Indian Veg Thali', veg: true, basePrice: 260, desc: '2 rotis, Paneer Butter Masala, Dal Makhani, Jeera Rice, Boondi Raita, Gulab Jamun, and salad.', img: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=300&q=80' },
      { name: 'Amritsari Aloo Kulcha with Chole', veg: true, basePrice: 180, desc: 'Stuffed tandoori bread served with spiced chickpea curry and boondi raita.', img: 'https://images.unsplash.com/photo-1788602564560-9bcbf0f9acb6?w=300&q=80' }
    ],
    Breads: [
      { name: 'Tandoori Butter Roti (2pcs)', veg: true, basePrice: 40, desc: 'Whole wheat round flatbread cooked in clay oven and brushed with butter.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Garlic Butter Naan', veg: true, basePrice: 65, desc: 'Leavened oven-baked white flour bread topped with minced garlic and butter.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' },
      { name: 'Laccha Paratha', veg: true, basePrice: 55, desc: 'Crispy layered flaky wheat bread cooked golden with ghee.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Extra Butter Pav (Pair)', veg: true, basePrice: 40, desc: 'Two soft bakery pav buns roasted in golden butter on tawa.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Pure Kaju Katli (250g)', veg: true, basePrice: 280, desc: 'Diamond-cut silver-foiled fudge made with premium ground cashew nuts and sugar.', img: 'https://plus.unsplash.com/premium_photo-1698500035173-fdea60f9294e?w=300&q=80' },
      { name: 'Desi Ghee Motichoor Ladoo (4pcs)', veg: true, basePrice: 140, desc: 'Tiny golden gram flour pearls fried in pure ghee, bound with saffron sugar syrup.', img: 'https://images.unsplash.com/photo-1760263216784-a4ca9a841ff5?w=300&q=80' },
      { name: 'Kesar Rasmalai (2pcs)', veg: true, basePrice: 110, desc: 'Delicate chenna patties soaked in thick saffron, pistachio, and cardamom infused milk.', img: 'https://plus.unsplash.com/premium_photo-1707413391465-82ac03dd5555?w=300&q=80' },
      { name: 'Warm Gulab Jamun with Rabdi (2pcs)', veg: true, basePrice: 100, desc: 'Soft mawa dumplings served with warm sugar syrup and thick condensed rabdi.', img: 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=' },
      { name: 'Sponge Rasgulla (2pcs)', veg: true, basePrice: 80, desc: 'Spongy cottage cheese rounds gently poached in fragrant sugar syrup.', img: 'https://plus.unsplash.com/premium_photo-1707413391465-82ac03dd5555?w=300&q=80' },
      { name: 'Hot Desi Ghee Jalebi (100g)', veg: true, basePrice: 90, desc: 'Crispy fried spiral pretzels soaked in hot saffron sugar syrup.', img: 'https://images.unsplash.com/photo-1760263216784-a4ca9a841ff5?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Patiala Sweet Lassi with Malai', veg: true, basePrice: 85, desc: 'Thick creamy churned yogurt beverage served with fresh clotted cream.', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80' },
      { name: 'Kesar Pista Badam Lassi', veg: true, basePrice: 95, desc: 'Chilled sweet yogurt shake infused with saffron strands and slivered almonds.', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80' },
      { name: 'Fresh Shikanji (Nimbu Soda)', veg: true, basePrice: 60, desc: 'Crisp sparkling lemonade flavored with roasted cumin, rock salt, and mint.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Masala Spiced Buttermilk', veg: true, basePrice: 50, desc: 'Refreshing salted yogurt drink tempered with curry leaves and hing.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  chai_point: {
    Starters: [
      { name: 'Classic Bun Maska', veg: true, basePrice: 65, desc: 'Soft warm sweet bun slathered with generous butter, best dipped in hot chai.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Crispy Punjabi Samosa (2pcs)', veg: true, basePrice: 70, desc: 'Flaky golden crust stuffed with spiced potato and peas, served with mint chutney.', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
      { name: 'Corn & Cheese Toastie', veg: true, basePrice: 110, desc: 'Toasted bread stuffed with sweet corn and melted cheddar cheese.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Classic Veggie Maggi', veg: true, basePrice: 85, desc: 'Nostalgic noodles cooked with sautéed onions, tomatoes, and green peas.', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
      { name: 'Cheese Butter Maggi', veg: true, basePrice: 105, desc: 'Steaming bowl of masala noodles enriched with molten processed cheese.', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
      { name: 'Mumbai Vada Pav with Thecha', veg: true, basePrice: 60, desc: 'Spicy batata vada tucked in pav with dry garlic-chilli chutney.', img: 'https://images.unsplash.com/photo-1750767396969-f37060ebe07d?w=300&q=80' },
      { name: 'Chicken Keema Samosa (2pcs)', veg: false, basePrice: 95, desc: 'Crispy pastry pockets filled with spiced minced chicken and herbs.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Indori Poha with Peanuts', veg: true, basePrice: 85, desc: 'Flattened rice flakes tempered with mustard seeds, curry leaves, and roasted peanuts.', img: 'https://plus.unsplash.com/premium_photo-1713370407756-acedc62f5fbb?w=300&q=80' },
      { name: 'Paneer Tikka Rice Bowl', veg: true, basePrice: 180, desc: 'Tender grilled paneer cubes in tomato gravy over aromatic jeera rice.', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
      { name: 'Homestyle Rajma Rice Bowl', veg: true, basePrice: 165, desc: 'Slow-cooked kidney beans in Punjabi spiced gravy served with steamed basmati.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Moong Dal Khichdi Bowl', veg: true, basePrice: 145, desc: 'Comforting porridge of yellow lentils and rice tempered with pure ghee and cumin.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Egg Bhurji with 2 Pavs', veg: false, basePrice: 120, desc: 'Spiced scrambled eggs with onions, tomatoes, and green chilies served with butter pav.', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80' },
      { name: 'Butter Chicken Rice Bowl', veg: false, basePrice: 210, desc: 'Juicy chicken tikka in creamy makhani gravy layered on long-grain rice.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Chicken Keema Matar Bowl', veg: false, basePrice: 220, desc: 'Minced chicken cooked with green peas and spices served with jeera rice.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' }
    ],
    Breads: [
      { name: 'Bun Maska with Fruit Jam', veg: true, basePrice: 75, desc: 'Toasted sweet bakery bun with layers of salted butter and mixed fruit preserve.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Buttered Pav (Pair)', veg: true, basePrice: 35, desc: 'Two soft bakery buns toasted in butter on griddle.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Multi-Grain Toast with Butter', veg: true, basePrice: 50, desc: 'Two slices of toasted artisanal multigrain bread with butter.', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80' },
      { name: 'Methi Mathri Crisp Jar (100g)', veg: true, basePrice: 65, desc: 'Flaky savoury fenugreek crisps seasoned with carom seeds.', img: 'https://images.unsplash.com/photo-1765360024331-25b63e85272e?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Banana Walnut Tea Cake Slice', veg: true, basePrice: 85, desc: 'Moist baked loaf cake loaded with ripe bananas and crunchy California walnuts.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Warm Chocolate Fudge Brownie', veg: true, basePrice: 95, desc: 'Decadent dark chocolate brownie with a fudgy center.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' },
      { name: 'Marble Tea Cake Slice', veg: true, basePrice: 80, desc: 'Ribboned chocolate and vanilla sponge cake ideal with hot chai.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Nankhatai Desi Cookies (Box)', veg: true, basePrice: 90, desc: 'Traditional Indian shortbread cookies baked with cardamom and pistachio.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Ginger Elaichi Chai Flask (500ml)', veg: true, basePrice: 159, desc: 'Freshly brewed milk tea infused with crushed fresh ginger root and green cardamom.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Dum Chai Kulhad (Single Cup)', veg: true, basePrice: 55, desc: 'Robust, slow-brewed Assam CTC black tea with whole milk.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Masala Chai Flask (500ml)', veg: true, basePrice: 169, desc: 'Spiced signature tea brewed with cloves, cinnamon, ginger, and black pepper.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Filter Coffee Hot', veg: true, basePrice: 65, desc: 'Traditional South Indian filter coffee brew served hot.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' }
    ]
  },

  presi_cafe: {
    Starters: [
      { name: 'Crispy Veg Puff', veg: true, basePrice: 45, desc: 'Golden flaky bakery pastry stuffed with spiced potatoes, carrots, and green peas.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Spicy Paneer Tikka Puff', veg: true, basePrice: 55, desc: 'Puff pastry stuffed with marinated cottage cheese cubes and capsicum.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Cheese Garlic Toast (3pcs)', veg: true, basePrice: 85, desc: 'Toasted bread slices smothered with garlic herb butter and melted mozzarella.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'French Fries with Dip', veg: true, basePrice: 80, desc: 'Crispy salted golden potato fries served with tomato ketchup and mayo.', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80' },
      { name: 'Golden Egg Puff', veg: false, basePrice: 50, desc: 'Flaky bakery puff with a boiled egg half wrapped in caramelized onion masala.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Chicken Masala Puff', veg: false, basePrice: 60, desc: 'Flaky pastry pocket packed with spicy minced chicken filling.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' }
    ],
    Mains: [
      { name: 'Grilled Veg Cheese Sandwich', veg: true, basePrice: 110, desc: 'Triple-layered bread grilled with cucumber, tomato, mint chutney, and molten cheese.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Corn & Spinach Grilled Panini', veg: true, basePrice: 125, desc: 'Crispy pressed panini bread filled with creamy corn, spinach, and mozzarella.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Cheesy Veg Maggi Bowl', veg: true, basePrice: 75, desc: 'Instant noodles cooked with vegetables, butter, and topped with shredded cheese.', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
      { name: 'Classic White Sauce Penne Pasta', veg: true, basePrice: 160, desc: 'Penne pasta tossed in rich buttery garlic bechamel sauce with sweet corn and bell peppers.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Paneer Kathi Roll', veg: true, basePrice: 120, desc: 'Flaky parotta wrap rolled with marinated paneer, onions, and tangy mint mayo.', img: 'https://plus.unsplash.com/premium_photo-1679287668420-80c27ea4fb31?w=300&q=80' },
      { name: 'Grilled Chicken Mayo Sandwich', veg: false, basePrice: 140, desc: 'Shredded chicken breast tossed with herb mayo, lettuce, and cheese in grilled bread.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Chicken Kathi Roll', veg: false, basePrice: 145, desc: 'Juicy chicken tikka wrapped in an egg-layered parotta with sliced onions and mint sauce.', img: 'https://plus.unsplash.com/premium_photo-1679287668420-80c27ea4fb31?w=300&q=80' }
    ],
    Breads: [
      { name: 'Butter Croissant', veg: true, basePrice: 70, desc: 'Flaky, crescent-shaped golden French butter pastry.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Chocolate Glazed Donut', veg: true, basePrice: 65, desc: 'Soft ring donut dipped in dark chocolate glaze with rainbow sprinkles.', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&q=80' },
      { name: 'Blueberry Muffin', veg: true, basePrice: 75, desc: 'Fluffy bakery muffin studded with juicy blueberries and a crumble top.', img: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&q=80' },
      { name: 'Cinnamon Sugar Roll', veg: true, basePrice: 70, desc: 'Warm sweet roll rolled with aromatic cinnamon sugar glaze.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Dutch Chocolate Pastry', veg: true, basePrice: 85, desc: 'Rich dark chocolate ganache layered between moist chocolate sponge.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'Red Velvet Pastry Slice', veg: true, basePrice: 90, desc: 'Classic crimson sponge layered with light cream cheese frosting.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Black Forest Cake Slice', veg: true, basePrice: 80, desc: 'Chocolate sponge with whipped dairy cream and dark maraschino cherries.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Warm Brownie with Choco Sauce', veg: true, basePrice: 85, desc: 'Gooey chocolate brownie warmed and drizzled with hot fudge.', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Campus Hot Cappuccino', veg: true, basePrice: 60, desc: 'Freshly extracted espresso with steamed milk foam and cocoa dusting.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Iced Cold Coffee', veg: true, basePrice: 75, desc: 'Chilled creamy blended coffee topped with chocolate syrup.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Belgian Hot Chocolate', veg: true, basePrice: 80, desc: 'Thick steaming chocolate drink topped with miniature marshmallows.', img: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&q=80' },
      { name: 'Oreo Milkshake', veg: true, basePrice: 90, desc: 'Thick chilled vanilla milkshake blended with crunchy Oreo cookies.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' }
    ]
  },

  truffles: {
    Starters: [
      { name: 'Peri Peri Crinkle Fries', veg: true, basePrice: 130, desc: 'Crispy crinkle cut potatoes tossed in spicy African peri peri rub.', img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80' },
      { name: 'Truffles Cheese Garlic Bread', veg: true, basePrice: 150, desc: 'Baguette slices toasted with herb garlic butter and bubbling mozzarella.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Crispy Golden Onion Rings (8pcs)', veg: true, basePrice: 140, desc: 'Crisp batter fried thick onion rings with house tartar dip.', img: 'https://images.unsplash.com/photo-1639024471287-032f66453916?w=300&q=80' },
      { name: 'Jalapeno Cheese Poppers (5pcs)', veg: true, basePrice: 160, desc: 'Molten cheese and diced jalapeno poppers fried crunchy.', img: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=300&q=80' },
      { name: 'Truffles Buffalo Wings (6pcs)', veg: false, basePrice: 260, desc: 'Crispy fried wings tossed in tangy spicy Buffalo cayenne sauce.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Crunchy BBQ Chicken Strips (4pcs)', veg: false, basePrice: 230, desc: 'Tender chicken fillets crusted in spiced crumbs with smoky BBQ dip.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Peri Peri Chicken Popcorn', veg: false, basePrice: 190, desc: 'Bite-sized chicken nuggets dusted with fiery peri peri seasoning.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Peri Peri Paneer Steak Burger', veg: true, basePrice: 220, desc: 'Thick cottage cheese slab marinated in peri peri with grilled peppers.', img: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&q=80' },
      { name: 'Crunchy Veg Deluxe Burger', veg: true, basePrice: 180, desc: 'Spiced potato-pea patty with melted cheese, lettuce, and secret sauce.', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80' },
      { name: 'Baked Mac & Cheese Bowl', veg: true, basePrice: 250, desc: 'Macaroni elbows baked in four cheese sauce with golden herb breadcrumb crust.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Fiery Arrabbiata Penne Bowl', veg: true, basePrice: 240, desc: 'Penne tossed with spicy tomato concasse, garlic, and fresh basil.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'All American Cheeseburger', veg: false, basePrice: 240, desc: 'Grilled chicken patty, cheddar slice, gherkins, onions, and relish in sesame bun.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
      { name: 'Truffles Lamb Burger with Cheese', veg: false, basePrice: 310, desc: 'Juicy minced lamb patty with caramelized onions, fried egg, and cheddar.', img: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&q=80' },
      { name: 'Crispy Fried Chicken Burger', veg: false, basePrice: 250, desc: 'Southern-style deep fried chicken thigh with spicy jalapeño coleslaw.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
      { name: 'Creamy Chicken Lasagna al Forno', veg: false, basePrice: 320, desc: 'Baked pasta sheets layered with minced chicken ragu, bechamel, and mozzarella.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' }
    ],
    Breads: [
      { name: 'Cheesy Loaded Jalapeno Fries', veg: true, basePrice: 170, desc: 'Skin-on fries drenched in warm cheddar sauce and pickled jalapenos.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Herb Butter Garlic Rolls (2pcs)', veg: true, basePrice: 90, desc: 'Warm soft buns brushed with whipped roasted garlic butter.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Loaded Nachos with Salsa & Queso', veg: true, basePrice: 180, desc: 'Crisp corn tortilla chips with spicy tomato salsa and liquid cheese.', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80' },
      { name: 'Cheesy Bacon Loaded Fries', veg: false, basePrice: 190, desc: 'Skin-on fries smothered in cheese sauce and crispy chicken bacon bits.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Ferrero Rocher Pastry', veg: true, basePrice: 180, desc: 'Layers of hazelnut chocolate sponge, Nutella cream, and crunchy wafer.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'Mississippi Mud Pie', veg: true, basePrice: 170, desc: 'Thick chocolate biscuit crust filled with rich chocolate fudge and whipped cream.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Dutch Truffle Cake Slice', veg: true, basePrice: 160, desc: 'Decadent dark chocolate ganache layered with moist cocoa sponge.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'New York Blueberry Cheesecake', veg: true, basePrice: 180, desc: 'Velvety baked cream cheese slice crowned with sweet blueberry compote.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Belgian Chocolate Thickshake', veg: true, basePrice: 160, desc: 'Rich shake blended with 70% chocolate ganache and vanilla ice cream.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' },
      { name: 'Salted Caramel Brownie Shake', veg: true, basePrice: 170, desc: 'Vanilla ice cream blended with brownies, sea salt, and caramel drizzle.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' },
      { name: 'Cold Coffee with Ice Cream', veg: true, basePrice: 140, desc: 'Strong espresso blended with milk, topped with a scoop of vanilla.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Peach & Mint Iced Tea', veg: true, basePrice: 110, desc: 'Refreshing brewed iced tea infused with peach syrup and lemon.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  glens_bakehouse: {
    Starters: [
      { name: 'Spinach & Corn Quiche', veg: true, basePrice: 150, desc: 'Flaky buttery shortcrust tart filled with savory custard, spinach, and sweet corn.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Cheese Butter Croissant', veg: true, basePrice: 140, desc: 'All-butter laminated French pastry filled with melted gruyere cheese.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Sundried Tomato Focaccia Bites (4pcs)', veg: true, basePrice: 160, desc: 'Toasted herb focaccia squares topped with basil pesto and bocconcini.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Mushroom & Thyme Vol-au-Vent (2pcs)', veg: true, basePrice: 150, desc: 'Puff pastry cases filled with creamy garlic sautéed button mushrooms.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Chicken & Mushroom Pot Pie', veg: false, basePrice: 180, desc: 'Golden baked puff crust over creamy shredded chicken and button mushrooms.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' },
      { name: 'Peri Peri Chicken Savory Puff', veg: false, basePrice: 120, desc: 'Crispy bakery bake packed with shredded chicken tossed in peri peri.', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&q=80' }
    ],
    Mains: [
      { name: 'Wood-Fired Margherita Pizza', veg: true, basePrice: 280, desc: 'Thin artisan crust with San Marzano tomato sauce, fresh mozzarella, and sweet basil.', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
      { name: 'Penne Pesto Cream Pasta', veg: true, basePrice: 290, desc: 'Al dente penne in vibrant basil pine-nut pesto with a splash of dairy cream.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Roasted Veggie & Hummus Bagel', veg: true, basePrice: 220, desc: 'Toasted poppy seed bagel with creamy hummus, grilled zucchini, and bell peppers.', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80' },
      { name: 'Four Cheese Sourdough Melt', veg: true, basePrice: 240, desc: 'Aged cheddar, mozzarella, gouda, and parmesan grilled golden on sourdough.', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
      { name: 'Chicken Alfredo Tagliatelle', veg: false, basePrice: 340, desc: 'Handmade ribbon pasta with grilled chicken in velvety garlic Parmesan sauce.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80' },
      { name: 'Grilled Herb Chicken Sourdough', veg: false, basePrice: 260, desc: 'Sliced chicken breast, dijon mayo, and melted provolone in artisan sourdough.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'Smoked Turkey & Cranberry Panini', veg: false, basePrice: 290, desc: 'Pressed crusty bread with sliced smoked turkey, brie cheese, and cranberry relish.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' }
    ],
    Breads: [
      { name: 'Artisan Sourdough Loaf (Whole)', veg: true, basePrice: 150, desc: 'Slow-fermented rustic loaf with blistered crust and open chewy crumb.', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
      { name: 'Brioche Cinnamon Roll', veg: true, basePrice: 120, desc: 'Soft pillowy bun swirled with aromatic cinnamon butter and cream cheese glaze.', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
      { name: 'French Baguette', veg: true, basePrice: 90, desc: 'Crisp golden crust with light airy crumb, baked daily.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      { name: 'Rosemary Sea Salt Focaccia', veg: true, basePrice: 110, desc: 'Olive oil soaked Italian flatbread topped with fresh rosemary leaves.', img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Glen\'s Red Velvet Cupcakes (2pcs)', veg: true, basePrice: 140, desc: 'The iconic Bengaluru cupcakes: moist crimson sponge topped with velvety cream cheese.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Signature Belgian Chocolate Cake', veg: true, basePrice: 170, desc: 'Layers of moist cocoa sponge and silky dark Belgian chocolate mousse.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80' },
      { name: 'New York Blueberry Cheesecake', veg: true, basePrice: 190, desc: 'Dense, rich baked cream cheese on buttery crust with wild blueberry puree.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Banoffee Pie Tart', veg: true, basePrice: 160, desc: 'Crisp pastry shell layered with homemade dulce de leche, bananas, and whipped cream.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Hazelnut Cafe Latte', veg: true, basePrice: 150, desc: 'Double espresso with silky steamed milk and roasted hazelnut syrup.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Belgian Hot Chocolate', veg: true, basePrice: 160, desc: 'Rich, steaming real chocolate drink topped with whipped cream.', img: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&q=80' },
      { name: 'Pour-Over Specialty Coffee', veg: true, basePrice: 140, desc: 'Single-origin Arabica brew highlighting floral and citrus tasting notes.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Cold Brew Sweet Cream', veg: true, basePrice: 160, desc: '18-hour cold steeped coffee poured over vanilla sweet cream.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' }
    ]
  },

  meghana_foods: {
    Starters: [
      { name: 'Paneer 65', veg: true, basePrice: 240, desc: 'Cottage cheese cubes tossed in spicy curd masala with curry leaves.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Crispy Mushroom Chilli', veg: true, basePrice: 220, desc: 'Crispy fried button mushrooms tossed with capsicum and spicy soy garlic sauce.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Baby Corn Pepper Fry', veg: true, basePrice: 210, desc: 'Golden fried tender baby corn sautéed with black pepper and curry leaves.', img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80' },
      { name: 'Meghana Special Chicken 555', veg: false, basePrice: 320, desc: 'Crisp fried boneless chicken strips tossed with green chilies, cashews, and garlic.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Andhra Chilli Chicken', veg: false, basePrice: 310, desc: 'Iconic spicy green chili coated dry chicken sauteed with curry leaves.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Guntur Chicken Roast', veg: false, basePrice: 330, desc: 'Spicy dry roasted chicken infused with fiery Guntur red chilies and ground spices.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Mutton Sukka Roast', veg: false, basePrice: 420, desc: 'Tender lamb chunks roasted dry with caramelized shallots and ground black pepper.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' }
    ],
    Mains: [
      { name: 'Meghana Special Chicken Biryani', veg: false, basePrice: 360, desc: 'Spiced boneless chicken pieces layered over fragrant basmati rice with salan and raita.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Boneless Chicken Biryani', veg: false, basePrice: 350, desc: 'Long grain basmati biryani topped with tender boneless chicken in rich Andhra gravy.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Hyderabadi Mutton Dum Biryani', veg: false, basePrice: 420, desc: 'Tender bone-in mutton slow-cooked on dum with saffron basmati rice and aromatics.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Egg Dum Biryani (2 Eggs)', veg: false, basePrice: 240, desc: 'Golden spiced hard-boiled eggs nested in fragrant dum biryani rice with gravy.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Bengaluru Donne Chicken Biryani', veg: false, basePrice: 310, desc: 'Traditional Karnataka military hotel style spiced short-grain seeraga samba rice biryani.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Meghana Special Paneer Biryani', veg: true, basePrice: 290, desc: 'Fragrant biryani rice layered with spicy tossed paneer cubes and fried onions.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Mushroom Dum Biryani', veg: true, basePrice: 270, desc: 'Basmati rice dum cooked with juicy marinated button mushrooms and whole spices.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Seasonal Veg Dum Biryani', veg: true, basePrice: 250, desc: 'Long-grain basmati cooked with garden vegetables, mint, saffron, and roasted cashews.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Andhra Veg Meals Special', veg: true, basePrice: 230, desc: 'Steamed rice, Gongura pachadi, Kandi podi, pure ghee, Pappu, Sambar, Rasam, and Curd.', img: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=300&q=80' }
    ],
    Breads: [
      { name: 'Kerala Malabar Parotta (2pcs)', veg: true, basePrice: 65, desc: 'Flaky, multi-layered griddled flatbreads cooked in pure oil.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Butter Tandoori Roti', veg: true, basePrice: 40, desc: 'Whole wheat clay oven baked bread with butter.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Garlic Butter Naan', veg: true, basePrice: 70, desc: 'Clay oven baked flatbread topped with toasted garlic and butter.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' },
      { name: 'Ceylon Egg Parotta', veg: false, basePrice: 90, desc: 'Layered parotta stuffed with spiced whisked egg and onions.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Double Ka Meetha', veg: true, basePrice: 110, desc: 'Hyderabadi fried bread pudding steeped in saffron milk, cardamom, and roasted nuts.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Apricot Delight', veg: true, basePrice: 130, desc: 'Rich stewed apricots layered with chilled custard and clotted cream.', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&q=80' },
      { name: 'Hot Gulab Jamun (2pcs)', veg: true, basePrice: 80, desc: 'Warm khoya balls soaked in rose-cardamom sugar syrup.', img: 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=' },
      { name: 'Kesar Pista Kulfi', veg: true, basePrice: 90, desc: 'Dense slow-churned Indian milk ice cream with pistachios.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Spiced Andhra Buttermilk (Majjiga)', veg: true, basePrice: 45, desc: 'Cooling churned curd beverage tempered with crushed ginger and green chili.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Sweet Punjabi Lassi', veg: true, basePrice: 80, desc: 'Thick sweetened yogurt beverage served chilled.', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80' },
      { name: 'Thums Up Glass Bottle (300ml)', veg: true, basePrice: 40, desc: 'Classic strong fizzy cola, the ultimate pairing with biryani.', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80' },
      { name: 'Fresh Lime Soda (Sweet & Salt)', veg: true, basePrice: 60, desc: 'Sparkling lemon beverage with rock salt and mint.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  biryani_house: {
    Starters: [
      { name: 'Andhra Chilli Chicken Dry', veg: false, basePrice: 310, desc: 'Famous spicy green chili coated chicken sauteed with curry leaves.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Chicken 65 (Biryani Style)', veg: false, basePrice: 280, desc: 'Crispy fried chicken chunks tossed with curd, curry leaves, and green chilies.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Chicken Lollipop (6pcs)', veg: false, basePrice: 290, desc: 'Crispy frenched spiced chicken wings served with fiery Schezwan chutney.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Guntur Chicken Roast', veg: false, basePrice: 320, desc: 'Dry roasted chicken infused with fiery Guntur red chilies and ground spices.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Paneer 65 Crispy', veg: true, basePrice: 230, desc: 'Cottage cheese cubes tossed in spicy yogurt curd masala with curry leaves.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Crispy Mushroom Pepper Fry', veg: true, basePrice: 220, desc: 'Button mushrooms sauteed crisp with freshly crushed black peppercorns.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Apollo Fish Fry', veg: false, basePrice: 350, desc: 'Hyderabadi spiced fish fillets pan seared with yogurt and green chilies.', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80' }
    ],
    Mains: [
      { name: 'Hyderabadi Chicken Dum Biryani', veg: false, basePrice: 340, desc: 'Authentic slow cooked dum biryani layered with spiced marinated chicken, saffron basmati, served with mirchi ka salan and raita.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Special Boneless Chicken Biryani', veg: false, basePrice: 360, desc: 'Aromatic basmati rice topped with spicy pan-fried boneless chicken cubes and caramelized onions.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Royal Mutton Dum Biryani', veg: false, basePrice: 420, desc: 'Tender baby lamb cooked on dum with aged basmati rice, mint, and royal spices.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Egg Dum Biryani (2 Eggs)', veg: false, basePrice: 240, desc: 'Golden spiced hard-boiled eggs nested in fragrant dum biryani rice with gravy.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Special Paneer Dum Biryani', veg: true, basePrice: 280, desc: 'Fragrant basmati rice layered with spiced tandoori cottage cheese cubes and golden onions.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Seasonal Veg Dum Biryani', veg: true, basePrice: 250, desc: 'Long-grain basmati cooked with garden vegetables, mint, saffron, and roasted cashews.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Mushroom Dum Biryani', veg: true, basePrice: 260, desc: 'Juicy marinated button mushrooms simmered with herbs in sealed biryani handi.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Bengaluru Donne Chicken Biryani', veg: false, basePrice: 310, desc: 'Traditional Karnataka military hotel style spiced short-grain seeraga samba rice biryani.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Andhra Chicken Curry with Ghee Rice', veg: false, basePrice: 330, desc: 'Fiery Andhra home-style chicken curry served over aromatic basmati ghee rice.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' }
    ],
    Breads: [
      { name: 'Ceylon Egg Parotta', veg: false, basePrice: 90, desc: 'Flaky layered parotta stuffed with spiced egg and onions.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Malabar Parotta (2pcs)', veg: true, basePrice: 65, desc: 'Crispy, flaky multi-layered Kerala flatbread griddled golden.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Rumali Roti (2pcs)', veg: true, basePrice: 50, desc: 'Paper thin soft flatbread cooked on inverted wok.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' },
      { name: 'Garlic Butter Naan', veg: true, basePrice: 70, desc: 'Clay oven baked bread slathered with roasted garlic butter.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Double Ka Meetha', veg: true, basePrice: 110, desc: 'Hyderabadi royal fried bread pudding steeped in saffron milk, cardamom, and roasted nuts.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Shahi Tukda with Rabdi', veg: true, basePrice: 130, desc: 'Ghee-fried bread rounds soaked in sugar syrup and topped with thick condensed rabdi.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Hot Gulab Jamun (2pcs)', veg: true, basePrice: 80, desc: 'Warm golden khoya balls soaked in rose-cardamom sugar syrup.', img: 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=' },
      { name: 'Matka Phirni', veg: true, basePrice: 95, desc: 'Chilled creamy rice pudding scented with saffron and cardamom in clay pot.', img: 'https://plus.unsplash.com/premium_photo-1707413391465-82ac03dd5555?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Thums Up Glass Bottle (300ml)', veg: true, basePrice: 40, desc: 'Chilled strong fizzy cola, the classic biryani companion.', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80' },
      { name: 'Spiced Andhra Buttermilk (Majjiga)', veg: true, basePrice: 45, desc: 'Cooling churned curd beverage tempered with crushed ginger and green chili.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Sweet Punjabi Lassi', veg: true, basePrice: 80, desc: 'Thick sweetened yogurt beverage served chilled.', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80' },
      { name: 'Fresh Lime Soda (Sweet & Salt)', veg: true, basePrice: 60, desc: 'Fizzy sparkling lemon drink.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  hotel_empire: {
    Starters: [
      { name: 'Empire Paneer Tikka', veg: true, basePrice: 230, desc: 'Cottage cheese cubes marinated in spiced hung curd and skewered in tandoor.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Veg Crispy Spring Rolls (4pcs)', veg: true, basePrice: 170, desc: 'Crisp fried rolls packed with shredded cabbage, carrots, and glass noodles.', img: 'https://images.unsplash.com/photo-1581438761655-ebb4e43add30?w=300&q=80' },
      { name: 'Empire Special Chicken Kabab', veg: false, basePrice: 270, desc: 'The legendary Bengaluru late-night fried chicken kebab coated in red masala.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Kalmi Kabab (2pcs)', veg: false, basePrice: 280, desc: 'Tender chicken drumsticks marinated in cashew paste, cream, and tandoori spices.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' },
      { name: 'Tandoori Chicken Half', veg: false, basePrice: 310, desc: 'Bone-in chicken marinated in yogurt and royal spices, roasted in clay oven.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Empire Mutton Brain Dry', veg: false, basePrice: 320, desc: 'Iconic Empire delicacy: spiced lamb brain sauteed with onions and green chilies.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80' },
      { name: 'Crispy Dragon Chicken', veg: false, basePrice: 290, desc: 'Stir-fried crunchy chicken strips tossed with cashews and fiery red chili sauce.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Empire Iconic Ghee Rice', veg: true, basePrice: 140, desc: 'Aromatic short grain rice cooked in pure desi ghee with caramelized onions and whole spices.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Dal Tadka Double Fry', veg: true, basePrice: 180, desc: 'Yellow lentils tempered twice with garlic, cumin, and dry whole red chilies.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Paneer Butter Masala', veg: true, basePrice: 260, desc: 'Malai paneer cubes simmered in rich creamy butter-cashew gravy.', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
      { name: 'Veg Dum Biryani Empire', veg: true, basePrice: 220, desc: 'Aromatic basmati rice cooked with fresh seasonal vegetables and saffron.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Empire Butter Chicken', veg: false, basePrice: 340, desc: 'Tender chicken tikka chunks in rich velvety tomato, cream, and butter gravy.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Mutton Rogan Josh Empire', veg: false, basePrice: 420, desc: 'Slow-braised lamb shanks in Kashmiri red chili and rich aromatic gravy.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Empire Chicken Curry', veg: false, basePrice: 290, desc: 'Homestyle spicy chicken gravy infused with coconut and fresh curry leaves.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Empire Chicken Dum Biryani', veg: false, basePrice: 310, desc: 'Slow cooked chicken biryani served with brinjal salan and onion raita.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' }
    ],
    Breads: [
      { name: 'Empire Coin Parotta (3pcs)', veg: true, basePrice: 70, desc: 'Crispy, flaky, small coin-sized layered parottas cooked on hot tawa with oil.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      { name: 'Roomali Roti', veg: true, basePrice: 45, desc: 'Thin handkerchief-soft bread baked on inverted domed kadhai.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' },
      { name: 'Garlic Butter Naan', veg: true, basePrice: 65, desc: 'Tandoor baked bread brushed with minced garlic and butter.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' },
      { name: 'Butter Tandoori Roti', veg: true, basePrice: 35, desc: 'Whole wheat bread baked in clay tandoor.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Empire Royal Falooda', veg: true, basePrice: 160, desc: 'Chilled rose milk layered with basil seeds, vermicelli, jelly, dry fruits, and ice cream.', img: 'https://images.unsplash.com/photo-1696487774083-44992ca48eb4?w=300&q=80' },
      { name: 'Matka Kulfi', veg: true, basePrice: 95, desc: 'Creamy saffron almond kulfi served in an earthen clay pot.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Warm Gulab Jamun (2pcs)', veg: true, basePrice: 75, desc: 'Golden fried khoya dumplings in rose cardamom syrup.', img: 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=' },
      { name: 'Caramel Custard Pudding', veg: false, basePrice: 110, desc: 'Silky smooth baked egg and milk pudding with amber caramel sauce.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Sharjah Shake', veg: true, basePrice: 110, desc: 'Famous Kerala-Arabian banana, milk, Horlicks, and cashew thickshake.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80' },
      { name: 'Fresh Mosambi Juice', veg: true, basePrice: 85, desc: 'Freshly pressed sweet lime juice without ice.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Empire Cold Coffee', veg: true, basePrice: 90, desc: 'Thick blended cold coffee with chocolate drizzle.', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&q=80' },
      { name: 'Mint Lime Cooler', veg: true, basePrice: 60, desc: 'Crisp sparkling lemonade with crushed fresh mint.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' }
    ]
  },

  dhaba: {
    Starters: [
      { name: 'Dhaba Paneer Tikka', veg: true, basePrice: 220, desc: 'Thick cottage cheese cubes marinated in mustard oil and ajwain, clay tandoor roasted.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Tandoori Soya Chaap', veg: true, basePrice: 210, desc: 'Soya chaap pieces marinated in spicy tandoori masala and charred over open coals.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Crispy Chana Garlic Roast', veg: true, basePrice: 150, desc: 'Spiced Kabuli chickpeas deep fried crisp with golden roasted garlic cloves.', img: 'https://images.unsplash.com/photo-1765360024331-25b63e85272e?w=300&q=80' },
      { name: 'Dhaba Chicken Tikka', veg: false, basePrice: 290, desc: 'Boneless chicken cubes spiced with Punjabi garam masala and roasted in tandoor.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Tandoori Chicken Half', veg: false, basePrice: 310, desc: 'Bone-in chicken steeped in curd and mustard oil Punjabi marinade.', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&q=80' },
      { name: 'Dhaba Chicken Lollipop (6pcs)', veg: false, basePrice: 260, desc: 'Crisp fried spiced chicken wings served with Schezwan chutney.', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&q=80' }
    ],
    Mains: [
      { name: 'Dhaba Dal Tadka (Double Fry)', veg: true, basePrice: 190, desc: 'Yellow toor lentils tempered in pure ghee with crushed garlic, green chili, and hing.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Sev Tamatar Dhaba Special', veg: true, basePrice: 180, desc: 'Spicy tangy tomato gravy topped with crispy chickpea sev and fresh coriander.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Kadhai Paneer', veg: true, basePrice: 270, desc: 'Paneer cubes tossed with fresh capsicum, whole coriander, and spicy tomato masala.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Jeera Rice with Dal Fry', veg: true, basePrice: 170, desc: 'Fragrant cumin-tempered basmati rice served with yellow dal.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Handi Chicken Desi Style', veg: false, basePrice: 360, desc: 'Bone-in chicken simmered slow in earthen clay pot with whole spices and thick gravy.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Dhaba Butter Chicken', veg: false, basePrice: 370, desc: 'Smoky tandoori chicken chunks cooked in rich creamy spiced velvet gravy.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' },
      { name: 'Desi Mutton Curry', veg: false, basePrice: 420, desc: 'Rustic slow-cooked mutton curry with home-ground spices.', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
      { name: 'Dhaba Egg Curry (2 Eggs)', veg: false, basePrice: 190, desc: 'Pan-fried boiled eggs simmered in spicy onion-tomato gravy.', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&q=80' }
    ],
    Breads: [
      { name: 'Missi Roti with Desi Butter', veg: true, basePrice: 50, desc: 'Nutritious spiced gram flour flatbread served with dollop of white butter.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Tandoori Butter Roti', veg: true, basePrice: 30, desc: 'Crispy whole wheat bread fresh from the tandoor.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Stuffed Aloo Paratha with Curd', veg: true, basePrice: 80, desc: 'Tandoor baked wheat bread filled with spiced mashed potatoes.', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&q=80' },
      { name: 'Garlic Butter Naan', veg: true, basePrice: 65, desc: 'Clay oven baked bread slathered with roasted garlic butter.', img: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300&q=80' }
    ],
    Desserts: [
      { name: 'Warm Gulab Jamun (2pcs)', veg: true, basePrice: 70, desc: 'Soft mawa dumplings in warm rose cardamom syrup.', img: 'https://media.istockphoto.com/id/521788423/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=oMoXZUYPBZq_N8h9yqB16HsmGF4G-oEcRwEg-K8zZ0o=' },
      { name: 'Dhaba Gajar Ka Halwa', veg: true, basePrice: 90, desc: 'Slow-cooked red carrots in whole milk and mawa with cashews.', img: 'https://images.unsplash.com/photo-1760263216784-a4ca9a841ff5?w=300&q=80' },
      { name: 'Kulfi on a Stick', veg: true, basePrice: 60, desc: 'Dense traditional malai kulfi on stick.', img: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&q=80' },
      { name: 'Rabdi Jalebi', veg: true, basePrice: 110, desc: 'Crisp hot jalebis topped with thick condensed milk rabdi.', img: 'https://images.unsplash.com/photo-1760263216784-a4ca9a841ff5?w=300&q=80' }
    ],
    Beverages: [
      { name: 'Patiala Heavy Sweet Lassi', veg: true, basePrice: 85, desc: 'Giant tumbler of thick churned yogurt beverage topped with clotted malai.', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&q=80' },
      { name: 'Spiced Masala Chaas', veg: true, basePrice: 45, desc: 'Cold salted buttermilk with roasted cumin and mint.', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
      { name: 'Kulhad Masala Chai', veg: true, basePrice: 35, desc: 'Piping hot ginger-cardamom tea served in earthen clay cup.', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
      { name: 'Thums Up Glass Bottle (300ml)', veg: true, basePrice: 35, desc: 'Chilled classic Indian cola.', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80' }
    ]
  }
};
