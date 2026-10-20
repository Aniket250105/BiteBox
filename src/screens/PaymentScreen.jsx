import React, { useState, useEffect } from 'react';
import './PaymentScreen.css';
import { SiGooglepay, SiPhonepe, SiPaytm } from 'react-icons/si';
import { apiService } from '../services/apiService';
import Toast from '../components/Toast';
import { useDemoPill } from '../utils/useDemoPill';

const PaymentScreen = ({ orderDetails, onBack, onReturnToCart, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'processing' | 'success' | 'failed'
  const [isProcessing, setIsProcessing] = useState(false);
  const [forceFailure, setForceFailure] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const showDemoPill = useDemoPill();
  const [failureInfo, setFailureInfo] = useState(null);
  const [attempts, setAttempts] = useState(1);
  const [toast, setToast] = useState({ message: '', type: '' });

  const total = orderDetails?.totalAmount ?? orderDetails?.grandTotal ?? 0;
  const orderId = orderDetails?.orderId;
  const orderNumber = orderDetails?.orderNumber || 'Pending Order';

  // Check backend health for demo mode
  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.demoMode === 'boolean') {
          setIsDemoMode(data.demoMode);
        }
      })
      .catch(() => {
        // If unreachable, keep default
      });
  }, []);

  // Process Payment
  const handlePay = async () => {
    // Ignore repeat clicks / already processing
    if (isProcessing) return;

    if (!orderId) {
      setToast({ message: 'Missing order reference. Returning to cart.', type: 'error' });
      setTimeout(onBack, 1500);
      return;
    }

    setIsProcessing(true);
    setPaymentState('processing');

    const methodCode = selectedMethod.toUpperCase(); // 'UPI', 'CARD', 'COD'
    const shouldForceFail = selectedMethod !== 'cod' && forceFailure && isDemoMode;

    try {
      const result = await apiService.processPayment({
        orderId,
        paymentMethod: methodCode,
        forceFailure: shouldForceFail
      });

      if (!result.success) {
        // Payment failed at gateway
        setPaymentState('failed');
        setFailureInfo({
          error: result.error || 'Transaction declined by payment gateway.',
          attempts: result.attempts || attempts
        });
        setAttempts(result.attempts ? result.attempts + 1 : attempts + 1);
        return;
      }

      // Success
      setPaymentState('success');
      setTimeout(() => {
        onSuccess(result);
      }, 1400);
    } catch (err) {
      // Check if an item became unavailable between cart and payment
      if (err.itemUnavailable) {
        const itemName = err.itemName || 'An item in your order';
        setToast({ 
          message: `${itemName} is no longer in stock. Returning to cart...`, 
          type: 'error' 
        });
        setTimeout(() => {
          if (onReturnToCart) {
            onReturnToCart(itemName);
          } else {
            onBack();
          }
        }, 1800);
        return;
      }

      // Normal payment failure
      setPaymentState('failed');
      setFailureInfo({
        error: err.message || 'Payment processing failed. Please retry.',
        attempts
      });
      setAttempts(prev => prev + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  // Processing Spinner View
  if (paymentState === 'processing') {
    return (
      <div className="payment-screen center-content">
        <div className="spinner"></div>
        <h3 className="processing-text font-bold text-xl">Processing Payment...</h3>
        <p className="text-secondary text-sm">Communicating with payment gateway for order #{orderNumber}</p>
        <p className="text-xs text-secondary mt-4">Please do not refresh or close this screen.</p>
      </div>
    );
  }

  // Payment Success View
  if (paymentState === 'success') {
    return (
      <div className="payment-screen center-content success-state">
        <div className="success-icon-container">
          <svg className="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h3 className="success-text text-2xl font-bold">
          {selectedMethod === 'cod' ? 'Order Placed!' : 'Payment Successful!'}
        </h3>
        <p className="font-semibold text-sm mt-1">Order #{orderNumber}</p>
        <p className="text-secondary text-xs mt-2">
          {selectedMethod === 'cod'
            ? 'Cash on delivery recorded. Awaiting restaurant confirmation...'
            : 'Transaction verified. Moving to live tracking...'}
        </p>
      </div>
    );
  }

  // Payment Failed State View with Retry Button
  if (paymentState === 'failed') {
    return (
      <div className="payment-screen center-content failed-state">
        <div className="failed-icon-container">
          <span>✕</span>
        </div>
        <h3 className="failed-text text-2xl font-bold">Payment Failed</h3>
        
        {failureInfo?.attempts && (
          <span className="failed-attempt-badge">
            Attempt #{failureInfo.attempts} Failed
          </span>
        )}

        <p className="text-secondary text-sm max-w-sm mb-4">
          {failureInfo?.error || 'Your payment was declined by the bank or gateway.'}
        </p>
        
        <p className="text-xs text-secondary">
          Order #{orderNumber} has not been charged and your stock remains intact.
        </p>

        <div className="failed-actions">
          <button 
            className="retry-pay-btn" 
            onClick={handlePay}
            disabled={isProcessing}
          >
            {isProcessing ? 'Retrying...' : '🔄 Retry Payment'}
          </button>
          
          <button 
            className="change-method-btn" 
            onClick={() => setPaymentState('idle')}
            disabled={isProcessing}
          >
            Change Payment Method
          </button>

          <button 
            className="btn text-secondary text-xs" 
            onClick={onBack}
            style={{ background: 'none', border: 'none', marginTop: '8px' }}
          >
            ← Return to Cart
          </button>
        </div>

        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ message: '', type: '' })} 
        />
      </div>
    );
  }

  return (
    <div className="payment-screen">
      <div className="header payment-header">
        <button className="back-button" onClick={onBack}>←</button>
        <div>
          <h2 className="text-lg font-bold">Payment</h2>
          <p className="text-xs text-secondary">Order #{orderNumber}</p>
        </div>
        {isDemoMode && showDemoPill && (
          <button
            type="button"
            className="demo-toggle-btn"
            style={{
              marginLeft: 'auto',
              background: isDemoOpen ? 'var(--color-primary)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isDemoOpen ? '#FFFFFF' : 'var(--color-text)'
            }}
            onClick={() => setIsDemoOpen(!isDemoOpen)}
            title="Toggle Demo Controls"
          >
            <span>🧪 Demo</span>
            <span>{isDemoOpen ? '▴' : '▾'}</span>
          </button>
        )}
      </div>

      <div className="screen-content">
        <div className="order-recap">
          <div>
            <span className="text-secondary text-xs uppercase tracking-wider block">Total Payable</span>
            <span className="recap-amount font-bold text-2xl">₹{total}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-secondary block">{orderDetails?.restaurant?.name || 'Restaurant Order'}</span>
            <span className="text-xs font-semibold text-primary">{orderDetails?.items?.length || 0} items</span>
          </div>
        </div>

        <h3 className="section-title text-base font-bold">Select Payment Method</h3>

        <div className="payment-methods">
          {/* UPI Option */}
          <div 
            className={`payment-method-card ${selectedMethod === 'upi' ? 'selected' : ''}`}
            onClick={() => setSelectedMethod('upi')}
          >
            <div className="method-header">
              <div className="method-title-group">
                <span className="method-icon">📱</span>
                <div>
                  <span className="font-semibold block">UPI (Instant)</span>
                  <span className="text-xs text-secondary">Google Pay, PhonePe, Paytm, or UPI ID</span>
                </div>
              </div>
              <div className="radio-circle">
                {selectedMethod === 'upi' && <div className="radio-inner"></div>}
              </div>
            </div>
            {selectedMethod === 'upi' && (
              <div className="method-details">
                <div className="upi-options">
                  <button type="button" className="upi-app-btn"><SiGooglepay size={22} color="#4285F4" /> <span>Google Pay</span></button>
                  <button type="button" className="upi-app-btn"><SiPhonepe size={18} color="#5f259f" /> <span>PhonePe</span></button>
                  <button type="button" className="upi-app-btn"><SiPaytm size={22} color="#00BAF2" /> <span>Paytm</span></button>
                </div>
                <div className="upi-manual">
                  <p className="text-xs text-secondary mb-2">Or verify via UPI ID</p>
                  <input 
                    type="text" 
                    defaultValue="aniket@okhdfcbank" 
                    placeholder="example@upi" 
                    className="mock-input" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card Option */}
          <div 
            className={`payment-method-card ${selectedMethod === 'card' ? 'selected' : ''}`}
            onClick={() => setSelectedMethod('card')}
          >
            <div className="method-header">
              <div className="method-title-group">
                <span className="method-icon">💳</span>
                <div>
                  <span className="font-semibold block">Credit / Debit Card</span>
                  <span className="text-xs text-secondary">Visa, Mastercard, RuPay</span>
                </div>
              </div>
              <div className="radio-circle">
                {selectedMethod === 'card' && <div className="radio-inner"></div>}
              </div>
            </div>
            {selectedMethod === 'card' && (
              <div className="method-details card-details">
                <input 
                  type="text" 
                  defaultValue="4532 •••• •••• 8821" 
                  placeholder="Card Number" 
                  className="mock-input" 
                />
                <div className="card-row">
                  <input type="text" defaultValue="08/29" placeholder="MM/YY" className="mock-input half-input" />
                  <input type="password" defaultValue="•••" placeholder="CVV" className="mock-input half-input" maxLength="3" />
                </div>
                <input 
                  type="text" 
                  defaultValue="Aniket Sharma" 
                  placeholder="Name on Card" 
                  className="mock-input" 
                />
              </div>
            )}
          </div>

          {/* Cash on Delivery Option */}
          <div 
            className={`payment-method-card ${selectedMethod === 'cod' ? 'selected' : ''}`}
            onClick={() => setSelectedMethod('cod')}
          >
            <div className="method-header">
              <div className="method-title-group">
                <span className="method-icon">💵</span>
                <div>
                  <span className="font-semibold block">Cash on Delivery</span>
                  <span className="text-xs text-secondary">Pay cash to delivery partner on arrival</span>
                </div>
              </div>
              <div className="radio-circle">
                {selectedMethod === 'cod' && <div className="radio-inner"></div>}
              </div>
            </div>
            {selectedMethod === 'cod' && (
              <div className="method-details">
                <p className="text-xs text-secondary">
                  Pay on delivery (₹{total}) in cash or via UPI directly to the delivery partner on arrival.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Demo-only switch: Force Payment Failure (UPI & Card only - collapsed by default) */}
        {isDemoMode && isDemoOpen && selectedMethod !== 'cod' && (
          <div className="demo-payment-card slide-in-top">
            <div className="demo-payment-info">
              <span className="demo-payment-label">
                ⚡ Force payment failure (Demo)
              </span>
              <span className="demo-payment-desc">
                Simulates gateway rejection for UPI/Card. Stock is preserved.
              </span>
            </div>
            <label className="demo-switch" title="Toggle forced payment failure">
              <input 
                type="checkbox" 
                checked={forceFailure}
                onChange={(e) => setForceFailure(e.target.checked)}
              />
              <span className="demo-slider"></span>
            </label>
          </div>
        )}
      </div>

      <div className="checkout-footer payment-footer">
        <button 
          className="btn btn-primary pay-btn" 
          onClick={handlePay}
          disabled={isProcessing}
        >
          {isProcessing 
            ? 'Processing...' 
            : selectedMethod === 'cod' 
              ? `Place Order • Pay on delivery (₹${total})` 
              : `Pay ₹${total}`}
        </button>
      </div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />
    </div>
  );
};

export default PaymentScreen;
