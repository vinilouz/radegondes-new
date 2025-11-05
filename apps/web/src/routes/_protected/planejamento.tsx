import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Clock, CheckCircle, Plus, Calendar, TrendingUp, Edit } from 'lucide-react';
import { formatTime, formatTimeRelative, formatHoursMinutes } from '@/lib/utils';
import { useState } from 'react';
import { CreateCycleModal } from '@/components/planning/CreateCycleModal';
import { TopicTime } from '@/components/TopicTime';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/_protected/planejamento')({
  component: PlanejamentoPage,
});

function PlanejamentoPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const cyclesQuery = useQuery({
    ...trpc.getCycles.queryOptions(),
  });

  const cycles = cyclesQuery.data || [];
  const activeCycle = cycles.find(c => c.status === 'active');
  const hasCycles = cycles.length > 0;

  // Buscar detalhes do ciclo ativo incluindo tópicos
  const cycleDetailsQuery = useQuery({
    ...trpc.getCycleDetails.queryOptions({ cycleId: activeCycle?.id || '' }),
    enabled: !!activeCycle,
  });

  const cycleTopics = cycleDetailsQuery.data?.topics || [];
  const futureSessions = cycleDetailsQuery.data?.futureSessions || [];

  // Calcular tempo de sessões completadas do ciclo por tópico
  const cycleCompletedTimeByTopic = cycleTopics.reduce((acc, topic) => {
    acc[topic.topicId] = topic.completedTime || 0;
    return acc;
  }, {} as Record<string, number>);

  // Calcular estatísticas gerais
  const completedCycles = cycles.filter(c => c.status === 'completed').length;
  const activeCycles = cycles.filter(c => c.status === 'active').length;
  const totalCompletedTime = cycles.reduce((sum, c) => sum + (c.completedTime || 0), 0);
  const totalRequiredTime = cycles.reduce((sum, c) => sum + (c.totalRequiredTime || 0), 0);

  if (cyclesQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planejamento de Estudos</h1>
          <p className="text-muted-foreground mt-2">
            {hasCycles
              ? "Acompanhe seu progresso e continue sua jornada de aprendizado"
              : "Crie seu primeiro ciclo de estudo para organizar sua aprendizagem de forma inteligente"
            }
          </p>
        </div>

        {hasCycles && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar Ciclo
          </Button>
        )}
      </div>

      {/* PRIMEIRO ACESSO: Apenas tela de criação */}
      {!hasCycles && (
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="p-12 text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Target className="h-10 w-10 text-primary" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">Comece seu Planejamento de Estudos</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Crie ciclos de estudo personalizados para organizar seus tópicos,
                    definir prioridades e acompanhar seu progresso de forma inteligente.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Selecione Tópicos</h4>
                      <p className="text-xs text-muted-foreground">Escolha por disciplina e tempo</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Defina Relevância</h4>
                      <p className="text-xs text-muted-foreground">Importância e conhecimento</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Configure Horários</h4>
                      <p className="text-xs text-muted-foreground">Dias e duração</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  size="lg"
                  className="px-8 py-3 text-base"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Criar Meu Primeiro Ciclo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* COM CICLO CRIADO: Exibir diretamente o plano ativo */}
      {hasCycles && activeCycle && (
        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ciclo Atual</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{activeCycle.name}</div>
                <p className="text-xs text-muted-foreground">
                  {activeCycle.topicCount || 0} tópicos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progresso</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeCycle.totalRequiredTime > 0
                    ? Math.round((activeCycle.completedTime || 0) / activeCycle.totalRequiredTime * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTime(activeCycle.completedTime || 0)} / {formatTime(activeCycle.totalRequiredTime)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas/Semana</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCycle.hoursPerWeek}h</div>
                <p className="text-xs text-muted-foreground">
                  por semana
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ciclos Completos</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCycles}</div>
                <p className="text-xs text-muted-foreground">
                  {totalCompletedTime > 0 && `• ${formatTime(totalCompletedTime)} total`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar Geral */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do Ciclo</span>
              <span className="font-medium">
                {activeCycle.totalRequiredTime > 0
                  ? Math.round((activeCycle.completedTime || 0) / activeCycle.totalRequiredTime * 100)
                  : 0}%
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${activeCycle.totalRequiredTime > 0 ? (activeCycle.completedTime || 0) / activeCycle.totalRequiredTime * 100 : 0}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(activeCycle.completedTime || 0)} concluídos</span>
              <span>{formatTime(activeCycle.totalRequiredTime)} total</span>
            </div>
          </div>

          {/* Lista de Tópicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tópicos do Ciclo</h3>

            {cycleDetailsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : cycleTopics.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Nenhum tópico encontrado neste ciclo.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {cycleTopics.map((topic) => {
                  const estimatedMinutes = (typeof topic.requiredTime === 'number' && topic.requiredTime > 0)
                    ? topic.requiredTime
                    : ((topic.importance * 30) + ((5 - topic.knowledge) * 20));
                  const requiredMs = estimatedMinutes * 60 * 1000;
                  const completedMs = cycleCompletedTimeByTopic[topic.topicId] || 0;
                  const progress = requiredMs > 0 ? Math.round((completedMs / requiredMs) * 100) : 0;

                  const nextSession = futureSessions.find((s) => s.topicId === topic.topicId && s.status === 'pending')
                  return (
                    <Card key={topic.id} className="hover:shadow-md transition-shadow py-0">
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{topic.topicName}</h3>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progresso do Tópico</span>
                              <span className="font-medium">
                                {formatHoursMinutes(completedMs)} / {formatHoursMinutes(requiredMs)} ({progress}%)
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <TopicTime
                              topicId={topic.topicId}
                              disciplineId={topic.disciplineId}
                              studyId={topic.studyPlanId}
                              showButton={true}
                              displayMs={cycleCompletedTimeByTopic[topic.topicId] || 0}
                              cycleContext={{
                                cycleId: activeCycle.id,
                                cycleName: activeCycle.name,
                                topicName: topic.topicName,
                                disciplineName: (topic as any).disciplineName ?? '',
                                cycleSessionId: nextSession?.id
                              }}
                              onStop={() => cycleDetailsQuery.refetch()}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outros Ciclos (se houver) */}
          {cycles.length > 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Outros Ciclos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cycles.filter(c => c.id !== activeCycle.id).map((cycle) => (
                  <Card key={cycle.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{cycle.name}</h4>
                          {cycle.status === 'completed' && (
                            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                              Completo
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tópicos:</span>
                            <span className="ml-1 font-medium">{cycle.topicCount || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Progresso:</span>
                            <span className="ml-1 font-medium">
                              {cycle.totalRequiredTime > 0
                                ? Math.round((cycle.completedTime || 0) / cycle.totalRequiredTime * 100)
                                : 0}%
                            </span>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="w-full">
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <CreateCycleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          cyclesQuery.refetch();
        }}
        existingCycle={activeCycle ? {
          id: activeCycle.id,
          name: activeCycle.name,
          hoursPerWeek: activeCycle.hoursPerWeek,
          studyDays: activeCycle.studyDays,
          minSessionDuration: activeCycle.minSessionDuration,
          maxSessionDuration: activeCycle.maxSessionDuration,
        } : undefined}
      />
    </div>
  );
}