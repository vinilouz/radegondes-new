import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';

function FloatingTimer() {
  const [isMinimized, setIsMinimized] = useState(false);
  const { getActiveTimerInfo, pausarTimer, formatarTempo } = useTimer();
  const { user } = useAuth();
  const navigate = useNavigate();

  const activeTimerInfo = getActiveTimerInfo();

  const handlePauseTimer = async () => {
    await pausarTimer(null, null, 'pausado_pelo_usuario');
  };


  const handleNavigateToTopic = () => {
    if (activeTimerInfo && activeTimerInfo.disciplinaId && activeTimerInfo.planoId) {
      navigate(`/planos/${activeTimerInfo.planoId}/disciplinas/${activeTimerInfo.disciplinaId}`);
    }
  };

  if (!activeTimerInfo || !user) {
    return null;
  }

  if (isMinimized) {
    // Modo minimizado: apenas ícone + tempo no canto inferior direito
    return (
      <div
        className="floating-timer-minimized"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: 'var(--darkmode-bg-secondary)',
          border: '2px solid var(--orange-primary)',
          borderRadius: '50px',
          padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => setIsMinimized(false)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="var(--orange-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--orange-primary)',
          fontFamily: 'monospace'
        }}>
          {formatarTempo(activeTimerInfo.tempo)}
        </span>
      </div>
    );
  }

  // Modo maximizado: barra fixa na parte inferior
  return (
    <div
      className="floating-timer-maximized"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'var(--darkmode-bg-secondary)',
        borderTop: '2px solid var(--orange-primary)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        userSelect: 'none',
        padding: '16px 24px'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Info do Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--orange-primary)',
            animation: 'pulse 2s infinite'
          }} />

          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--orange-primary)',
            fontFamily: 'monospace',
            letterSpacing: '1px'
          }}>
            {formatarTempo(activeTimerInfo.tempo)}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--darkmode-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}>
              {activeTimerInfo.topico}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--darkmode-text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}>
              {activeTimerInfo.disciplinaNome}
            </div>
          </div>
        </div>

        {/* Controles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button
            onClick={handlePauseTimer}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F59E0B',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#D97706'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#F59E0B'}
            title="Pausar timer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M10 4H6V20H10V4ZM18 4H14V20H18V4Z" fill="currentColor"/>
            </svg>
            Pausar
          </button>

          <button
            onClick={handleNavigateToTopic}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: 'var(--darkmode-text-primary)',
              border: '1px solid var(--darkmode-bg-elevation-2)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--darkmode-bg-elevation-1)';
              e.target.style.borderColor = 'var(--orange-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'var(--darkmode-bg-elevation-2)';
            }}
            title="Ir para disciplina"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            Ver
          </button>


          <button
            onClick={() => setIsMinimized(true)}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              color: 'var(--darkmode-text-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--darkmode-bg-elevation-1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            title="Minimizar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 13H5V11H19V13Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .floating-timer-maximized {
            padding: 12px 16px !important;
          }

          .floating-timer-minimized {
            bottom: 10px !important;
            right: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default FloatingTimer;