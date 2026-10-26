import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './CartCheckout.css';
import ImageWithFallback from '../components/ImageWithFallback';
import Toast from '../components/Toast';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { PRESET_LOCATIONS, generateRouteWaypoints } from '../services/locationData';

const CartCheckout = ({ 
  restaurant, 
  cart, 
  updateCart, 
  userProfile, 
  onBack, 
  onProceedToPayment 
}) => {
  const [menuItems, setMenuItems] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponAnnouncement, setCouponAnnouncement] = useState('');
  
  // Delivery address & location modal state
  const [activeAddress, setActiveAddress] = useState(userProfile?.address || '');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customAddressInput, setCustomAddressInput] = useState(userProfile?.address || '');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Server-computed quote (Never compute prices locally)
  const [serverQuote, setServerQuote] = useState(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  
  // Order creation state
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [lastUpdatedId, setLastUpdatedId] = useState(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Keep activeAddress in sync with userProfile
  useEffect(() => {
    if (userProfile?.address) {
      setActiveAddress(userProfile.address);
      setCustomAddressInput(userProfile.address);
    }
  }, [userProfile?.address]);

  // Load menu items from API for item details and images
  useEffect(() => {
    if (restaurant?.id) {
      setIsLoadingMenu(true);
      apiService.fetchRestaurantMenu(restaurant.id)
        .then(res => setMenuItems(res.menu || []))
        .catch(err => console.warn('Could not load checkout items:', err.message))
        .finally(() => setIsLoadingMenu(false));
    }
  }, [restaurant?.id]);

  // Cart items display list (strictly items belonging to this restaurant's menu)
  const cartItems = useMemo(() => {
    return Object.keys(cart).map(itemId => {
      const item = menuItems.find(m => m.id === itemId);
      return item ? { ...item, qty: cart[itemId] } : null;
    }).filter(Boolean).filter(item => item.qty > 0);
  }, [cart, menuItems]);

  // Automatically prune any alien items left over from another restaurant
  useEffect(() => {
    if (menuItems.length > 0 && cart) {
      const alienItemIds = Object.keys(cart).filter(id => 
        (cart[id] || 0) > 0 && !menuItems.some(m => m.id === id)
      );
      if (alienItemIds.length > 0) {
        alienItemIds.forEach(id => updateCart(id, 0));
      }
    }
  }, [menuItems, cart, updateCart]);

  // Format cart items for server
  const formattedItems = useMemo(() => {
    if (menuItems.length === 0) return [];
    return cartItems.map(item => ({ menuItemId: item.id, quantity: item.qty }));
  }, [cartItems, menuItems.length]);

  // Resolve delivery coordinates
  const resolveDeliveryCoords = useCallback(() => {
    let lat = userProfile?.coords?.[0];
    let lng = userProfile?.coords?.[1];

    if (lat !== undefined && lng !== undefined && lat !== null && lng !== null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      return { lat: Number(lat), lng: Number(lng) };
    }

    if (activeAddress) {
      const match = activeAddress.match(/\(?(-?\d+\.\d+),\s*(-?\d+\.\d+)\)?/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }

      const matched = PRESET_LOCATIONS.find(p => p.address === activeAddress || (p.name && activeAddress.includes(p.name)));
      if (matched && matched.coords) {
        return { lat: matched.coords[0], lng: matched.coords[1] };
      }
    }

    return { lat: null, lng: null };
  }, [userProfile, activeAddress]);

  // Request order quote from server
  const fetchQuote = useCallback(async (couponToUse = appliedCouponCode) => {
    if (!restaurant?.id || formattedItems.length === 0) {
      setServerQuote(null);
      return;
    }

    const coords = resolveDeliveryCoords();
    setIsQuoting(true);
    setQuoteError(null);
    try {
      const quote = await apiService.fetchOrderQuote({
        restaurantId: restaurant.id,
        items: formattedItems,
        deliveryAddress: activeAddress || '',
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        couponCode: couponToUse || undefined
      });
      setServerQuote(quote);
      setQuoteError(null);
    } catch (err) {
      setServerQuote(null);
      setQuoteError({
        message: err.message || 'Unable to quote order.',
        itemUnavailable: Boolean(err.itemUnavailable),
        itemName: err.itemName || null
      });
    } finally {
      setIsQuoting(false);
    }
  }, [restaurant?.id, activeAddress, formattedItems, appliedCouponCode, resolveDeliveryCoords]);

  // Trigger quote recalculation whenever items or delivery address change
  useEffect(() => {
    fetchQuote(appliedCouponCode);
  }, [fetchQuote, appliedCouponCode]);

  // Apply Coupon via Server Quote
  const handleApplyCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      setCouponAnnouncement('Please enter a coupon code.');
      return;
    }

    setCouponError('');
    setIsQuoting(true);
    const coords = resolveDeliveryCoords();
    try {
      const quote = await apiService.fetchOrderQuote({
        restaurantId: restaurant.id,
        items: formattedItems,
        deliveryAddress: activeAddress || '',
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        couponCode: code
      });
      setServerQuote(quote);
      setAppliedCouponCode(code);
      setCouponError('');
      const msg = `Coupon ${code} applied! ₹${quote.discountAmount} off.`;
      setCouponAnnouncement(msg);
      setToast({ message: msg, type: 'success' });
    } catch (err) {
      const errorMsg = err.message || 'Invalid coupon code.';
      setCouponError(errorMsg);
      setCouponAnnouncement(`Coupon error: ${errorMsg}`);
    } finally {
      setIsQuoting(false);
    }
  };

  // Remove Coupon
  const handleRemoveCoupon = () => {
    setCouponInput('');
    setAppliedCouponCode('');
    setCouponError('');
    setCouponAnnouncement('Coupon removed.');
    fetchQuote('');
    setToast({ message: 'Coupon removed.', type: 'info' });
  };

  const handleUpdateCart = (itemId, newQty) => {
    updateCart(itemId, newQty);
    setLastUpdatedId(itemId);
    setTimeout(() => setLastUpdatedId(null), 200);

    // If all items removed, return to menu with friendly message
    if (newQty <= 0 && cartItems.length <= 1) {
      setToast({ message: 'Cart is empty. Returning to menu...', type: 'info' });
      setTimeout(onBack, 700);
    }
  };

  // Proceed to Payment: Create order via POST /api/orders
  const handleProceedToPayment = async () => {
    if (!serverQuote || quoteError || isCreatingOrder || isQuoting) return;

    const coords = resolveDeliveryCoords();
    setIsCreatingOrder(true);
    try {
      const orderRes = await apiService.createOrder({
        restaurantId: restaurant.id,
        items: formattedItems,
        deliveryAddress: activeAddress || '',
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        couponCode: appliedCouponCode || undefined
      });

      onProceedToPayment({
        orderId: orderRes.orderId,
        orderNumber: orderRes.orderNumber,
        restaurant,
        totalAmount: orderRes.totalAmount,
        itemTotal: orderRes.itemTotal,
        taxAmount: orderRes.taxAmount,
        deliveryFee: orderRes.deliveryFee,
        discountAmount: orderRes.discountAmount,
        items: orderRes.items
      });
    } catch (err) {
      if (err.itemUnavailable) {
        setQuoteError({
          message: err.message || `${err.itemName} is currently out of stock.`,
          itemUnavailable: true,
          itemName: err.itemName
        });
        setToast({
          message: err.message || `${err.itemName} became unavailable.`,
          type: 'error'
        });
      } else {
        setToast({ message: err.message || 'Could not place order.', type: 'error' });
      }
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Delivery Location Change Handlers
  const handleSelectPreset = async (preset) => {
    setCustomAddressInput(preset.address);
    setActiveAddress(preset.address);
    authService.updateDeliveryLocation(preset.address, preset.coords, preset.waypoints);
    setShowLocationModal(false);

    // Check if restaurant delivers to new area
    try {
      const available = await apiService.fetchRestaurants(preset.address);
      const stillDelivers = available.some(r => r.id === restaurant.id);
      if (!stillDelivers) {
        setToast({
          message: `${restaurant.name} does not deliver to ${preset.address}.`,
          type: 'warning'
        });
      }
    } catch {}
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) return;
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = `Current GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        const waypoints = generateRouteWaypoints(latitude, longitude);
        setCustomAddressInput(address);
        setActiveAddress(address);
        authService.updateDeliveryLocation(address, [latitude, longitude], waypoints);
        setIsDetectingGps(false);
        setShowLocationModal(false);
      },
      () => setIsDetectingGps(false),
      { timeout: 7000 }
    );
  };

  const handleSaveCustomAddress = () => {
    if (!customAddressInput.trim()) return;
    const matched = PRESET_LOCATIONS.find(p => p.address === customAddressInput.trim());
    const coords = matched?.coords || PRESET_LOCATIONS[0].coords;
    const waypoints = matched?.waypoints || PRESET_LOCATIONS[0].waypoints;
    setActiveAddress(customAddressInput.trim());
    authService.updateDeliveryLocation(customAddressInput.trim(), coords, waypoints);
    setShowLocationModal(false);
  };

  // Loading skeleton while fetching menu data
  if (isLoadingMenu) {
    return (
      <div className="cart-screen">
        <div className="cart-topbar">
          <button type="button" className="circbtn" onClick={onBack}>←</button>
          <div className="cart-title-col">
            <b>Review order</b>
            <span>{restaurant?.name || 'Your Cart'}</span>
          </div>
        </div>
        <div className="cart-content-scroll">
          <div className="cardw">
            <div className="skeleton" style={{ height: '60px', borderRadius: '16px' }} />
          </div>
          <div className="cardw">
            <div className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="cart-screen empty">
        <div className="cart-topbar">
          <button type="button" className="circbtn" onClick={onBack}>←</button>
          <div className="cart-title-col">
            <b>Review order</b>
            <span>Empty cart</span>
          </div>
        </div>
        <div className="cart-empty-state">
          <div className="empty-cart-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any dishes yet.</p>
          <button type="button" className="bigbtn" onClick={onBack}>
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  const totalItemCount = cartItems.reduce((acc, it) => acc + it.qty, 0);

  return (
    <div className="cart-screen">
      {/* Screen Reader Aria-Live Announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {couponAnnouncement}
      </div>

      {/* 1. Top Bar */}
      <div className="cart-topbar">
        <button 
          type="button" 
          className="circbtn" 
          onClick={onBack}
          aria-label="Back to menu"
        >
          ←
        </button>
        <div className="cart-title-col">
          <b>Review order</b>
          <span>{restaurant?.name} · {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
        </div>
      </div>

      {/* 2. Three-Step Tracker (Step 1 Cart is active, Steps 2 & 3 not clickable) */}
      <div className="cart-steps" role="navigation" aria-label="Checkout Progress">
        <div className="step-item on" aria-current="step">
          <i>1</i>
          <span>Cart</span>
        </div>
        <div className="step-line" />
        <div className="step-item" aria-disabled="true">
          <i>2</i>
          <span>Payment</span>
        </div>
        <div className="step-line" />
        <div className="step-item" aria-disabled="true">
          <i>3</i>
          <span>Track</span>
        </div>
      </div>

      <div className="cart-content-scroll">
        {/* Demo Disclaimer Banner */}
        <div className="demo-disclaimer-banner" role="note">
          Demo prototype: menus and prices are sample data and no real order is placed.
        </div>

        {/* Out-of-Stock or Delivery Area Warning Banner */}
        {quoteError && (
          <div className="quote-error-banner" role="alert">
            <div className="quote-error-header">
              <span>⚠️</span>
              <span>{quoteError.message}</span>
            </div>
            {quoteError.itemUnavailable && quoteError.itemName ? (
              <button 
                type="button"
                className="btn-retry" 
                style={{ fontSize: '11.5px', padding: '6px 12px' }}
                onClick={() => {
                  const matchingItem = menuItems.find(m => m.name === quoteError.itemName);
                  if (matchingItem) {
                    updateCart(matchingItem.id, 0);
                  }
                  setQuoteError(null);
                }}
              >
                Remove {quoteError.itemName} from Cart
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-retry"
                style={{ fontSize: '11.5px', padding: '6px 12px' }}
                onClick={onBack}
              >
                Return to Restaurant
              </button>
            )}
          </div>
        )}

        {/* 3. Delivery Card with Static Inline SVG Mini-Map */}
        <div className="cardw">
          <div className="delivery-card-inner">
            <div className="minimap" aria-hidden="true">
              <svg width="54" height="54" viewBox="0 0 54 54">
                <rect width="54" height="54" fill="var(--map-land, #F3EEE4)" />
                <rect x="0" y="34" width="54" height="20" fill="var(--map-water, #CFE3F3)" />
                <g stroke="var(--map-roads, #FFFFFF)" strokeWidth="5">
                  <path d="M0 18 H54" />
                  <path d="M22 0 V54" />
                </g>
                <circle cx="27" cy="22" r="9" fill="rgba(255,107,44,.25)" />
                <circle cx="27" cy="22" r="5" fill="#FF6B2C" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>
            <div className="delivery-text-col">
              <small>Deliver to</small>
              <b>{activeAddress.split(',')[0] || 'Delivery Location'}</b>
              <span>{activeAddress.split(',').slice(1).join(',').trim() || 'Tap change to switch area'}</span>
            </div>
            <button 
              type="button" 
              className="lnk-change-btn" 
              onClick={() => setShowLocationModal(true)}
              aria-label="Change delivery location"
            >
              Change
            </button>
          </div>
        </div>

        {/* 4. Items Card */}
        <div className="cardw">
          {cartItems.map((item) => {
            const isOutOfStock = quoteError?.itemUnavailable && quoteError?.itemName === item.name;

            return (
              <div key={item.id} className={`cart-dish-row ${isOutOfStock ? 'dish-unavailable' : ''}`}>
                <div className="plate cart-dish-plate">
                  <ImageWithFallback 
                    src={item.image || item.image_url} 
                    fallbackEmoji={item.isVeg ? '🥗' : '🍗'} 
                    alt={item.name}
                    isPlate={true}
                  />
                </div>
                <div className="cart-dish-info">
                  <b className="cart-dish-name">{item.name}</b>
                  <span className="cart-dish-price">₹{item.price} each</span>
                  {isOutOfStock && <span className="item-out-of-stock-badge">Out of Stock</span>}
                </div>
                <div className={`dish-qty-stepper light-stepper ${lastUpdatedId === item.id ? 'animate-pop' : ''}`}>
                  <button 
                    type="button" 
                    className="qty-btn"
                    onClick={() => handleUpdateCart(item.id, item.qty - 1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <span className="qty-number">{item.qty}</span>
                  <button 
                    type="button" 
                    className="qty-btn"
                    onClick={() => handleUpdateCart(item.id, item.qty + 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}

          <button type="button" className="btn-add-more" onClick={onBack}>
            + Add more items
          </button>
        </div>

        {/* 5. Ticket-Shaped Coupon Card (Three states: input with Apply, applied, and error) */}
        <div className={`ticket-coupon-card ${appliedCouponCode ? 'applied' : couponError ? 'has-error' : ''}`}>
          <span className="coupon-ticket-icon">🏷️</span>

          {appliedCouponCode ? (
            /* Applied State */
            <div className="ticket-applied-info">
              <b>{appliedCouponCode}</b>
              <span>₹{serverQuote?.discountAmount || 0} off applied</span>
            </div>
          ) : (
            /* Input State / Error State */
            <form className="ticket-form" onSubmit={handleApplyCoupon}>
              <input 
                type="text" 
                className="ticket-code-input"
                placeholder="Enter coupon (e.g. WELCOME50)"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  if (couponError) setCouponError('');
                }}
                disabled={isQuoting}
                aria-label="Coupon code"
              />
              <button 
                type="submit" 
                className="ticket-apply-btn"
                disabled={isQuoting || !couponInput.trim()}
              >
                {isQuoting ? '...' : 'Apply'}
              </button>
            </form>
          )}

          {appliedCouponCode && (
            <button 
              type="button" 
              className="ticket-remove-lnk" 
              onClick={handleRemoveCoupon}
              aria-label="Remove coupon"
            >
              Remove
            </button>
          )}
        </div>

        {/* Inline Coupon Error Notice */}
        {couponError && (
          <div className="ticket-error-notice" role="alert">
            <span>✕ {couponError}</span>
          </div>
        )}

        {/* 6. Receipt-Style Bill (Numbers exclusively from server quote) */}
        <div className="cardw receipt-bill">
          <div className="receipt-row">
            <span>Item total</span>
            {isQuoting ? (
              <div className="skeleton" style={{ width: '45px', height: '14px' }} />
            ) : (
              <span>₹{serverQuote?.itemTotal ?? '—'}</span>
            )}
          </div>

          <div className="receipt-row">
            <span>GST (5%)</span>
            {isQuoting ? (
              <div className="skeleton" style={{ width: '38px', height: '14px' }} />
            ) : (
              <span>₹{serverQuote?.taxAmount ?? '—'}</span>
            )}
          </div>

          <div className="receipt-row">
            <span>Delivery fee</span>
            {isQuoting ? (
              <div className="skeleton" style={{ width: '40px', height: '14px' }} />
            ) : (
              <span>₹{serverQuote?.deliveryFee ?? '—'}</span>
            )}
          </div>

          {serverQuote?.discountAmount > 0 && (
            <div className="receipt-row discount-green">
              <span>Coupon discount ({appliedCouponCode})</span>
              <span>−₹{serverQuote.discountAmount}</span>
            </div>
          )}

          <div className="receipt-separator" />

          <div className="receipt-total-row">
            <span>To pay</span>
            {isQuoting ? (
              <div className="skeleton" style={{ width: '60px', height: '20px' }} />
            ) : (
              <b>₹{serverQuote?.totalAmount ?? '—'}</b>
            )}
          </div>
        </div>
      </div>

      {/* 7. Sticky Bottom Bar */}
      <div className="cart-bottombar">
        <div className="bottombar-total-col">
          <small>Total · {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</small>
          <b>{serverQuote ? `₹${serverQuote.totalAmount}` : '—'}</b>
        </div>
        <button 
          type="button" 
          className="bigbtn continue-btn"
          onClick={handleProceedToPayment}
          disabled={!serverQuote || isQuoting || isCreatingOrder || Boolean(quoteError)}
        >
          {isCreatingOrder ? 'Securing order...' : isQuoting ? 'Quoting...' : 'Continue to pay →'}
        </button>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal-card slide-in-top" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title font-bold">Change Delivery Location 📍</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowLocationModal(false)}>✕</button>
            </div>

            <button
              type="button"
              className="btn-gps-detect"
              onClick={handleDetectGps}
              disabled={isDetectingGps}
            >
              {isDetectingGps ? 'Detecting GPS...' : '📡 Use Current Location (GPS)'}
            </button>

            <div className="preset-locations-grid">
              {PRESET_LOCATIONS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`preset-chip ${activeAddress === p.address ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(p)}
                >
                  <span className="font-semibold text-xs">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="text-xs font-semibold">Custom Address</label>
              <input
                type="text"
                className="form-input"
                value={customAddressInput}
                onChange={e => setCustomAddressInput(e.target.value)}
              />
            </div>

            <button type="button" className="bigbtn w-full" onClick={handleSaveCustomAddress}>
              Save & Update Location
            </button>
          </div>
        </div>
      )}

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />
    </div>
  );
};

export default CartCheckout;
