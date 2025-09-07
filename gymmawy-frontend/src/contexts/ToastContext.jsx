import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'error', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showError = (message, duration) => addToast(message, 'error', duration);
  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showError, showSuccess, showInfo, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};
