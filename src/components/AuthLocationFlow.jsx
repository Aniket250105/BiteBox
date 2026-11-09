import React, { useState, useEffect } from 'react';
import './AuthLocationFlow.css';
import { authService, DEMO_CREDENTIALS } from '../services/authService';
import { apiService, API_BASE } from '../services/apiService';
import { PRESET_LOCATIONS, generateRouteWaypoints } from '../services/locationData';
import { useDemoPill } from '../utils/useDemoPill';

const AuthLocationFlow = ({ onComplete, initialMessage, theme = 'light', onToggleTheme }) => {
  // Step state: 'auth' | 'location'
  const [currentStep, setCurrentStep] = useState('auth');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Auth form state
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(initialMessage || '');
  const [authLoading, setAuthLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState('');
  const showDemoPill = useDemoPill();

  // Fetch health to verify DEMO_MODE
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.demoMode === 'boolean') {
          setIsDemoMode(data.demoMode);
        }
      })
      .catch(() => {});
  }, []);

  // Sync initialMessage changes (e.g. session expired notification)
  React.useEffect(() => {
    if (initialMessage) {
      setAuthError(initialMessage);
    }
  }, [initialMessage]);

  // Check backend connectivity on mount to display friendly inline notice if down
  React.useEffect(() => {
    authService.checkHealth().then(isHealthy => {
      if (!isHealthy && !initialMessage) {
        setAuthError('Backend server appears offline. Please ensure "npm run dev" is running.');
      }
    });
  }, [initialMessage]);

  // Demo toggle state (collapsed by default for clean screenshots)
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Location step state
  const [selectedLocation, setSelectedLocation] = useState(PRESET_LOCATIONS[0]);
  const [customAddress, setCustomAddress] = useState(PRESET_LOCATIONS[0].address);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Logged-in user cached during flow
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Switch between Login and Register tabs
  const handleTabChange = (mode) => {
    setAuthMode(mode);
    setAuthError('');
  };

  // Quick Demo fill (only accessible when demo toggle is open)
  const handleFillDemo = () => {
    setAuthMode('login');
    setIdentifier(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setAuthError('');
  };

  // Instant 1-Click Demo Login (logs in immediately without remembering credentials)
  const handleInstantDemoLogin = async () => {
    setAuthMode('login');
    setIdentifier(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setAuthError('');
    setAuthLoading(true);

    try {
      const user = await authService.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
      setLoggedInUser(user);
      setAuthLoading(false);

      if (user.address) {
        setCustomAddress(user.address);
        const matched = PRESET_LOCATIONS.find(p => p.address === user.address);
        if (matched) setSelectedLocation(matched);
      }
      setCurrentStep('location');
    } catch (err) {
      setAuthLoading(false);
      setAuthError(err.message || 'Demo login failed. Please try again.');
    }
  };

  // Simulate Expired Token (evaluator test case)
  const handleSimulateExpired = async () => {
    await authService.simulateExpiredToken();
    setAuthError('Session expired. Please log in again.');
  };

  // Reset demo data handler (re-seeds DB, restores stock, preserves demo account)
  const handleResetDemoData = async () => {
    if (!window.confirm('This clears all orders and restores stock. Continue?')) {
      return;
    }
    setResetLoading(true);
    setAuthError('');
    try {
      const res = await apiService.resetDemoDatabase();
      setDemoNotice(res?.message || 'Demo data reset: stock restored & orders cleared.');
      setTimeout(() => setDemoNotice(''), 5000);
    } catch (err) {
      setAuthError(err.message || 'Failed to reset demo data.');
    } finally {
      setResetLoading(false);
    }
  };

  // Submit Login or Register
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      let user;
      if (authMode === 'login') {
        user = await authService.login(identifier, password);
      } else {
        user = await authService.register(name, identifier, password);
      }

      setLoggedInUser(user);
      setAuthLoading(false);

      // If user already has an address, prefill location step
      if (user.address) {
        setCustomAddress(user.address);
        const matched = PRESET_LOCATIONS.find(p => p.address === user.address);
        if (matched) setSelectedLocation(matched);
      }

      // Advance to Location step
      setCurrentStep('location');
    } catch (err) {
      setAuthLoading(false);
      setAuthError(err.message || 'Authentication failed. Please try again.');
    }
  };

  // Select a preset area
  const handleSelectPreset = (preset) => {
    setSelectedLocation(preset);
    setCustomAddress(preset.address);
    setLocationError('');
  };

  // Detect live browser GPS (handles unsecure LAN context with clear message)
  const handleDetectLocation = () => {
    const isUnsecureLAN = typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isUnsecureLAN || !navigator.geolocation) {
      setLocationError('Location needs HTTPS. Choose your area instead');
      return;
    }

    setIsDetectingGps(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const gpsAddress = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        const waypoints = generateRouteWaypoints(latitude, longitude);

        setSelectedLocation({
          id: 'custom-gps',
          name: 'Current Location',
          address: gpsAddress,
          coords: [latitude, longitude],
          restaurantCoords: waypoints[0],
          waypoints
        });
        setCustomAddress(gpsAddress);
        setIsDetectingGps(false);
      },
      (err) => {
        setIsDetectingGps(false);
        setLocationError('Location needs HTTPS. Choose your area instead');
        // Keep default hub selectable so user can pick
        if (!selectedLocation) {
          handleSelectPreset(PRESET_LOCATIONS[0]);
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Confirm Location and complete entry step
  const handleConfirmLocation = () => {
    const finalAddress = customAddress.trim() || selectedLocation.address;
    const finalCoords = selectedLocation?.coords || PRESET_LOCATIONS[0].coords;
    const finalWaypoints = selectedLocation?.waypoints || PRESET_LOCATIONS[0].waypoints;

    const updatedUser = authService.updateDeliveryLocation(finalAddress, finalCoords, finalWaypoints);
    onComplete(updatedUser || loggedInUser);
  };

  return (
    <div className="auth-location-flow">
      {currentStep === 'auth' ? (
        /* STEP 1: LOGIN / REGISTER CARD */
        <div className="auth-card slide-in-top">
          {/* Header & Demo Toggle */}
          <div className="auth-header" style={{ position: 'relative' }}>
            {onToggleTheme && (
              <button
                type="button"
                className="circbtn"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
                aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
                style={{ position: 'absolute', top: 0, right: 0 }}
              >
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
            )}
            <div className="brand-logo-row">
              <span className="brand-icon">🍱</span>
              <h1 className="brand-name">BiteBox</h1>
            </div>
            <p className="brand-tagline text-xs text-secondary">
              {authMode === 'login' ? 'Delicious food, delivered fast' : 'Join BiteBox & start ordering'}
            </p>
          </div>

          {/* Segmented Tab Bar */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Register
            </button>
          </div>

          {/* Auth Form */}
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {/* Inline Error Message */}
            {authError && (
              <div className="auth-error-banner slide-in-top">
                <span className="error-icon">⚠️</span>
                <span className="error-text text-xs">{authError}</span>
              </div>
            )}

            {/* Register: Full Name */}
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label text-xs font-semibold">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aniket Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email or Phone */}
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label text-xs font-semibold">Email or 10-digit Mobile</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    className="demo-autofill-link"
                    onClick={handleFillDemo}
                    title="Auto-fill demo credentials"
                  >
                    ⚡ Auto-Fill Demo
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. aniket@bitebox.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder={authMode === 'register' ? 'Min. 6 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={authLoading}
            >
              {authLoading ? (
                <span className="btn-loading-content">
                  <span className="auth-spinner"></span>
                  {authMode === 'login' ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : (
                <span>{authMode === 'login' ? 'Log In & Continue ➔' : 'Create Account ➔'}</span>
              )}
            </button>

            {/* Instant Demo Login Button */}
            {authMode === 'login' && (
              <>
                <div className="auth-or-divider">
                  <span>or</span>
                </div>
                <button
                  type="button"
                  className="btn btn-demo-instant"
                  onClick={handleInstantDemoLogin}
                  disabled={authLoading}
                  title="One-click log in with demo account"
                >
                  <span>⚡ 1-Click Demo Login</span>
                  <span className="demo-account-hint">(aniket@bitebox.com)</span>
                </button>
              </>
            )}
          </form>

          {/* Toggle Helper Footer */}
          <div className="auth-footer text-xs text-secondary text-center">
            {authMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-link font-semibold text-primary"
                  onClick={() => handleTabChange('register')}
                >
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-link font-semibold text-primary"
                  onClick={() => handleTabChange('login')}
                >
                  Log in here
                </button>
              </p>
            )}
          </div>
        </div>
      ) : (
        /* STEP 2: DELIVERY LOCATION STEP */
        <div className="location-card slide-in-top">
          <div className="location-card-header">
            <div className="welcome-row">
              <span className="location-header-pin">📍</span>
              <div>
                <h2 className="welcome-name text-lg font-bold">
                  Welcome, {loggedInUser?.name || 'Foodie'}!
                </h2>
                <p className="text-xs text-secondary">
                  Where should we deliver your food today?
                </p>
              </div>
            </div>
          </div>

          {/* Inline Error */}
          {locationError && (
            <div className="location-error-banner slide-in-top">
              <span className="error-icon">⚠️</span>
              <span className="error-text text-xs">{locationError}</span>
            </div>
          )}

          {/* Browser GPS Action */}
          <div className="gps-detect-container">
            <button
              type="button"
              className="btn-gps-detect"
              onClick={handleDetectLocation}
              disabled={isDetectingGps}
            >
              {isDetectingGps ? (
                <span className="btn-loading-content">
                  <span className="auth-spinner red-spinner"></span>
                  Detecting GPS coordinates...
                </span>
              ) : (
                <span>📡 Use Current Location (Browser GPS)</span>
              )}
            </button>
          </div>

          <div className="location-divider">
            <span>or choose a delivery hub in Bengaluru</span>
          </div>

          {/* Quick-Pick Bengaluru Hubs */}
          <div className="preset-locations-grid">
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip ${selectedLocation?.id === preset.id ? 'active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
              >
                <span className="preset-chip-radio">
                  {selectedLocation?.id === preset.id ? '●' : '○'}
                </span>
                <span className="preset-chip-title font-semibold text-xs">{preset.name}</span>
              </button>
            ))}
          </div>

          {/* Address Preview / Edit */}
          <div className="form-group mt-3">
            <label className="form-label text-xs font-semibold">Delivery Address / Landmark</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Enter apartment, street name, and landmark"
              required
            />
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            className="btn btn-primary location-confirm-btn"
            onClick={handleConfirmLocation}
          >
            Confirm & Explore Restaurants ➔
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthLocationFlow;
