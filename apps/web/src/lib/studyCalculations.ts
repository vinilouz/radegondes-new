export interface DisciplineWithScores {
  id: string;
  name: string;
  topicCount: number;
  importance: number;
  knowledge: number;
}

export interface CalculatedDiscipline extends DisciplineWithScores {
  // O 'score' agora representa o Fator de Prioridade.
  score: number; 
  estimatedHours: number;
  percentage: number;
}

export interface StudyCalculationResult {
  disciplines: CalculatedDiscipline[];
  totalHours: number;
}

// Constantes relevantes para o novo cálculo
const KNOWLEDGE_SCALE_INVERSE = 6; // Usado para inverter a pontuação de conhecimento (6 - knowledge)
const FLOOR_PERCENTAGE = 0.6; // 60% do tempo médio é o piso garantido

/**
 * Calcula a distribuição de tempo de estudo usando o método de piso dinâmico.
 * 1. Garante um tempo mínimo para todas as disciplinas (60% do tempo médio).
 * 2. Distribui o tempo restante com base em um Fator de Prioridade.
 */
export function calculateStudyTimeDistribution(
  disciplines: DisciplineWithScores[],
  totalAvailableHours: number
): StudyCalculationResult {
  if (disciplines.length === 0) {
    return { disciplines: [], totalHours: 0 };
  }

  // --- PASSO 1: Calcular o piso dinâmico e o tempo restante ---
  const numeroDisciplinas = disciplines.length;
  const tempoMedio = totalAvailableHours / numeroDisciplinas;
  const tempoMinimoPorDisciplina = tempoMedio * FLOOR_PERCENTAGE;
  const tempoBaseTotal = tempoMinimoPorDisciplina * numeroDisciplinas;
  const tempoRestante = totalAvailableHours - tempoBaseTotal;

  // --- PASSO 2: Calcular o Fator de Prioridade para cada disciplina ---
  const factors = disciplines.map(d => {
    // Inverte o conhecimento: 1 (baixo) se torna 5 (alta necessidade), 5 se torna 1.
    const deficitConhecimento = KNOWLEDGE_SCALE_INVERSE - d.knowledge;
    const fatorPrioridade = d.importance * deficitConhecimento;
    return { id: d.id, fator: fatorPrioridade };
  });

  // Soma de todos os fatores para o cálculo proporcional
  const somaFatores = factors.reduce((sum, f) => sum + f.fator, 0);

  // --- PASSO 3: Distribuir o tempo restante e calcular o tempo final ---
  const finalDisciplines = disciplines.map(d => {
    const fatorInfo = factors.find(f => f.id === d.id);
    const fator = fatorInfo ? fatorInfo.fator : 0;

    // Apenas distribui se houver fatores de prioridade
    const tempoAdicional = somaFatores > 0 ? (fator / somaFatores) * tempoRestante : 0;
    
    const tempoFinal = tempoMinimoPorDisciplina + tempoAdicional;

    // Arredondamento para melhor exibição
    const estimatedHours = Math.round(tempoFinal * 10) / 10;
    const percentage = Math.round((tempoFinal / totalAvailableHours) * 100);
    
    return {
      ...d,
      score: Math.round(fator * 100) / 100, // O 'score' é o Fator de Prioridade
      estimatedHours,
      percentage,
    };
  });

  return {
    disciplines: finalDisciplines.sort((a, b) => b.estimatedHours - a.estimatedHours), // Ordena do maior para o menor
    totalHours: Math.round(totalAvailableHours * 10) / 10,
  };
}

// --- Funções Auxiliares (mantidas e ajustadas) ---

export function getScoreExplanation(score: number): string {
  // Ajustado para a nova escala de Fator de Prioridade (que pode ir de 0 a 25)
  if (score >= 15) return "Prioridade máxima - foco principal";
  if (score >= 10) return "Alta prioridade - tempo significativo";
  if (score >= 5) return "Prioridade média - tempo moderado";
  return "Prioridade de revisão - tempo de manutenção";
}

export function getKnowledgeLevelDescription(knowledge: number): string {
  switch (knowledge) {
    case 1: return "Iniciante";
    case 2: return "Básico";
    case 3: return "Intermediário";
    case 4: return "Avançado";
    case 5: return "Expert";
    default: return "Desconhecido";
  }
}

export function getImportanceLevelDescription(importance: number): string {
  switch (importance) {
    case 1: return "Muito Baixa";
    case 2: return "Baixa";
    case 3: return "Média";
    case 4: return "Alta";
    case 5: return "Muito Alta";
    default: "Desconhecida";
  }
}

// --- Funções de Explicação do Cálculo (Atualizadas) ---

export function getCalculationSteps(discipline: DisciplineWithScores, totalAvailableHours: number, allDisciplines: DisciplineWithScores[]): string[] {
  const numeroDisciplinas = allDisciplines.length;
  const tempoMedio = totalAvailableHours / numeroDisciplinas;
  const tempoMinimo = tempoMedio * FLOOR_PERCENTAGE;
  const tempoRestante = totalAvailableHours - (tempoMinimo * numeroDisciplinas);

  const deficit = KNOWLEDGE_SCALE_INVERSE - discipline.knowledge;
  const fatorPrioridade = discipline.importance * deficit;

  const somaFatores = allDisciplines.reduce((sum, d) => {
    return sum + (d.importance * (KNOWLEDGE_SCALE_INVERSE - d.knowledge));
  }, 0);

  const tempoAdicional = somaFatores > 0 ? (fatorPrioridade / somaFatores) * tempoRestante : 0;
  const tempoFinal = tempoMinimo + tempoAdicional;

  return [
    `1. Tempo Médio: ${totalAvailableHours}h ÷ ${numeroDisciplinas} disciplinas = ${tempoMedio.toFixed(2)}h`,
    `2. Tempo Mínimo (Piso): ${tempoMedio.toFixed(2)}h × ${FLOOR_PERCENTAGE * 100}% = ${tempoMinimo.toFixed(2)}h`,
    `3. Tempo Restante a Distribuir: ${totalAvailableHours}h - (${tempoMinimo.toFixed(2)}h × ${numeroDisciplinas}) = ${tempoRestante.toFixed(2)}h`,
    `4. Fator de Prioridade: ${discipline.importance} (imp) × ${deficit} (déficit) = ${fatorPrioridade.toFixed(2)}`,
    `5. Tempo Adicional: (${fatorPrioridade.toFixed(2)} ÷ ${somaFatores.toFixed(2)}) × ${tempoRestante.toFixed(2)}h = ${tempoAdicional.toFixed(2)}h`,
    `6. Horas Finais: ${tempoMinimo.toFixed(2)}h (mínimo) + ${tempoAdicional.toFixed(2)}h (adicional) = ${tempoFinal.toFixed(2)}h`
  ];
}

export function getSimpleFormula(): string {
  return `Cada matéria recebe um tempo mínimo, e o tempo restante é dividido pelo Fator de Prioridade (Importância × Déficit de Conhecimento).`;
}

export function getCompleteFormula(disciplinesCount: number, totalHours: number): string {
  return `Tempo Mínimo = (${totalHours}h ÷ ${disciplinesCount}) × ${FLOOR_PERCENTAGE * 100}%. O resto é distribuído por prioridade.`;
}