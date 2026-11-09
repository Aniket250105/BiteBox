import React, { useState, useEffect, useCallback, useRef } from 'react';
import './RestaurantListing.css';
import ImageWithFallback from '../components/ImageWithFallback';
import AuthLocationFlow from '../components/AuthLocationFlow';
import { PRESET_LOCATIONS, generateRouteWaypoints } from '../services/locationData';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { useDemoPill } from '../utils/useDemoPill';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Remove Leaflet's default image icon lookup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: ''
});

// Check if a restaurant is a seeded place (can keep photographic thumbnail)
export const isSeededRestaurant = (r) => {
  if (!r) return false;
  return Boolean(
    r.source === 'seed' ||
    r.source === 'seed-fallback' ||
    r.isDemoFallback ||
    ['r1', 'r2', 'r3', 'r4'].includes(r.id)
  );
};

// Return a neutral cuisine emoji for live OSM places
export const getCuisineEmoji = (r) => {
  if (!r) return '🍽️';
  const text = `${(r.cuisines || []).join(' ')} ${r.cuisine || ''} ${r.name || ''} ${r.amenity || ''}`.toLowerCase();
  if (text.includes('coffee') || text.includes('cafe') || text.includes('café') || text.includes('tea') || text.includes('bakery') || text.includes('bakes')) {
    return '☕';
  }
  if (text.includes('salad') || text.includes('healthy') || text.includes('bowl')) {
    return '🥗';
  }
  if (text.includes('juice') || text.includes('shake') || text.includes('smoothie') || text.includes('beverage')) {
    return '🧃';
  }
  if (text.includes('burger') || text.includes('sandwich') || text.includes('fast_food') || text.includes('fast food') || text.includes('wrap')) {
    return '🍔';
  }
  if (text.includes('pizza') || text.includes('italian') || text.includes('pasta')) {
    return '🍕';
  }
  if (text.includes('chinese') || text.includes('asian') || text.includes('noodle') || text.includes('momo') || text.includes('ramen')) {
    return '🥢';
  }
  if (text.includes('ice cream') || text.includes('dessert') || text.includes('sweet') || text.includes('cake') || text.includes('waffle')) {
    return '🧁';
  }
  if (text.includes('south indian') || text.includes('dosa') || text.includes('idli') || text.includes('veg') || text.includes('tiffin')) {
    return '🌿';
  }
  if (text.includes('biryani') || text.includes('curry') || text.includes('thali') || text.includes('rice') || text.includes('north indian') || text.includes('mughlai')) {
    return '🍛';
  }
  return r.emoji || '🍽️';
};

