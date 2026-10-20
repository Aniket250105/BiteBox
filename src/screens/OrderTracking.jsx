import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './OrderTracking.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Toast from '../components/Toast';
import { apiService } from '../services/apiService';
import { useDemoPill } from '../utils/useDemoPill';

// Remove Leaflet's default image icon lookup to avoid any 404 image errors in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: ''
});

// Realistic road-aligned coordinates in Indiranagar / MG Road, Bengaluru
const DEFAULT_INDIRANAGAR_WAYPOINTS = [
  [12.9719, 77.6412], // 100 Feet Rd, near 12th Main (Restaurant)
  [12.9752, 77.6411], // 100 Feet Rd heading north
  [12.9782, 77.6409], // 100 Feet Rd & CMH Rd intersection (Metro)
  [12.9784, 77.6360], // CMH Road heading west
  [12.9786, 77.6315], // CMH Rd & 80 Feet Rd intersection
  [12.9818, 77.6318], // 80 Feet Rd heading into Defence Colony
  [12.9830, 77.6350]  // Defence Colony residential lane (Customer Doorstep)
];

const STAGES = [
  { id: 'awaiting_confirmation', title: 'Awaiting restaurant confirmation', time: 'Just now', desc: 'Payment received. Waiting for restaurant to accept your order.', icon: '⏳', defaultEta: 35 },
  { id: 'confirmed', title: 'Order Confirmed', time: '12:00 PM', desc: 'The restaurant has accepted your order.', icon: '📝', defaultEta: 30 },
  { id: 'preparing', title: 'Preparing Food', time: '12:05 PM', desc: 'The kitchen is preparing your dishes fresh.', icon: '🍳', defaultEta: 25 },
  { id: 'picked_up', title: 'Picked Up', time: '12:18 PM', desc: 'Delivery partner has collected the order.', icon: '🎒', defaultEta: 15 },
  { id: 'out_delivery', title: 'Out for Delivery', time: '12:22 PM', desc: 'Agent is on the way to your doorstep.', icon: '🛵', defaultEta: 12 },
  { id: 'delivered', title: 'Delivered', time: '12:35 PM', desc: 'Order delivered! Enjoy your meal.', icon: '✅', defaultEta: 0 }
];

