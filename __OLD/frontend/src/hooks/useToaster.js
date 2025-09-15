import { useState } from 'react';

export function useToaster() {
  const [toaster, setToaster] = useState({
    show: false,
    message: '',
    type: 'success',
    duration: 3000
  });

  const showToaster = (message, type = 'success', duration = 3000) => {
    setToaster({
      show: true,
      message,
      type,
      duration
    });
  };

  const hideToaster = () => {
    setToaster(prev => ({
      ...prev,
      show: false
    }));
  };

  const showSuccess = (message, duration) => showToaster(message, 'success', duration);
  const showError = (message, duration) => showToaster(message, 'error', duration);
  const showWarning = (message, duration) => showToaster(message, 'warning', duration);
  const showInfo = (message, duration) => showToaster(message, 'info', duration);

  return {
    toaster,
    showToaster,
    hideToaster,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
