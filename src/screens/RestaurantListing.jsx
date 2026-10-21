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
  const [fallbackNotice, setFallbackNotice] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCooldown, setRetryCooldown] = useState(0);
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

  // Load restaurants based on active user delivery location & coordinates
  const loadRestaurants = useCallback(async () => {
    if (!isAuthLocationComplete) return;
    setError(null);
    setDisplayLimit(20);

    let lat = 13.1693;
    let lng = 77.5348;
    if (userProfile?.coords && Array.isArray(userProfile.coords) && userProfile.coords.length === 2) {
      lat = userProfile.coords[0];
      lng = userProfile.coords[1];
    } else if (userProfile?.address) {
      const matched = PRESET_LOCATIONS.find(p => p.address === userProfile.address || (p.name && userProfile.address.includes(p.name)));
      if (matched) {
        lat = matched.coords[0];
        lng = matched.coords[1];
      }
    }

    // Instant session cache to eliminate long skeleton delay
    const cacheKey = `bitebox_nearby_${Number(lat).toFixed(3)}_${Number(lng).toFixed(3)}`;
    let hasLoadedFromCache = false;
    try {
      const cachedStr = sessionStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached && Array.isArray(cached.restaurants) && cached.restaurants.length > 0) {
          setRestaurants(cached.restaurants);
          setFallbackNotice(cached.notice || null);
          setIsLoading(false);
          hasLoadedFromCache = true;
        }
      }
    } catch {}

    if (!hasLoadedFromCache) {
      setIsLoading(true);
    }

    try {
      const res = await apiService.fetchNearbyRestaurants({ lat, lng, radiusKm: 3 });
      setRestaurants(res.restaurants || []);
      setFallbackNotice(res.notice || null);
      setError(null);
      setRetryCooldown(0);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          restaurants: res.restaurants || [],
          notice: res.notice || null
        }));
      } catch {}
    } catch (err) {
      const isRateLimit = err.isRateLimited || err.status === 429 || (err.message && err.message.toLowerCase().includes('rate limit'));
      const friendlyMsg = isRateLimit 
        ? "You're searching very quickly! Rate limit reached. Retrying automatically in a few seconds..."
        : (err.message || 'Unable to connect to the BiteBox server. Please ensure the backend is running.');
      setError(friendlyMsg);
      setFallbackNotice(null);
      if (isRateLimit) {
        setRetryCooldown(5);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLocationComplete, userProfile?.coords, userProfile?.address]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // Handle countdown and auto-retry for rate limiting
  useEffect(() => {
    if (retryCooldown <= 0) return;
    const timer = setTimeout(() => {
      setRetryCooldown(prev => {
        if (prev <= 1) {
          loadRestaurants();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [retryCooldown, loadRestaurants]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setDisplayLimit(20);
  }, [searchQuery, activeFilter]);

  const filteredRestaurants = restaurants.filter(r => {
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = (r.name || '').toLowerCase().includes(query);
      const matchesCuisine = (r.cuisines || []).some(c => c.toLowerCase().includes(query));
      if (!matchesName && !matchesCuisine) return false;
    }

    // Category / chip filter
    if (activeFilter === 'Rating 4.0+') {
      // Must exclude null ratings (only rated restaurants >= 4.0)
      return r.rating !== null && r.rating !== undefined && Number(r.rating) >= 4.0;
    }
    if (activeFilter === 'Pure veg') {
      return (
        r.isPureVeg === true ||
        (r.cuisines || []).some(c => c.toLowerCase().includes('south indian') || c.toLowerCase().includes('veg')) ||
        (r.name || '').toLowerCase().includes('veg')
      );
    }
    if (activeFilter === 'Under 30 min') {
      if (r.distanceKm !== null && r.distanceKm !== undefined) {
        return r.distanceKm <= 2.2;
      }
      const dt = r.deliveryTime || r.delivery_time_est || '';
      return dt.includes('15-20') || dt.includes('20-25') || dt.includes('25-30') || dt.includes('19-26');
    }
    return true;
  });

  const visibleRestaurants = filteredRestaurants.slice(0, displayLimit);

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
        {/* Visible Notice Banner for Fallback Cases */}
        {fallbackNotice && (
          <div className="fallback-notice-banner" role="alert" id="fallback-notice-banner">
            <span className="notice-icon">ℹ️</span>
            <span className="notice-text">{fallbackNotice}</span>
          </div>
        )}

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
            {[1, 2, 3, 4, 5, 6].map(n => (
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

        {/* Error State with Countdown Retry */}
        {!isLoading && error && (
          <div className="friendly-error-state">
            <div className="friendly-error-icon">
              {retryCooldown > 0 ? '⏳' : '📡'}
            </div>
            <div className="friendly-error-title">
              {retryCooldown > 0 ? 'Taking a quick breather' : "Couldn't load restaurants"}
            </div>
            <div className="friendly-error-desc">{error}</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
              <button 
                className="btn-retry" 
                onClick={loadRestaurants}
                disabled={retryCooldown > 0}
              >
                {retryCooldown > 0 ? `⏳ Retrying in ${retryCooldown}s...` : '🔄 Try Again'}
              </button>
              <button 
                className="btn-retry" 
                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                onClick={handleOpenLocationModal}
              >
                📍 Change Location
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredRestaurants.length === 0 && (
          <div className="friendly-error-state">
            <div className="friendly-error-icon">🍽️</div>
            <div className="friendly-error-title">No restaurants within 3 km</div>
            <div className="friendly-error-desc">
              {searchQuery.trim()
                ? `No restaurants match "${searchQuery}". Try a different keyword.`
                : `No restaurants found within 3 km of ${displayAddress}. Tap below to retry or switch delivery location.`}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
              <button className="btn-retry" onClick={loadRestaurants}>
                🔄 Retry
              </button>
              <button 
                className="btn-retry" 
                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                onClick={handleOpenLocationModal}
              >
                📍 Change Location
              </button>
            </div>
          </div>
        )}

        {/* Restaurant Cards List */}
        {!isLoading && !error && filteredRestaurants.length > 0 && (
          <>
            <div className="restaurants-list">
              {visibleRestaurants.map(restaurant => (
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
                      {restaurant.rating !== null && restaurant.rating !== undefined ? (
                        <span className="restaurant-rating">⭐ {restaurant.rating}</span>
                      ) : (
                        <span className="restaurant-rating-new">⭐ New</span>
                      )}
                    </div>
                    <p className="restaurant-cuisines text-sm text-secondary">
                      {(restaurant.cuisines || []).join(', ')}
                    </p>
                    <div className="restaurant-meta text-xs">
                      {(restaurant.isDemoFallback || restaurant.source === 'seed') && (
                        <span className="badge-demo-restaurant">Demo restaurant</span>
                      )}
                      {restaurant.distanceText && (
                        <span className="restaurant-distance">📍 {restaurant.distanceText}</span>
                      )}
                      <span className="delivery-time">🕒 {restaurant.deliveryTime || restaurant.delivery_time_est || '15-25 min'}</span>
                      {restaurant.priceForTwo ? (
                        <>
                          <span className="dot">•</span>
                          <span>₹{restaurant.priceForTwo} for two</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show More Pagination Button */}
            {filteredRestaurants.length > displayLimit && (
              <div className="show-more-container">
                <p className="text-xs text-secondary">
                  Showing {visibleRestaurants.length} of {filteredRestaurants.length} restaurants
                </p>
                <button
                  className="btn-show-more"
                  onClick={() => setDisplayLimit(prev => prev + 20)}
                >
                  Show more ({filteredRestaurants.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* OpenStreetMap Attribution Footer */}
        <footer className="osm-attribution-footer">
          <p className="text-xs text-secondary">
            Restaurant data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
          </p>
        </footer>
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
