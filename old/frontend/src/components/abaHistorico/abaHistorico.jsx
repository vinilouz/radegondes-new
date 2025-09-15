// Componente da Aba Histórico
function AbaHistorico({ registrosEstudo, carregandoRegistros, disciplina }) {
  if (carregandoRegistros) {
    return <SkeletonList count={4} />;
  }

  if (!registrosEstudo || registrosEstudo.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: 'var(--darkmode-text-secondary)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <h4 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: '0 0 8px 0'
        }}>
          Nenhum registro encontrado
        </h4>
        <p style={{
          fontSize: '14px',
          color: 'var(--darkmode-text-secondary)',
          margin: 0
        }}>
          Você ainda não registrou estudos para esta disciplina.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: 0
        }}>
          Histórico de Estudos ({registrosEstudo.length})
        </h4>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {registrosEstudo.map((registro, index) => (
          <div
            key={registro._id || index}
            style={{
              padding: '20px',
              backgroundColor: 'var(--darkmode-bg-tertiary)',
              borderRadius: '12px',
              border: '1px solid var(--darkmode-border-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Cabeçalho do registro */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '15px'
            }}>
              <div>
                <h5 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--darkmode-text-primary)',
                  margin: '0 0 5px 0'
                }}>
                  {registro.topico || 'Tópico não informado'}
                </h5>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--darkmode-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <span>📅 {new Date(registro.data || registro.createdAt).toLocaleDateString('pt-BR')}</span>
                  {registro.iniciadaEm && (
                    <span>🟢 Início: {new Date(registro.iniciadaEm).toLocaleTimeString('pt-BR')}</span>
                  )}
                  {registro.finalizadaEm && (
                    <span>🔴 Fim: {new Date(registro.finalizadaEm).toLocaleTimeString('pt-BR')}</span>
                  )}
                  <span>⏱️ {Math.floor((registro.tempoEstudo || 0) / 60)}min {String((registro.tempoEstudo || 0) % 60).padStart(2, '0')}s</span>
                  {registro.estudoFinalizado && <span style={{ color: 'var(--darkmode-button-success)' }}>✅ Finalizado</span>}
                  {!registro.estudoFinalizado && <span style={{ color: '#F59E0B' }}>⏳ Em andamento</span>}
                </div>
              </div>
            </div>

            {/* Conteúdo do registro */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px'
            }}>
              {/* Material */}
              <div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--darkmode-text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '5px',
                  display: 'block'
                }}>
                  📖 Material
                </label>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--darkmode-text-primary)',
                  backgroundColor: 'var(--darkmode-bg-secondary)',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--darkmode-border-secondary)',
                  minHeight: '40px'
                }}>
                  {registro.material || 'Não informado'}
                </div>
              </div>

              {/* Comentários */}
              <div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--darkmode-text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '5px',
                  display: 'block'
                }}>
                  💬 Comentários
                </label>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--darkmode-text-primary)',
                  backgroundColor: 'var(--darkmode-bg-secondary)',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--darkmode-border-secondary)',
                  minHeight: '40px'
                }}>
                  {registro.observacoes || 'Não informado'}
                </div>
              </div>
            </div>

            {/* Links (se houver) */}
            {registro.links && registro.links.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--darkmode-text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '5px',
                  display: 'block'
                }}>
                  🔗 Links ({registro.links.length})
                </label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}>
                  {registro.links.map((link, linkIndex) => (
                    <div key={linkIndex} style={{
                      fontSize: '13px',
                      backgroundColor: 'var(--darkmode-bg-secondary)',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--darkmode-border-secondary)'
                    }}>
                      <strong>{link.titulo}:</strong> <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange-primary)' }}>{link.url}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questões (sempre mostrar) */}
            <div style={{
              marginTop: '15px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '15px',
              fontSize: '13px',
              backgroundColor: 'var(--darkmode-bg-secondary)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--darkmode-border-secondary)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#10B981', fontSize: '16px' }}>
                  {registro.questoesPlanejadas || 0}
                </div>
                <div style={{ color: 'var(--darkmode-text-secondary)' }}>✅ Corretas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#EF4444', fontSize: '16px' }}>
                  {registro.questoesRealizadas || 0}
                </div>
                <div style={{ color: 'var(--darkmode-text-secondary)' }}>❌ Erradas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  color: registro.questoesPlanejadas > 0 ?
                    (registro.questoesRealizadas >= registro.questoesPlanejadas ? 'var(--darkmode-button-success)' : '#F59E0B') :
                    'var(--darkmode-text-secondary)'
                }}>
                  {registro.questoesPlanejadas > 0 ?
                    Math.round((registro.questoesRealizadas / registro.questoesPlanejadas) * 100) :
                    0}%
                </div>
                <div style={{ color: 'var(--darkmode-text-secondary)' }}>📊 Progresso</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AbaHistorico;