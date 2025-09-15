import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useAlarmeRevisao } from '../../hooks/useAlarmeRevisao';
import AlarmeRevisao from '../../components/AlarmeRevisao';

function Revisoes() {
  const { user, token } = useAuth();
  /** @type {[any[], Function]} */
  const [topicosAgendados, setTopicosAgendados] = useState([]); // eslint-disable-line
  const [loading, setLoading] = useState(true);

  // Hook do alarme de revisão
  const { 
    alarmeAtivo, 
    topicosAlarme, 
    pararAlarme, 
    silenciarAlarme, 
    reativarAudio, 
    isAudioTocando 
  } = useAlarmeRevisao(topicosAgendados);

  useEffect(() => {
    document.title = 'Revisões - Radegondes';
    buscarTopicosAgendados();
  }, []);

  const buscarTopicosAgendados = async () => {
    try {
      setLoading(true);
      
      // Buscar registros de estudo com agendamento
      const response = await fetch(`${API_BASE_URL}/api/registros-estudo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const registros = data.registros || data; // Suportar ambos os formatos
        
        // Filtrar apenas registros que são agendamentos com data preenchida
        const agendados = registros.filter(registro => 
          registro.dataOpcao === 'agendar' && 
          registro.dataAgendada && 
          registro.dataAgendada.trim() !== ''
        );

        console.log('📊 Registros agendados encontrados:', agendados.length);
        console.log('📋 Detalhes dos agendamentos:', agendados.map(r => ({
          id: r._id,
          topico: r.topico,
          disciplina: r.disciplinaNome,
          dataAgendada: r.dataAgendada,
          horario: r.horarioAgendado,
          dataRegistro: r.data
        })));
        
        console.log('📋 Agendamentos por tópico:', agendados.reduce((acc, r) => {
          const chave = `${r.disciplinaId}-${r.topico}`;
          acc[chave] = (acc[chave] || 0) + 1;
          return acc;
        }, {}));

        // Buscar informações dos planos para cada registro
        const topicosComPlano = await Promise.all(
          agendados.map(async (registro) => {
            try {
              const planoResponse = await fetch(`${API_BASE_URL}/api/planos/${registro.plano}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (planoResponse.ok) {
                const plano = await planoResponse.json();
                return {
                  ...registro,
                  planoNome: plano.nome,
                  planoId: plano._id
                };
              }
              return null;
            } catch (error) {
              console.error('Erro ao buscar plano:', error);
              return null;
            }
          })
        );

        // Filtrar registros válidos, agrupar por tópico e manter apenas o mais recente
        const topicosValidos = topicosComPlano
          .filter(topico => topico !== null);

        // Agrupar por tópico e manter apenas o último agendamento de cada um
        const topicosUnicos = {};
        topicosValidos.forEach(topico => {
          const chaveTopico = `${topico.disciplinaId}-${topico.topico}`;
          
          console.log(`🔍 Processando: ${chaveTopico}`, {
            dataAgendada: topico.dataAgendada,
            horario: topico.horarioAgendado,
            dataRegistro: topico.data,
            jaExiste: !!topicosUnicos[chaveTopico]
          });
          
          if (!topicosUnicos[chaveTopico]) {
            topicosUnicos[chaveTopico] = topico;
            console.log(`➕ Adicionado como primeiro: ${chaveTopico}`);
          } else {
            // Comparar data de agendamento
            const dataAtual = new Date(topico.dataAgendada + 'T' + (topico.horarioAgendado || '00:00:00'));
            const dataExistente = new Date(topicosUnicos[chaveTopico].dataAgendada + 'T' + (topicosUnicos[chaveTopico].horarioAgendado || '00:00:00'));
            
            console.log(`⚖️ Comparando ${chaveTopico}:`, {
              atual: dataAtual.toISOString(),
              existente: dataExistente.toISOString(),
              atualMaisRecente: dataAtual > dataExistente
            });
            
            // Se a data de agendamento for mais recente, OU se for a mesma data mas o registro foi criado mais recentemente
            if (dataAtual > dataExistente || 
                (dataAtual.getTime() === dataExistente.getTime() && 
                 new Date(topico.data) > new Date(topicosUnicos[chaveTopico].data))) {
              topicosUnicos[chaveTopico] = topico;
              console.log(`🔄 Substituído: ${chaveTopico}`);
            } else {
              console.log(`⏭️ Mantido existente: ${chaveTopico}`);
            }
          }
        });

        // Converter para array e ordenar por data de agendamento
        const topicosFinais = Object.values(topicosUnicos)
          .sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());

        console.log('🎯 Tópicos únicos encontrados:', Object.keys(topicosUnicos));
        console.log('✅ Tópicos únicos finais:', topicosFinais.length);
        console.log('📋 Resumo final:', topicosFinais.map(t => ({
          chave: `${t.disciplinaId}-${t.topico}`,
          topico: t.topico,
          disciplina: t.disciplinaNome,
          dataAgendada: t.dataAgendada,
          horario: t.horarioAgendado,
          dataRegistro: t.data
        })));

        setTopicosAgendados(topicosFinais);
      }
    } catch (error) {
      console.error('Erro ao buscar tópicos agendados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    // Garantir que a data seja interpretada como local, não UTC
    const data = new Date(dataString + 'T00:00:00');
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    // Comparar apenas as datas (sem horário)
    const dataData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const hojeData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const amanhaData = new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate());
    
    if (dataData.getTime() === hojeData.getTime()) {
      return 'Hoje';
    } else if (dataData.getTime() === amanhaData.getTime()) {
      return 'Amanhã';
    } else {
      return data.toLocaleDateString('pt-BR');
    }
  };

  const isAtrasado = (dataString, horarioString) => {
    // Garantir que a data seja interpretada como local, não UTC
    const dataAgendamento = new Date(dataString + 'T00:00:00');
    const hoje = new Date();
    
    // Se tem horário definido, considerar o horário na comparação
    if (horarioString) {
      const [horas, minutos] = horarioString.split(':');
      dataAgendamento.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    } else {
      // Se não tem horário, considerar o final do dia agendado
      dataAgendamento.setHours(23, 59, 59, 999);
    }
    
    return dataAgendamento < hoje;
  };

  if (loading) {
    return (
      <>
        <header className='flex flex-col head'>
          <h1>Revisões</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--darkmode-text-secondary)' }}>
            Tópicos agendados para revisão
          </p>
        </header>
        
        {/* Skeleton Loading */}
        <div className="topicos-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="topico-card skeleton-card">
              <div className="topico-header">
                <div className="topico-info">
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-subtitle"></div>
                </div>
                <div className="skeleton-badge"></div>
              </div>
              
              <div className="topico-footer">
                <div className="skeleton-line skeleton-date"></div>
                <div className="skeleton-line skeleton-plan"></div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Componente de Alarme */}
      <AlarmeRevisao
        alarmeAtivo={alarmeAtivo}
        topicosAlarme={topicosAlarme}
        pararAlarme={pararAlarme}
        silenciarAlarme={silenciarAlarme}
        reativarAudio={reativarAudio}
        isAudioTocando={isAudioTocando}
      />

      <style>
        {`
          .topicos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            margin-top: 24px;
          }

          .topico-card {
            background: var(--darkmode-bg-secondary);
            border: 1px solid var(--darkmode-border-secondary);
            border-radius: 12px;
            padding: 20px;
            text-decoration: none;
            color: inherit;
            display: block;
            transition: all 0.2s ease;
            position: relative;
            border-left: 4px solid var(--orange-primary);
            border-color: rgba(255, 107, 53, 0.3);
          }

          .topico-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            border-color: var(--orange-primary);
          }

          .topico-card.atrasado {
            border-left: 4px solid #EF4444;
            border-color: rgba(239, 68, 68, 0.3);
          }

          .topico-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
          }

          .topico-info {
            flex: 1;
          }

          .topico-nome {
            font-size: 16px;
            font-weight: 600;
            color: var(--darkmode-text-primary);
            margin: 0 0 4px 0;
            line-height: 1.3;
          }

          .topico-disciplina {
            font-size: 14px;
            color: var(--darkmode-text-secondary);
            margin: 0;
          }

          .topico-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .badge-agendado {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #F59E0B;
          }

          .badge-atrasado {
            background: rgba(239, 68, 68, 0.1);
            color: #EF4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }

          .topico-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid var(--darkmode-border-secondary);
          }

          .topico-data {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--darkmode-text-tertiary);
          }

          .topico-plano {
            font-size: 12px;
            color: var(--darkmode-text-tertiary);
            font-style: italic;
          }

          .empty-state {
            text-align: center;
            padding: 60px 20px;
            background: var(--darkmode-bg-secondary);
            border: 2px dashed var(--darkmode-border-secondary);
            border-radius: 12px;
            margin-top: 30px;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .empty-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--darkmode-text-primary);
            margin: 0 0 8px 0;
          }

          .empty-text {
            font-size: 14px;
            color: var(--darkmode-text-secondary);
            margin: 0;
          }

          /* Skeleton Styles */
          .skeleton-card {
            pointer-events: none;
            opacity: 0.7;
          }

          .skeleton-line {
            background: linear-gradient(90deg, 
              var(--darkmode-border-secondary) 25%, 
              var(--darkmode-bg-primary) 50%, 
              var(--darkmode-border-secondary) 75%
            );
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
            border-radius: 4px;
          }

          .skeleton-title {
            height: 20px;
            width: 70%;
            margin-bottom: 8px;
          }

          .skeleton-subtitle {
            height: 16px;
            width: 50%;
          }

          .skeleton-badge {
            height: 20px;
            width: 60px;
            background: linear-gradient(90deg, 
              var(--darkmode-border-secondary) 25%, 
              var(--darkmode-bg-primary) 50%, 
              var(--darkmode-border-secondary) 75%
            );
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
            border-radius: 12px;
          }

          .skeleton-date {
            height: 14px;
            width: 80px;
          }

          .skeleton-plan {
            height: 14px;
            width: 60px;
          }

          @keyframes skeleton-loading {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}
      </style>

      <header className='flex flex-col head'>
        <h1>Revisões</h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--darkmode-text-secondary)' }}>
          Tópicos agendados para revisão
        </p>
      </header>

      {topicosAgendados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3 className="empty-title">
            Nenhum tópico agendado
          </h3>
          <p className="empty-text">
            Vá até uma disciplina e agende tópicos para que apareçam aqui.
          </p>
        </div>
      ) : (
        <div className="topicos-grid">
          {topicosAgendados.map(topico => (
            <Link
              key={topico._id}
              to={`/planos/${topico.planoId}/disciplinas/${topico.disciplinaId}?openModal=${encodeURIComponent(topico.topico)}`}
              className={`topico-card ${isAtrasado(topico.dataAgendada, topico.horarioAgendado) ? 'atrasado' : ''}`}
            >
              <div className="topico-header">
                <div className="topico-info">
                  <div className="topico-nome">
                    {topico.topico}
                  </div>
                  <p className="topico-disciplina">
                    {topico.disciplinaNome}
                  </p>
                </div>
                <span className={`topico-badge ${isAtrasado(topico.dataAgendada) ? 'badge-atrasado' : 'badge-agendado'}`}>
                  {isAtrasado(topico.dataAgendada, topico.horarioAgendado) ? 'Atrasado' : 'Agendado'}
                </span>
              </div>

              <div className="topico-footer">
                <div className="topico-data">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {formatarData(topico.dataAgendada)}
                  {topico.horarioAgendado && ` - ${topico.horarioAgendado}`}
                </div>
                <div className="topico-plano">
                  {topico.planoNome}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default Revisoes;

