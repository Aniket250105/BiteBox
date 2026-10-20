import React, { useState, useEffect, useCallback } from 'react';
import './RestaurantListing.css';
import ImageWithFallback from '../components/ImageWithFallback';
import AuthLocationFlow from '../components/AuthLocationFlow';
import { PRESET_LOCATIONS, generateRouteWaypoints } from '../services/locationData';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { useDemoPill } from '../utils/useDemoPill';

const RestaurantListing = ({ 
  onSelectRestaurant, 
  userProfile, 
  setUserProfile, 
  onDeliveryLocationChange,
  onLogout,
  sessionExpiredNotice,
  onClearExpiredNotice
}) => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [locationAddressInput, setLocationAddressInput] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);
  const showDemoPill = useDemoPill();
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState('');

  // Check backend health for DEMO_MODE
  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.demoMode === 'boolean') {
          setIsDemoMode(data.demoMode);
        }
      })
      .catch(() => {});
  }, []);

  // If user is not authenticated or hasn't completed delivery location, show entry step
  const isAuthLocationComplete = userProfile?.name && userProfile?.address;

  const filters = ['All', 'Rating 4.0+', 'Under 30 min', 'Pure veg'];

  // Load restaurants based on active user delivery location
  const loadRestaurants = useCallback(async () => {
    if (!isAuthLocationComplete) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await apiService.fetchRestaurants(userProfile?.address || '');
      setRestaurants(list);
    } catch (err) {
      setError(err.message || 'Unable to load restaurants. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLocationComplete, userProfile?.address]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const filteredRestaurants = restaurants.filter(r => {
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = (r.name || '').toLowerCase().includes(query);
      const matchesCuisine = (r.cuisines || []).some(c => c.toLowerCase().includes(query));
      if (!matchesName && !matchesCuisine) return false;
    }

    // Category / chip filter
    if (activeFilter === 'Rating 4.0+') return (Number(r.rating) || 0) >= 4.0;
    if (activeFilter === 'Pure veg') {
      return (r.cuisines || []).some(c => c.toLowerCase().includes('south indian') || c.toLowerCase().includes('veg')) || (r.name || '').includes('Veg');
    }
    if (activeFilter === 'Under 30 min') {
      const dt = r.deliveryTime || r.delivery_time_est || '';
      return dt.includes('15-20') || dt.includes('25-30');
    }
    return true;
  });

  const handleOpenLocationModal = () => {
    setLocationAddressInput(userProfile?.address || '');
    setShowLocationModal(true);
  };

  const handleSelectPreset = (preset) => {
    setLocationAddressInput(preset.address);
    const updated = authService.updateDeliveryLocation(preset.address, preset.coords, preset.waypoints);
    if (onDeliveryLocationChange) {
      onDeliveryLocationChange(updated);
    } else {
      setUserProfile(updated);
    }
    setShowLocationModal(false);
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) return;
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = `Current GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        const waypoints = generateRouteWaypoints(latitude, longitude);
        const updated = authService.updateDeliveryLocation(address, [latitude, longitude], waypoints);
        if (onDeliveryLocationChange) {
          onDeliveryLocationChange(updated);
        } else {
          setUserProfile(updated);
        }
        setIsDetectingGps(false);
        setShowLocationModal(false);
      },
      () => {
        setIsDetectingGps(false);
      },
      { timeout: 7000 }
    );
  };

  const handleSaveCustomAddress = () => {
    if (!locationAddressInput.trim()) return;
    const matched = PRESET_LOCATIONS.find(p => p.address === locationAddressInput.trim());
    const coords = matched?.coords || PRESET_LOCATIONS[0].coords;
    const waypoints = matched?.waypoints || PRESET_LOCATIONS[0].waypoints;
    const updated = authService.updateDeliveryLocation(locationAddressInput.trim(), coords, waypoints);
    if (onDeliveryLocationChange) {
      onDeliveryLocationChange(updated);
    } else {
      setUserProfile(updated);
    }
    setShowLocationModal(false);
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('This clears all orders and restores stock. Continue?')) {
      return;
    }
    setIsResetting(true);
    setResetNotice('');
    try {
      const res = await apiService.resetDemoDatabase();
      setResetNotice(res?.message || 'Demo data reset: stock restored & orders cleared.');
      await loadRestaurants();
      setTimeout(() => setResetNotice(''), 5000);
    } catch (err) {
      setResetNotice(`Error: ${err.message || 'Failed to reset demo data.'}`);
    } finally {
      setIsResetting(false);
    }
  };

  // If entry step is not complete, render AuthLocationFlow
  if (!isAuthLocationComplete) {
    return (
      <div className="restaurant-listing-entry-container">
        <AuthLocationFlow 
          onComplete={(user) => {
            if (onClearExpiredNotice) onClearExpiredNotice();
            if (onDeliveryLocationChange) {
              onDeliveryLocationChange(user);
            } else {
              setUserProfile(user);
            }
          }} 
          initialMessage={sessionExpiredNotice}
        />
      </div>
    );
  }

  const displayName = userProfile.name.split(' ')[0] || userProfile.name;
  const displayAddress = userProfile.address;

  return (
    <div className="restaurant-listing">
      {/* Sticky Header with Location and User Dropdown */}
      <div className="header location-header">
        <div className="location-info" onClick={handleOpenLocationModal} title="Change delivery location">
          <span className="location-icon">📍</span>
          <div className="location-text-col">
            <span className="location-deliver-label text-xs font-semibold">Deliver to:</span>
            <p className="text-xs text-secondary location-text font-medium">{displayAddress}</p>
          </div>
          <span className="chevron">▾</span>
        </div>

        <div className="header-right-actions">
          {isDemoMode && showDemoPill && (
            <button
              type="button"
              className={`demo-toggle-chip ${isDemoPanelOpen ? 'active' : ''}`}
              onClick={() => setIsDemoPanelOpen(!isDemoPanelOpen)}
              title="Toggle Demo Controls"
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                background: isDemoPanelOpen ? 'var(--color-primary)' : 'var(--color-surface)',
                color: isDemoPanelOpen ? '#FFFFFF' : 'var(--color-text)'
              }}
            >
              <span>🧪 Demo</span>
              <span>{isDemoPanelOpen ? '▴' : '▾'}</span>
            </button>
          )}

          {/* User Dropdown */}
          <div className="user-profile-menu-container">
            <button
              className="user-profile-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              title="User Menu"
            >
              <span className="user-avatar-circle">👤</span>
              <span className="user-greeting-name text-xs font-bold">Hi, {displayName}</span>
              <span className="chevron text-xs">▾</span>
            </button>

            {showUserDropdown && (
              <div className="user-dropdown-menu slide-in-top" onClick={e => e.stopPropagation()}>
                <div className="user-dropdown-header">
                  <span className="dropdown-user-name font-bold text-xs">{userProfile.name}</span>
                  <span className="dropdown-user-id text-xs text-secondary">{userProfile.email || userProfile.phone || userProfile.identifier}</span>
                </div>
                <button
                  className="dropdown-item logout-item"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Demo Rehearsal Panel */}
      {isDemoMode && isDemoPanelOpen && (
        <div 
          className="slide-in-top" 
          style={{ 
            margin: '8px 16px', 
            padding: '10px 14px', 
            background: 'var(--color-surface)', 
            border: '1px dashed var(--color-border)', 
            borderRadius: 'var(--radius-md)' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-primary">🕹️ Evaluator Rehearsal Controls</span>
              <p className="text-xs text-secondary" style={{ marginTop: '2px', fontSize: '0.72rem' }}>
                Re-seeds stock & clears active orders between rehearsals.
              </p>
            </div>
            <button
              type="button"
              className="btn-demo-fill"
              style={{
                backgroundColor: '#D32F2F',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontWeight: '700',
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
              onClick={handleResetDemoData}
              disabled={isResetting}
              title="Re-seed database, restore stock, and clear orders"
            >
              {isResetting ? 'Resetting...' : '🔄 Reset Demo Data'}
            </button>
          </div>
          {resetNotice && (
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: '600' }}>
              ✓ {resetNotice}
            </div>
          )}
        </div>
      )}

      <div className="screen-content">
        <div className="search-bar-container">
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search restaurants, cuisines..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-container">
          {filters.map(filter => (
            <button
              key={filter}
              className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="restaurants-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px 0' }}>
          <h3 className="section-title text-xl font-bold" style={{ margin: 0 }}>Top brands for you</h3>
          {!isLoading && (
            <span className="text-xs text-secondary font-medium">
              {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'place' : 'places'}
            </span>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="restaurants-list">
            {[1, 2, 3].map(n => (
              <div key={n} className="restaurant-card" style={{ pointerEvents: 'none' }}>
                <div className="skeleton" style={{ height: '140px', width: '100%', borderRadius: '12px 12px 0 0' }}></div>
                <div className="restaurant-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ height: '20px', width: '55%' }}></div>
                    <div className="skeleton" style={{ height: '20px', width: '40px' }}></div>
                  </div>
                  <div className="skeleton" style={{ height: '14px', width: '75%' }}></div>
                  <div className="skeleton" style={{ height: '12px', width: '45%' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry Button */}
        {!isLoading && error && (
          <div className="friendly-error-state">
            <div className="friendly-error-icon">📡</div>
            <div className="friendly-error-title">Couldn't load restaurants</div>
            <div className="friendly-error-desc">{error}</div>
            <button className="btn-retry" onClick={loadRestaurants}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredRestaurants.length === 0 && (
          <div className="friendly-error-state">
            <div className="friendly-error-icon">🍽️</div>
            <div className="friendly-error-title">No restaurants available</div>
            <div className="friendly-error-desc">
              {searchQuery.trim()
                ? `No restaurants match "${searchQuery}". Try a different keyword.`
                : `No restaurants currently deliver to ${displayAddress}. Tap below to switch delivery location.`}
            </div>
            {!searchQuery.trim() && (
              <button className="btn-retry" onClick={handleOpenLocationModal}>
                📍 Change Delivery Area
              </button>
            )}
          </div>
        )}

        {/* Restaurant Cards List */}
        {!isLoading && !error && filteredRestaurants.length > 0 && (
          <div className="restaurants-list">
            {filteredRestaurants.map(restaurant => (
              <div 
                key={restaurant.id} 
                className={`restaurant-card ${!restaurant.isOpen ? 'closed' : ''}`}
                onClick={() => restaurant.isOpen && onSelectRestaurant(restaurant)}
              >
                <div className="restaurant-image">
                  <ImageWithFallback 
                    src={restaurant.image} 
                    fallbackEmoji={restaurant.emoji}
                    alt={restaurant.name} 
                  />
                  {!restaurant.isOpen && <div className="closed-overlay">Currently Closed</div>}
                </div>
                <div className="restaurant-details">
                  <div className="restaurant-header-row">
                    <h4 className="restaurant-name text-lg font-bold">{restaurant.name}</h4>
                    <span className="restaurant-rating">⭐ {restaurant.rating}</span>
                  </div>
                  <p className="restaurant-cuisines text-sm text-secondary">
                    {(restaurant.cuisines || []).join(', ')}
                  </p>
                  <div className="restaurant-meta text-xs">
                    <span className="delivery-time">🕒 {restaurant.deliveryTime || restaurant.delivery_time_est}</span>
                    <span className="dot">•</span>
                    <span>₹{restaurant.priceForTwo || 250} for two</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Location Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal-card slide-in-top" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title text-base font-bold">Change Delivery Location 📍</h3>
              <button className="modal-close-btn" onClick={() => setShowLocationModal(false)}>✕</button>
            </div>

            <button
              className="btn-gps-detect mt-2"
              onClick={handleDetectGps}
              disabled={isDetectingGps}
            >
              {isDetectingGps ? 'Detecting GPS...' : '📡 Use Current Location (GPS)'}
            </button>

            <div className="preset-locations-grid mt-3">
              {PRESET_LOCATIONS.map(p => (
                <button
                  key={p.id}
                  className={`preset-chip ${userProfile.address === p.address ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(p)}
                >
                  <span className="font-semibold text-xs">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="form-group mt-3">
              <label className="text-xs font-semibold">Custom Address</label>
              <input
                type="text"
                className="form-input text-xs"
                value={locationAddressInput}
                onChange={e => setLocationAddressInput(e.target.value)}
              />
            </div>

            <button className="btn btn-primary w-full mt-3" onClick={handleSaveCustomAddress}>
              Save & Update Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantListing;
