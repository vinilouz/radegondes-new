export interface DisciplineWithScores {
  id: string;
  name: string;
  topicCount: number;
  importance: number;
  knowledge: number;
}

export interface CalculatedDiscipline extends DisciplineWithScores {
  score: number;
  estimatedHours: number;
  percentage: number;
}

export interface StudyCalculationResult {
  disciplines: CalculatedDiscipline[];
  totalHours: number;
}

const IMPORTANCE_WEIGHT = 0.6;
const KNOWLEDGE_WEIGHT = 0.4;
const MAX_IMPORTANCE_KNOWLEDGE_SCORE = 5;
const WEIGHT_VARIATION = 0.5;

function calculateDisciplineScore(importance: number, knowledge: number): number {
  const normalizedImportance = (importance - 1) / (MAX_IMPORTANCE_KNOWLEDGE_SCORE - 1);
  const normalizedKnowledge = (MAX_IMPORTANCE_KNOWLEDGE_SCORE - knowledge) / (MAX_IMPORTANCE_KNOWLEDGE_SCORE - 1);
  
  return (normalizedImportance * IMPORTANCE_WEIGHT) + (normalizedKnowledge * KNOWLEDGE_WEIGHT);
}

function calculateWeightMultiplier(score: number): number {
  return 1 + ((score - 0.5) * WEIGHT_VARIATION);
}

export function calculateStudyTimeDistribution(
  disciplines: DisciplineWithScores[],
  totalAvailableHours: number
): StudyCalculationResult {
  if (disciplines.length === 0) {
    return { disciplines: [], totalHours: 0 };
  }

  const baseHoursPerDiscipline = totalAvailableHours / disciplines.length;

  const disciplinesWithScores = disciplines.map(discipline => {
    const score = calculateDisciplineScore(discipline.importance, discipline.knowledge);
    const weightMultiplier = calculateWeightMultiplier(score);
    const adjustedHours = baseHoursPerDiscipline * weightMultiplier;
    
    return {
      ...discipline,
      score: Math.round(score * 100) / 100,
      estimatedHours: Math.round(adjustedHours * 10) / 10,
      percentage: 0,
    };
  });

  const totalEstimatedHours = disciplinesWithScores.reduce((sum, d) => sum + d.estimatedHours, 0);
  const scaleFactor = totalAvailableHours / totalEstimatedHours;
  
  const finalDisciplines = disciplinesWithScores.map(discipline => ({
    ...discipline,
    estimatedHours: Math.round(discipline.estimatedHours * scaleFactor * 10) / 10,
    percentage: Math.round((discipline.estimatedHours / totalEstimatedHours) * 100),
  }));

  const adjustedTotalHours = finalDisciplines.reduce((sum, d) => sum + d.estimatedHours, 0);

  return {
    disciplines: finalDisciplines,
    totalHours: Math.round(adjustedTotalHours * 10) / 10,
  };
}

export function getScoreExplanation(score: number): string {
  if (score >= 0.8) return "Prioridade máxima - requer mais tempo";
  if (score >= 0.6) return "Alta prioridade - tempo significativo";
  if (score >= 0.4) return "Prioridade média - tempo moderado";
  if (score >= 0.2) return "Baixa prioridade - tempo reduzido";
  return "Prioridade mínima - tempo mínimo";
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
    default: return "Desconhecida";
  }
}

export function getCalculationSteps(discipline: DisciplineWithScores, totalAvailableHours: number, allDisciplines: DisciplineWithScores[]): string[] {
  const baseHoursPerDiscipline = totalAvailableHours / allDisciplines.length;
  const score = calculateDisciplineScore(discipline.importance, discipline.knowledge);
  const weightMultiplier = calculateWeightMultiplier(score);
  const adjustedHours = baseHoursPerDiscipline * weightMultiplier;
  
  const allAdjustedHours = allDisciplines.map(d => {
    const s = calculateDisciplineScore(d.importance, d.knowledge);
    const wm = calculateWeightMultiplier(s);
    return baseHoursPerDiscipline * wm;
  });
  const totalAdjusted = allAdjustedHours.reduce((sum, h) => sum + h, 0);
  const scaleFactor = totalAvailableHours / totalAdjusted;
  const finalHours = adjustedHours * scaleFactor;
  
  return [
    `Horas base: ${totalAvailableHours}h ÷ ${allDisciplines.length} = ${baseHoursPerDiscipline.toFixed(2)}h`,
    `Pontuação: (${discipline.importance} × ${IMPORTANCE_WEIGHT} + (${MAX_IMPORTANCE_KNOWLEDGE_SCORE} - ${discipline.knowledge}) × ${KNOWLEDGE_WEIGHT}) = ${score.toFixed(2)}`,
    `Multiplicador: 1 + (${score.toFixed(2)} - 0.5) × ${WEIGHT_VARIATION} = ${weightMultiplier.toFixed(2)}`,
    `Horas ajustadas: ${baseHoursPerDiscipline.toFixed(2)}h × ${weightMultiplier.toFixed(2)} = ${adjustedHours.toFixed(2)}h`,
    `Fator de escala: ${totalAvailableHours}h ÷ ${totalAdjusted.toFixed(2)}h = ${scaleFactor.toFixed(2)}`,
    `Horas finais: ${adjustedHours.toFixed(2)}h × ${scaleFactor.toFixed(2)} = ${finalHours.toFixed(2)}h`
  ];
}

export function getSimpleFormula(): string {
  return `Base: Total ÷ Disciplinas, depois ajustado por (Importância × ${IMPORTANCE_WEIGHT} + (${MAX_IMPORTANCE_KNOWLEDGE_SCORE} - Conhecimento) × ${KNOWLEDGE_WEIGHT})`;
}

export function getCompleteFormula(disciplinesCount: number, totalHours: number): string {
  return `Horas por disciplina = [(${totalHours}h ÷ ${disciplinesCount} disciplinas) × Pontuação da disciplina]`;
}