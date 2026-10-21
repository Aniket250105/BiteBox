import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './CartCheckout.css';
import Toast from '../components/Toast';
import { apiService } from '../services/apiService';
import { PRESET_LOCATIONS } from '../services/locationData';

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
  
  // Server-computed quote (The UI never calculates its own totals)
  const [serverQuote, setServerQuote] = useState(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  
  // Order creation state
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [lastUpdatedId, setLastUpdatedId] = useState(null);

  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

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

  // Format cart items for server (strictly this restaurant's valid items)
  const formattedItems = useMemo(() => {
    if (menuItems.length === 0) {
      return [];
    }
    return cartItems.map(item => ({ menuItemId: item.id, quantity: item.qty }));
  }, [cartItems, menuItems.length]);

  // Resolve delivery coordinates from userProfile coords, address string, or preset locations
  const resolveDeliveryCoords = useCallback(() => {
    let lat = userProfile?.coords?.[0];
    let lng = userProfile?.coords?.[1];

    if (lat !== undefined && lng !== undefined && lat !== null && lng !== null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      return { lat: Number(lat), lng: Number(lng) };
    }

    // Try extracting from address string like "Current GPS (13.0307, 77.4923)"
    if (userProfile?.address) {
      const match = userProfile.address.match(/\(?(-?\d+\.\d+),\s*(-?\d+\.\d+)\)?/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }

      // Check preset locations
      const matched = PRESET_LOCATIONS.find(p => p.address === userProfile.address || (p.name && userProfile.address.includes(p.name)));
      if (matched && matched.coords) {
        return { lat: matched.coords[0], lng: matched.coords[1] };
      }
    }

    return { lat: null, lng: null };
  }, [userProfile]);

  // Request order quote from server (database-backed calculations)
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
        deliveryAddress: userProfile?.address || '',
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        couponCode: couponToUse || undefined
      });
      setServerQuote(quote);
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
  }, [restaurant?.id, userProfile?.address, formattedItems, appliedCouponCode, resolveDeliveryCoords]);

  // Trigger quote recalculation whenever items or delivery address change
  useEffect(() => {
    fetchQuote(appliedCouponCode);
  }, [fetchQuote, appliedCouponCode]);

  // Apply Coupon via Server Quote
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setToast({ message: 'Please enter a coupon code.', type: 'error' });
      return;
    }

    const coords = resolveDeliveryCoords();
    setIsQuoting(true);
    try {
      const quote = await apiService.fetchOrderQuote({
        restaurantId: restaurant.id,
        items: formattedItems,
        deliveryAddress: userProfile?.address || '',
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        couponCode: code
      });
      setServerQuote(quote);
      setAppliedCouponCode(code);
      setToast({ 
        message: `Coupon ${code} applied! Saved ₹${quote.discountAmount}.`, 
        type: 'success' 
      });
    } catch (err) {
      setToast({ message: err.message || 'Invalid coupon code.', type: 'error' });
    } finally {
      setIsQuoting(false);
    }
  };

  // Remove Coupon
  const handleRemoveCoupon = () => {
    setCouponInput('');
    setAppliedCouponCode('');
    fetchQuote('');
    setToast({ message: 'Coupon removed.', type: 'success' });
  };

  const handleUpdateCart = (itemId, newQty) => {
    updateCart(itemId, newQty);
    setLastUpdatedId(itemId);
    setTimeout(() => setLastUpdatedId(null), 200);
  };

  // Proceed to Pay: Create order in database via POST /api/orders (JWT auth)
  const handleProceedToPayment = async () => {
    if (!serverQuote || quoteError || isCreatingOrder) return;

    const coords = resolveDeliveryCoords();
    setIsCreatingOrder(true);
    try {
      const orderRes = await apiService.createOrder({
        restaurantId: restaurant.id,
        items: formattedItems,
        deliveryAddress: userProfile?.address || '',
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

  // Loading menu state while fetching details
  if (isLoadingMenu) {
    return (
      <div className="cart-checkout">
        <div className="header checkout-header">
          <button className="back-button" onClick={onBack}>←</button>
          <div>
            <h2 className="text-lg font-bold">{restaurant?.name || 'Your Cart'}</h2>
            <p className="text-xs text-secondary">Loading order details...</p>
          </div>
        </div>
        <div className="screen-content" style={{ padding: '24px' }}>
          <div className="skeleton" style={{ height: '70px', borderRadius: '12px', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  // If cart is empty, show empty state
  if (cartItems.length === 0) {
    return (
      <div className="cart-checkout empty-state">
        <div className="header">
          <button className="back-button" onClick={onBack}>←</button>
          <h2>Cart</h2>
        </div>
        <div className="empty-cart-message">
          <div className="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p className="text-secondary">Looks like you haven't added anything yet.</p>
          <button className="btn btn-primary" onClick={onBack}>Browse Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-checkout">
      <div className="header checkout-header">
        <button className="back-button" onClick={onBack}>←</button>
        <div>
          <h2 className="text-lg font-bold">{restaurant?.name || 'Your Cart'}</h2>
          <p className="text-xs text-secondary">
            Deliver to: {userProfile?.address || 'Current Address'}
          </p>
        </div>
      </div>

      <div className="screen-content">
        {/* Demo Disclaimer Banner */}
        <div className="demo-disclaimer-banner" role="note">
          Demo prototype: menus and prices are sample data and no real order is placed.
        </div>

        {/* Out-of-stock or Delivery Area Warning Banner */}
        {quoteError && (
          <div className="quote-error-banner">
            <div className="quote-error-header">
              <span>⚠️</span>
              <span>{quoteError.message}</span>
            </div>
            {quoteError.message.includes('does not belong to') ? (
              <button 
                className="quote-error-action-btn"
                onClick={() => {
                  Object.keys(cart).forEach(id => {
                    if (!menuItems.some(m => m.id === id)) {
                      updateCart(id, 0);
                    }
                  });
                  setQuoteError(null);
                }}
              >
                Clear Other Restaurant Items
              </button>
            ) : quoteError.itemUnavailable && quoteError.itemName ? (
              <button 
                className="quote-error-action-btn"
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
              <button className="quote-error-action-btn" onClick={onBack}>
                Return to Restaurant
              </button>
            )}
          </div>
        )}

        {/* Added Items Card */}
        <div className="checkout-card items-list">
          <h3 className="section-title text-base font-bold">Items Added</h3>
          
          {cartItems.map(item => {
            const isOutOfStock = quoteError?.itemUnavailable && quoteError?.itemName === item.name;

            return (
              <div key={item.id} className={`cart-item ${isOutOfStock ? 'item-unavailable' : ''}`}>
                <div className="cart-item-info">
                  <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                    <div className="dot"></div>
                  </div>
                  <div>
                    <h4 className="item-name font-medium">{item.name}</h4>
                    <p className="item-price text-sm text-secondary">₹{item.price}</p>
                    {isOutOfStock && (
                      <span className="item-out-of-stock-badge">Out of Stock</span>
                    )}
                  </div>
                </div>
                
                <div className="cart-item-actions">
                  <div className={`stepper cart-stepper ${lastUpdatedId === item.id ? 'animate-pop' : ''}`}>
                    <button onClick={() => handleUpdateCart(item.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => handleUpdateCart(item.id, item.qty + 1)}>+</button>
                  </div>
                  <div className="cart-item-total font-semibold">
                    ₹{item.price * item.qty}
                  </div>
                </div>
              </div>
            );
          })}
          
          <button className="add-more-btn" onClick={onBack}>
            + Add more items
          </button>
        </div>

        {/* Coupon Input Section */}
        <div className="checkout-card coupon-section">
          <div className="coupon-input-group">
            <span className="coupon-icon">🎟️</span>
            <input 
              type="text" 
              placeholder="Enter Coupon Code (e.g. WELCOME50, BITEBOX10)" 
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              disabled={Boolean(appliedCouponCode)}
            />
            {!appliedCouponCode ? (
              <button 
                className="apply-btn" 
                onClick={handleApplyCoupon}
                disabled={isQuoting}
              >
                {isQuoting ? '...' : 'APPLY'}
              </button>
            ) : (
              <button className="remove-btn text-primary font-bold" onClick={handleRemoveCoupon}>
                REMOVE
              </button>
            )}
          </div>
        </div>

        {/* Bill Details Section (Exclusively rendered from server quote) */}
        <div className="checkout-card bill-details" id="bill-details">
          <h3 className="section-title text-base font-bold">
            Bill Details {isQuoting && <span className="text-xs text-secondary font-normal">(Updating...)</span>}
          </h3>
          
          <div className="bill-row">
            <span className="text-secondary">Item Total</span>
            <span>{serverQuote ? `₹${serverQuote.itemTotal}` : '—'}</span>
          </div>
          
          <div className="bill-row">
            <span className="text-secondary">Delivery Fee</span>
            <span>{serverQuote ? `₹${serverQuote.deliveryFee}` : '—'}</span>
          </div>
          
          <div className="bill-row">
            <span className="text-secondary">Taxes & Charges (5%)</span>
            <span>{serverQuote ? `₹${serverQuote.taxAmount}` : '—'}</span>
          </div>
          
          {serverQuote?.discountAmount > 0 && (
            <div className="bill-row discount-row text-success font-semibold">
              <span>Item Discount ({appliedCouponCode})</span>
              <span>- ₹{serverQuote.discountAmount}</span>
            </div>
          )}
          
          <hr className="divider" />
          
          <div className="bill-row grand-total font-bold text-lg">
            <span>To Pay</span>
            <span>{serverQuote ? `₹${serverQuote.totalAmount}` : '—'}</span>
          </div>
        </div>
      </div>

      {/* Checkout Footer */}
      <div className="checkout-footer">
        <div className="pay-amount-summary">
          <span className="font-bold text-lg">{serverQuote ? `₹${serverQuote.totalAmount}` : '—'}</span>
          <a href="#bill-details" className="text-xs text-primary font-semibold">VIEW DETAILED BILL</a>
        </div>
        <button 
          className="btn btn-primary proceed-btn" 
          onClick={handleProceedToPayment}
          disabled={!serverQuote || Boolean(quoteError) || isQuoting || isCreatingOrder}
        >
          {isCreatingOrder ? 'Creating Order...' : isQuoting ? 'Quoting...' : 'Proceed to Pay'}
        </button>
      </div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />
    </div>
  );
};

export default CartCheckout;
