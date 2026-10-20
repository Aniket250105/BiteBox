import React, { useState, useEffect, useCallback } from 'react';
import './RestaurantPortal.css';
import { apiService } from '../services/apiService';
import Toast from '../components/Toast';

const REJECTION_REASONS = [
  'Kitchen overloaded with incoming orders',
  'Out of key ingredients for selected dishes',
  'Restaurant closing early for maintenance',
  'Delivery area inaccessible currently'
];

const RestaurantPortal = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReasons, setSelectedReasons] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  const loadOrders = useCallback(async () => {
    try {
      const list = await apiService.fetchRestaurantOrders();
      setOrders(list || []);
    } catch (err) {
      console.warn('Failed to refresh restaurant portal orders:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3500);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleDecision = async (orderId, decision) => {
    setProcessingId(orderId);
    const reason = selectedReasons[orderId] || REJECTION_REASONS[0];

    try {
      const res = await apiService.submitRestaurantDecision(orderId, decision, reason);
      if (decision === 'ACCEPT') {
        setToast({ 
          message: `Order #${res.order?.order_number || orderId} accepted! Delivery partner assigned.`, 
          type: 'success' 
        });
      } else {
        const refundMsg = res.refund?.status === 'REFUNDED' 
          ? `₹${res.refund.amount} refunded` 
          : 'No charge made';
        setToast({ 
          message: `Order #${res.order?.order_number || orderId} rejected. (${refundMsg})`, 
          type: 'warning' 
        });
      }
      await loadOrders();
    } catch (err) {
      setToast({ message: err.message || 'Failed to update order decision.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAdvance = async (orderId) => {
    setProcessingId(orderId);
    try {
      const res = await apiService.advanceOrderStage(orderId);
      setToast({ message: res.message || 'Order stage advanced.', type: 'success' });
      await loadOrders();
    } catch (err) {
      setToast({ message: err.message || 'Failed to advance stage.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const formatStatus = (status) => {
    if (status === 'paid, awaiting restaurant decision') return 'Awaiting Decision';
    if (status === 'out_for_delivery') return 'Out for Delivery';
    return status;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'paid, awaiting restaurant decision') return 'badge-awaiting';
    if (status === 'confirmed') return 'badge-confirmed';
    if (status === 'rejected') return 'badge-rejected';
    if (status === 'delivered') return 'badge-delivered';
    return 'badge-progress';
  };

  return (
    <div className="restaurant-portal">
      <div className="portal-container">
        {/* Header */}
        <div className="portal-header">
          <div className="portal-title-group">
            <h1>
              <span>🍳</span> Restaurant Partner Portal
              <span className="portal-tag">Demo Mode</span>
            </h1>
            <p className="text-xs text-secondary mt-1">
              Live management of incoming kitchen orders and kitchen dispatch
            </p>
          </div>

          <div className="portal-header-actions">
            <span className="portal-live-indicator">
              <span className="portal-live-dot"></span> Auto-sync
            </span>
            <button className="portal-refresh-btn" onClick={loadOrders} disabled={isLoading}>
              🔄 Refresh
            </button>
            <a href="/" className="portal-customer-link">
              ← Customer View
            </a>
          </div>
        </div>

        {/* Orders Feed */}
        {orders.length === 0 && !isLoading && (
          <div className="empty-portal">
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
            <h3>No orders received yet</h3>
            <p className="text-secondary text-sm mt-1">
              Place an order in the customer app to see it appear here in real time.
            </p>
          </div>
        )}

        <div className="portal-orders-list">
          {orders.map((ord) => {
            const isAwaiting = ord.status === 'paid, awaiting restaurant decision';
            const isCOD = ord.payment_method === 'COD';
            const isRejected = ord.status === 'rejected';
            const isDelivered = ord.status === 'delivered';
            const canAdvance = ['confirmed', 'preparing', 'picked_up', 'out_for_delivery'].includes(ord.status);

            return (
              <div 
                key={ord.id} 
                className={`portal-order-card ${isAwaiting ? 'pending-decision' : ''} ${ord.status === 'confirmed' ? 'confirmed-order' : ''} ${isRejected ? 'rejected-order' : ''}`}
              >
                {/* Header */}
                <div className="order-card-header">
                  <div>
                    <span className="order-card-id">#{ord.order_number}</span>
                    <div className="order-restaurant-label mt-0.5">
                      {ord.restaurant_emoji} {ord.restaurant_name}
                    </div>
                  </div>
                  <span className={`order-status-badge ${getStatusBadgeClass(ord.status)}`}>
                    {formatStatus(ord.status)}
                  </span>
                </div>

                {/* Items */}
                <div className="order-card-body">
                  <table className="order-items-table">
                    <tbody>
                      {(ord.items || []).map((it) => (
                        <tr key={it.id}>
                          <td><strong>{it.quantity}x</strong> {it.item_name}</td>
                          <td style={{ textAlign: 'right' }}>₹{it.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="order-payment-info">
                    <div>
                      <span className="text-xs text-secondary block">Payment Status</span>
                      {isCOD ? (
                        <span className="order-payment-pill pill-cod">
                          💵 Pay on delivery (₹{ord.total_amount})
                        </span>
                      ) : (
                        <span className="order-payment-pill pill-online">
                          💳 {ord.payment_status === 'REFUNDED' ? `REFUNDED (₹${ord.total_amount})` : `Paid via Online (₹${ord.total_amount})`}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-xs text-secondary block">Total Bill</span>
                      <strong className="text-base">₹{ord.total_amount}</strong>
                    </div>
                  </div>

                  {isRejected && (
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#D32F2F', fontWeight: '600' }}>
                      Reason: {ord.rejection_reason || 'Kitchen unavailable'}
                    </div>
                  )}
                </div>

                {/* Decision Actions */}
                <div className="order-actions-bar">
                  {isAwaiting && (
                    <>
                      <div className="decision-buttons-group">
                        <button 
                          className="btn-accept" 
                          onClick={() => handleDecision(ord.id, 'ACCEPT')}
                          disabled={processingId === ord.id}
                        >
                          {processingId === ord.id ? 'Processing...' : '✅ Accept Order'}
                        </button>
                      </div>

                      <div className="reject-container">
                        <select 
                          className="reject-reason-select"
                          value={selectedReasons[ord.id] || REJECTION_REASONS[0]}
                          onChange={(e) => setSelectedReasons({ ...selectedReasons, [ord.id]: e.target.value })}
                        >
                          {REJECTION_REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button 
                          className="btn-reject" 
                          onClick={() => handleDecision(ord.id, 'REJECT')}
                          disabled={processingId === ord.id}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </>
                  )}

                  {canAdvance && (
                    <button 
                      className="btn-advance" 
                      onClick={() => handleAdvance(ord.id)}
                      disabled={processingId === ord.id}
                    >
                      {processingId === ord.id 
                        ? 'Updating...' 
                        : `Advance Stage (${ord.status === 'confirmed' ? 'Preparing' : ord.status === 'preparing' ? 'Picked Up' : ord.status === 'picked_up' ? 'Out for Delivery' : 'Delivered'}) ▶`}
                    </button>
                  )}

                  {isDelivered && (
                    <span className="text-xs font-semibold text-secondary">
                      ✅ Order completed and delivered to customer.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />
    </div>
  );
};

export default RestaurantPortal;
