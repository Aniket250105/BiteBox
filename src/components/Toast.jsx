import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 2200); // auto-dismiss after 2.2s
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-container ${type}`} role="status" aria-live="polite">
      {type === 'error' && <span className="toast-icon" aria-hidden="true">⚠️</span>}
      <span className="toast-message">{message}</span>
    </div>
  );
};

export default Toast;
