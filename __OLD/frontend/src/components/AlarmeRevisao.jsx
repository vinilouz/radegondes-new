import { useEffect, useState } from 'react';

function AlarmeRevisao({ alarmeAtivo, topicosAlarme, pararAlarme, silenciarAlarme, reativarAudio, isAudioTocando }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAudioSilenciado, setIsAudioSilenciado] = useState(false);

  useEffect(() => {
    if (alarmeAtivo) {
      setIsVisible(true);
      setIsAudioSilenciado(false);
    } else {
      // Delay para permitir animação de saída
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [alarmeAtivo]);

  const handleSilenciar = () => {
    silenciarAlarme();
    setIsAudioSilenciado(true);
  };

  const handleReativar = () => {
    reativarAudio();
    setIsAudioSilenciado(false);
  };

  const handleParar = () => {
    pararAlarme();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <style>
        {`
          .alarme-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
            border-bottom: 3px solid #B91C1C;
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4);
            transform: translateY(${alarmeAtivo ? '0' : '-100%'});
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: ${alarmeAtivo ? 'pulse-glow' : 'none'} 2s infinite;
          }

          .alarme-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .alarme-info {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
          }

          .alarme-icon {
            font-size: 24px;
            animation: shake 0.5s infinite;
          }

          .alarme-text {
            color: white;
          }

          .alarme-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .alarme-subtitle {
            font-size: 14px;
            margin: 0;
            opacity: 0.9;
          }

          .alarme-topicos {
            font-size: 13px;
            margin: 4px 0 0 0;
            opacity: 0.8;
            font-weight: 500;
          }

          .alarme-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .alarme-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .btn-silenciar {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .btn-silenciar:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateY(-1px);
          }

          .btn-reativar {
            background: rgba(34, 197, 94, 0.9);
            color: white;
            border: 1px solid rgba(34, 197, 94, 0.3);
          }

          .btn-reativar:hover {
            background: rgba(34, 197, 94, 1);
            transform: translateY(-1px);
          }

          .btn-parar {
            background: rgba(255, 255, 255, 0.9);
            color: #DC2626;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .btn-parar:hover {
            background: white;
            transform: translateY(-1px);
          }

          .audio-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22C55E;
            animation: ${isAudioTocando ? 'blink' : 'none'} 1s infinite;
          }

          .audio-indicator.silenciado {
            background: #64748B;
            animation: none;
          }

          @keyframes pulse-glow {
            0% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4); }
            50% { box-shadow: 0 4px 20px rgba(220, 38, 38, 0.6); }
            100% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4); }
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
          }

          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
          }

          @media (max-width: 768px) {
            .alarme-content {
              padding: 12px 16px;
              flex-direction: column;
              gap: 12px;
            }

            .alarme-info {
              gap: 12px;
            }

            .alarme-title {
              font-size: 16px;
            }

            .alarme-subtitle,
            .alarme-topicos {
              font-size: 13px;
            }

            .alarme-actions {
              width: 100%;
              justify-content: center;
            }

            .alarme-btn {
              padding: 6px 12px;
              font-size: 13px;
            }
          }
        `}
      </style>

      <div className="alarme-overlay">
        <div className="alarme-content">
          <div className="alarme-info">
            <div className="alarme-icon">🚨</div>
            <div className="alarme-text">
              <h3 className="alarme-title">
                Hora da Revisão!
              </h3>
              <p className="alarme-subtitle">
                {topicosAlarme.length === 1 
                  ? 'Você tem 1 tópico agendado para agora' 
                  : `Você tem ${topicosAlarme.length} tópicos agendados para agora`
                }
              </p>
              {topicosAlarme.length > 0 && (
                <p className="alarme-topicos">
                  {topicosAlarme.map(topico => topico.topico).join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="alarme-actions">
            <div 
              className={`audio-indicator ${isAudioSilenciado ? 'silenciado' : ''}`}
              title={isAudioTocando ? 'Áudio tocando' : 'Áudio silenciado'}
            />
            
            {!isAudioSilenciado ? (
              <button 
                className="alarme-btn btn-silenciar" 
                onClick={handleSilenciar}
                title="Silenciar áudio (alarme continua visível)"
              >
                🔇 Silenciar
              </button>
            ) : (
              <button 
                className="alarme-btn btn-reativar" 
                onClick={handleReativar}
                title="Reativar áudio"
              >
                🔊 Reativar
              </button>
            )}

            <button 
              className="alarme-btn btn-parar" 
              onClick={handleParar}
              title="Parar alarme completamente"
            >
              ✕ Parar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AlarmeRevisao;
