import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { SkeletonStats, SkeletonList } from '../../components/Skeleton';

function Estatisticas() {
  const { token } = useAuth();
  /** @        function Estatisticas() {
  const { token } = useAuth();
  /** @type {[any, Function]} */
  const [stats, setStats] = useState({
    totalPlanos: 0,
    totalDisciplinas: 0,
    totalTopicos: 0,
    totalQuestoes: 0,
    questoesCertas: 0,
    totalTempoEstudo: 0,
    totalRegistrosEstudo: 0,
    totalRevisoes: 0,
    planosRecentes: [],
    disciplinasMaisEstudadas: [],
    tempoEstudoPorMes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Estatísticas - Radegondes';
    fetchEstatisticas();
  }, []);

  const fetchEstatisticas = async () => {
    try {
      setLoading(true);
      
      // Buscar dados reais de diferentes endpoints
      const [planosRes, registrosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/planos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/registros-estudo`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const planos = planosRes.ok ? await planosRes.json() : [];
      const registrosData = registrosRes.ok ? await registrosRes.json() : { registros: [] };
      const registros = registrosData.registros || registrosData;

      console.log('📊 Dados coletados:', { 
        planos: planos.length, 
        registros: registros.length
      });

      // Calcular estatísticas reais
      const totalPlanos = Array.isArray(planos) ? planos.length : 0;
      
      // Contar disciplinas únicas dos planos do usuário
      const disciplinasUnicas = new Set();
      planos.forEach(plano => {
        if (plano.disciplinas && Array.isArray(plano.disciplinas)) {
          plano.disciplinas.forEach(disc => {
            disciplinasUnicas.add(disc._id || disc.id || disc);
          });
        }
      });
      const totalDisciplinas = disciplinasUnicas.size;

      // Contar tópicos únicos dos registros (apenas registros que têm tópico preenchido)
      const topicosUnicos = new Set();
      registros.forEach(registro => {
        if (registro.topico && registro.topico.trim() !== '') {
          topicosUnicos.add(`${registro.disciplinaId}-${registro.topico.trim()}`);
        }
      });
      const totalTopicos = topicosUnicos.size;

      // Calcular tempo total de estudo (em segundos) - apenas registros com tempo preenchido
      const totalTempoEstudo = registros.reduce((total, registro) => {
        if (registro.tempoEstudo && !isNaN(registro.tempoEstudo)) {
          return total + (Number(registro.tempoEstudo) * 60); // converter minutos para segundos
        }
        return total;
      }, 0);

      // Contar apenas registros de estudo válidos (com dados preenchidos)
      const registrosValidos = registros.filter(r => 
        r.topico && r.topico.trim() !== '' && r.disciplinaId
      );
      const totalRegistrosEstudo = registrosValidos.length;

      // Contar revisões (registros com dataOpcao === 'agendar' e data preenchida)
      const totalRevisoes = registros.filter(r => 
        r.dataOpcao === 'agendar' && r.dataAgendada && r.dataAgendada.trim() !== ''
      ).length;

      // Calcular questões resolvidas (soma de questoesRealizadas de todos os registros)
      const totalQuestoes = registros.reduce((total, registro) => {
        if (registro.questoesRealizadas && !isNaN(registro.questoesRealizadas)) {
          return total + Number(registro.questoesRealizadas);
        }
        return total;
      }, 0);

      // Calcular questões certas do último registro de cada tópico
      const ultimosRegistrosPorTopico = {};
      registros.forEach(registro => {
        if (registro.topico && registro.topico.trim() !== '' && registro.disciplinaId) {
          const chaveTopico = `${registro.disciplinaId}-${registro.topico.trim()}`;
          const dataRegistro = new Date(registro.createdAt || registro.dataRegistro || Date.now());
          
          if (!ultimosRegistrosPorTopico[chaveTopico] || 
              new Date(ultimosRegistrosPorTopico[chaveTopico].createdAt || ultimosRegistrosPorTopico[chaveTopico].dataRegistro || 0) < dataRegistro) {
            ultimosRegistrosPorTopico[chaveTopico] = registro;
          }
        }
      });

      const questoesCertas = Object.values(ultimosRegistrosPorTopico).reduce((total, registro) => {
        if (registro.questoesRealizadas && !isNaN(registro.questoesRealizadas)) {
          return total + Number(registro.questoesRealizadas);
        }
        return total;
      }, 0);

      console.log('📈 Estatísticas calculadas:', {
        totalPlanos,
        totalDisciplinas,
        totalTopicos,
        totalQuestoes,
        questoesCertas,
        totalTempoEstudo,
        totalRegistrosEstudo,
        totalRevisoes
      });

      setStats({
        totalPlanos,
        totalDisciplinas,
        totalTopicos,
        totalQuestoes,
        questoesCertas,
        totalTempoEstudo,
        totalRegistrosEstudo,
        totalRevisoes,
        planosRecentes: [],
        disciplinasMaisEstudadas: [],
        tempoEstudoPorMes: []
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Em caso de erro, definir valores zerados
      setStats({
        totalPlanos: 0,
        totalDisciplinas: 0,
        totalTopicos: 0,
        totalQuestoes: 0,
        questoesCertas: 0,
        totalTempoEstudo: 0,
        totalRegistrosEstudo: 0,
        totalRevisoes: 0,
        planosRecentes: [],
        disciplinasMaisEstudadas: [],
        tempoEstudoPorMes: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else if (minutos > 0) {
      return `${minutos}m`;
    } else {
      return `${segundos}s`;
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <>
        <header className='flex flex-col head'>
          <h1>Estatísticas</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--darkmode-text-secondary)' }}>
            Acompanhe seu progresso e desempenho nos estudos
          </p>
        </header>
        
        <SkeletonStats count={6} />
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '30px',
          marginTop: '30px'
        }}>
          <div>
            <div style={{ 
              height: '24px', 
              width: '200px', 
              background: 'linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-loading 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '20px'
            }} />
            <SkeletonList count={3} />
          </div>
          
          <div>
            <div style={{ 
              height: '24px', 
              width: '250px', 
              background: 'linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-loading 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '20px'
            }} />
            <SkeletonList count={3} />
          </div>
        </div>
        
        <style>
          {`
            @keyframes skeleton-loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}
        </style>
      </>
    );
  }

  return (
    <>
      <header className='flex flex-col head'>
        <h1>Estatísticas</h1>
        <p>Acompanhe seu progresso e desempenho nos estudos</p>
      </header>

      {/* Cards de Estatísticas Gerais */}
      <div className="stats-grid" style={{ marginBottom: '40px' }}>
        <div className="stat-card">
          <div className="stat-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Total de Estudos
          </div>
          <div className="stat-value" style={{ textAlign: 'center' }}>
            {stats.totalPlanos}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 6H21M8 12H21M8 18H21M3 6.5H4V5.5H3V6.5ZM3 12.5H4V11.5H3V12.5ZM3 18.5H4V17.5H3V18.5Z" stroke="#FF6B35" strokeWidth="2"/>
            </svg>
            Tópicos Estudados
          </div>
          <div className="stat-value-orange" style={{ textAlign: 'center' }}>
            {stats.totalTopicos}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Tempo Total Estudado
          </div>
          <div className="stat-value" style={{ textAlign: 'center' }}>
            {formatarTempo(stats.totalTempoEstudo)}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Questões Certas
          </div>
          <div className="stat-value-success" style={{ textAlign: 'center' }}>
            {stats.questoesCertas}
          </div>
        </div>
      </div>

      {/* Gráficos de Análise Semanal */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '30px',
        marginBottom: '40px'
      }}>
        
        {/* Gráfico de Desempenho */}
        <div className="chart-section">
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px',
            color: 'var(--darkmode-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Desempenho Semanal
          </h3>
          <div style={{
            background: 'var(--darkmode-bg-secondary)',
            border: '1px solid var(--darkmode-border-secondary)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            {stats.totalRegistrosEstudo > 0 ? (
              <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'space-around',
                  height: '160px',
                  borderBottom: '1px solid var(--darkmode-border-secondary)',
                  gap: '8px'
                }}>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => {
                    const registrosDia = Math.floor(Math.random() * 5) + 1; // Simular dados por enquanto
                    const altura = Math.max(20, (registrosDia / 5) * 120);
                    return (
                      <div key={dia} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1
                      }}>
                        <div className="chart-bar" style={{
                          background: `linear-gradient(180deg, var(--orange-primary), ${index % 2 === 0 ? '#FF8A65' : '#FF7043'})`,
                          width: '100%',
                          maxWidth: '40px',
                          height: `${altura}px`,
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '8px',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {registrosDia}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--darkmode-text-tertiary)',
                          fontWeight: '500'
                        }}>
                          {dia}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: 'var(--darkmode-text-secondary)'
                }}>
                  Sessões de estudo por dia da semana
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--darkmode-text-secondary)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                <p>Nenhum dado de desempenho ainda</p>
                <p style={{ fontSize: '12px' }}>Comece a estudar para ver seu progresso</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Tempo de Estudo */}
        <div className="chart-section">
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px',
            color: 'var(--darkmode-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⏱️ Tempo de Estudo Semanal
          </h3>
          <div style={{
            background: 'var(--darkmode-bg-secondary)',
            border: '1px solid var(--darkmode-border-secondary)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            {stats.totalTempoEstudo > 0 ? (
              <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'space-around',
                  height: '160px',
                  borderBottom: '1px solid var(--darkmode-border-secondary)',
                  gap: '8px'
                }}>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => {
                    const tempoMinutos = Math.floor(Math.random() * 120) + 30; // Simular dados por enquanto
                    const altura = Math.max(20, (tempoMinutos / 150) * 120);
                    return (
                      <div key={dia} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1
                      }}>
                        <div className="chart-bar" style={{
                          background: `linear-gradient(180deg, #4CAF50, ${index % 2 === 0 ? '#66BB6A' : '#81C784'})`,
                          width: '100%',
                          maxWidth: '40px',
                          height: `${altura}px`,
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '8px',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: '600',
                            textAlign: 'center',
                            lineHeight: '1'
                          }}>
                            {tempoMinutos}m
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--darkmode-text-tertiary)',
                          fontWeight: '500'
                        }}>
                          {dia}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: 'var(--darkmode-text-secondary)'
                }}>
                  Tempo total estudado por dia (minutos)
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--darkmode-text-secondary)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
                <p>Nenhum tempo registrado ainda</p>
                <p style={{ fontSize: '12px' }}>Comece a cronometrar seus estudos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Estatisticas;
