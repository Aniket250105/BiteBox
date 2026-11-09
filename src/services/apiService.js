// BiteBox API Service for Restaurants, Menus, and Coupons

export const API_BASE = (import.meta.env?.VITE_API_BASE ?? '/api').replace(/\/+$/, '');

function handleNetworkError(err) {
  const msg = (err?.message || '').toLowerCase();
  if (
    err?.name === 'TypeError' ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('failed') ||
    msg.includes('econnrefused')
  ) {
    throw new Error('Unable to connect to the BiteBox server. Please ensure the backend is running.');
  }
  throw err;
}

export const apiService = {
  // Check backend health for demo mode and connectivity
  async fetchHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) return { demoMode: true };
      return await res.json();
    } catch {
      return { demoMode: true };
    }
  },
  // Fetch restaurants (filtered by area if provided)
  async fetchRestaurants(area = '') {
    try {
      const url = area 
        ? `${API_BASE}/restaurants?area=${encodeURIComponent(area)}`
        : `${API_BASE}/restaurants`;

      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load restaurants.');
      }

      const data = await res.json();
      return data.restaurants || [];
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Fetch restaurant menu by restaurant ID
  async fetchRestaurantMenu(restaurantId) {
    try {
      const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/menu`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load menu items.');
      }

      const data = await res.json();
      return {
        restaurant: data.restaurant,
        menu: data.menu || []
      };
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Validate coupon server-side
  async validateCoupon(code, orderAmount) {
    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid coupon code.');
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Fetch nearby restaurants (within 3 km radius) using OpenStreetMap / Cache
  async fetchNearbyRestaurants({ lat, lng, radiusKm = 3 }) {
    try {
      const token = localStorage.getItem('bitebox_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/restaurants/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`, {
        headers
      });

      if (!res.ok) {
        if (res.status === 429) {
          const err = new Error("You're searching very quickly! Rate limit reached. Retrying automatically in a few seconds...");
          err.status = 429;
          err.isRateLimited = true;
          throw err;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load nearby restaurants.');
      }

      return await res.json();
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Compute order quote server-side from database prices
  async fetchOrderQuote({ restaurantId, items, deliveryAddress, deliveryLat, deliveryLng, couponCode }) {
    try {
      const token = localStorage.getItem('bitebox_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/orders/quote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ restaurantId, items, deliveryAddress, deliveryLat, deliveryLng, couponCode })
      });

      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Failed to calculate order quote.');
        err.itemUnavailable = data.itemUnavailable || false;
        err.itemName = data.itemName || null;
        err.statusCode = res.status;
        throw err;
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Create order (Customer taken from JWT)
  async createOrder({ restaurantId, items, deliveryAddress, deliveryLat, deliveryLng, couponCode }) {
    try {
      const token = localStorage.getItem('bitebox_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          restaurantId,
          items,
          deliveryAddress,
          deliveryLat,
          deliveryLng,
          couponCode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Failed to create order.');
        err.itemUnavailable = data.itemUnavailable || false;
        err.itemName = data.itemName || null;
        err.statusCode = res.status;
        throw err;
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Process payment (Atomically deducts stock, moves order to 'paid, awaiting restaurant decision')
  async processPayment({ orderId, paymentMethod, forceFailure }) {
    try {
      const token = localStorage.getItem('bitebox_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/payments/process`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId,
          paymentMethod,
          forceFailure
        })
      });

      const data = await res.json();
      if (!res.ok) {
        // May be payment failure or out-of-stock error
        const err = new Error(data.error || 'Payment failed.');
        err.itemUnavailable = data.itemUnavailable || false;
        err.itemName = data.itemName || null;
        err.statusCode = res.status;
        err.paymentData = data;
        throw err;
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Demo: Toggle item stock (Demo mode only)
  async toggleDemoStock(menuItemId, isAvailable) {
    try {
      const res = await fetch(`${API_BASE}/demo/toggle-item-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, isAvailable })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle item stock.');
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Demo: Reset demo stock state
  async resetDemoStock() {
    try {
      const res = await fetch(`${API_BASE}/demo/reset-demo-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset demo state.');
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Demo: Re-seed demo database (clears orders & payments, restores stock, preserves demo account)
  async resetDemoDatabase() {
    try {
      const res = await fetch(`${API_BASE}/demo/reset-database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset demo database.');
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Fetch full order by ID (with items, payment, assigned agent, status history)
  async fetchOrderById(orderId) {
    try {
      const token = localStorage.getItem('bitebox_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/orders/${orderId}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load order.');
      }

      return data.order;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Submit Restaurant Decision: ACCEPT or REJECT (Demo Mode)
  async submitRestaurantDecision(orderId, decision, reason = '') {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit restaurant decision.');
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Advance Order Stage forward: confirmed -> preparing -> picked_up -> out_for_delivery -> delivered
  async advanceOrderStage(orderId, stage) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/advance-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to advance order stage.');
      }

      return data;
    } catch (err) {
      handleNetworkError(err);
    }
  },

  // Fetch all orders for minimal restaurant management portal
  async fetchRestaurantOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders/restaurant/all`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load restaurant orders.');
      }

      return data.orders || [];
    } catch (err) {
      handleNetworkError(err);
    }
  }
};


