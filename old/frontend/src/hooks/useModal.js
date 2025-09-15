import { useEffect } from 'react';

export function useModal(isOpen) {
  useEffect(() => {
    // Modal agora usa modal-overlay, não precisa modificar o body
    return () => {
      // Cleanup se necessário
    };
  }, [isOpen]);
}
