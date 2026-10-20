import React, { useState } from 'react';
import './index.css';
import './animations.css';
import RestaurantListing from './screens/RestaurantListing';
import MenuPage from './screens/MenuPage';
import CartCheckout from './screens/CartCheckout';
import PaymentScreen from './screens/PaymentScreen';
import OrderTracking from './screens/OrderTracking';
import RestaurantPortal from './screens/RestaurantPortal';
import Toast from './components/Toast';
import { authService } from './services/authService';
import { apiService } from './services/apiService';

function App() {
  const [currentScreen, setCurrentScreen] = useState(() => {
    try {
      const savedScreen = sessionStorage.getItem('bitebox_active_screen');
      const savedOrder = sessionStorage.getItem('bitebox_active_order');
      if ((savedScreen === 'payment' || savedScreen === 'tracking') && savedOrder) {
        return savedScreen;
      }
    } catch {}
    return 'listing';
  });

  const [selectedRestaurant, setSelectedRestaurant] = useState(() => {
    try {
      const savedRest = sessionStorage.getItem('bitebox_active_restaurant');
      if (savedRest) return JSON.parse(savedRest);
    } catch {}
    return null;
  });
  
  // Cart state: { itemId: quantity } and owning restaurant
  const [cart, setCart] = useState({});
  const [cartRestaurant, setCartRestaurant] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bitebox_cart_restaurant');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [orderDetails, setOrderDetails] = useState(() => {
    try {
      const savedOrder = sessionStorage.getItem('bitebox_active_order');
      if (savedOrder) return JSON.parse(savedOrder);
    } catch {}
    return null;
  });

  const [sessionToast, setSessionToast] = useState({ message: '', type: '' });
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState('');

  // User profile state initialized from localStorage session
  const [userProfile, setUserProfile] = useState(() => {
    return authService.getCurrentSession() || { name: '', address: '' };
  });

  const isRestaurantRoute = window.location.pathname.startsWith('/restaurant') || window.location.search.includes('view=restaurant');

  // Listen for session expiry event dispatched from anywhere
  React.useEffect(() => {
    const handleExpired = () => {
      setSessionToast({ message: 'Session expired. Please log in again.', type: 'error' });
      setSessionExpiredNotice('Session expired. Please log in again.');
      setUserProfile({ name: '', address: '' });
      setCurrentScreen('listing');
      try {
        sessionStorage.removeItem('bitebox_active_screen');
        sessionStorage.removeItem('bitebox_active_order');
        sessionStorage.removeItem('bitebox_active_restaurant');
      } catch {}
    };

    window.addEventListener('bitebox:session-expired', handleExpired);
    return () => window.removeEventListener('bitebox:session-expired', handleExpired);
  }, []);

  // Verify token with backend on mount
  React.useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      setUserProfile({ name: '', address: '' });
      return;
    }

    authService.verifySession().then((res) => {
      if (res?.expired) {
        setSessionToast({ message: 'Session expired. Please log in again.', type: 'error' });
        setSessionExpiredNotice('Session expired. Please log in again.');
        setUserProfile({ name: '', address: '' });
        setCurrentScreen('listing');
        try {
          sessionStorage.removeItem('bitebox_active_screen');
          sessionStorage.removeItem('bitebox_active_order');
          sessionStorage.removeItem('bitebox_active_restaurant');
        } catch {}
      } else if (res?.valid && res.user) {
        setUserProfile(res.user);
      } else if (res?.unreachable) {
        setSessionToast({ message: 'Backend server appears unreachable (port 3001).', type: 'error' });
      }
    });
  }, []);

  // Resume active order on mount after refresh
  React.useEffect(() => {
    const activeScreen = sessionStorage.getItem('bitebox_active_screen');
    const activeOrderRaw = sessionStorage.getItem('bitebox_active_order');
    if ((activeScreen === 'payment' || activeScreen === 'tracking') && activeOrderRaw) {
      try {
        const parsed = JSON.parse(activeOrderRaw);
        const orderId = parsed?.orderId || parsed?.id;
        if (orderId) {
          apiService.fetchOrderById(orderId).then(order => {
            if (order) {
              const isPaid = order.status && order.status !== 'PLACED';
              if (activeScreen === 'payment' && isPaid) {
                setCurrentScreen('tracking');
                sessionStorage.setItem('bitebox_active_screen', 'tracking');
              }
              if (order.restaurant && !selectedRestaurant) {
                setSelectedRestaurant(order.restaurant);
                sessionStorage.setItem('bitebox_active_restaurant', JSON.stringify(order.restaurant));
              }
            }
          }).catch(err => {
            console.warn('Failed to refresh active order state:', err.message);
          });
        }
      } catch (e) {
        console.warn('Invalid active order session:', e);
      }
    }
  }, []);

  // Handle delivery location change & warn/clear cart if restaurant doesn't deliver to new area
  const handleDeliveryLocationChange = async (newProfile) => {
    setUserProfile(newProfile);

    const hasCartItems = Object.keys(cart).length > 0;
    if (hasCartItems && selectedRestaurant) {
      try {
        const availableRestaurants = await apiService.fetchRestaurants(newProfile.address);
        const stillDelivers = availableRestaurants.some(r => r.id === selectedRestaurant.id);

        if (!stillDelivers) {
          const restaurantName = selectedRestaurant.name;
          setCart({});
          setCartRestaurant(null);
          setSelectedRestaurant(null);
          try { sessionStorage.removeItem('bitebox_cart_restaurant'); } catch {}
          setSessionToast({
            message: `Your cart from ${restaurantName} was cleared because they do not deliver to ${newProfile.address}.`,
            type: 'warning'
          });
          return;
        }
      } catch (err) {
        console.warn('Could not verify restaurant delivery area:', err.message);
      }
    }

    setSessionToast({
      message: `Delivery location set to ${newProfile.address}.`,
      type: 'success'
    });
  };

  const handleLogout = () => {
    authService.logout();
    setSessionExpiredNotice('');
    setUserProfile({ name: '', address: '' });
    setCart({});
    setCartRestaurant(null);
    setSelectedRestaurant(null);
    setOrderDetails(null);
    setCurrentScreen('listing');
    try {
      sessionStorage.removeItem('bitebox_active_screen');
      sessionStorage.removeItem('bitebox_active_order');
      sessionStorage.removeItem('bitebox_active_restaurant');
      sessionStorage.removeItem('bitebox_cart_restaurant');
    } catch {}
  };

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setCurrentScreen('menu'); 
  };

  const updateCart = (itemId, quantity, itemRestaurant) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (quantity <= 0) {
        delete newCart[itemId];
      } else {
        newCart[itemId] = quantity;
      }
      if (Object.keys(newCart).length === 0) {
        setCartRestaurant(null);
        try { sessionStorage.removeItem('bitebox_cart_restaurant'); } catch {}
      } else {
        const targetRest = itemRestaurant || selectedRestaurant;
        if (targetRest) {
          setCartRestaurant(targetRest);
          try { sessionStorage.setItem('bitebox_cart_restaurant', JSON.stringify(targetRest)); } catch {}
        }
      }
      return newCart;
    });
  };

  const handleReplaceCart = (itemId, quantity, newRestaurant) => {
    setCart({ [itemId]: quantity });
    setCartRestaurant(newRestaurant);
    try { sessionStorage.setItem('bitebox_cart_restaurant', JSON.stringify(newRestaurant)); } catch {}
  };

  const handleBackToListing = () => {
    setCurrentScreen('listing');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleBackToCheckout = () => {
    try {
      sessionStorage.removeItem('bitebox_active_screen');
    } catch {}
    setCurrentScreen('checkout');
  };

  const goToCheckout = () => {
    if (cartRestaurant && selectedRestaurant?.id !== cartRestaurant.id) {
      setSelectedRestaurant(cartRestaurant);
    }
    setCurrentScreen('checkout');
  };

  const proceedToPayment = (details) => {
    setOrderDetails(details);
    setCurrentScreen('payment');
    try {
      sessionStorage.setItem('bitebox_active_screen', 'payment');
      sessionStorage.setItem('bitebox_active_order', JSON.stringify(details));
      if (details.restaurant || selectedRestaurant) {
        sessionStorage.setItem('bitebox_active_restaurant', JSON.stringify(details.restaurant || selectedRestaurant));
      }
    } catch {}
  };

  const handlePaymentSuccess = () => {
    setCart({});
    setCartRestaurant(null);
    try { sessionStorage.removeItem('bitebox_cart_restaurant'); } catch {}
    setCurrentScreen('tracking');
    try {
      sessionStorage.setItem('bitebox_active_screen', 'tracking');
    } catch {}
  };

  const handleReturnToCartFromPayment = (unavailableItemName) => {
    if (unavailableItemName) {
      setSessionToast({
        message: `${unavailableItemName} is out of stock. Returning to cart to pick another item.`,
        type: 'error'
      });
    }
    try {
      sessionStorage.removeItem('bitebox_active_screen');
    } catch {}
    setCurrentScreen('checkout');
  };

  if (isRestaurantRoute) {
    return <RestaurantPortal />;
  }

  return (
    <div className="app-container">
      <Toast 
        message={sessionToast.message} 
        type={sessionToast.type} 
        onClose={() => setSessionToast({ message: '', type: '' })} 
      />
      <div className="screen-transition" key={currentScreen}>
        {currentScreen === 'listing' && (
          <RestaurantListing 
            onSelectRestaurant={handleSelectRestaurant}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onDeliveryLocationChange={handleDeliveryLocationChange}
            onLogout={handleLogout}
            sessionExpiredNotice={sessionExpiredNotice}
            onClearExpiredNotice={() => setSessionExpiredNotice('')}
          />
        )}
        
        {currentScreen === 'menu' && (
          <MenuPage 
            restaurant={selectedRestaurant} 
            onBack={handleBackToListing}
            cart={cart}
            updateCart={updateCart}
            onViewCart={goToCheckout}
            cartRestaurant={cartRestaurant}
            onReplaceCart={handleReplaceCart}
          />
        )}

        {currentScreen === 'checkout' && (
          <CartCheckout
            restaurant={selectedRestaurant}
            cart={cart}
            updateCart={updateCart}
            userProfile={userProfile}
            onBack={handleBackToMenu}
            onProceedToPayment={proceedToPayment}
          />
        )}

        {currentScreen === 'payment' && (
          <PaymentScreen
            orderDetails={orderDetails}
            onBack={handleBackToCheckout}
            onReturnToCart={handleReturnToCartFromPayment}
            onSuccess={handlePaymentSuccess}
          />
        )}
        
        {currentScreen === 'tracking' && (
          <OrderTracking 
            restaurant={selectedRestaurant} 
            orderDetails={orderDetails}
            userProfile={userProfile}
            onHome={() => {
              setCurrentScreen('listing');
              setSelectedRestaurant(null);
              setCart({});
              setCartRestaurant(null);
              setOrderDetails(null);
              try {
                sessionStorage.removeItem('bitebox_active_screen');
                sessionStorage.removeItem('bitebox_active_order');
                sessionStorage.removeItem('bitebox_active_restaurant');
                sessionStorage.removeItem('bitebox_cart_restaurant');
              } catch {}
            }} 
          />
        )}
      </div>
    </div>
  );
}

export default App;
