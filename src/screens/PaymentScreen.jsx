import React, { useState, useEffect } from 'react';
import './PaymentScreen.css';
import { SiGooglepay, SiPhonepe, SiPaytm } from 'react-icons/si';
import { apiService, API_BASE } from '../services/apiService';
import Toast from '../components/Toast';
import SlideToPay from '../components/SlideToPay';
import { useDemoPill } from '../utils/useDemoPill';

const PaymentScreen = ({ orderDetails, onBack, onReturnToCart, onSuccess, theme = 'light', onToggleTheme }) => {
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'cod'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm'
  const [upiIdInput, setUpiIdInput] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'processing' | 'success' | 'failed'
  const [isProcessing, setIsProcessing] = useState(false);
  const [forceFailure, setForceFailure] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const showDemoPill = useDemoPill();
  const [failureInfo, setFailureInfo] = useState(null);
  const [attempts, setAttempts] = useState(1);
  const [toast, setToast] = useState({ message: '', type: '' });
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

  // Card form state (strictly client-side only - never saved, stored, or sent over network)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const total = orderDetails?.totalAmount ?? orderDetails?.grandTotal ?? 0;
  const orderId = orderDetails?.orderId;
  const orderNumber = orderDetails?.orderNumber || 'Pending Order';
  const restaurantName = orderDetails?.restaurant?.name || 'Restaurant';
  const itemCount = orderDetails?.items?.length || 0;
  const deliveryAddress = orderDetails?.deliveryAddress || orderDetails?.restaurant?.address || 'Current Address';

  // Check backend health for demo mode
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

  // Process Payment
  const handlePay = async () => {
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

  const handleVerifyUpi = () => {
    if (!upiIdInput.includes('@')) {
      setToast({ message: 'Please enter a valid UPI ID (e.g. name@upi)', type: 'error' });
      setIsUpiVerified(false);
    } else {
      setIsUpiVerified(true);
      setToast({ message: 'UPI ID verified successfully!', type: 'success' });
    }
  };

  // Processing View
  if (paymentState === 'processing') {
    return (
      <div className="payment-screen center-content">
        <div className="payment-spinner" />
        <h3 className="processing-title">Processing Payment...</h3>
        <p className="processing-sub">Communicating with payment gateway for order #{orderNumber}</p>
        <small className="processing-note">Please do not close this screen.</small>
      </div>
    );
  }

  // Payment Success View
  if (paymentState === 'success') {
    return (
      <div className="payment-screen center-content">
        <div className="payment-success-badge">✓</div>
        <h3 className="success-title">
          {selectedMethod === 'cod' ? 'Order Placed!' : 'Payment Successful!'}
        </h3>
        <p className="success-order-num">Order #{orderNumber}</p>
        <p className="success-sub">
          {selectedMethod === 'cod'
            ? 'Cash on delivery recorded. Awaiting restaurant confirmation...'
            : 'Transaction verified. Moving to live tracking...'}
        </p>
      </div>
    );
  }

  // Failed State View with Retry
  if (paymentState === 'failed') {
    return (
      <div className="payment-screen center-content failed-state">
        <div className="failed-icon-badge">✕</div>
        <h3 className="failed-title">Payment Failed</h3>
        
        {failureInfo?.attempts && (
          <span className="failed-attempt-pill">
            Attempt #{failureInfo.attempts} Failed
          </span>
        )}

        <p className="failed-desc">
          {failureInfo?.error || 'Your payment was declined by the bank or gateway.'}
        </p>
        
        <p className="failed-note">
          Order #{orderNumber} has not been charged and your stock remains intact.
        </p>

        <div className="failed-actions-col">
          <button 
            type="button"
            className="bigbtn" 
            onClick={handlePay}
            disabled={isProcessing}
          >
            {isProcessing ? 'Retrying...' : '🔄 Retry Payment'}
          </button>
          
          <button 
            type="button"
            className="btn-retry" 
            style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-line)' }}
            onClick={() => setPaymentState('idle')}
            disabled={isProcessing}
          >
            Change Payment Method
          </button>

          <button 
            type="button"
            className="return-cart-btn" 
            onClick={onBack}
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
      {/* 1. Top Bar */}
      <div className="payment-topbar">
        <button 
          type="button" 
          className="circbtn" 
          onClick={onBack}
          aria-label="Back to checkout"
        >
          ←
        </button>
        <div className="payment-title-col">
          <b>Payment</b>
          <span>Step 2 of 3</span>
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

        {isDemoMode && showDemoPill && (
          <button
            type="button"
            className={`demo-toggle-chip ${isDemoOpen ? 'active' : ''}`}
            onClick={() => setIsDemoOpen(!isDemoOpen)}
            title="Toggle Demo Controls"
          >
            <span>🧪 Demo</span>
          </button>
        )}
      </div>

      <div className="payment-content-scroll">
        {/* 2. Amount Glow Hero Card */}
        <div className="payment-hero-card">
          <small>Amount to pay</small>
          <b>₹{total}</b>
          <span>
            {restaurantName} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
            {orderDetails?.couponCode ? ` · ${orderDetails.couponCode} applied` : ''}
          </span>
        </div>

        {/* Collapsible Demo Control Panel */}
        {isDemoOpen && (
          <div className="demo-rehearsal-panel slide-in-top" style={{ position: 'relative', top: 'auto', left: 'auto', right: 'auto', margin: '10px 16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-primary">
                  🪟 Glassmorphism Layer
                </span>
                <p className="text-xs text-secondary" style={{ marginTop: '2px', fontSize: '0.72rem' }}>
                  Toggle translucent glass surfaces across the app
                </p>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border-line)', paddingTop: '8px' }}>
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-primary">
                  ⚡ Force Payment Failure
                </span>
                <p className="text-xs text-secondary" style={{ marginTop: '2px', fontSize: '0.72rem' }}>
                  Simulates a declined card/gateway error for testing retry.
                </p>
              </div>
              <input 
                type="checkbox" 
                checked={forceFailure} 
                onChange={(e) => setForceFailure(e.target.checked)} 
                style={{ width: '20px', height: '20px', accentColor: 'var(--sun)' }}
              />
            </div>
          </div>
        )}

        {/* 3. Segmented Method Control (UPI, Card, Cash) */}
        <div className="payment-segmented-control" role="tablist">
          <button 
            type="button" 
            className={`seg-btn ${selectedMethod === 'upi' ? 'on' : ''}`}
            onClick={() => setSelectedMethod('upi')}
            role="tab"
            aria-selected={selectedMethod === 'upi'}
          >
            UPI
          </button>
          <button 
            type="button" 
            className={`seg-btn ${selectedMethod === 'card' ? 'on' : ''}`}
            onClick={() => setSelectedMethod('card')}
            role="tab"
            aria-selected={selectedMethod === 'card'}
          >
            Card
          </button>
          <button 
            type="button" 
            className={`seg-btn ${selectedMethod === 'cod' ? 'on' : ''}`}
            onClick={() => setSelectedMethod('cod')}
            role="tab"
            aria-selected={selectedMethod === 'cod'}
          >
            Cash
          </button>
        </div>

        {/* 4. Method Details */}
        {selectedMethod === 'upi' && (
          <div className="upi-content-section">
            <div className="payment-section-label">Pay with a UPI app</div>
            <div className="upi-apps-row">
              <button 
                type="button" 
                className={`upi-app-tile ${selectedUpiApp === 'gpay' ? 'on' : ''}`}
                onClick={() => setSelectedUpiApp('gpay')}
              >
                <i className="app-icon" style={{ background: '#4285F4' }}>
                  <SiGooglepay size={22} color="#fff" />
                </i>
                <span>Google Pay</span>
              </button>

              <button 
                type="button" 
                className={`upi-app-tile ${selectedUpiApp === 'phonepe' ? 'on' : ''}`}
                onClick={() => setSelectedUpiApp('phonepe')}
              >
                <i className="app-icon" style={{ background: '#5F259F' }}>
                  <SiPhonepe size={20} color="#fff" />
                </i>
                <span>PhonePe</span>
              </button>

              <button 
                type="button" 
                className={`upi-app-tile ${selectedUpiApp === 'paytm' ? 'on' : ''}`}
                onClick={() => setSelectedUpiApp('paytm')}
              >
                <i className="app-icon" style={{ background: '#00BAF2' }}>
                  <SiPaytm size={24} color="#fff" />
                </i>
                <span>Paytm</span>
              </button>
            </div>

            <div className="payment-section-label" style={{ marginTop: '14px' }}>Or enter UPI ID</div>
            <div className="upi-id-input-box">
              <input 
                type="text" 
                placeholder="yourname@upi" 
                value={upiIdInput}
                onChange={(e) => {
                  setUpiIdInput(e.target.value);
                  setIsUpiVerified(false);
                }}
                className="upi-input-field"
              />
              <button 
                type="button" 
                className="btn-verify-upi" 
                onClick={handleVerifyUpi}
              >
                {isUpiVerified ? '✓ Verified' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {selectedMethod === 'card' && (
          <div className="card-content-section">
            <div className="payment-section-label">Credit or Debit Card</div>
            <div className="cardw card-form-card">
              <div className="form-group">
                <label className="text-xs font-semibold">Card Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 •••• •••• 4242"
                  autoComplete="off"
                  name="cardnumber"
                  id="payment-card-number"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div className="form-group">
                  <label className="text-xs font-semibold">Expiry Date</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    autoComplete="off"
                    name="exp-date"
                    id="payment-card-expiry"
                  />
                </div>
                <div className="form-group">
                  <label className="text-xs font-semibold">CVV</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={4}
                    placeholder="•••"
                    autoComplete="off"
                    name="cvc"
                    id="payment-card-cvv"
                  />
                </div>
              </div>
              <div className="card-demo-note" style={{ fontSize: '11.5px', color: 'var(--text-muted, #7B7B86)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>⚠️</span>
                <span>Demo only: don’t enter real card details</span>
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'cod' && (
          <div className="cod-content-section">
            <div className="cardw cod-info-card">
              <div className="cod-header-row">
                <span style={{ fontSize: '24px' }}>💵</span>
                <div>
                  <b>Pay on delivery</b>
                  <p className="text-xs text-secondary mt-1">
                    Keep exact cash of <strong>₹{total}</strong> ready to pay the delivery partner upon arrival. No card or online transfer needed now.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Trust Note */}
        <div className="payment-trust-note">
          🔒 Simulated payment for this demo. No real money moves.
        </div>

        {/* 6. Delivery Address & Estimated Arrival Card */}
        <div className="cardw payment-recap-card">
          <div className="recap-row">
            <span style={{ fontSize: '18px' }}>📍</span>
            <div className="recap-text">
              <b>{restaurantName} → Doorstep</b>
              <span>{deliveryAddress}</span>
            </div>
          </div>
          <div className="recap-separator" />
          <div className="recap-row">
            <span style={{ fontSize: '18px' }}>🕒</span>
            <div className="recap-text">
              <b>Estimated arrival</b>
              <span>25–30 min after the restaurant confirms</span>
            </div>
          </div>
        </div>

        {/* 7. Slide to Pay Control */}
        <div className="slide-to-pay-container">
          <SlideToPay 
            amount={total}
            isCash={selectedMethod === 'cod'}
            subLabel="Swipe right to confirm"
            isProcessing={isProcessing}
            paymentState={paymentState}
            onSlideComplete={handlePay}
          />
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

export default PaymentScreen;
