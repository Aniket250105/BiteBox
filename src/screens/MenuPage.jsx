import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './MenuPage.css';
import ImageWithFallback from '../components/ImageWithFallback';
import { apiService } from '../services/apiService';

// Deterministic pastel color palette for dish cards
const PASTEL_PALETTE = [
  '#FFE6D1', // warm peach
  '#FFDDD6', // soft coral
  '#DDF0DC', // pale mint
  '#FFF3D6', // soft custard
  '#E8E3DD', // warm stone
  '#E3E8F8', // lavender mist
  '#FBE4EB', // rose blush
  '#E2F4EE'  // sage foam
];

function getPastelBackground(id) {
  let hash = 0;
  const str = String(id || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return PASTEL_PALETTE[Math.abs(hash) % PASTEL_PALETTE.length];
}

const MenuPage = ({ restaurant, onBack, cart, updateCart, onViewCart, cartRestaurant, onReplaceCart }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [lastUpdatedId, setLastUpdatedId] = useState(null);
  const [replaceModal, setReplaceModal] = useState({ isOpen: false, itemId: null, qty: 1 });

  // Load menu items from API for the selected restaurant
  const loadMenu = useCallback(async () => {
    if (!restaurant?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.fetchRestaurantMenu(restaurant.id);
      const items = res.menu || [];
      setMenuItems(items);

      // Auto-select category (Biryani, Burger, Pizza, Dosa restaurants default to Mains)
      const cats = [...new Set(items.map(item => item.category))];
      if (cats.length > 0) {
        const prefersMains = /biryani|biriyani|briyani|pizza|pizzeria|burger|dosa|thali|meals/i.test(
          `${restaurant?.name || ''} ${restaurant?.cuisine || ''}`
        );
        const defaultCat = (prefersMains && cats.includes('Mains')) ? 'Mains' : cats[0];
        setActiveCategory(prev => (cats.includes(prev) ? prev : defaultCat));
      }
    } catch (err) {
      setError(err.message || 'Unable to load menu. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurant?.id, restaurant?.name, restaurant?.cuisine]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  if (!restaurant) return null;

  // Group items by category dynamically from menu data
  const categories = useMemo(() => {
    return [...new Set(menuItems.map(item => item.category))];
  }, [menuItems]);

  // Cart calculations using loaded menu items
  let totalItems = 0;
  let totalPrice = 0;
  
  Object.keys(cart).forEach(itemId => {
    const qty = cart[itemId];
    const item = menuItems.find(m => m.id === itemId);
    if (item && qty > 0) {
      totalItems += qty;
      totalPrice += item.price * qty;
    }
  });

  const handleUpdateCart = (itemId, newQty) => {
    const hasDifferentRestaurantCart = 
      newQty > 0 && 
      cartRestaurant && 
      cartRestaurant.id !== restaurant.id && 
      Object.keys(cart).length > 0;

    if (hasDifferentRestaurantCart) {
      setReplaceModal({ isOpen: true, itemId, qty: newQty });
      return;
    }

    updateCart(itemId, newQty, restaurant);
    setLastUpdatedId(itemId);
    setTimeout(() => setLastUpdatedId(null), 200);
  };

  const currentCategoryItems = menuItems.filter(item => 
    !activeCategory || item.category === activeCategory
  );

  // Up to three cuisine tags
  const cuisineTags = useMemo(() => {
    if (restaurant.cuisines && restaurant.cuisines.length > 0) {
      return restaurant.cuisines.slice(0, 3);
    }
    if (restaurant.cuisine) {
      return restaurant.cuisine.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
    }
    return ['Specialty'];
  }, [restaurant.cuisines, restaurant.cuisine]);

  const deliveryTimeStr = restaurant.deliveryTime || restaurant.delivery_time_est || '20–30 min';
  const distanceStr = restaurant.distanceText || (restaurant.distanceKm ? `${restaurant.distanceKm} km` : 'Nearby');
  const ratingText = restaurant.rating !== null && restaurant.rating !== undefined 
    ? `★ ${restaurant.rating}` 
    : '★ New';

  return (
    <div className="menu-screen">
      {/* 1. Gradient Hero Header (No fake device chrome, runs to top edge) */}
      <div className="menu-hero">
        <div className="menu-hero-ambient-circle-1" />
        <div className="menu-hero-ambient-circle-2" />

        {/* Back Button with 44px touch target */}
        <div className="menu-hero-nav">
          <button 
            type="button" 
            className="circbtn menu-back-btn" 
            onClick={onBack}
            aria-label="Back to restaurants"
          >
            ←
          </button>
        </div>

        {/* Large Restaurant Plate Frame (128px) */}
        <div className="plate menu-hero-plate">
          <ImageWithFallback 
            src={restaurant.image || restaurant.image_url} 
            fallbackEmoji={restaurant.emoji || '🍛'}
            alt={restaurant.name}
            isPlate={true}
          />
        </div>
      </div>

      {/* 2. Overlapping White Restaurant Info Card */}
      <div className="menu-info-card">
        <h2 className="menu-restaurant-name">{restaurant.name}</h2>
        
        <div className="menu-info-meta-row">
          <b className="meta-rating">{ratingText}</b>
          <i className="dotsep" />
          <span>{deliveryTimeStr}</span>
          <i className="dotsep" />
          <span>{distanceStr}</span>
          <i className="dotsep" />
          <span className={restaurant.isOpen ? 'meta-open' : 'meta-closed'}>
            {restaurant.isOpen ? 'Open now' : 'Closed'}
          </span>
        </div>

        <div className="menu-cuisine-tags">
          {cuisineTags.map(tag => (
            <span key={tag} className="cuisine-tag">{tag}</span>
          ))}
          {(restaurant.isDemoFallback || restaurant.source === 'seed' || (restaurant.distanceKm && restaurant.distanceKm > 3.0)) && (
            <span className="badge-demo-restaurant">Demo restaurant</span>
          )}
        </div>
      </div>

      {/* Notice if cart has items from another restaurant */}
      {cartRestaurant && cartRestaurant.id !== restaurant.id && Object.keys(cart).length > 0 && (
        <div className="other-cart-notice-banner">
          <span>🛒</span>
          <span>Your cart has items from <strong>{cartRestaurant.name}</strong>. Adding items here will start a new cart.</span>
        </div>
      )}

      {/* 3. Category Pills (Sticky below hero while scrolling) */}
      {!isLoading && !error && categories.length > 0 && (
        <div className="menu-category-pills-bar">
          <div className="menu-category-pills-scroll">
            {categories.map((cat) => (
              <button 
                key={cat} 
                type="button"
                className={`category-pill ${activeCategory === cat ? 'on' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Loading Skeletons */}
      {isLoading && (
        <div className="menu-grid-container">
          <div className="menu-dish-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="dish-card skeleton-card">
                <div className="skeleton skeleton-dish-img" />
                <div className="dish-card-body">
                  <div className="skeleton" style={{ height: '16px', width: '70%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State with Retry Button */}
      {!isLoading && error && (
        <div className="friendly-error-state">
          <div className="friendly-error-icon">🍳</div>
          <div className="friendly-error-title">Couldn't load menu</div>
          <div className="friendly-error-desc">{error}</div>
          <button type="button" className="btn-retry" onClick={loadMenu}>
            🔄 Try Again
          </button>
        </div>
      )}

      {/* 5. Two-Column Dish Grid */}
      {!isLoading && !error && (
        <div className="menu-grid-container">
          <div className="menu-dish-grid">
            {currentCategoryItems.map(item => {
              const qty = cart[item.id] || 0;
              const isAvailable = item.isAvailable && (item.stockQuantity === undefined || item.stockQuantity > 0);
              const pastelBg = getPastelBackground(item.id);

              return (
                <div 
                  key={item.id} 
                  className={`dish-card ${!isAvailable ? 'sold' : ''}`}
                  aria-disabled={!isAvailable}
                >
                  {/* Pastel Image Area with Veg/Non-Veg Marker and Circular Plate */}
                  <div className="dish-img-area" style={{ background: pastelBg }}>
                    {/* Veg / Non-veg Marker */}
                    <div className={`dish-veg-marker ${item.isVeg ? 'veg' : 'nv'}`} title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'} />
                    
                    {/* Circular Plate Frame (72px) with Image */}
                    <div className="plate dish-plate">
                      <ImageWithFallback
                        src={item.image || item.image_url}
                        fallbackEmoji={item.isVeg ? '🥗' : '🍗'}
                        alt={item.name}
                        isPlate={true}
                      />
                    </div>
                  </div>

                  {/* Body: Name, Price, and Add / Stepper / Sold Tag */}
                  <div className="dish-card-body">
                    <div className="dish-name" title={item.name}>{item.name}</div>
                    
                    <div className="dish-price-row">
                      <b>₹{item.price}</b>

                      {!isAvailable ? (
                        <div className="soldtag">Sold out</div>
                      ) : qty === 0 ? (
                        <button 
                          type="button"
                          className="dish-plus-btn"
                          onClick={() => handleUpdateCart(item.id, 1)}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          <span className="plus-icon">+</span>
                        </button>
                      ) : (
                        <div className={`dish-qty-stepper ${lastUpdatedId === item.id ? 'animate-pop' : ''}`}>
                          <button 
                            type="button" 
                            className="qty-btn"
                            onClick={() => handleUpdateCart(item.id, qty - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            −
                          </button>
                          <span className="qty-number">{qty}</span>
                          <button 
                            type="button" 
                            className="qty-btn"
                            onClick={() => handleUpdateCart(item.id, qty + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Demo Disclaimer under the dish grid */}
          <div className="menu-demo-disclaimer" role="note">
            Demo prototype: menus and prices are sample data and no real order is placed.
          </div>
        </div>
      )}

      {/* 6. Floating Dark Cart Pill (Contrasting in both Light and Dark modes) */}
      {totalItems > 0 && (
        <div 
          className="menu-cart-pill" 
          onClick={onViewCart}
          role="button"
          tabIndex={0}
          aria-label={`View cart with ${totalItems} items, total ₹${totalPrice}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onViewCart();
          }}
        >
          <div className="cart-pill-count">{totalItems}</div>
          <div className="cart-pill-text">
            <small>Your cart</small>
            <b>₹{totalPrice}</b>
          </div>
          <div className="cart-pill-cta">
            View cart →
          </div>
        </div>
      )}

      {/* Replace Cart Confirmation Modal */}
      {replaceModal.isOpen && (
        <div className="modal-overlay" onClick={() => setReplaceModal({ isOpen: false, itemId: null, qty: 1 })}>
          <div className="modal-card slide-in-top" onClick={e => e.stopPropagation()}>
            <div className="replace-modal-header">
              <span className="replace-modal-icon">🛒</span>
              <h3 className="modal-title font-bold">Replace cart items?</h3>
            </div>
            <p className="replace-modal-desc text-secondary">
              Your cart contains items from <strong>{cartRestaurant?.name || 'another restaurant'}</strong>.
              Would you like to discard your existing cart and start a fresh order from <strong>{restaurant.name}</strong>?
            </p>
            <div className="replace-modal-actions">
              <button 
                type="button"
                className="btn-retry" 
                style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-line)' }}
                onClick={() => setReplaceModal({ isOpen: false, itemId: null, qty: 1 })}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="bigbtn"
                onClick={() => {
                  if (onReplaceCart) {
                    onReplaceCart(replaceModal.itemId, replaceModal.qty, restaurant);
                  } else {
                    Object.keys(cart).forEach(id => updateCart(id, 0));
                    updateCart(replaceModal.itemId, replaceModal.qty, restaurant);
                  }
                  setReplaceModal({ isOpen: false, itemId: null, qty: 1 });
                  setLastUpdatedId(replaceModal.itemId);
                  setTimeout(() => setLastUpdatedId(null), 200);
                }}
              >
                Discard & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