// Helper to compute bearing between two points
function getBearing(p1, p2) {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lon1 = (p1[1] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const lon2 = (p2[1] * Math.PI) / 180;

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Compute cumulative segment distances
function getPathDistances(pts) {
  const dists = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    dists.push(d);
    total += d;
  }
  return { dists, total };
}

// Interpolate along waypoints with given progress [0.0 - 1.0]
function getInterpolatedPosition(pts, progress) {
  if (pts.length < 2) return { latLng: pts[0] || [12.9719, 77.6412], bearing: 0, trail: pts };
  if (progress <= 0) {
    return { latLng: pts[0], bearing: getBearing(pts[0], pts[1]), trail: [pts[0]] };
  }
  if (progress >= 1) {
    return { latLng: pts[pts.length - 1], bearing: getBearing(pts[pts.length - 2], pts[pts.length - 1]), trail: pts };
  }

  const { dists, total } = getPathDistances(pts);
  const targetDist = progress * total;
  let accumulated = 0;
  const trail = [pts[0]];

  for (let i = 0; i < dists.length; i++) {
    if (accumulated + dists[i] >= targetDist) {
      const segT = (targetDist - accumulated) / (dists[i] || 1);
      const lat = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * segT;
      const lng = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * segT;
      const currentPos = [lat, lng];
      trail.push(currentPos);
      return {
        latLng: currentPos,
        bearing: getBearing(pts[i], pts[i + 1]),
        trail
      };
    }
    accumulated += dists[i];
    trail.push(pts[i + 1]);
  }

  return { latLng: pts[pts.length - 1], bearing: 0, trail: pts };
}

// Generate realistic road-grid waypoints from restaurant to customer GPS
function generateWaypoints(destLat, destLng, restLat = null, restLng = null) {
  const originLat = restLat !== null && !isNaN(restLat) ? restLat : destLat - 0.011;
  const originLng = restLng !== null && !isNaN(restLng) ? restLng : destLng - 0.009;
  const dLat = destLat - originLat;
  const dLng = destLng - originLng;

  return [
    [originLat, originLng],
    [originLat + dLat * 0.25, originLng],
    [originLat + dLat * 0.25, originLng + dLng * 0.5],
    [originLat + dLat * 0.65, originLng + dLng * 0.5],
    [originLat + dLat * 0.65, originLng + dLng * 0.9],
    [destLat, destLng]
  ];
}

const OrderTracking = ({ restaurant, orderDetails, userProfile, onHome }) => {
  // Live server-polled order record
  const [liveOrder, setLiveOrder] = useState(null);
  const orderId = orderDetails?.orderId || orderDetails?.id;
  const showDemoPill = useDemoPill();

  // Helper to compute waypoints given destination and restaurant
  const resolveCurrentWaypoints = useCallback((order, profile) => {
    // 1. Destination coordinates: check order, then orderDetails, then profile coords
    let destLat = Number(order?.delivery_lat || orderDetails?.delivery_lat);
    let destLng = Number(order?.delivery_lng || orderDetails?.delivery_lng);

    if (isNaN(destLat) || isNaN(destLng) || !destLat || !destLng) {
      if (profile?.coords && Array.isArray(profile.coords) && profile.coords.length === 2) {
        destLat = profile.coords[0];
        destLng = profile.coords[1];
      } else {
        destLat = 13.1693;
        destLng = 77.5348;
      }
    }

    // 2. Restaurant coordinates: check order restaurant, prop restaurant, orderDetails restaurant
    let restLat = Number(order?.restaurant?.lat || order?.restaurant_lat || restaurant?.lat || orderDetails?.restaurant?.lat || orderDetails?.restaurant_lat);
    let restLng = Number(order?.restaurant?.lng || order?.restaurant_lng || restaurant?.lng || orderDetails?.restaurant?.lng || orderDetails?.restaurant_lng);

    return generateWaypoints(destLat, destLng, restLat, restLng);
  }, [restaurant, orderDetails]);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [waypoints, setWaypoints] = useState(() => resolveCurrentWaypoints(null, userProfile));
  const [progress, setProgress] = useState(0); // 0 to 1
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [isDemoControlsOpen, setIsDemoControlsOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [forceRejectionDemo, setForceRejectionDemo] = useState(false);
  const [useSchematicMap, setUseSchematicMap] = useState(false);
  const [tileErrorOccurred, setTileErrorOccurred] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Check health for demo mode
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

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const restaurantMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const agentMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const completedPolylineRef = useRef(null);
  const animationFrameRef = useRef(null);
  const autoSimTimerRef = useRef(null);

  // Poll backend for real order status
  const fetchOrderState = useCallback(async () => {
    if (!orderId) return;
    try {
      const order = await apiService.fetchOrderById(orderId);
      if (order) {
        setLiveOrder(order);

        // Map server status to stage index
        const status = order.status;
        if (status === 'paid, awaiting restaurant decision') {
          setCurrentStageIndex(0);
        } else if (status === 'confirmed') {
          setCurrentStageIndex(1);
        } else if (status === 'preparing') {
          setCurrentStageIndex(2);
        } else if (status === 'picked_up') {
          setCurrentStageIndex(3);
        } else if (status === 'out_for_delivery') {
          setCurrentStageIndex(4);
        } else if (status === 'delivered') {
          setCurrentStageIndex(5);
        }
      }
    } catch (err) {
      console.warn('Failed to poll order state:', err.message);
    }
  }, [orderId]);

  // Polling on mount and every 3 seconds
  useEffect(() => {
    fetchOrderState();
    const interval = setInterval(fetchOrderState, 3000);
    return () => clearInterval(interval);
  }, [fetchOrderState]);

  // Dynamically update waypoints as soon as live order data loads with coordinates
  useEffect(() => {
    if (liveOrder) {
      const newWaypoints = resolveCurrentWaypoints(liveOrder, userProfile);
      setWaypoints(newWaypoints);
    }
  }, [liveOrder, userProfile, resolveCurrentWaypoints]);

  // Handle Demo "Force Restaurant Rejection" switch
  useEffect(() => {
    if (forceRejectionDemo && orderId && liveOrder?.status === 'paid, awaiting restaurant decision') {
      const timer = setTimeout(async () => {
        try {
          await apiService.submitRestaurantDecision(
            orderId, 
            'REJECT', 
            'Kitchen closed unexpectedly due to equipment maintenance'
          );
          setToast({ message: '⚡ Demo: Restaurant forced rejection triggered.', type: 'warning' });
          await fetchOrderState();
        } catch (err) {
          console.warn('Force rejection failed:', err.message);
        }
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [forceRejectionDemo, orderId, liveOrder?.status, fetchOrderState]);

  // Address and Details labels
  const deliveryAddress = liveOrder?.delivery_address || orderDetails?.deliveryAddress || userProfile?.address || 'Current Address';
  const restaurantName = liveOrder?.restaurant?.name || restaurant?.name || orderDetails?.restaurant?.name || 'Spicy Symphony';
  const isCOD = (liveOrder?.payment?.payment_method || orderDetails?.paymentMethod) === 'COD';
  const assignedAgent = liveOrder?.agent || null;
  const isRejected = liveOrder?.status === 'rejected';

  // Initialize Leaflet Map
  useEffect(() => {
    if (useSchematicMap || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const startPoint = waypoints[0];
      const endPoint = waypoints[waypoints.length - 1];

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;

      const bounds = L.latLngBounds(waypoints);
      map.fitBounds(bounds, { padding: [45, 45] });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      }).addTo(map);

      tileLayer.on('tileerror', () => {
        setTileErrorOccurred(true);
        setUseSchematicMap(true);
      });

      // 1. Restaurant Marker
      const restIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-container restaurant-pin">
            <div class="pin-badge">🏢</div>
            <div class="pin-tag">${restaurantName}</div>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });
      restaurantMarkerRef.current = L.marker(startPoint, { icon: restIcon }).addTo(map);

      // 2. Customer Marker
      const custIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-container customer-pin">
            <div class="pulse-ring"></div>
            <div class="pin-badge">📍</div>
            <div class="pin-tag customer-tag">Delivery Location</div>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });
      customerMarkerRef.current = L.marker(endPoint, { icon: custIcon }).addTo(map);

      // 3. Planned Route Polyline
      routePolylineRef.current = L.polyline(waypoints, {
        color: '#E53935',
        weight: 5,
        opacity: 0.45,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // 4. Completed Trail Polyline (Solid)
      completedPolylineRef.current = L.polyline([startPoint], {
        color: '#E53935',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // 5. Delivery Agent Marker (Scooter with dynamic rotation)
      const agentIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-container agent-scooter-pin" id="agent-scooter-wrapper">
            <div class="scooter-pulse"></div>
            <div class="scooter-icon-circle" id="agent-scooter-icon">🛵</div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
      agentMarkerRef.current = L.marker(startPoint, { icon: agentIcon, zIndexOffset: 1000 }).addTo(map);
      // Invalidate map size after mount and after layout renders
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.fitBounds(L.latLngBounds(waypoints), { padding: [45, 45] });
        }
      }, 150);

      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
      setUseSchematicMap(true);
    }
  }, [waypoints, useSchematicMap, restaurantName]);

  // Synchronize Agent position & rotation with progress
  useEffect(() => {
    if (useSchematicMap) return;

    const { latLng, bearing, trail } = getInterpolatedPosition(waypoints, progress);

    if (agentMarkerRef.current) {
      agentMarkerRef.current.setLatLng(latLng);

      const iconEl = document.getElementById('agent-scooter-icon');
      if (iconEl) {
        iconEl.style.transform = `rotate(${bearing}deg)`;
      }
    }

    if (completedPolylineRef.current && trail.length > 0) {
      completedPolylineRef.current.setLatLngs(trail);
    }
  }, [progress, waypoints, useSchematicMap]);

  // Stage change progress constraints
  useEffect(() => {
    if (currentStageIndex < 4) {
      setProgress(0);
    } else if (currentStageIndex === 5) {
      setProgress(1);
    }
  }, [currentStageIndex]);

  // Smooth driving animation loop when in "Out for Delivery"
  useEffect(() => {
    if (currentStageIndex !== 4) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const baseDurationMs = 35000 / speedMultiplier;

    const animate = (currentTime) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      setProgress((prev) => {
        const next = prev + delta / baseDurationMs;
        if (next >= 1) {
          // Trigger server advance to delivered if not already
          if (orderId && liveOrder?.status !== 'delivered') {
            apiService.advanceOrderStage(orderId, 'delivered').catch(() => {});
          }
          setCurrentStageIndex(5);
          setToast({ message: '🎉 Your order has been delivered! Enjoy your meal.', type: 'success' });
          return 1;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentStageIndex, speedMultiplier, orderId, liveOrder?.status]);

  // Simulate Next Stage via Real Server API
  const handleSimulateNext = async () => {
    if (!orderId || isRejected || currentStageIndex >= 5) return;

    try {
      if (currentStageIndex === 0) {
        // Restaurant decision: ACCEPT
        const res = await apiService.submitRestaurantDecision(orderId, 'ACCEPT');
        setToast({ message: '✅ Restaurant accepted order. Delivery partner assigned!', type: 'success' });
        setLiveOrder(res.order);
        setCurrentStageIndex(1);
      } else {
        // Advance forward stage in state machine
        const res = await apiService.advanceOrderStage(orderId);
        setToast({ message: res.message || 'Advanced to next stage.', type: 'success' });
        setLiveOrder(res.order);
        await fetchOrderState();
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to advance stage.', type: 'error' });
    }
  };

  // Auto-Run Trip Demo via Server Transitions
  const handleAutoRunDemo = () => {
    setIsAutoSimulating(true);
    setToast({ message: '🚀 Auto-demo started: Fast-tracking real stages.', type: 'success' });

    let step = currentStageIndex;
    const runNext = async () => {
      if (step >= 5 || isRejected) {
        setIsAutoSimulating(false);
        return;
      }

      try {
        if (step === 0) {
          await apiService.submitRestaurantDecision(orderId, 'ACCEPT');
          step = 1;
        } else {
          await apiService.advanceOrderStage(orderId);
          step += 1;
        }
        await fetchOrderState();

        if (step === 4) {
          setSpeedMultiplier(3); // accelerate drive
        } else if (step < 5) {
          autoSimTimerRef.current = setTimeout(runNext, 3000);
        }
      } catch (err) {
        setIsAutoSimulating(false);
        console.warn('Auto-run step stopped:', err.message);
      }
    };

    runNext();
  };

  const handleStopAutoSim = () => {
    setIsAutoSimulating(false);
    if (autoSimTimerRef.current) clearTimeout(autoSimTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('This clears all orders and restores stock. Continue?')) {
      return;
    }
    setResetLoading(true);
    try {
      await apiService.resetDemoDatabase();
      setToast({ message: '🔄 Demo data reset! Stock restored, orders cleared.', type: 'success' });
      setTimeout(() => {
        if (onHome) onHome();
      }, 1000);
    } catch (err) {
      setToast({ message: err.message || 'Failed to reset demo data.', type: 'error' });
      setResetLoading(false);
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds(waypoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45] });
      setToast({ message: 'Map recentered on delivery route.', type: 'success' });
    }
  };

  const routeDistanceKm = useMemo(() => {
    if (!waypoints || waypoints.length < 2) return 1.5;
    const [lat1, lon1] = waypoints[0];
    const [lat2, lon2] = waypoints[waypoints.length - 1];
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(0.3, Math.round(R * c * 10) / 10);
  }, [waypoints]);

  const calculateEta = () => {
    if (isRejected) return 'Cancelled';
    if (currentStageIndex === 5) return 'Delivered';
    const transitMin = Math.max(5, Math.round(routeDistanceKm * 6));
    const totalMin = 15 + transitMin;
    if (currentStageIndex === 0) return `${totalMin} - ${totalMin + 5} mins`;
    if (currentStageIndex === 1) return `${Math.max(15, totalMin - 5)} - ${totalMin} mins`;
    if (currentStageIndex === 2) return `${Math.max(10, totalMin - 10)} mins`;
    if (currentStageIndex === 3) return `${transitMin} mins`;
    const remainingMinutes = Math.max(1, Math.round(transitMin * (1 - progress)));
    return `${remainingMinutes} mins`;
  };

  const currentStage = STAGES[currentStageIndex] || STAGES[0];
  const orderNumber = liveOrder?.order_number || orderDetails?.orderNumber || 'BB-ORDER';
  const totalAmount = liveOrder?.total_amount 
    ?? liveOrder?.payment?.amount 
    ?? orderDetails?.totalAmount 
    ?? orderDetails?.total_amount 
    ?? 0;

  return (
    <div className="order-tracking-screen">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {/* Screen Header */}
      <div className="header tracking-header-bar">
        <button className="back-btn" onClick={onHome} title="Back to Home">←</button>
        <div className="header-title-box">
          <h2 className="text-lg font-bold">Track Order</h2>
          <span className="live-status-badge">
            <span className="live-dot"></span> LIVE
          </span>
        </div>
        {isDemoMode && showDemoPill && (
          <button
            className={`demo-toggle-btn ${isDemoControlsOpen ? 'active' : ''}`}
            onClick={() => setIsDemoControlsOpen(!isDemoControlsOpen)}
            title="Toggle Simulation & Demo Controls"
          >
            <span>🧪 Demo</span>
            <span className="toggle-chevron">{isDemoControlsOpen ? '▴' : '▾'}</span>
          </button>
        )}
      </div>

      <div className="screen-content tracking-screen-body">

        {/* Live ETA Banner */}
        <div className="eta-banner-card">
          <div className="eta-header">
            <div>
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Estimated Delivery</span>
              <h3 className="eta-time text-2xl font-bold">{calculateEta()}</h3>
            </div>
            <div className="eta-pill">
              {isRejected 
                ? '❌ Rejected' 
                : currentStageIndex === 5 
                ? '🎉 Complete' 
                : currentStageIndex === 0 
                ? '⏳ Awaiting' 
                : '⚡ On Time'}
            </div>
          </div>
          <div className="eta-progress-bar-bg">
            <div
              className="eta-progress-bar-fill"
              style={{
                width: isRejected 
                  ? '100%' 
                  : `${currentStageIndex === 5 ? 100 : currentStageIndex === 4 ? 65 + Math.round(progress * 33) : (currentStageIndex + 1) * 16}%`,
                backgroundColor: isRejected ? '#D32F2F' : undefined
              }}
            ></div>
          </div>
          <div className="eta-footer-row text-xs text-secondary mt-2">
            <span className="font-medium">{isRejected ? 'Order Rejected' : currentStage.title}</span>
            <span className="eta-bullet-separator">•</span>
            <span className="font-semibold">Order #{orderNumber}</span>
          </div>
        </div>

        {/* Collapsible Demo Control Panel */}
        {isDemoControlsOpen && (
          <div className="demo-controls-panel slide-in-top">
            <div className="demo-panel-header">
              <span className="font-bold text-xs uppercase tracking-wider text-primary">🕹️ Live Demo Controls</span>
              <span className="text-xs text-secondary">Stage 4b State Machine</span>
            </div>

            {/* Force Restaurant Rejection Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed var(--color-border)' }}>
              <div>
                <span className="text-xs font-bold block" style={{ color: '#F57C00' }}>
                  ⚡ Force restaurant rejection
                </span>
                <span className="text-xs text-secondary">
                  Auto-rejects order during awaiting decision stage
                </span>
              </div>
              <input 
                type="checkbox" 
                checked={forceRejectionDemo} 
                onChange={(e) => setForceRejectionDemo(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: '#F57C00' }}
              />
            </div>

            <div className="demo-action-row" style={{ marginTop: '12px' }}>
              <button
                className="btn btn-primary demo-btn-sm"
                onClick={handleSimulateNext}
                disabled={isRejected || currentStageIndex === 5}
              >
                Simulate Next ▶
              </button>

              {isAutoSimulating ? (
                <button className="btn btn-outline demo-btn-sm stop-btn" onClick={handleStopAutoSim}>
                  ⏹ Stop Auto
                </button>
              ) : (
                <button 
                  className="btn btn-outline demo-btn-sm" 
                  onClick={handleAutoRunDemo}
                  disabled={isRejected || currentStageIndex === 5}
                >
                  ▶ Auto-Run (45s)
                </button>
              )}
            </div>

            <div className="demo-speed-row">
              <span className="text-xs text-secondary font-medium">Trip Speed:</span>
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  className={`speed-pill ${speedMultiplier === speed ? 'active' : ''}`}
                  onClick={() => setSpeedMultiplier(speed)}
                >
                  {speed}x
                </button>
              ))}

              <button
                className="schematic-toggle-btn"
                onClick={() => setUseSchematicMap(!useSchematicMap)}
              >
                {useSchematicMap ? '🗺️ OSM Tiles' : '📐 Schematic Map'}
              </button>
            </div>

            {/* Re-seed demo database button */}
            {isDemoMode && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--color-border)' }}>
                <button
                  type="button"
                  className="btn demo-btn-sm"
                  style={{
                    backgroundColor: '#D32F2F',
                    color: '#FFFFFF',
                    width: '100%',
                    fontWeight: '700',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)'
                  }}
                  onClick={handleResetDemoData}
                  disabled={resetLoading}
                  title="Re-seed database, restore stock, and clear orders"
                >
                  {resetLoading ? 'Resetting Database...' : '🔄 Reset Demo Data (Re-seed DB)'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* If Rejected: Show Dedicated Rejection State Card */}
        {isRejected && (
          <div className="rejected-order-card">
            <div className="rejected-card-header">
              <span className="rejected-badge-icon">✕</span>
              <div>
                <h3>Order Rejected by Restaurant</h3>
                <span className="text-xs text-secondary">Order #{orderNumber}</span>
              </div>
            </div>

            <p className="text-sm">
              We're sorry! The restaurant was unable to accept your order.
            </p>

            <div className="rejected-reason-box">
              <strong className="block text-xs uppercase tracking-wider text-secondary mb-1">Reason</strong>
              <span>{liveOrder?.rejection_reason || 'Kitchen overloaded with pending orders.'}</span>
            </div>

            <div>
              {isCOD ? (
                <span className="rejected-refund-pill pill-nocharge">
                  💵 No charge made (Pay on delivery cancelled)
                </span>
              ) : (
                <span className="rejected-refund-pill pill-refunded">
                  💰 ₹{totalAmount} refunded to original payment method
                </span>
              )}
            </div>

            <p className="text-xs text-secondary mb-4">
              Item stock has been safely restored to the restaurant menu.
            </p>

            <button className="rejected-return-btn" onClick={onHome}>
              ← Return to Restaurant Listing
            </button>
          </div>
        )}

        {/* Live Delivery Map (Interactive OSM Leaflet) */}
        {!isRejected && (
          <div className="map-wrapper-card">
            <div className="map-header-bar">
              <span className="map-badge">⚡ Route View</span>
              <span className="map-subtext text-xs text-secondary font-medium">
                {currentStageIndex === 4 ? 'Scooter is en-route' : 'Driver GPS Route'}
              </span>
            </div>

            {!useSchematicMap ? (
              <div 
                id="leaflet-delivery-map" 
                ref={mapContainerRef} 
                className="leaflet-map-canvas"
              ></div>
            ) : (
              <div className="schematic-map-canvas">
                <div className="schematic-node restaurant-node">
                  <div className="node-icon">🏢</div>
                  <div className="node-label">{restaurantName}</div>
                </div>
                <div className="schematic-node customer-node">
                  <div className="node-icon">📍</div>
                  <div className="node-label">Destination</div>
                </div>
                <svg className="schematic-route-svg">
                  <path d="M 40 180 Q 200 40 360 40" className="schematic-path-bg" />
                  <path
                    d="M 40 180 Q 200 40 360 40"
                    className="schematic-path-active"
                    style={{ strokeDashoffset: `${320 * (1 - progress)}` }}
                  />
                </svg>
                <div
                  className="schematic-agent-node"
                  style={{
                    left: `${40 + progress * 320}px`,
                    top: `${180 - Math.sin(progress * Math.PI) * 110 - progress * 140}px`
                  }}
                >
                  <div className="scooter-circle">🛵</div>
                </div>
                <div className="schematic-watermark">
                  <span>⚡ Offline Fallback Schematic Map</span>
                </div>
              </div>
            )}

            <div className="map-overlay-controls">
              {!useSchematicMap && (
                <button className="map-overlay-btn" onClick={handleRecenter} title="Recenter on Route">
                  ⌖ Recenter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Delivery Partner Card */}
        {!isRejected && (
          assignedAgent ? (
            <div className="delivery-partner-card">
              <div className="partner-main-info">
                <div className="partner-initials-avatar">
                  <span className="initials-text">
                    {(assignedAgent.name || 'RK').split(' ').map(n => n[0]).join('')}
                  </span>
                  <span className="partner-online-dot"></span>
                </div>

                <div className="partner-details">
                  <div className="partner-name-row">
                    <h4 className="font-bold text-base">{assignedAgent.name}</h4>
                    <span className="partner-rating-badge">★ {assignedAgent.rating || 4.9}</span>
                  </div>
                  <p className="partner-vehicle text-xs text-secondary">
                    {assignedAgent.vehicle_model} • <span className="vehicle-plate">{assignedAgent.vehicle_plate}</span>
                  </p>
                  <p className="partner-status-tag text-xs font-semibold text-primary">
                    {currentStageIndex === 5
                      ? 'Delivered successfully'
                      : currentStageIndex === 4
                      ? 'On the way to your delivery location'
                      : currentStageIndex === 3
                      ? 'Collected parcel from restaurant'
                      : 'Assigned to your order'}
                  </p>
                </div>
              </div>

              <div className="partner-actions-row">
                <button
                  className="partner-call-btn"
                  onClick={() => setToast({ message: `Calling ${assignedAgent.name} (${assignedAgent.phone})...`, type: 'success' })}
                >
                  📞 Call Partner
                </button>
                <button
                  className="partner-msg-btn"
                  onClick={() => setToast({ message: 'Message sent: "Please leave at doorstep if unreachable."', type: 'success' })}
                >
                  💬 Message
                </button>
              </div>
            </div>
          ) : (
            <div className="awaiting-agent-card">
              <div className="partner-awaiting-box">
                <span className="awaiting-agent-icon">🛵</span>
                <div>
                  <h5 className="font-semibold text-sm">Delivery Partner</h5>
                  <p className="text-xs text-secondary mt-0.5">
                    Delivery partner will be assigned once the restaurant accepts.
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* Delivery Address & Order Details Summary */}
        <div className="tracking-address-card">
          <div className="address-header">
            <span className="address-icon">📍</span>
            <div>
              <h5 className="font-semibold text-sm">Delivery Destination</h5>
              <p className="text-xs text-secondary mt-0.5">{deliveryAddress}</p>
            </div>
          </div>

          <div className="tracking-payment-summary-row">
            <span className="text-xs text-secondary">Payment Method</span>
            <span className="text-xs font-bold" style={{ color: isCOD ? '#F57C00' : 'var(--color-success)' }}>
              {isCOD ? `Pay on delivery (₹${totalAmount})` : `Paid via Online (₹${totalAmount})`}
            </span>
          </div>
        </div>

        {/* Synchronized Vertical Stage Timeline */}
        {!isRejected && (
          <div className="tracking-card">
            <div className="timeline-header mb-4">
              <h3 className="section-title text-base font-bold">Order Status</h3>
              <span className="text-xs text-secondary">Order #{orderNumber}</span>
            </div>

            <div className="vertical-timeline">
              {STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isActive = index === currentStageIndex;
                const isFuture = index > currentStageIndex;

                let statusClass = '';
                if (isCompleted) statusClass = 'completed';
                if (isActive) statusClass = 'active';
                if (isFuture) statusClass = 'future';

                return (
                  <div key={stage.id} className={`timeline-item ${statusClass}`}>
                    <div className="timeline-marker">
                      <div className="marker-icon">
                        {isCompleted ? '✓' : stage.icon}
                      </div>
                      {index !== STAGES.length - 1 && <div className="marker-line"></div>}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <h4 className="font-bold text-sm">{stage.title}</h4>
                        <span className="timeline-time text-xs font-medium">
                          {isCompleted || isActive ? stage.time : `Est. ${stage.defaultEta}m`}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mt-1">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Primary Action */}
            <div className="tracking-actions mt-6">
              {currentStageIndex < STAGES.length - 1 ? (
                <button
                  className="btn btn-outline w-full"
                  onClick={handleSimulateNext}
                >
                  Simulate Next Stage
                </button>
              ) : (
                <button className="btn btn-primary w-full" onClick={onHome}>
                  Back to Home
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
