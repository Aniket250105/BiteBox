import React, { useState, useEffect, useCallback } from 'react';
import './MenuPage.css';
import ImageWithFallback from '../components/ImageWithFallback';
import { apiService } from '../services/apiService';

const MenuPage = ({ restaurant, onBack, cart, updateCart, onViewCart }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [lastUpdatedId, setLastUpdatedId] = useState(null);

  // Load menu items from API for the selected restaurant
  const loadMenu = useCallback(async () => {
    if (!restaurant?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.fetchRestaurantMenu(restaurant.id);
      const items = res.menu || [];
      setMenuItems(items);

      // Auto-select first category if available
      const cats = [...new Set(items.map(item => item.category))];
      if (cats.length > 0) {
        setActiveCategory(prev => (cats.includes(prev) ? prev : cats[0]));
      }
    } catch (err) {
      setError(err.message || 'Unable to load menu. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  if (!restaurant) return null;

  // Group items by category
  const categories = [...new Set(menuItems.map(item => item.category))];

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
    updateCart(itemId, newQty);
    setLastUpdatedId(itemId);
    setTimeout(() => setLastUpdatedId(null), 200);
  };

  const currentCategoryItems = menuItems.filter(item => 
    !activeCategory || item.category === activeCategory
  );

  return (
    <div className="menu-page">
      {/* Restaurant Header */}
      <div className="header menu-header">
        <button className="back-button" onClick={onBack}>
          ←
        </button>
        <div className="menu-header-info">
          <h2 className="text-xl font-bold">{restaurant.name}</h2>
          <p className="text-sm text-secondary">
            {restaurant.rating !== null && restaurant.rating !== undefined ? `⭐ ${restaurant.rating}` : '⭐ New'} • {restaurant.deliveryTime || restaurant.delivery_time_est || 'Nearby'}
          </p>
        </div>
      </div>

      <div className="screen-content menu-content">
        {/* Demo Disclaimer Banner */}
        <div className="demo-disclaimer-banner" role="note">
          Demo prototype: menus and prices are sample data and no real order is placed.
        </div>
        {/* Category Tabs */}
        {!isLoading && !error && categories.length > 0 && (
          <div className="category-tabs">
            {categories.map((cat) => (
              <div 
                key={cat} 
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </div>
            ))}
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="menu-sections">
            <div className="skeleton" style={{ height: '38px', width: '100%', marginBottom: '16px', borderRadius: '8px' }}></div>
            {[1, 2, 3].map(n => (
              <div 
                key={n} 
                className="menu-item-card" 
                style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', pointerEvents: 'none' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div className="skeleton" style={{ height: '14px', width: '30px' }}></div>
                  <div className="skeleton" style={{ height: '20px', width: '65%' }}></div>
                  <div className="skeleton" style={{ height: '16px', width: '35%' }}></div>
                  <div className="skeleton" style={{ height: '12px', width: '85%' }}></div>
                </div>
                <div className="skeleton" style={{ width: '96px', height: '96px', borderRadius: '12px' }}></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry Button */}
        {!isLoading && error && (
          <div className="friendly-error-state">
            <div className="friendly-error-icon">🍳</div>
            <div className="friendly-error-title">Couldn't load menu</div>
            <div className="friendly-error-desc">{error}</div>
            <button className="btn-retry" onClick={loadMenu}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Menu Items List */}
        {!isLoading && !error && (
          <div className="menu-sections">
            <div className="menu-section">
              <h3 className="category-title text-lg font-bold">{activeCategory}</h3>
              <div className="items-list">
                {currentCategoryItems.map(item => {
                  const qty = cart[item.id] || 0;
                  
                  return (
                    <div key={item.id} className={`menu-item-card ${!item.isAvailable ? 'out-of-stock' : ''}`}>
                      <div className="item-details">
                        <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                          <div className="dot"></div>
                        </div>
                        <h4 className="item-name font-bold text-base">{item.name}</h4>
                        <p className="item-price font-medium">₹{item.price}</p>
                        <p className="item-desc text-xs text-secondary">{item.description}</p>
                      </div>
                      
                      <div className="item-actions">
                        <div className="item-image-placeholder">
                          <ImageWithFallback
                            src={item.image || item.image_url}
                            fallbackEmoji={item.isVeg ? '🥗' : '🍗'}
                            alt={item.name}
                          />
                        </div>
                        
                        {!item.isAvailable ? (
                          <div className="add-btn-container disabled">
                            <span>Out of stock</span>
                          </div>
                        ) : qty === 0 ? (
                          <button 
                            className="add-btn"
                            onClick={() => handleUpdateCart(item.id, 1)}
                          >
                            ADD
                          </button>
                        ) : (
                          <div className={`stepper ${lastUpdatedId === item.id ? 'animate-pop' : ''}`}>
                            <button onClick={() => handleUpdateCart(item.id, qty - 1)}>−</button>
                            <span>{qty}</span>
                            <button onClick={() => handleUpdateCart(item.id, qty + 1)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating View Cart Bar */}
      {totalItems > 0 && (
        <div className="floating-cart-bar" onClick={onViewCart}>
          <div className="cart-summary">
            <span className="cart-items-count font-bold">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="cart-total text-sm">| ₹{totalPrice}</span>
          </div>
          <div className="view-cart-action font-bold">
            View Cart 🛒
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;

