import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';


function TimerTopico({ indice, topico, onPause, disciplina, planoId }) {
  const { getTimer, iniciarTimer, pausarTimer, formatarTempo, isTransitioning, generateTimerKey, activeTimer } = useTimer();
  const { token } = useAuth();

  const timerData = getTimer(disciplina._id, planoId, topico, indice);
  const currentTimerKey = generateTimerKey(disciplina._id, planoId, topico, indice);

  const handleIniciarTimer = async (e) => {
    e.stopPropagation();
    await iniciarTimer(disciplina._id, planoId, topico, indice, disciplina, token);
  };

  // Determinar estado visual do botão - apenas o timer globalmente ativo deve mostrar estado ativo
  const isGloballyActive = activeTimer === currentTimerKey;
  const isDisabled = isTransitioning || (isGloballyActive && !timerData.finalizado);
  const showLoading = isTransitioning && !isGloballyActive;

  const handlePausarTimer = async (e) => {
    e.stopPropagation();
    const timerKey = `${disciplina._id}_${planoId}_${topico}_${indice}`;
    await pausarTimer(timerKey, onPause);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 10px',
      backgroundColor: isGloballyActive ? 'rgba(245, 158, 11, 0.1)' : 'var(--darkmode-bg-tertiary)',
      borderRadius: '8px',
      border: `1px solid ${isGloballyActive ? 'var(--orange-primary)' : 'var(--darkmode-border-secondary)'}`,
      minWidth: '130px'
    }}>
      {/* Display do Timer */}
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: isGloballyActive ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)',
        fontFamily: 'monospace',
        minWidth: '55px'
      }}>
        {formatarTempo(timerData?.tempo || 0)}
      </div>

      {/* Botões de Controle lado a lado */}
      <div style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center'
      }}>
        {!isGloballyActive ? (
          <button
            onClick={handleIniciarTimer}
            disabled={isDisabled}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDisabled ? 0.6 : 1
            }}
            title={isTransitioning ? "Processando..." : "Iniciar timer"}
          >
            {showLoading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="var(--orange-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="var(--darkmode-button-success)" stroke="var(--darkmode-button-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={handlePausarTimer}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Pausar timer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4H6V20H10V4ZM18 4H14V20H18V4Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default TimerTopico;