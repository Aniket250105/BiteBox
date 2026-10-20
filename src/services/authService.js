// BiteBox Authentication Service connected to SQLite Backend API

const API_BASE = 'http://localhost:3001/api';
const SESSION_STORAGE_KEY = 'bitebox_session';
const TOKEN_STORAGE_KEY = 'bitebox_token';

// Seeded demo credentials for easy evaluator auto-fill
export const DEMO_CREDENTIALS = {
  email: 'aniket@bitebox.com',
  phone: '9876543210',
  password: 'password123',
  name: 'Aniket Sharma',
  defaultAddress: 'Presidency University, Itgalpur, Rajanakunte, Bengaluru',
  defaultCoords: [13.1693, 77.5348]
};

// Check if an error was caused by network/offline connectivity
function isNetworkError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    err.name === 'TypeError' ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('failed') ||
    msg.includes('econnrefused')
  );
}

export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  },

  getAuthHeaders() {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async login(identifier, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      // Persist token and session
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      const sessionUser = {
        ...data.user,
        token: data.token,
        coords: DEMO_CREDENTIALS.defaultCoords,
        waypoints: null
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));

      return sessionUser;
    } catch (err) {
      if (isNetworkError(err)) {
        throw new Error('Backend server is unreachable. Please verify the server is running on http://localhost:3001.');
      }
      throw err;
    }
  },

  async register(name, identifier, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Persist token and session
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      const sessionUser = {
        ...data.user,
        token: data.token,
        coords: null,
        waypoints: null
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));

      return sessionUser;
    } catch (err) {
      if (isNetworkError(err)) {
        throw new Error('Backend server is unreachable. Please verify the server is running on http://localhost:3001.');
      }
      throw err;
    }
  },

  async verifySession() {
    const token = this.getToken();
    if (!token) return { valid: false };

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (res.status === 401) {
        // Token expired or invalid
        this.notifySessionExpired();
        return { expired: true, valid: false };
      }

      if (!res.ok) {
        return { valid: false };
      }

      const data = await res.json();
      const current = this.getCurrentSession();
      const updated = {
        ...current,
        ...data.user,
        token
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      return { valid: true, user: updated };
    } catch (err) {
      console.warn('Backend verification offline:', err.message);
      return { unreachable: true, valid: false };
    }
  },

  notifySessionExpired() {
    this.logout();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bitebox:session-expired'));
    }
  },

  async simulateExpiredToken() {
    try {
      const res = await fetch(`${API_BASE}/auth/test-expired-token`);
      const data = await res.json();
      if (data?.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      }
    } catch {
      localStorage.setItem(TOKEN_STORAGE_KEY, 'invalid_expired_token_mock');
    }
    this.notifySessionExpired();
  },

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  updateDeliveryLocation(address, coords, waypoints) {
    const session = this.getCurrentSession();
    if (!session) return null;

    session.address = address;
    if (coords) session.coords = coords;
    if (waypoints) session.waypoints = waypoints;

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    // Also sync to backend in background if token available
    const token = this.getToken();
    if (token) {
      fetch(`${API_BASE}/auth/location`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ address })
      }).catch(err => console.warn('Could not sync address to server:', err.message));
    }

    return session;
  },

  getCurrentSession() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

