import { useState } from 'react';

export function useConfirmModal() {
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: '',
    type: 'danger',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showConfirm = (message, onConfirm, type = 'danger') => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        message,
        type,
        onConfirm: () => {
          hideConfirm();
          onConfirm?.();
          resolve(true);
        },
        onCancel: () => {
          hideConfirm();
          resolve(false);
        }
      });
    });
  };

  const hideConfirm = () => {
    setConfirmModal(prev => ({
      ...prev,
      show: false
    }));
  };

  return {
    confirmModal,
    showConfirm,
    hideConfirm
  };
}
