import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

function Historico() {
  const { user, token } = useAuth();
  const [topicosEstudados, setTopicosEstudados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Histórico - Radegondes';
    buscarTopicosEstudados();
  }, []);

  const buscarTopicosEstudados = async () => {
    try {
      setLoading(true);

      // Buscar todos os registros de estudo
      const response = await fetch(`${API_BASE_URL}/api/registros-estudo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const registros = data.registros || data;

        console.log('📚 Total de registros encontrados:', registros.length);
        console.log('📋 Primeiros 3 registros:', registros.slice(0, 3));

        // Filtrar registros válidos que indicam estudo real
        const registrosValidos = registros.filter(registro =>
          registro.topico &&
          registro.topico.trim() !== '' &&
          registro.disciplinaId &&
          // Considerar estudado se tem qualquer uma dessas evidências:
          (registro.tempoEstudo > 0 || // Teve tempo cronometrado
            registro.marcarComoEstudado === true || // Foi marcado explicitamente
            registro.questoesRealizadas > 0 || // Fez questões
            registro.material?.trim() || // Adicionou material
            registro.observacoes?.trim() || // Fez observações
            (registro.links && registro.links.length > 0 && registro.links.some(link => link.titulo?.trim() || link.url?.trim()))) // Adicionou links
        );

        console.log('📚 Registros válidos (estudados) encontrados:', registrosValidos.length);
        console.log('📋 Detalhes dos registros válidos:', registrosValidos.map(r => ({
          topico: r.topico,
          disciplina: r.disciplinaNome,
          tempoEstudo: r.tempoEstudo,
          marcarComoEstudado: r.marcarComoEstudado,
          questoesRealizadas: r.questoesRealizadas,
          material: r.material,
          observacoes: r.observacoes
        })));

        // Buscar informações dos planos para cada registro
        const topicosComPlano = await Promise.all(
          registrosValidos.map(async (registro) => {
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

        // Filtrar registros válidos e agrupar por tópico (manter o mais recente)
        const topicosValidos = topicosComPlano.filter(topico => topico !== null);

        // Agrupar por tópico e manter apenas o último registro de cada um
        const topicosUnicos = {};
        topicosValidos.forEach(topico => {
          const chaveTopico = `${topico.disciplinaId}-${topico.topico}`;

          if (!topicosUnicos[chaveTopico] ||
            new Date(topico.data || topico.createdAt) > new Date(topicosUnicos[chaveTopico].data || topicosUnicos[chaveTopico].createdAt)) {
            topicosUnicos[chaveTopico] = topico;
          }
        });

        // Ordenar por data de estudo (mais recente primeiro)
        const topicosOrdenados = Object.values(topicosUnicos).sort((a, b) => {
          const dateA = new Date(b.data || b.createdAt || 0);
          const dateB = new Date(a.data || a.createdAt || 0);
          return dateA.getTime() - dateB.getTime();
        });

        setTopicosEstudados(topicosOrdenados);
      }
    } catch (error) {
      console.error('Erro ao buscar tópicos estudados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);

    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    return `${minutos}min`;
  };

  if (loading) {
    return (
      <>
        <style>
          {`
            .topicos-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
              gap: 20px;
              margin-top: 24px;
            }

            .skeleton-card {
              background: var(--darkmode-bg-secondary);
              border: 1px solid var(--darkmode-border-secondary);
              border-radius: 12px;
              padding: 20px;
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
              margin-bottom: 16px;
            }

            .skeleton-badge {
              height: 20px;
              width: 80px;
              background: linear-gradient(90deg, 
                var(--darkmode-border-secondary) 25%, 
                var(--darkmode-bg-primary) 50%, 
                var(--darkmode-border-secondary) 75%
              );
              background-size: 200% 100%;
              animation: skeleton-loading 1.5s infinite;
              border-radius: 12px;
              margin-left: auto;
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
          <h1>Histórico</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--darkmode-text-secondary)' }}>
            Tópicos já estudados
          </p>
        </header>

        <div className="topicos-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-subtitle"></div>
                </div>
                <div className="skeleton-badge"></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
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
            border-left: 4px solid #22c55e;
            border-color: rgba(34, 197, 94, 0.3);
          }

          .topico-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            border-color: var(--orange-primary);
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
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.3);
          }

          .topico-footer {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 12px;
            color: var(--darkmode-text-secondary);
          }

          .topico-data {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .topico-tempo {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--orange-primary);
            font-weight: 500;
          }

          .topico-plano {
            font-weight: 500;
          }

          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--darkmode-text-secondary);
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
        `}
      </style>

      <header className='flex flex-col head'>
        <h1>Histórico</h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--darkmode-text-secondary)' }}>
          Tópicos já estudados
        </p>
      </header>

      {topicosEstudados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3 className="empty-title">
            Nenhum tópico estudado ainda
          </h3>
          <p className="empty-text">
            Marque tópicos como estudados para que apareçam aqui no seu histórico.
          </p>
        </div>
      ) : (
        <div className="topicos-grid">
          {topicosEstudados.map(topico => {
            console.log(topico, 'jkl;asdf;jkldfasjkl;asdfjkl;asdfjkl;ajkl;dsfjkl;sdfjkl;')
            return (
              <Link
              key={topico._id}
              to={`/planos/${topico.planoId}/disciplinas/${topico.disciplinaId}?openModal=${encodeURIComponent(topico.topico)}`}
              className="topico-card"
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
                <span className="topico-badge">
                Já estudei
                </span>
              </div>
              <div className="topico-nome">
                Iniciada em: {topico.iniciadaEm ? formatarData(topico.iniciadaEm) : '-'}
              </div>
              <div className="topico-nome">
                Finalizada em: {topico.finalizadaEm ? formatarData(topico.finalizadaEm) : '-'}
              </div>
              <div className="topico-footer">
                <div className="topico-plano">
                {topico.planoNome}
                </div>
              </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  );
}

export default Historico;
