import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import Toaster from '../../components/Toaster';
import { useToaster } from '../../hooks/useToaster';
import { SkeletonDisciplina, SkeletonList } from '../../components/Skeleton';

function AbaInformacoes({ topico, statusTopicos, setStatusTopicos, material, setMaterial, comentarios, setComentarios, topicoEditado, setTopicoEditado }) {
  const [dataOpcao, setDataOpcao] = useState('estudando');
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  // Sincronizar com o status salvo do tópico quando o componente for montado ou tópico mudar
  useEffect(() => {
    const statusDoTopico = statusTopicos[topico];
    if (statusDoTopico) {
      setDataOpcao(statusDoTopico.tipo || 'estudando');
    } else {
      setDataOpcao('estudando');
    }
  }, [topico, statusTopicos]);

  // Função para atualizar status quando data opção muda
  const handleDataOpcaoChange = (novaOpcao) => {
    setDataOpcao(novaOpcao);
    setStatusTopicos(prev => {
      let dataAgendada = '';
      if (novaOpcao === 'agendar') {
        dataAgendada = prev[topico]?.dataAgendada || '';
      }
      return {
        ...prev,
        [topico]: {
          tipo: novaOpcao,
          dataAgendada
        }
      };
    });
  };

  // Função para atualizar horário agendado
  const handleHorarioAgendadoChange = (novoHorario) => {
    const dataAgendada = statusTopicos[topico]?.dataAgendada;
    const hoje = new Date().toISOString().split('T')[0];

    // Se a data for hoje, validar se o horário não é anterior ao atual
    if (dataAgendada === hoje) {
      const agora = new Date();
      const horarioAtual = agora.toTimeString().slice(0, 5);

      if (novoHorario < horarioAtual) {
        showError('Não é possível agendar para um horário passado. Selecione um horário futuro.');
        return;
      }
    }

    setStatusTopicos(prev => ({
      ...prev,
      [topico]: {
        ...prev[topico],
        tipo: 'agendar',
        dataAgendada: prev[topico]?.dataAgendada || '',
        horarioAgendado: novoHorario
      }
    }));
  };

  // Função para atualizar data agendada
  const handleDataAgendadaChange = (novaData) => {
    // Validar se a data não é anterior a hoje
    const hoje = new Date().toISOString().split('T')[0];
    if (novaData < hoje) {
      // Mostrar toast de erro e não permitir a data
      showError('Não é possível agendar para uma data passada. Selecione hoje ou uma data futura.');
      return;
    }

    const agora = new Date();
    const horarioAtual = agora.toTimeString().slice(0, 5);

    setStatusTopicos(prev => {
      const topicoPrev = prev[topico] || {};
      let novoHorario = topicoPrev.horarioAgendado || '';

      // Se a data for hoje e o horário agendado for anterior ao atual, limpar o horário
      if (novaData === hoje && novoHorario && novoHorario < horarioAtual) {
        novoHorario = '';
      }

      return {
        ...prev,
        [topico]: {
          ...topicoPrev,
          tipo: dataOpcao,
          dataAgendada: novaData,
          horarioAgendado: novoHorario
        }
      };
    });
  };

  // Função para converter segundos em formato HH:MM:SS
  const formatarTempoEstudo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Linha 1 - Status do Estudo */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          marginBottom: '8px'
        }}>
          Status do Estudo
        </label>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="statusEstudo"
              value="estudando"
              checked={dataOpcao === 'estudando'}
              onChange={(e) => handleDataOpcaoChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            <span style={{ color: 'var(--darkmode-text-primary)', fontSize: '14px' }}>Estudando</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="statusEstudo"
              value="ja-estudei"
              checked={dataOpcao === 'ja-estudei'}
              onChange={(e) => handleDataOpcaoChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            <span style={{ color: 'var(--darkmode-text-primary)', fontSize: '14px' }}>Já estudei</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="statusEstudo"
              value="agendar"
              checked={dataOpcao === 'agendar'}
              onChange={(e) => handleDataOpcaoChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            <span style={{ color: 'var(--darkmode-text-primary)', fontSize: '14px' }}>Agendar</span>
          </label>
        </div>
      </div>

      {/* Linha 2 - Agendamento (só aparece se agendar estiver selecionado) */}
      {dataOpcao === 'agendar' && (
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '8px'
          }}>
            Agendamento
          </label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Campos de agendamento */}
            <div
              style={{
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
            >
              <input
                ref={dateInputRef}
                type="date"
                min={new Date().toISOString().split('T')[0]} // Data mínima é hoje
                value={statusTopicos[topico]?.dataAgendada || ''}
                onChange={(e) => handleDataAgendadaChange(e.target.value)}
                style={{
                  padding: '8px 35px 8px 12px',
                  border: '1px solid var(--darkmode-border-secondary)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'var(--darkmode-bg-secondary)',
                  color: 'var(--darkmode-text-primary)',
                  cursor: 'pointer',
                  width: '150px'
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#FF6B35" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" stroke="#FF6B35" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" stroke="#FF6B35" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="#FF6B35" strokeWidth="2" />
              </svg>
            </div>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.focus()}
            >
              <input
                ref={timeInputRef}
                type="time"
                min={(() => {
                  const dataAgendada = statusTopicos[topico]?.dataAgendada;
                  const hoje = new Date().toISOString().split('T')[0];
                  // Se a data agendada for hoje, definir horário mínimo como agora
                  if (dataAgendada === hoje) {
                    const agora = new Date();
                    return agora.toTimeString().slice(0, 5); // formato HH:MM
                  }
                  return ''; // Sem restrição de horário para datas futuras
                })()}
                value={statusTopicos[topico]?.horarioAgendado || ''}
                onChange={(e) => handleHorarioAgendadoChange(e.target.value)}
                style={{
                  padding: '8px 35px 8px 12px',
                  border: '1px solid var(--darkmode-border-secondary)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'var(--darkmode-bg-secondary)',
                  color: 'var(--darkmode-text-primary)',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield',
                  appearance: 'none',
                  cursor: 'pointer',
                  width: '120px'
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              >
                <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Botão Remover Agendamento */}
            {(statusTopicos[topico]?.dataAgendada || statusTopicos[topico]?.horarioAgendado) && (
              <button
                onClick={() => {
                  console.log('Removendo agendamento para tópico:', topico);
                  console.log('Status antes:', statusTopicos[topico]);

                  // Limpar agendamento
                  setStatusTopicos(prev => ({
                    ...prev,
                    [topico]: {
                      ...prev[topico],
                      dataAgendada: '',
                      horarioAgendado: '',
                      tipo: 'estudando' // Reset para o tipo padrão
                    }
                  }));

                  console.log('Agendamento removido');
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #EF4444',
                  borderRadius: '6px',
                  color: '#EF4444',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Remover Agendamento
              </button>
            )}
          </div>
        </div>
      )}

      {/* Linha 3 - Tópico e Material em uma linha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {/* Tópico */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '8px'
          }}>
            Tópico
          </label>
          <input
            type="text"
            value={topicoEditado}
            onChange={(e) => setTopicoEditado(e.target.value)}
            placeholder="Digite o nome do tópico"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--darkmode-border-secondary)',
              borderRadius: '6px',
              backgroundColor: 'var(--darkmode-bg-secondary)',
              color: 'var(--darkmode-text-primary)',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Material */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '8px'
          }}>
            Material
          </label>
          <input
            type="text"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Ex: Livro, Vídeo, PDF, etc."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--darkmode-border-secondary)',
              borderRadius: '6px',
              backgroundColor: 'var(--darkmode-bg-secondary)',
              color: 'var(--darkmode-text-primary)',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Linha 3 - Comentários */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          marginBottom: '8px'
        }}>
          Comentários
        </label>
        <textarea
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Adicione seus comentários sobre o estudo..."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid var(--darkmode-border-secondary)',
            borderRadius: '6px',
            backgroundColor: 'var(--darkmode-bg-secondary)',
            color: 'var(--darkmode-text-primary)',
            fontSize: '14px',
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
      </div>
    </div>
  );
}

export default AbaInformacoes;