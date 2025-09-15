import { useState, useEffect } from 'react';

function Toaster({ message, type = 'success', show, onClose, duration = 3000 }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: '#10B981',
          textColor: '#10B981'
        };
      case 'error':
        return {
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: '#EF4444',
          textColor: '#EF4444'
        };
      case 'warning':
        return {
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: '#F59E0B',
          textColor: '#F59E0B'
        };
      default:
        return {
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          bgColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3B82F6',
          textColor: '#3B82F6'
        };
    }
  };

  const { icon, bgColor, borderColor, textColor } = getIconAndColors();

  return (
    <>
      <style>
        {`
          .toaster-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .toaster-container {
            background: var(--darkmode-bg-primary);
            border: 2px solid ${borderColor};
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 500px;
            pointer-events: auto;
            animation: toasterSlideIn 0.3s ease-out;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          .toaster-icon {
            color: ${textColor};
            flex-shrink: 0;
          }
          
          .toaster-content {
            flex: 1;
          }
          
          .toaster-message {
            color: var(--darkmode-text-primary);
            font-size: 14px;
            font-weight: 500;
            margin: 0;
            line-height: 1.4;
          }
          
          .toaster-close {
            background: none;
            border: none;
            color: var(--darkmode-text-secondary);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            flex-shrink: 0;
          }
          
          .toaster-close:hover {
            background: rgba(0, 0, 0, 0.1);
            color: var(--darkmode-text-primary);
          }
          
          @keyframes toasterSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @media (max-width: 480px) {
            .toaster-container {
              min-width: 280px;
              max-width: 90vw;
              margin: 0 20px;
            }
          }
        `}
      </style>
      
      <div className="toaster-overlay">
        <div className="toaster-container">
          <div className="toaster-icon">
            {icon}
          </div>
          <div className="toaster-content">
            <p className="toaster-message">{message}</p>
          </div>
          <button className="toaster-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default Toaster;