const RestaurantListing = ({ 
  onSelectRestaurant, 
  userProfile, 
  setUserProfile, 
  onDeliveryLocationChange,
  onLogout,
  sessionExpiredNotice,
  onClearExpiredNotice,
  theme = 'light',
  onToggleTheme
}) => {
  const [restaurants, setRestaurants] = useState([]);
  const [fallbackNotice, setFallbackNotice] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]); // ['Open now', 'Pure veg', 'Under 30 min', 'Rating 4.0+']
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [locationAddressInput, setLocationAddressInput] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);
  const showDemoPill = useDemoPill();
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState('');
  const [isGlassOn, setIsGlassOn] = useState(() => {
    return document.documentElement.getAttribute('data-glass') !== 'off';
  });

  const handleToggleGlass = () => {
    const next = !isGlassOn;
    setIsGlassOn(next);
    if (next) {
      document.documentElement.removeAttribute('data-glass');
      try { localStorage.removeItem('bitebox_glass_mode'); } catch {}
    } else {
      document.documentElement.setAttribute('data-glass', 'off');
      try { localStorage.setItem('bitebox_glass_mode', 'off'); } catch {}
    }
  };
  
  // Sheet Expansion & Drag state
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartTranslateYRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Map state & references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [useSchematicMap, setUseSchematicMap] = useState(false);
  const [selectedPinRestaurantId, setSelectedPinRestaurantId] = useState(null);
  const listRowsRef = useRef({});

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

  const isAuthLocationComplete = userProfile?.name && userProfile?.address;
  const filterList = ['Open now', 'Pure veg', 'Under 30 min', 'Rating 4.0+'];

  // Toggle filter chip
  const handleToggleFilter = (filterName) => {
    setActiveFilters(prev => 
      prev.includes(filterName) 
        ? prev.filter(f => f !== filterName) 
        : [...prev, filterName]
    );
  };

  // Determine active coordinates
  const customerCoords = React.useMemo(() => {
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
    return [lat, lng];
  }, [userProfile?.coords, userProfile?.address]);

  // Load restaurants based on active user delivery location & coordinates
  const loadRestaurants = useCallback(async () => {
    if (!isAuthLocationComplete) return;
    setError(null);
    setDisplayLimit(20);

    const [lat, lng] = customerCoords;
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
  }, [isAuthLocationComplete, customerCoords]);

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
  }, [searchQuery, activeFilters]);

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(r => {
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = (r.name || '').toLowerCase().includes(query);
      const matchesCuisine = (r.cuisines || []).some(c => c.toLowerCase().includes(query));
      if (!matchesName && !matchesCuisine) return false;
    }

    // "Open now" filter: hides closed places
    if (activeFilters.includes('Open now')) {
      if (!r.isOpen) return false;
    }

    // Category / chip filters
    if (activeFilters.includes('Rating 4.0+')) {
      if (r.rating === null || r.rating === undefined || Number(r.rating) < 4.0) return false;
    }
    if (activeFilters.includes('Pure veg')) {
      const isVeg = r.isPureVeg === true ||
        (r.cuisines || []).some(c => c.toLowerCase().includes('south indian') || c.toLowerCase().includes('veg')) ||
        (r.name || '').toLowerCase().includes('veg');
      if (!isVeg) return false;
    }
    if (activeFilters.includes('Under 30 min')) {
      let isUnder30 = false;
      if (r.distanceKm !== null && r.distanceKm !== undefined) {
        isUnder30 = r.distanceKm <= 2.2;
      } else {
        const dt = r.deliveryTime || r.delivery_time_est || '';
        isUnder30 = dt.includes('15-20') || dt.includes('20-25') || dt.includes('25-30') || dt.includes('19-26');
      }
      if (!isUnder30) return false;
    }

    return true;
  });

  const visibleRestaurants = filteredRestaurants.slice(0, displayLimit);

  // Pin only restaurants within 3 km of customer's location (capped at 40)
  const pinnedRestaurants = React.useMemo(() => {
    return filteredRestaurants
      .filter(r => (r.distanceKm === null || r.distanceKm <= 3.0) && r.lat && r.lng)
      .slice(0, 40);
  }, [filteredRestaurants]);

  // 1. Initialize Leaflet Map ONCE
  useEffect(() => {
    if (useSchematicMap || !mapContainerRef.current || !isAuthLocationComplete) return;
    if (mapInstanceRef.current) return;

    // Check if network is explicitly offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setUseSchematicMap(true);
      return;
    }

    const [lat, lng] = customerCoords;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14.2,
        zoomControl: false,
        attributionControl: false
      });
      mapInstanceRef.current = map;

      // Invalidate size on initial mount
      map.whenReady(() => {
        setTimeout(() => {
          if (map._loaded && typeof map.invalidateSize === 'function') {
            map.invalidateSize();
          }
        }, 60);
        setTimeout(() => {
          if (map._loaded && typeof map.invalidateSize === 'function') {
            map.invalidateSize();
          }
        }, 300);
      });

      // Add OpenStreetMap tiles with failure tolerance & 3-second fallback timer
      let hasAnyTileLoaded = false;
      let consecutiveTileErrors = 0;

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      tileLayer.on('tileload', () => {
        hasAnyTileLoaded = true;
      });

      tileLayer.on('tileerror', () => {
        consecutiveTileErrors++;
        // If consecutive errors happen and no tiles have loaded, trigger schematic early
        if (consecutiveTileErrors >= 2 && !hasAnyTileLoaded) {
          setUseSchematicMap(true);
        }
      });

      // Fallback timer: if tiles haven't loaded within about 3 seconds, or there are no tiles, fallback to schematic
      const tileTimeoutId = setTimeout(() => {
        if (!hasAnyTileLoaded) {
          console.warn('Tiles failed to load within 3 seconds, switching to schematic fallback');
          setUseSchematicMap(true);
        }
      }, 3000);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      const handleResize = () => {
        if (map._loaded && typeof map.invalidateSize === 'function') {
          map.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);

      setMapReady(true);

      return () => {
        clearTimeout(tileTimeoutId);
        window.removeEventListener('resize', handleResize);
      };
    } catch (e) {
      console.warn('Leaflet map initialization failed, falling back to schematic:', e);
      setUseSchematicMap(true);
    }
  }, [useSchematicMap, isAuthLocationComplete, customerCoords]);

  // Clean up Leaflet map when switching to schematic map
  useEffect(() => {
    if (useSchematicMap && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {}
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
      setMapReady(false);
    }
  }, [useSchematicMap]);

  // Invalidate map size on sheet expansion/collapse transitions
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._loaded || useSchematicMap) return;

    if (typeof map.invalidateSize === 'function') {
      map.invalidateSize();
    }
    const timer = setTimeout(() => {
      if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [isSheetExpanded, useSchematicMap, theme]);

  // 2. Update Leaflet Markers whenever pins or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup || useSchematicMap) return;

    const [lat, lng] = customerCoords;

    // Center map view on customer
    try {
      map.setView([lat, lng], 14.2, { animate: false });
    } catch {}

    // Clean up previous markers
    markersGroup.clearLayers();

    // 1. Customer Location Marker (dark dot with soft halo)
    const customerIcon = L.divIcon({
      className: 'leaflet-customer-marker-container',
      html: `
        <div class="custom-customer-halo"></div>
        <div class="custom-customer-dot"></div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
    L.marker([lat, lng], { icon: customerIcon, zIndexOffset: 1000 }).addTo(markersGroup);

    // 2. Dashed 3 km Radius Circle
    L.circle([lat, lng], {
      radius: 3000,
      color: '#FF6B2C',
      weight: 2,
      dashArray: '7, 6',
      fillColor: '#FF6B2C',
      fillOpacity: 0.08
    }).addTo(markersGroup);

    // 3. "3 km" Chip Badge on Southern Edge of Circle (~0.024 deg south, ~0.012 deg east)
    const chipLat = lat - 0.022;
    const chipLng = lng + 0.012;
    const chipIcon = L.divIcon({
      className: 'leaflet-radius-chip-container',
      html: `<div class="radius-chip-badge">3 km</div>`,
      iconSize: [48, 22],
      iconAnchor: [24, 11]
    });
    L.marker([chipLat, chipLng], { icon: chipIcon, zIndexOffset: 999 }).addTo(markersGroup);

    // 4. Restaurant Pins (only within 3 km, capped at 40, in sync with filters)
    pinnedRestaurants.forEach(r => {
      const isSelected = selectedPinRestaurantId === r.id;
      const isClosed = !r.isOpen;
      const pinLabel = isClosed 
        ? 'Closed' 
        : (r.rating !== null && r.rating !== undefined ? `★ ${r.rating}` : '★ New');
      
      const pinClass = isClosed ? 'pin-closed' : 'pin-open';
      const selectedClass = isSelected ? 'pin-selected' : '';

      const pinIcon = L.divIcon({
        className: 'leaflet-restaurant-pin-container',
        html: `
          <div class="restaurant-map-pin ${pinClass} ${selectedClass}">
            <span>${pinLabel}</span>
            <div class="pin-triangle"></div>
          </div>
        `,
        iconSize: [52, 28],
        iconAnchor: [26, 28]
      });

      const marker = L.marker([r.lat, r.lng], { icon: pinIcon });
      marker.on('click', () => {
        setSelectedPinRestaurantId(r.id);
        const rowEl = listRowsRef.current[r.id];
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      marker.addTo(markersGroup);
    });

    // Safely invalidate size if loaded
    try {
      if (map._loaded && typeof map.invalidateSize === 'function') {
        map.invalidateSize();
      }
    } catch {}
  }, [customerCoords, pinnedRestaurants, selectedPinRestaurantId, useSchematicMap, mapReady]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Bottom Sheet Drag Handlers (Only handle & header start drag)
  const handlePointerDown = (e) => {
    dragStartYRef.current = e.clientY;
    dragStartTranslateYRef.current = sheetTranslateY;
    hasMovedRef.current = false;
    setIsDraggingSheet(true);
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingSheet) return;
    const deltaY = e.clientY - dragStartYRef.current;
    if (Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }
    const maxUp = isSheetExpanded ? 0 : -280;
    const maxDown = isSheetExpanded ? 280 : 0;
    const newY = Math.max(maxUp, Math.min(deltaY, maxDown));
    setSheetTranslateY(newY);
  };

  const handlePointerUp = () => {
    if (!isDraggingSheet) return;
    setIsDraggingSheet(false);

    // If it was just a tap without drag movement, toggle state
    if (!hasMovedRef.current) {
      setIsSheetExpanded(prev => !prev);
      setSheetTranslateY(0);
      if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
        setTimeout(() => { try { mapInstanceRef.current?.invalidateSize(); } catch {} }, 60);
      }
      return;
    }

    // If dragged sufficiently, snap to expanded or collapsed
    if (isSheetExpanded) {
      if (sheetTranslateY > 60) {
        setIsSheetExpanded(false);
      }
    } else {
      if (sheetTranslateY < -60) {
        setIsSheetExpanded(true);
      }
    }
    setSheetTranslateY(0);
    if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
      setTimeout(() => { try { mapInstanceRef.current?.invalidateSize(); } catch {} }, 60);
    }
  };

  // Location modal handlers
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
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>
    );
  }

  const userInitial = (userProfile?.name?.trim()?.charAt(0) || 'A').toUpperCase();
  const displayAddress = userProfile.address || 'Select location';
  const placesWithin3KmCount = restaurants.filter(r => r.distanceKm === null || r.distanceKm <= 3.0).length;

  return (
    <div className={`discover-screen ${isSheetExpanded ? 'sheet-is-expanded' : ''}`}>
      {/* 1. Full-Width Top Map Area */}
      <div className="discover-map-wrapper">
        {!useSchematicMap ? (
          <div 
            id="discover-map" 
            ref={mapContainerRef} 
            className="discover-leaflet-map" 
          />
        ) : (
          /* Schematic SVG Map Fallback matching Concept */
          <div className="discover-schematic-map">
            <svg width="100%" height="100%" viewBox="0 0 370 372" preserveAspectRatio="xMidYMid slice">
              <rect width="370" height="372" fill="var(--map-land, #F3EEE4)" />
              <path d="M0 336 C70 314 110 356 190 342 C250 328 310 358 370 336 L370 372 L0 372 Z" fill="var(--map-water, #CFE3F3)" />
              <rect x="22" y="196" width="80" height="52" rx="14" fill="var(--map-park, #D9EBD3)" />
              <rect x="272" y="170" width="78" height="52" rx="14" fill="var(--map-park, #D9EBD3)" />
              <g stroke="var(--map-roads, #FFFFFF)" strokeWidth="12" strokeLinecap="round" fill="none">
                <path d="M0 178 H370" />
                <path d="M0 286 H370" />
                <path d="M92 0 V372" />
                <path d="M196 0 V372" />
                <path d="M296 0 V372" />
                <path d="M0 120 L370 232" />
              </g>
              <g stroke="var(--border-line, #E8DFD2)" strokeWidth="1" fill="none">
                <path d="M0 178 H370" />
                <path d="M0 286 H370" />
                <path d="M92 0 V372" />
                <path d="M196 0 V372" />
                <path d="M296 0 V372" />
              </g>
              {/* 3 km Dashed Accent Circle */}
              <circle cx="185" cy="245" r="98" fill="rgba(255,107,44,.09)" stroke="#FF6B2C" strokeWidth="2" strokeDasharray="7 6" />
              {/* 3 km Chip */}
              <g transform="translate(238, 310)">
                <rect width="48" height="22" rx="11" fill="#FF6B2C" />
                <text x="24" y="15" fontSize="11" fontWeight="700" fill="#FFFFFF" textAnchor="middle">3 km</text>
              </g>
              {/* Customer dot with halo */}
              <circle cx="185" cy="245" r="22" className="schematic-customer-halo" />
              <circle cx="185" cy="245" r="9" className="schematic-customer-dot" />
              
              {/* Render dynamic pins for pinned restaurants in schematic view */}
              {pinnedRestaurants.slice(0, 4).map((r, idx) => {
                const offsets = [
                  { x: 120, y: 195 },
                  { x: 252, y: 220 },
                  { x: 212, y: 300 },
                  { x: 112, y: 290 }
                ];
                const pos = offsets[idx % offsets.length];
                const isClosed = !r.isOpen;
                const isSelected = selectedPinRestaurantId === r.id;
                const text = isClosed ? 'Closed' : (r.rating ? `★ ${r.rating}` : '★ New');
                const fillBg = isClosed ? '#ECE7E1' : '#FFFFFF';
                const textColor = isClosed ? '#6B655D' : '#137A52';

                return (
                  <g 
                    key={r.id} 
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedPinRestaurantId(r.id);
                      const el = listRowsRef.current[r.id];
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <rect 
                      x="-26" 
                      y="-20" 
                      width="52" 
                      height="24" 
                      rx="12" 
                      fill={fillBg} 
                      stroke={isSelected ? '#FF6B2C' : 'none'}
                      strokeWidth={isSelected ? '2' : '0'}
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.18))" 
                    />
                    <path d="M-6 4 L0 11 L6 4 Z" fill={fillBg} />
                    <text x="0" y="-4" fontSize="11" fontWeight="700" fill={textColor} textAnchor="middle">{text}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Floating Top Controls: Location Pill, Avatar, Search Bar */}
      <div className="discover-floating-top">
        <div className="discover-top-row">
          <button 
            type="button" 
            className="discover-locpill" 
            onClick={handleOpenLocationModal}
            title="Change delivery location"
          >
            <span className="loc-icon">📍</span>
            <div className="loc-text-col">
              <small>Deliver to</small>
              <div className="loc-address-line">{displayAddress} ▾</div>
            </div>
          </button>

          <div className="discover-top-right-actions">
            {onToggleTheme && (
              <button
                type="button"
                className="circbtn theme-toggle-btn"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
                aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
              >
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
            )}

            {isDemoMode && showDemoPill && (
              <button
                type="button"
                className={`demo-toggle-chip ${isDemoPanelOpen ? 'active' : ''}`}
                onClick={() => setIsDemoPanelOpen(!isDemoPanelOpen)}
                title="Toggle Demo Controls"
              >
                <span>🧪 Demo</span>
              </button>
            )}

            <button
              type="button"
              className="discover-avatar-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              title="User profile"
            >
              {userInitial}
            </button>

            {showUserDropdown && (
              <div className="user-dropdown-menu slide-in-top" onClick={e => e.stopPropagation()}>
                <div className="user-dropdown-header">
                  <span className="dropdown-user-name font-bold text-xs">{userProfile.name}</span>
                  <span className="dropdown-user-id text-xs text-secondary">{userProfile.email || userProfile.phone || userProfile.identifier}</span>
                </div>
                {onToggleTheme && (
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      onToggleTheme();
                      setShowUserDropdown(false);
                    }}
                  >
                    {theme === 'dark' ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
                  </button>
                )}
                <button
                  type="button"
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

        {/* Floating Search Bar (Filter icon omitted as per specification) */}
        <div className="discover-searchbar-container">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="discover-search-input" 
            placeholder="Search restaurants or dishes" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Demo Rehearsal Panel */}
      {isDemoMode && isDemoPanelOpen && (
        <div className="demo-rehearsal-panel slide-in-top">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--sun)' }}>
                🕹️ Evaluator Rehearsal Controls
              </span>
              <p className="text-xs text-secondary" style={{ marginTop: '2px', fontSize: '0.72rem' }}>
                Re-seeds stock & clears active orders between rehearsals.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {onToggleTheme && (
                <button
                  type="button"
                  className="btn-theme-toggle"
                  style={{
                    background: 'var(--glass-fill-standard)',
                    color: 'var(--text-main)',
                    border: '1.5px solid var(--border-line)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                  onClick={onToggleTheme}
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
              )}
              <button
                type="button"
                className="btn-glass-toggle"
                style={{
                  background: isGlassOn ? 'var(--sunsoft)' : 'var(--bg-surface)',
                  color: isGlassOn ? 'var(--sun)' : 'var(--text-main)',
                  border: '1.5px solid var(--border-line)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '700',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
                onClick={handleToggleGlass}
                title="Toggle Glassmorphism surfaces"
              >
                🪟 Glass: {isGlassOn ? 'ON' : 'OFF'}
              </button>
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
              >
                {isResetting ? 'Resetting...' : '🔄 Reset Demo Data'}
              </button>
            </div>
          </div>
          {resetNotice && (
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--sun)', fontWeight: '600' }}>
              ✓ {resetNotice}
            </div>
          )}
        </div>
      )}

      {/* 2. Draggable Bottom Sheet */}
      <div 
        className={`discover-bottom-sheet ${isSheetExpanded ? 'expanded' : ''} ${isDraggingSheet ? 'is-dragging' : ''}`}
        style={{
          transform: isDraggingSheet 
            ? `translateY(${sheetTranslateY}px)` 
            : undefined,
          transition: isDraggingSheet ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)'
        }}
      >
        {/* Drag Handle Area (Tappable & Draggable) */}
        <div 
          className="sheet-handle-zone"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="button"
          tabIndex={0}
          aria-label={isSheetExpanded ? "Collapse sheet to half height" : "Expand sheet to full height"}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsSheetExpanded(prev => !prev);
            }
          }}
        >
          <div className="sheet-drag-handle" />
        </div>

        {/* Filter Chips */}
        <div className="discover-chips-row">
          {filterList.map(name => {
            const isActive = activeFilters.includes(name);
            return (
              <button
                key={name}
                type="button"
                className={`discover-chip ${isActive ? 'on' : ''}`}
                onClick={() => handleToggleFilter(name)}
              >
                {name === 'Pure veg' && <i className="veg-dot">●</i>}
                {name}
              </button>
            );
          })}
        </div>

        {/* Section Header */}
        <div className="discover-section-header">
          <b>Nearby</b>
          <span>{placesWithin3KmCount} {placesWithin3KmCount === 1 ? 'place' : 'places'} within 3 km</span>
        </div>

        {/* Fallback Notice Banner */}
        {fallbackNotice && (
          <div className="fallback-notice-banner" role="alert" id="fallback-notice-banner">
            <span className="notice-icon">ℹ️</span>
            <span className="notice-text">{fallbackNotice}</span>
          </div>
        )}

        {/* Scrollable Restaurant List (Scrollable in both half and full states) */}
        <div className="discover-restaurant-list-scroll">
          {/* Loading Skeletons */}
          {isLoading && (
            <div className="discover-skeleton-list">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="discover-skeleton-row">
                  <div className="skeleton skeleton-thumb" />
                  <div className="skeleton-details">
                    <div className="skeleton skeleton-line" style={{ width: '60%' }} />
                    <div className="skeleton skeleton-line" style={{ width: '80%' }} />
                    <div className="skeleton skeleton-line" style={{ width: '40%' }} />
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
                  type="button"
                  className="btn-retry" 
                  onClick={loadRestaurants}
                  disabled={retryCooldown > 0}
                >
                  {retryCooldown > 0 ? `⏳ Retrying in ${retryCooldown}s...` : '🔄 Try Again'}
                </button>
                <button 
                  type="button"
                  className="btn-retry" 
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-line)' }}
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
                <button type="button" className="btn-retry" onClick={loadRestaurants}>
                  🔄 Retry
                </button>
                <button 
                  type="button"
                  className="btn-retry" 
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-line)' }}
                  onClick={handleOpenLocationModal}
                >
                  📍 Change Location
                </button>
              </div>
            </div>
          )}

          {/* Restaurant Rows */}
          {!isLoading && !error && filteredRestaurants.length > 0 && (
            <>
              <div className="discover-rows-container">
                {visibleRestaurants.map(restaurant => {
                  const isClosed = !restaurant.isOpen;
                  const isSelected = selectedPinRestaurantId === restaurant.id;
                  const isPureVegRest = restaurant.isPureVeg || (restaurant.cuisines || []).some(c => c.toLowerCase().includes('south indian') || c.toLowerCase().includes('pure veg'));

                  // Pastel background gradient for thumbnail
                  let thumbGrad = 'linear-gradient(135deg, #FFCC99, #F07A3A)';
                  if (isPureVegRest) thumbGrad = 'linear-gradient(135deg, #C5E1A5, #6FAE5B)';
                  else if ((restaurant.cuisine || '').toLowerCase().includes('burger')) thumbGrad = 'linear-gradient(135deg, #FFE0A3, #E9A23B)';
                  else if (isClosed) thumbGrad = 'linear-gradient(135deg, #D7CCE8, #8F7DB5)';

                  const isSeeded = isSeededRestaurant(restaurant);
                  const cuisineEmoji = getCuisineEmoji(restaurant);

                  return (
                    <div
                      key={restaurant.id}
                      ref={el => listRowsRef.current[restaurant.id] = el}
                      className={`discover-row ${isClosed ? 'closed' : ''} ${isSelected ? 'row-highlighted' : ''}`}
                      onClick={() => restaurant.isOpen && onSelectRestaurant(restaurant)}
                    >
                      {/* 70px Thumbnail with Circular Plate */}
                      <div className="row-thumbnail" style={{ background: thumbGrad }}>
                        <div className="row-plate">
                          <ImageWithFallback 
                            src={isSeeded ? restaurant.image : null} 
                            fallbackEmoji={cuisineEmoji}
                            alt={restaurant.name} 
                            isPlate={true}
                          />
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="row-info">
                        <div className="row-name">{restaurant.name}</div>
                        <div className="row-cuisines">
                          {(restaurant.cuisines || []).join(', ')}
                        </div>
                        <div className="row-meta">
                          {isClosed ? (
                            <span className="tag-closed">Closed now</span>
                          ) : restaurant.rating !== null && restaurant.rating !== undefined ? (
                            <span className="badge-rating">★ {restaurant.rating}</span>
                          ) : (
                            <span className="badge-rating-new">★ New</span>
                          )}

                          {restaurant.distanceText && (
                            <span>{restaurant.distanceText}</span>
                          )}
                          <i className="dotsep" />
                          <span>{restaurant.deliveryTime || restaurant.delivery_time_est || '20–30 min'}</span>

                          {(restaurant.isDemoFallback || restaurant.source === 'seed' || (restaurant.distanceKm && restaurant.distanceKm > 3.0)) && (
                            <span className="badge-demo-restaurant">Demo restaurant</span>
                          )}
                        </div>
                      </div>

                      {/* Go Button */}
                      <div className="row-go-btn">›</div>
                    </div>
                  );
                })}
              </div>

              {/* Show More Pagination Button */}
              {filteredRestaurants.length > displayLimit && (
                <div className="show-more-container">
                  <p className="text-xs text-secondary">
                    Showing {visibleRestaurants.length} of {filteredRestaurants.length} restaurants
                  </p>
                  <button
                    type="button"
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
      </div>

      {/* Change Location Modal */}
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
                  className={`preset-chip ${userProfile.address === p.address ? 'active' : ''}`}
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
                value={locationAddressInput}
                onChange={e => setLocationAddressInput(e.target.value)}
              />
            </div>

            <button type="button" className="bigbtn w-full" onClick={handleSaveCustomAddress}>
              Save & Update Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantListing;
