import Reacts from "react";
// Componente da Aba Detalhes
function AbaDetalhes({ questoesPlanejadas, setQuestoesPlanejadas, questoesRealizadas, setQuestoesRealizadas }) {

  // Função para validar e ajustar questões corretas
  const handleQuestoesRealizadasChange = (valor) => {
    const novoValor = parseInt(valor) || 0;
    setQuestoesRealizadas(novoValor);

    // Se questões corretas for menor que as questões erradas atuais, 
    // ajustar questões planejadas para manter a consistência
    const questoesErradasAtuais = Math.max(0, questoesPlanejadas - questoesRealizadas);
    if (novoValor < questoesErradasAtuais) {
      setQuestoesPlanejadas(novoValor + questoesErradasAtuais);
    } else {
      // Se aumentou as corretas, manter as planejadas igual ou maior
      if (novoValor > questoesPlanejadas) {
        setQuestoesPlanejadas(novoValor);
      }
    }
  };

  // Função para validar questões planejadas (através das erradas)
  const handleQuestoesPlanjadasChange = (valor) => {
    const novoValor = parseInt(valor) || 0;
    setQuestoesPlanejadas(novoValor);

    // Garantir que questões planejadas seja pelo menos igual às realizadas
    if (novoValor < questoesRealizadas) {
      setQuestoesPlanejadas(questoesRealizadas);
    }
 };
 
 return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Questões - Lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Questões Corretas */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Questões Corretas
          </label>
          <input
            type="number"
            value={questoesRealizadas}
            onChange={(e) => handleQuestoesRealizadasChange(e.target.value)}
            min="0"
            style={{
              width: '100%',
              height: '120px',
              padding: '30px',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              fontSize: '60px',
              textAlign: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          />
        </div>

        {/* Questões Erradas */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Questões Erradas
          </label>
          <input
            type="number"
            value={Math.max(0, questoesPlanejadas - questoesRealizadas)}
            onChange={(e) => {
              const questoesErradas = parseInt(e.target.value) || 0;
              const novasQuestoesPlanejadas = questoesRealizadas + questoesErradas;
              handleQuestoesPlanjadasChange(novasQuestoesPlanejadas);
            }}
            min="0"
            style={{
              width: '100%',
              height: '120px',
              padding: '30px',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              fontSize: '60px',
              textAlign: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default AbaDetalhes;