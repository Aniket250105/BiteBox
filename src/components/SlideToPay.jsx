import React, { useState, useRef, useEffect, useCallback } from 'react';
import './SlideToPay.css';

const SlideToPay = ({
  onSlideComplete,
  amount,
  isCash = false,
  subLabel = 'Swipe right to confirm',
  isProcessing = false,
  paymentState = 'idle',
  disabled = false
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const knobRef = useRef(null);
  const startXRef = useRef(0);
  const maxDragRef = useRef(0);
  const completedRef = useRef(false);

  // Compute maximum drag distance based on track and knob widths
  const updateMaxDrag = useCallback(() => {
    if (trackRef.current && knobRef.current) {
      const trackWidth = trackRef.current.offsetWidth;
      const knobWidth = knobRef.current.offsetWidth;
      maxDragRef.current = Math.max(0, trackWidth - knobWidth - 12);
    }
  }, []);

  useEffect(() => {
    updateMaxDrag();
    window.addEventListener('resize', updateMaxDrag);
    return () => window.removeEventListener('resize', updateMaxDrag);
  }, [updateMaxDrag]);

  // Reset knob when payment fails so user can retry
  useEffect(() => {
    if (paymentState === 'failed') {
      setDragX(0);
      completedRef.current = false;
      setIsDragging(false);
    }
  }, [paymentState]);

  const triggerPayment = useCallback(() => {
    if (isProcessing || disabled || completedRef.current) return;
    completedRef.current = true;
    if (maxDragRef.current > 0) {
      setDragX(maxDragRef.current);
    }
    onSlideComplete();
  }, [isProcessing, disabled, onSlideComplete]);

  // Pointer event handlers with pointer capture
  const handlePointerDown = (e) => {
    if (isProcessing || disabled || completedRef.current) return;
    updateMaxDrag();
    setIsDragging(true);
    startXRef.current = e.clientX - dragX;
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || isProcessing || disabled || completedRef.current) return;
    const newX = Math.max(0, Math.min(e.clientX - startXRef.current, maxDragRef.current));
    setDragX(newX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = maxDragRef.current * 0.82;
    if (dragX >= threshold) {
      triggerPayment();
    } else {
      setDragX(0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerPayment();
    }
  };

  const label = isCash ? 'Slide to place order' : `Slide to pay ₹${amount}`;
  const textOpacity = maxDragRef.current > 0 ? Math.max(0, 1 - (dragX / (maxDragRef.current * 0.7))) : 1;

  // Screen reader announcement text
  let statusAnnouncement = '';
  if (paymentState === 'processing') statusAnnouncement = 'Processing payment, please wait...';
  if (paymentState === 'success') statusAnnouncement = 'Payment successful! Order placed.';
  if (paymentState === 'failed') statusAnnouncement = 'Payment failed. Please retry.';

  return (
    <div className="slide-to-pay-wrapper">
      {/* Aria-live region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {statusAnnouncement}
      </div>

      <div
        ref={trackRef}
        className={`slide-track ${isDragging ? 'dragging' : ''} ${paymentState}`}
        role="button"
        tabIndex={disabled || isProcessing ? -1 : 0}
        aria-label={`${label}. Press Enter or Space to confirm.`}
        aria-disabled={disabled || isProcessing}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={knobRef}
          className="slide-knob"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {paymentState === 'processing' ? (
            <span className="knob-spinner" />
          ) : paymentState === 'success' ? (
            <span className="knob-icon">✓</span>
          ) : (
            <span className="knob-icon">›</span>
          )}
        </div>

        <div className="slide-label" style={{ opacity: textOpacity }}>
          <b>{label}</b>
          <small>{subLabel}</small>
        </div>
      </div>
    </div>
  );
};

export default SlideToPay;
