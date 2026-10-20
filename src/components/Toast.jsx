import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500); // auto-dismiss after 2.5s
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-container slide-in-bottom ${type}`}>
      <span className="toast-icon">
        {type === 'success' ? '✅' : '⚠️'}
      </span>
      <span className="toast-message font-medium">{message}</span>
    </div>
  );
};

export default Toast;
