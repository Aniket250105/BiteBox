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

const OrderTracking = ({ restaurant, orderDetails, userProfile, onHome, theme = 'light', onToggleTheme }) => {
  // Live server-polled order record
  const [liveOrder, setLiveOrder] = useState(null);
  const orderId = orderDetails?.orderId || orderDetails?.id;
  const showDemoPill = useDemoPill();

  // Helper to compute waypoints given destination and restaurant
  const resolveCurrentWaypoints = useCallback((order, profile) => {
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
  const [isDemoReplaying, setIsDemoReplaying] = useState(false);
  const isDemoReplayingRef = useRef(false);
  const [tileErrorOccurred, setTileErrorOccurred] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Draggable bottom sheet state (half & full)
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartTranslateYRef = useRef(0);
  const hasMovedRef = useRef(false);

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
    if (!orderId || isDemoReplayingRef.current) return;
    try {
      const order = await apiService.fetchOrderById(orderId);
      if (order && !isDemoReplayingRef.current) {
        setLiveOrder(prevOrder => {
          if (
            prevOrder &&
            prevOrder.id === order.id &&
            prevOrder.status === order.status &&
            prevOrder.payment_status === order.payment_status &&
            prevOrder.agent?.id === order.agent?.id &&
            prevOrder.restaurant?.lat === order.restaurant?.lat &&
            prevOrder.restaurant?.lng === order.restaurant?.lng
          ) {
            return prevOrder;
          }
          return order;
        });

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

  const isRejected = liveOrder?.status === 'rejected';

  // Polling on mount and every 3 seconds - stops automatically when delivered or rejected
  useEffect(() => {
    if (isRejected || currentStageIndex === 5) {
      return;
    }
    fetchOrderState();
    const interval = setInterval(fetchOrderState, 3000);
    return () => clearInterval(interval);
  }, [fetchOrderState, isRejected, currentStageIndex]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (autoSimTimerRef.current) clearTimeout(autoSimTimerRef.current);
    };
  }, []);

  // Dynamically update waypoints as soon as live order data loads with coordinates
  useEffect(() => {
    if (liveOrder) {
      const newWaypoints = resolveCurrentWaypoints(liveOrder, userProfile);
      setWaypoints(prevWaypoints => {
        if (prevWaypoints && prevWaypoints.length === newWaypoints.length) {
          const isIdentical = prevWaypoints.every((pt, idx) =>
            Math.abs(pt[0] - newWaypoints[idx][0]) < 0.00001 &&
            Math.abs(pt[1] - newWaypoints[idx][1]) < 0.00001
          );
          if (isIdentical) {
            return prevWaypoints;
          }
        }
        return newWaypoints;
      });
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
  const assignedAgent = liveOrder?.agent || (currentStageIndex >= 1 ? {
    name: 'Ramesh Kumar',
    rating: '4.9',
    vehicle_model: 'Hero Splendor Plus',
    vehicle_plate: 'KA-04-EK-9821',
    phone: '+91 98765 43210'
  } : null);

  // Initialize Leaflet Map ONCE
  useEffect(() => {
    if (useSchematicMap || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const startPoint = waypoints[0];
      const endPoint = waypoints[waypoints.length - 1];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;

      const bounds = L.latLngBounds(waypoints);
      map.fitBounds(bounds, { padding: [55, 55] });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      }).addTo(map);

      let consecutiveTileErrors = 0;
      tileLayer.on('tileerror', () => {
        consecutiveTileErrors++;
        if (consecutiveTileErrors > 6) {
          setTileErrorOccurred(true);
          setUseSchematicMap(true);
        }
      });

      // 1. Restaurant Marker
      const restIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-container restaurant-pin">
            <div class="pin-badge">🍽️</div>
            <div class="pin-tag" id="map-restaurant-pin-tag">${restaurantName}</div>
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
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });
      customerMarkerRef.current = L.marker(endPoint, { icon: custIcon }).addTo(map);

      // 3. Planned Route Polyline (Dashed)
      routePolylineRef.current = L.polyline(waypoints, {
        color: '#b9b1a6',
        weight: 5,
        opacity: 0.85,
        dashArray: '9, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // 4. Completed Trail Polyline (Solid Saffron)
      completedPolylineRef.current = L.polyline([startPoint], {
        color: '#FF6B2C',
        weight: 6,
        opacity: 0.98,
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
        if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
          try {
            mapInstanceRef.current.invalidateSize();
            mapInstanceRef.current.fitBounds(L.latLngBounds(waypoints), { padding: [55, 55] });
          } catch {}
        }
      }, 150);

      const handleResize = () => {
        if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {}
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {}
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
      setUseSchematicMap(true);
    }
  }, [useSchematicMap]);

  // Invalidate map size on window resize and after sheet transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {}
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [isSheetExpanded]);

  // Update existing map markers & route polyline smoothly when waypoints or restaurant name change
  useEffect(() => {
    if (useSchematicMap || !mapInstanceRef.current || !waypoints || waypoints.length < 2) return;

    const startPoint = waypoints[0];
    const endPoint = waypoints[waypoints.length - 1];

    if (restaurantMarkerRef.current) {
      restaurantMarkerRef.current.setLatLng(startPoint);
      const tagEl = document.getElementById('map-restaurant-pin-tag');
      if (tagEl) tagEl.textContent = restaurantName;
    }

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng(endPoint);
    }

    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs(waypoints);
    }

    if (progress === 0 && mapInstanceRef.current && mapInstanceRef.current._loaded) {
      try {
        mapInstanceRef.current.fitBounds(L.latLngBounds(waypoints), { padding: [55, 55] });
      } catch {}
    }
  }, [waypoints, restaurantName, useSchematicMap, progress]);

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
          if (orderId && liveOrder?.status !== 'delivered') {
            apiService.advanceOrderStage(orderId, 'delivered').catch(() => {});
          }
          setCurrentStageIndex(5);
          setIsAutoSimulating(false);
          setIsDemoReplaying(false);
          isDemoReplayingRef.current = false;
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

  // Simulate Next Stage via Real Server API (with robust local fallback)
  const handleSimulateNext = async () => {
    if (isRejected || currentStageIndex >= 5) return;

    try {
      if (currentStageIndex === 0) {
        if (orderId) {
          try {
            const res = await apiService.submitRestaurantDecision(orderId, 'ACCEPT');
            if (res?.order) setLiveOrder(res.order);
          } catch (e) {
            console.warn('Decision API note:', e.message);
          }
        }
        setToast({ message: 'Restaurant accepted order. Delivery partner assigned!', type: 'success' });
        setCurrentStageIndex(1);
      } else {
        const nextStage = currentStageIndex + 1;
        if (orderId) {
          try {
            const res = await apiService.advanceOrderStage(orderId);
            if (res?.order) setLiveOrder(res.order);
            await fetchOrderState();
          } catch (e) {
            console.warn('Stage advance API note:', e.message);
          }
        }
        setCurrentStageIndex(nextStage);
        const stageToasts = {
          2: '🍳 Kitchen is preparing your dishes fresh.',
          3: '🎒 Ramesh Kumar has collected the order.',
          4: '🛵 Delivery partner is on the way! Tracing live route...',
          5: '🎉 Your order has been delivered! Enjoy your meal.'
        };
        setToast({ message: stageToasts[nextStage] || 'Advanced to next stage.', type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.message || 'Advanced stage.', type: 'info' });
      setCurrentStageIndex(prev => Math.min(prev + 1, 5));
    }
  };

  // Auto-Run Trip Demo via Server Transitions & Live Route Tracing
  const handleAutoRunDemo = () => {
    if (currentStageIndex >= 5) {
      handleRestartDemo();
      return;
    }

    setIsAutoSimulating(true);
    setToast({ message: '🚀 Live delivery demo started! Simulating journey...', type: 'success' });

    let step = currentStageIndex;
    const runNext = async () => {
      if (step >= 5 || isRejected) {
        setIsAutoSimulating(false);
        return;
      }

      try {
        if (step === 0) {
          if (orderId) {
            try {
              const res = await apiService.submitRestaurantDecision(orderId, 'ACCEPT');
              if (res?.order) setLiveOrder(res.order);
            } catch (e) {
              console.warn('Demo accept error:', e.message);
            }
          }
          step = 1;
          setCurrentStageIndex(1);
          setToast({ message: 'Restaurant confirmed! Ramesh Kumar assigned.', type: 'success' });
        } else {
          step += 1;
          if (orderId) {
            try {
              const res = await apiService.advanceOrderStage(orderId);
              if (res?.order) setLiveOrder(res.order);
            } catch (e) {
              console.warn('Demo advance error:', e.message);
            }
          }
          setCurrentStageIndex(step);
          if (step === 2) {
            setToast({ message: '🍳 Kitchen is preparing your food fresh...', type: 'info' });
          } else if (step === 3) {
            setToast({ message: '🎒 Order picked up by Ramesh Kumar!', type: 'info' });
          } else if (step === 4) {
            setToast({ message: '🛵 On the way! Tracing live route to doorstep...', type: 'success' });
          }
        }

        if (orderId && !isDemoReplayingRef.current) {
          fetchOrderState().catch(() => {});
        }

        if (step === 4) {
          // Out for delivery: speed up route driving animation to 3x for crisp realistic demo
          setSpeedMultiplier(prev => Math.max(prev, 3));
          if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
            try {
              mapInstanceRef.current.fitBounds(L.latLngBounds(waypoints), { padding: [50, 50] });
            } catch {}
          }
          // The animationFrame driving loop takes over until reaching step 5!
        } else if (step < 5) {
          autoSimTimerRef.current = setTimeout(runNext, 2200);
        }
      } catch (err) {
        console.warn('Auto-run step caught:', err.message);
        step += 1;
        setCurrentStageIndex(step);
        if (step < 4) {
          autoSimTimerRef.current = setTimeout(runNext, 2200);
        } else if (step === 4) {
          setSpeedMultiplier(prev => Math.max(prev, 3));
        }
      }
    };

    runNext();
  };

  const handleStopAutoSim = () => {
    setIsAutoSimulating(false);
    if (autoSimTimerRef.current) clearTimeout(autoSimTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setToast({ message: '⏸ Live demo paused.', type: 'info' });
  };

  const handleRestartDemo = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (autoSimTimerRef.current) clearTimeout(autoSimTimerRef.current);
    setIsAutoSimulating(false);
    setIsDemoReplaying(true);
    isDemoReplayingRef.current = true;
    setProgress(0);
    setCurrentStageIndex(0);
    if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
      try {
        mapInstanceRef.current.fitBounds(L.latLngBounds(waypoints), { padding: [55, 55] });
      } catch {}
    }
    setToast({ message: '🔄 Live demo reset. Tap Start Demo to trace!', type: 'success' });
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
    if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
      try {
        const bounds = L.latLngBounds(waypoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: [55, 55] });
        setToast({ message: 'Map recentered on delivery route.', type: 'success' });
      } catch {}
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

  // Existing distance-based ETA calculation
  const calculateEta = () => {
    if (isRejected) return 'Cancelled';
    if (currentStageIndex === 5) return 'Delivered';
    const transitMin = Math.max(5, Math.round(routeDistanceKm * 6));
    const totalMin = 15 + transitMin;
    if (currentStageIndex === 0) return `${totalMin} - ${totalMin + 5} min`;
    if (currentStageIndex === 1) return `${Math.max(15, totalMin - 5)} - ${totalMin} min`;
    if (currentStageIndex === 2) return `${Math.max(10, totalMin - 10)} min`;
    if (currentStageIndex === 3) return `${transitMin} min`;
    const remainingMinutes = Math.max(1, Math.round(transitMin * (1 - progress)));
    return `${remainingMinutes} min`;
  };

  // Live ETA arrival time (e.g. 12:35 PM)
  const etaDeliveryTime = useMemo(() => {
    const d = new Date();
    const remainingMin = Math.max(1, Math.round(Math.max(5, Math.round(routeDistanceKm * 6)) * (1 - progress)));
    d.setMinutes(d.getMinutes() + remainingMin);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [routeDistanceKm, progress]);

  const orderNumber = liveOrder?.order_number || orderDetails?.orderNumber || 'BB-ORDER';
  const totalAmount = liveOrder?.total_amount 
    ?? liveOrder?.payment?.amount 
    ?? orderDetails?.totalAmount 
    ?? orderDetails?.total_amount 
    ?? 0;

  const itemCount = useMemo(() => {
    if (liveOrder?.items && Array.isArray(liveOrder.items) && liveOrder.items.length > 0) {
      return liveOrder.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
    if (orderDetails?.items && Array.isArray(orderDetails.items) && orderDetails.items.length > 0) {
      return orderDetails.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
    if (orderDetails?.itemCount) {
      return orderDetails.itemCount;
    }
    return 1;
  }, [liveOrder?.items, orderDetails?.items, orderDetails?.itemCount]);

  // Bottom Sheet Drag Handlers
  const handlePointerDown = (e) => {
    dragStartYRef.current = e.clientY;
    dragStartTranslateYRef.current = sheetTranslateY;
    hasMovedRef.current = false;
    setIsDraggingSheet(true);
    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch {}
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

    if (!hasMovedRef.current) {
      setIsSheetExpanded(prev => !prev);
      setSheetTranslateY(0);
      return;
    }

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
  };

  return (
    <div className="order-tracking-screen" id="order-tracking-screen">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {/* Top Floating Controls over Map */}
      <div className="tracking-top-bar" role="navigation" aria-label="Tracking controls">
        <button 
          type="button" 
          className="circbtn back-btn" 
          onClick={onHome} 
          aria-label="Back to home"
          id="tracking-back-btn"
          title="Back to Home"
        >
          ←
        </button>

        <div className="tracking-top-right">
          {isDemoMode && (
            <button
              type="button"
              className={`chiplive-demo-btn demo-toggle-btn ${isDemoControlsOpen ? 'active' : ''}`}
              onClick={() => setIsDemoControlsOpen(prev => !prev)}
              title="Toggle Simulation & Demo Controls"
              id="tracking-demo-pill"
            >
              <span>🧪 Demo</span>
              <span className="toggle-chevron">{isDemoControlsOpen ? '▴' : '▾'}</span>
            </button>
          )}

          <div className="chiplive" aria-label="Live tracking active">
            <i className="live-dot-pulse" aria-hidden="true"></i>
            <span>Live tracking</span>
          </div>

          {onToggleTheme && (
            <button
              type="button"
              className="circbtn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
              aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            >
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Full-bleed Live Delivery Map (Interactive Leaflet or Schematic SVG) */}
      <div className="tmap map-wrapper-card" id="delivery-tracking-map-wrapper">
        {!useSchematicMap ? (
          <div 
            id="leaflet-delivery-map" 
            ref={mapContainerRef} 
            className="leaflet-map-canvas"
          ></div>
        ) : (
          <div className="schematic-map-canvas">
            <svg width="100%" height="100%" viewBox="0 0 370 410" preserveAspectRatio="xMidYMid slice" className="schematic-map-svg">
              <rect width="370" height="410" fill="var(--map-land, #F3EEE4)"/>
              <path d="M0 300 C80 270 120 330 200 312 C270 296 320 336 370 308 L370 410 L0 410 Z" fill="#CFE3F3"/>
              <rect x="22" y="110" width="90" height="70" rx="16" fill="#D9EBD3"/>
              <rect x="240" y="196" width="100" height="64" rx="16" fill="#D9EBD3"/>
              <g stroke="#fff" strokeWidth="13" strokeLinecap="round" fill="none">
                <path d="M0 150 H370"/><path d="M0 240 H370"/>
                <path d="M80 0 V410"/><path d="M200 0 V410"/><path d="M304 0 V410"/>
              </g>
              <g stroke="#e8dfd2" strokeWidth="1" fill="none">
                <path d="M0 150 H370"/><path d="M0 240 H370"/>
                <path d="M80 0 V410"/><path d="M200 0 V410"/><path d="M304 0 V410"/>
              </g>
              <path d="M80 240 H200 V150 H304 V120" stroke="#b9b1a6" strokeWidth="5" strokeDasharray="9 8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d={`M80 240 H200 V${240 - progress * 90}`} stroke="#FF6B2C" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="80" cy="240" r="17" fill="#fff" stroke="#17171C" strokeWidth="3"/>
              <text x="80" y="246" fontSize="17" textAnchor="middle">🍽️</text>
              <circle cx="200" cy={240 - progress * 90} r="30" fill="rgba(255,107,44,.18)"/>
              <circle cx="200" cy={240 - progress * 90} r="19" fill="#FF6B2C" stroke="#fff" strokeWidth="3"/>
              <text x="200" y={247 - progress * 90} fontSize="19" textAnchor="middle">🛵</text>
              <path d="M304 124 C292 106 292 90 304 82 C316 90 316 106 304 124 Z" fill="#17171C"/>
              <circle cx="304" cy="100" r="6" fill="#fff"/>
              <text x="362" y="402" fontSize="8.5" fill="#7b7b86" textAnchor="end">Leaflet | © OpenStreetMap contributors</text>
            </svg>
          </div>
        )}

        {!useSchematicMap && (
          <div className="map-overlay-controls">
            <button type="button" className="map-overlay-btn" onClick={handleRecenter} title="Recenter on Route">
              ⌖ Recenter
            </button>
          </div>
        )}
      </div>

      {/* Draggable Bottom Sheet (.sheet5) */}
      <div 
        className={`sheet5 ${isSheetExpanded ? 'expanded' : 'collapsed'} ${isDraggingSheet ? 'is-dragging' : ''}`}
        style={sheetTranslateY !== 0 ? { transform: `translateY(${sheetTranslateY}px)`, transition: 'none' } : undefined}
      >
        {/* Drag Handle & Tappable Header Area */}
        <div 
          className="handle" 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="button"
          tabIndex={0}
          aria-label={isSheetExpanded ? 'Collapse order details' : 'Expand order details'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsSheetExpanded(prev => !prev);
            }
          }}
        ></div>

        {/* ETA / Header Row (.arr) */}
        <div className="arr">
          <div>
            <small>
              {isRejected 
                ? 'Status' 
                : currentStageIndex === 5 
                ? 'Status' 
                : currentStageIndex === 4 
                ? 'Arriving in' 
                : 'Estimated delivery'}
            </small>
            <b>
              {isRejected ? (
                'Cancelled'
              ) : currentStageIndex === 5 ? (
                'Delivered!'
              ) : currentStageIndex === 4 ? (
                <>
                  {Math.max(1, Math.round(Math.max(5, Math.round(routeDistanceKm * 6)) * (1 - progress)))}{' '}
                  <em>min</em>
                </>
              ) : (
                <>
                  {calculateEta().replace(' min', '')}{' '}
                  <em>min</em>
                </>
              )}
            </b>
          </div>

          {/* Status pill: "⚡ On time" is ONLY shown when out for delivery */}
          <div 
            className={`ontime ${
              isRejected 
                ? 'eta-rejected' 
                : currentStageIndex === 5 
                ? 'eta-done' 
                : currentStageIndex === 4 
                ? '' 
                : currentStageIndex === 0 
                ? 'eta-awaiting' 
                : 'eta-progress'
            }`}
          >
            {isRejected 
              ? '❌ Rejected' 
              : currentStageIndex === 5 
              ? '🎉 Delivered' 
              : currentStageIndex === 4 
              ? `⚡ On time · ${etaDeliveryTime}` 
              : currentStageIndex === 0 
              ? '⏳ Awaiting' 
              : currentStageIndex === 1
              ? '📝 Confirmed'
              : currentStageIndex === 2
              ? '🍳 Cooking'
              : '🎒 Picked up'}
          </div>
        </div>

        {/* If Rejected: Dedicated Rejection View Card (Replaces Stepper) */}
        {isRejected ? (
          <div className="rejected-order-card" role="alert">
            <div className="rejected-card-header">
              <span className="rejected-badge-icon" aria-hidden="true">✕</span>
              <div>
                <h3>Order Rejected by Restaurant</h3>
                <span className="text-xs text-secondary">Order #{orderNumber}</span>
              </div>
            </div>

            <p className="rejection-desc">
              We're sorry! The restaurant was unable to accept your order.
            </p>

            <div className="rejected-reason-box">
              <strong className="block text-xs uppercase tracking-wider text-secondary mb-1">Reason</strong>
              <span>{liveOrder?.rejection_reason || 'Kitchen overloaded with pending orders.'}</span>
            </div>

            <div className="rejected-refund-container">
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

            <button type="button" className="rejected-return-btn bigbtn" onClick={onHome}>
              ← Return to Restaurant Listing
            </button>
          </div>
        ) : (
          /* 5-Stage Horizontal Stepper (.hstep) */
          <div className="hstep" role="list" aria-label="Order progress tracker">
            {/* 1: Confirmed */}
            <div 
              className={`n ${currentStageIndex > 1 ? 'd' : currentStageIndex === 1 ? 'a' : ''}`} 
              role="listitem"
              aria-current={currentStageIndex === 1 ? 'step' : undefined}
            >
              <i>{currentStageIndex > 1 ? '✓' : currentStageIndex === 1 ? '📝' : '○'}</i>
              <span>Confirmed</span>
            </div>

            {/* 2: Cooking */}
            <div 
              className={`n ${currentStageIndex > 2 ? 'd' : currentStageIndex === 2 ? 'a' : ''}`} 
              role="listitem"
              aria-current={currentStageIndex === 2 ? 'step' : undefined}
            >
              <i>{currentStageIndex > 2 ? '✓' : currentStageIndex === 2 ? '🍳' : '○'}</i>
              <span>Cooking</span>
            </div>

            {/* 3: Picked up */}
            <div 
              className={`n ${currentStageIndex > 3 ? 'd' : currentStageIndex === 3 ? 'a' : ''}`} 
              role="listitem"
              aria-current={currentStageIndex === 3 ? 'step' : undefined}
            >
              <i>{currentStageIndex > 3 ? '✓' : currentStageIndex === 3 ? '🎒' : '○'}</i>
              <span>Picked up</span>
            </div>

            {/* 4: On the way */}
            <div 
              className={`n ${currentStageIndex > 4 ? 'd' : currentStageIndex === 4 ? 'a' : ''}`} 
              role="listitem"
              aria-current={currentStageIndex === 4 ? 'step' : undefined}
            >
              <i>{currentStageIndex > 4 ? '✓' : currentStageIndex === 4 ? '🛵' : '○'}</i>
              <span>On the way</span>
            </div>

            {/* 5: Delivered */}
            <div 
              className={`n ${currentStageIndex === 5 ? 'd' : ''}`} 
              role="listitem"
              aria-current={currentStageIndex === 5 ? 'step' : undefined}
            >
              <i>{currentStageIndex === 5 ? '✓' : '○'}</i>
              <span>Delivered</span>
            </div>
          </div>
        )}

        {/* Delivery Partner Card (.agent5) - Hidden during rejection */}
        {!isRejected && (
          assignedAgent ? (
            <div className="agent5">
              <div className="av">
                {(assignedAgent.name || 'RK').split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="tx">
                <b>
                  {assignedAgent.name}
                  <span className="st">★ {assignedAgent.rating || '4.9'}</span>
                </b>
                <span>{assignedAgent.vehicle_model} · {assignedAgent.vehicle_plate}</span>
              </div>
              <button
                type="button"
                className="rbtn m partner-msg-btn"
                onClick={() => setToast({ message: 'Message sent: "Please leave at doorstep if unreachable."', type: 'success' })}
                aria-label="Message delivery partner"
                title="Message partner"
              >
                💬
              </button>
              <button
                type="button"
                className="rbtn c partner-call-btn"
                onClick={() => setToast({ message: `Calling ${assignedAgent.name} (${assignedAgent.phone || '+91 98765 43210'})...`, type: 'success' })}
                aria-label="Call delivery partner"
                title="Call partner"
              >
                📞
              </button>
            </div>
          ) : (
            <div className="agent5 awaiting awaiting-agent-card">
              <div className="av awaiting-av">🛵</div>
              <div className="tx">
                <b>Delivery Partner</b>
                <span>Delivery partner will be assigned once the restaurant accepts.</span>
              </div>
            </div>
          )
        )}

        {/* Interactive Live Tracking Demo Card */}
        <div className="live-demo-card" id="live-tracking-demo-card">
          <div className="live-demo-card-header">
            <div className="live-demo-badge">
              <span className={`live-demo-dot ${isAutoSimulating ? 'active-pulse' : ''}`} aria-hidden="true"></span>
              <span className="live-demo-title">Live Delivery Demo</span>
            </div>
            <span className="live-demo-step-badge">
              {currentStageIndex === 0 && 'Stage 1/5 · Awaiting'}
              {currentStageIndex === 1 && 'Stage 2/5 · Confirmed'}
              {currentStageIndex === 2 && 'Stage 3/5 · Cooking'}
              {currentStageIndex === 3 && 'Stage 4/5 · Picked Up'}
              {currentStageIndex === 4 && 'Stage 5/5 · En Route 🛵'}
              {currentStageIndex === 5 && 'Completed · Delivered 🎉'}
            </span>
          </div>

          <p className="live-demo-subtitle">
            {currentStageIndex === 0 && 'Simulate restaurant accepting, assigning rider & live GPS route tracing.'}
            {currentStageIndex === 1 && 'Order confirmed! Kitchen is prepping the dishes fresh.'}
            {currentStageIndex === 2 && 'Dishes being cooked fresh in the kitchen.'}
            {currentStageIndex === 3 && 'Ramesh Kumar collected your package from the counter.'}
            {currentStageIndex === 4 && 'Rider on the road! Tracing live GPS coordinates along the road.'}
            {currentStageIndex === 5 && 'Delivered to your doorstep! Enjoy your meal.'}
          </p>

          <div className="live-demo-actions-row">
            {currentStageIndex < 5 && !isRejected ? (
              <>
                {!isAutoSimulating ? (
                  <button
                    type="button"
                    className="live-demo-main-btn"
                    onClick={handleAutoRunDemo}
                    id="start-live-tracking-demo-btn"
                  >
                    <span className="btn-icon">▶</span>
                    <span>Start Live Demo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="live-demo-pause-btn"
                    onClick={handleStopAutoSim}
                    id="pause-live-tracking-demo-btn"
                  >
                    <span className="btn-icon">⏸</span>
                    <span>Pause Demo</span>
                  </button>
                )}

                <button
                  type="button"
                  className="live-demo-next-btn"
                  onClick={handleSimulateNext}
                  disabled={isAutoSimulating}
                  id="next-stage-demo-btn"
                  title="Advance single stage"
                >
                  <span>Next Step ⏭</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="live-demo-main-btn live-demo-replay-btn"
                onClick={handleRestartDemo}
                id="replay-live-tracking-demo-btn"
              >
                <span className="btn-icon">🔄</span>
                <span>Replay Live Demo</span>
              </button>
            )}
          </div>

          <div className="live-demo-footer-row">
            <div className="live-demo-speed-selector">
              <span className="speed-lbl">Speed:</span>
              {[1, 2, 5].map((spd) => (
                <button
                  type="button"
                  key={spd}
                  className={`speed-pill-btn ${speedMultiplier === spd ? 'active' : ''}`}
                  onClick={() => setSpeedMultiplier(spd)}
                  title={`Set simulation speed to ${spd}x`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              type="button"
              className="demo-toggle-drawer-btn"
              onClick={() => setIsDemoControlsOpen(prev => !prev)}
            >
              {isDemoControlsOpen ? 'Options ▴' : 'Options ▾'}
            </button>
          </div>
        </div>

        {/* Order Summary Row (.osum) */}
        <div className="osum">
          <div>
            <b>Order #{orderNumber}</b>
            <span>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · {isCOD ? 'Pay on delivery' : 'Paid online'}
            </span>
          </div>
          <b className="osum-total">₹{totalAmount}</b>
        </div>

        {/* Expanded Sheet Extra Content */}
        <div className="tracking-dest-card">
          <div className="dl">
            <div className="dest-icon" aria-hidden="true">📍</div>
            <div className="tx">
              <small>Deliver to</small>
              <b>{deliveryAddress}</b>
              <span>Restaurant: {restaurantName}</span>
            </div>
          </div>
        </div>

        {/* Completed Delivery Celebration Banner */}
        {currentStageIndex === 5 && !isRejected && (
          <div className="delivered-card">
            <div className="delivered-icon" aria-hidden="true">🎉</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success-text, #137A52)' }}>
              Order Delivered!
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #7B7B86)', marginTop: '4px' }}>
              Enjoy your meal from {restaurantName}. Thanks for choosing BiteBox!
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                className="bigbtn"
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  color: 'var(--sun, #FF6B2C)',
                  border: '1.5px solid var(--sun, #FF6B2C)',
                  boxShadow: 'none'
                }}
                onClick={handleRestartDemo}
              >
                🔄 Replay Demo
              </button>
              <button type="button" className="bigbtn" style={{ flex: 1 }} onClick={onHome}>
                Back to Home →
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Demo Control Panel */}
        {isDemoControlsOpen && (
          <div className="demo-controls-panel">
            <div className="demo-panel-header">
              <span style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', color: 'var(--sun, #FF6B2C)' }}>
                🕹️ Live Demo Controls
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #7B7B86)' }}>
                Stage 4b State Machine
              </span>
            </div>

            {/* Glassmorphism Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed var(--border-line, #EFE6DC)' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', color: 'var(--sun, #FF6B2C)' }}>
                  🪟 Glassmorphism Layer
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #7B7B86)' }}>
                  Toggle translucent glass surfaces across the app
                </span>
              </div>
              <button
                type="button"
                className="btn-glass-toggle"
                style={{
                  background: isGlassOn ? 'var(--sunsoft)' : 'var(--bg-surface)',
                  color: isGlassOn ? 'var(--sun)' : 'var(--text-main)',
                  border: '1.5px solid var(--border-line)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '700',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
                onClick={handleToggleGlass}
              >
                {isGlassOn ? 'Glass: ON' : 'Glass: OFF'}
              </button>
            </div>

            {/* Force Restaurant Rejection Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed var(--border-line, #EFE6DC)' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', color: '#F57C00' }}>
                  ⚡ Force restaurant rejection
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #7B7B86)' }}>
                  Auto-rejects order during awaiting decision stage
                </span>
              </div>
              <input 
                type="checkbox" 
                checked={forceRejectionDemo} 
                onChange={(e) => setForceRejectionDemo(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: '#F57C00', cursor: 'pointer' }}
              />
            </div>

            {/* Step Advance & Auto-Run Buttons */}
            <div className="demo-action-row">
              <button
                type="button"
                className="demo-btn-sm demo-btn-primary"
                onClick={handleSimulateNext}
                disabled={isRejected || currentStageIndex === 5}
              >
                Simulate Next ▶
              </button>

              {isAutoSimulating ? (
                <button type="button" className="demo-btn-sm demo-btn-outline stop-btn" onClick={handleStopAutoSim}>
                  ⏹ Stop Auto
                </button>
              ) : (
                <button 
                  type="button"
                  className="demo-btn-sm demo-btn-outline" 
                  onClick={handleAutoRunDemo}
                  disabled={isRejected || currentStageIndex === 5}
                >
                  ▶ Auto-Run (45s)
                </button>
              )}
            </div>

            {/* Speed Multiplier and Schematic Map Toggle */}
            <div className="demo-speed-row">
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #7B7B86)', fontWeight: '600' }}>Speed:</span>
              {[1, 2, 5].map((speed) => (
                <button
                  type="button"
                  key={speed}
                  className={`speed-pill ${speedMultiplier === speed ? 'active' : ''}`}
                  onClick={() => setSpeedMultiplier(speed)}
                >
                  {speed}x
                </button>
              ))}

              <button
                type="button"
                className="schematic-toggle-btn"
                onClick={() => setUseSchematicMap(prev => !prev)}
              >
                {useSchematicMap ? '🗺️ OSM Tiles' : '📐 Schematic Map'}
              </button>
            </div>

            {/* Re-seed demo database button */}
            {isDemoMode && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-line, #EFE6DC)' }}>
                <button
                  type="button"
                  style={{
                    backgroundColor: '#D32F2F',
                    color: '#FFFFFF',
                    width: '100%',
                    fontWeight: '700',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    minHeight: '44px'
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
      </div>
    </div>
  );
};

export default OrderTracking;
