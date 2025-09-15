import React from "react";
import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';


function AbaTimers({ topico, disciplina, planoId, indice, setTempoEstudoTimer, onPause }) {
  const { getTimer, iniciarTimer, pausarTimer, formatarTempo, generateTimerKey, activeTimer, isTransitioning } = useTimer();
  const { token } = useAuth();

  // Obter timer data do context global
  const timerData = getTimer(disciplina._id, planoId, topico, indice || 0);
  const currentTimerKey = generateTimerKey(disciplina._id, planoId, topico, indice || 0);

  // Verificar se este timer está globalmente ativo
  const isGloballyActive = activeTimer === currentTimerKey;

  // Atualizar tempoEstudoTimer sempre que o timer mudar
  React.useEffect(() => {
    setTempoEstudoTimer(timerData.tempo);
  }, [timerData.tempo, setTempoEstudoTimer]);

  const handleIniciarTimer = async () => {
    await iniciarTimer(disciplina._id, planoId, topico, indice || 0, disciplina, token);
  };

  const handlePausarTimer = async () => {
    const timerKey = `${disciplina._id}_${planoId}_${topico}_${indice || 0}`;
    await pausarTimer(timerKey, onPause);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Cabeçalho minimalista */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="var(--orange-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: 0
        }}>
          Timer de Estudo - {topico}
        </h4>
      </div>

      {/* Timer Único - Design simplificado */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: isGloballyActive ? 'rgba(245, 158, 11, 0.1)' : 'var(--darkmode-bg-tertiary)',
        borderRadius: '12px',
        border: `2px solid ${isGloballyActive ? 'var(--orange-primary)' : 'var(--darkmode-border-secondary)'}`,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Display do Timer - Maior */}
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: isGloballyActive ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)',
            fontFamily: 'monospace',
            textAlign: 'center',
            textShadow: isGloballyActive ? '0 0 15px rgba(245, 158, 11, 0.4)' : 'none',
            letterSpacing: '2px'
          }}>
            {formatarTempo(timerData.tempo)}
          </div>

          {/* Botões de Controle */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            {!isGloballyActive ? (
              <button
                onClick={handleIniciarTimer}
                disabled={isTransitioning}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isTransitioning ? 'rgba(34, 197, 94, 0.5)' : 'var(--darkmode-button-success)',
                  color: 'var(--darkmode-bg-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isTransitioning ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {isTransitioning ? '⏳ Processando...' : '▶ Iniciar'}
              </button>
            ) : (
              <button
                onClick={handlePausarTimer}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#F59E0B',
                  color: 'var(--darkmode-bg-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ⏸ Pausar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informações do Timer */}
      <div style={{
        padding: '12px',
        backgroundColor: 'var(--darkmode-bg-tertiary)',
        borderRadius: '6px',
        border: '1px solid var(--darkmode-border-secondary)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'var(--darkmode-text-secondary)',
          marginBottom: '4px'
        }}>
          Status do Timer
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isGloballyActive ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)'
        }}>
          {isGloballyActive ? 'Em execução' : 'Parado'}
        </div>
      </div>
    </div>
  );
}

export default AbaTimers;