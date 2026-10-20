import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './CartCheckout.css';
import Toast from '../components/Toast';
import { apiService } from '../services/apiService';

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

  // Load menu items from API for item details and images
  useEffect(() => {
    if (restaurant?.id) {
      apiService.fetchRestaurantMenu(restaurant.id)
        .then(res => setMenuItems(res.menu || []))
        .catch(err => console.warn('Could not load checkout items:', err.message));
    }
  }, [restaurant?.id]);

  // Format cart items for server
  const formattedItems = useMemo(() => {
    return Object.keys(cart)
      .filter(id => (cart[id] || 0) > 0)
      .map(id => ({ menuItemId: id, quantity: cart[id] }));
  }, [cart]);

  // Request order quote from server (database-backed calculations)
  const fetchQuote = useCallback(async (couponToUse = appliedCouponCode) => {
    if (!restaurant?.id || formattedItems.length === 0) {
      setServerQuote(null);
      return;
    }

    setIsQuoting(true);
    setQuoteError(null);
    try {
      const quote = await apiService.fetchOrderQuote({
        restaurantId: restaurant.id,
        items: formattedItems,
        deliveryAddress: userProfile?.address || '',
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
  }, [restaurant?.id, userProfile?.address, formattedItems, appliedCouponCode]);

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

    setIsQuoting(true);
    try {
      const quote = await apiService.fetchOrderQuote({
        restaurantId: restaurant.id,
        items: formattedItems,
        deliveryAddress: userProfile?.address || '',
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

    setIsCreatingOrder(true);
    try {
      const orderRes = await apiService.createOrder({
        restaurantId: restaurant.id,
        items: formattedItems,
        deliveryAddress: userProfile?.address || '',
        deliveryLat: userProfile?.coords?.[0] || null,
        deliveryLng: userProfile?.coords?.[1] || null,
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

  // Cart items display list
  const cartItems = Object.keys(cart).map(itemId => {
    const item = menuItems.find(m => m.id === itemId);
    return item ? { ...item, qty: cart[itemId] } : null;
  }).filter(Boolean).filter(item => item.qty > 0);

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
            {quoteError.itemUnavailable && quoteError.itemName && (
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
            )}
            {!quoteError.itemUnavailable && (
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
