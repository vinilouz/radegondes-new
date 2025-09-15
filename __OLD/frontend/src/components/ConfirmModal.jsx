import { useState, useEffect } from 'react';

function ConfirmModal({ show, message, onConfirm, onCancel, type = 'danger' }) {
  useEffect(() => {
    if (show) {
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup ao desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          buttonColor: '#EF4444',
          buttonHoverColor: '#DC2626',
          iconColor: '#EF4444'
        };
      case 'warning':
        return {
          buttonColor: '#F59E0B',
          buttonHoverColor: '#D97706',
          iconColor: '#F59E0B'
        };
      default:
        return {
          buttonColor: '#3B82F6',
          buttonHoverColor: '#2563EB',
          iconColor: '#3B82F6'
        };
    }
  };

  const { buttonColor, buttonHoverColor, iconColor } = getColors();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <>
      <style>
        {`
          .confirm-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: confirmModalFadeIn 0.2s ease-out;
            padding: 20px;
          }
          
          .confirm-modal-container {
            background: var(--darkmode-bg-primary);
            border: 1px solid var(--darkmode-border-primary);
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            max-width: 400px;
            width: 100%;
            padding: 24px;
            animation: confirmModalSlideIn 0.2s ease-out;
          }
          
          .confirm-modal-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }
          
          .confirm-modal-icon {
            color: ${iconColor};
            flex-shrink: 0;
          }
          
          .confirm-modal-title {
            color: var(--darkmode-text-primary);
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }
          
          .confirm-modal-message {
            color: var(--darkmode-text-secondary);
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 24px 0;
          }
          
          .confirm-modal-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          }
          
          .confirm-modal-button {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;
          }
          
          .confirm-modal-button-cancel {
            background: var(--darkmode-bg-secondary);
            color: var(--darkmode-text-secondary);
            border: 1px solid var(--darkmode-border-secondary);
          }
          
          .confirm-modal-button-cancel:hover {
            background: var(--darkmode-bg-tertiary);
            color: var(--darkmode-text-primary);
          }
          
          .confirm-modal-button-confirm {
            background: ${buttonColor};
            color: white;
          }
          
          .confirm-modal-button-confirm:hover {
            background: ${buttonHoverColor};
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          
          @keyframes confirmModalFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes confirmModalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          @media (max-width: 480px) {
            .confirm-modal-container {
              margin: 0 20px;
              max-width: none;
            }
            
            .confirm-modal-actions {
              flex-direction: column-reverse;
            }
            
            .confirm-modal-button {
              width: 100%;
            }
          }
        `}
      </style>
      
      <div className="confirm-modal-overlay" onClick={handleBackdropClick}>
        <div className="confirm-modal-container">
          <div className="confirm-modal-header">
            <div className="confirm-modal-icon">
              {type === 'danger' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {type === 'warning' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {type === 'info' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <h3 className="confirm-modal-title">
              {type === 'danger' ? 'Confirmar Exclusão' : 'Confirmação'}
            </h3>
          </div>
          
          <p className="confirm-modal-message">
            {message}
          </p>
          
          <div className="confirm-modal-actions">
            <button 
              className="confirm-modal-button confirm-modal-button-cancel"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button 
              className="confirm-modal-button confirm-modal-button-confirm"
              onClick={onConfirm}
            >
              {type === 'danger' ? 'Excluir' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmModal;
