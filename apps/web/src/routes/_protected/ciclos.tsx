import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Plus, Edit, Trash2, BookOpen, Clock, BarChart3, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CreateCycleModal } from '@/components/planning/CreateCycleModal';
import { Badge } from '@/components/ui/badge';
import { calculateStudyTimeDistribution } from '@/lib/studyCalculations';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const Route = createFileRoute('/_protected/ciclos')({
  component: PlanejamentoPage,
});

function PlanejamentoPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const cyclesQuery = useQuery({
    ...trpc.getCycles.queryOptions(),
  });

  const deleteCycleMutation = useMutation({
    mutationFn: (cycleId: string) => trpcClient.deleteCycle.mutate({ cycleId }),
    onSuccess: () => {
      cyclesQuery.refetch();
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDeleteCycle = () => {
    if (activeCycle) {
      deleteCycleMutation.mutate(activeCycle.id);
    }
  };

  const cycles = cyclesQuery.data || [];
  const activeCycle = cycles.length > 0 ? cycles[0] : null;
  const hasCycles = cycles.length > 0;

  const cycleDetailsQuery = useQuery({
    ...trpc.getCycleDetails.queryOptions({ cycleId: activeCycle?.id || '' }),
    enabled: !!activeCycle,
  });

  const disciplines = cycleDetailsQuery.data?.disciplines || [];
  const totalDisciplines = disciplines.length;



  const studyTimeCalculation = disciplines.length > 0 ? calculateStudyTimeDistribution(
    disciplines.map(d => ({
      id: d.disciplineId,
      name: d.disciplineName || 'Sem nome',
      topicCount: d.topicCount || 0,
      importance: d.importance || 3,
      knowledge: d.knowledge || 3,
    })),
    activeCycle?.hoursPerWeek || 10
  ) : null;



  const weeklyStudyQuery = useQuery({
    ...trpc.getCycleWeeklyStudyTime.queryOptions({ cycleId: activeCycle?.id || '' }),
    enabled: !!activeCycle,
  });

  const weeklyStudiedHours = (weeklyStudyQuery.data?.totalTime || 0) / (1000 * 60 * 60);
  const weeklyGoalHours = activeCycle?.hoursPerWeek || 0;
  const weeklyProgress = weeklyGoalHours > 0 ? Math.min((weeklyStudiedHours / weeklyGoalHours) * 100, 100) : 0;

  const [hoveredDiscipline, setHoveredDiscipline] = useState<string | null>(null);



  if (cyclesQuery.isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ciclo de Estudos</h1>
          <p className="text-muted-foreground mt-2">
            {hasCycles
              ? "Visualize e gerencie seu ciclo de estudos"
              : "Crie seu primeiro ciclo de estudo para organizar sua aprendizagem"
            }
          </p>
        </div>

        {hasCycles && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar Ciclo
            </Button>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleteCycleMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Ciclo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                    Tem certeza que deseja excluir este ciclo de estudos? Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteCycle}
                    disabled={deleteCycleMutation.isPending}
                  >
                    {deleteCycleMutation.isPending ? 'Excluindo...' : 'Excluir Ciclo'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {!hasCycles && (
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="p-12 text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Target className="h-10 w-10 text-primary" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">Comece seu Ciclo de Estudos</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Crie ciclos de estudo organizados por disciplinas, definindo prioridades
                    e acompanhando sua jornada de aprendizado.
                  </p>
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

      {hasCycles && activeCycle && (
        <div className="space-y-6">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="flex flex-row items-center p-4">
                <div className="mr-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{totalDisciplines}</div>
                  <p className="text-sm text-muted-foreground">Disciplina{totalDisciplines !== 1 ? 's' : ''}</p>
                </div>
              </Card>

              <Card className="flex flex-row items-center p-4">
                <div className="mr-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{activeCycle.hoursPerWeek}h</div>
                  <p className="text-sm text-muted-foreground">Meta Semanal</p>
                </div>
              </Card>
            </div>

            <Card>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">Progresso Semanal</span>
                    <span className="text-2xl font-bold text-primary">
                      {weeklyStudiedHours.toFixed(1)}h / {weeklyGoalHours}h
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${weeklyProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Baseado nas sessões de estudo desta semana
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {cycleDetailsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : disciplines.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center">
                <p className="text-muted-foreground">Nenhuma disciplina encontrada neste ciclo.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Disciplinas</h3>
                <div className="space-y-3">
                  {disciplines.map((discipline) => {
                    const disciplineCalc = studyTimeCalculation?.disciplines.find(d => d.id === discipline.disciplineId);
                    return (
                      <Card
                        key={discipline.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate({
                          to: '/planos/$studyId/$disciplineId',
                          params: {
                            studyId: discipline.studyId,
                            disciplineId: discipline.disciplineId
                          }
                        })}
                      >
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-base">{discipline.disciplineName || 'Sem nome'}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Déficit: {discipline.importance * (6 - discipline.knowledge)}
                                </p>
                              </div>
                              {disciplineCalc && (
                                <div className="text-right">
                                  <div className="text-lg font-bold">{Math.floor(disciplineCalc.estimatedHours)}h {Math.round((disciplineCalc.estimatedHours % 1) * 60)}min</div>
                                  <div className="text-xs text-muted-foreground">por dia</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="relative w-full aspect-square max-w-sm mx-auto group">
                    {hoveredDiscipline && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="bg-background border rounded-lg px-3 py-2 shadow-lg">
                          <div className="font-medium text-sm">{hoveredDiscipline}</div>
                        </div>
                      </div>
                    )}
                    <svg viewBox="0 0 200 200" className="w-full h-full" onMouseLeave={() => setHoveredDiscipline(null)}>
                      {studyTimeCalculation && (() => {
                        let currentAngle = -90;
                        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];

                        return studyTimeCalculation.disciplines.map((discipline, index) => {
                          const percentage = discipline.percentage;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;

                          currentAngle = endAngle;

                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;

                          const outerRadius = 90;
                          const innerRadius = 60;

                          const x1 = 100 + outerRadius * Math.cos(startRad);
                          const y1 = 100 + outerRadius * Math.sin(startRad);
                          const x2 = 100 + outerRadius * Math.cos(endRad);
                          const y2 = 100 + outerRadius * Math.sin(endRad);
                          const x3 = 100 + innerRadius * Math.cos(endRad);
                          const y3 = 100 + innerRadius * Math.sin(endRad);
                          const x4 = 100 + innerRadius * Math.cos(startRad);
                          const y4 = 100 + innerRadius * Math.sin(startRad);

                          const largeArc = angle > 180 ? 1 : 0;

                          const pathData = [
                            `M ${x1} ${y1}`,
                            `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
                            `L ${x3} ${y3}`,
                            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
                            'Z'
                          ].join(' ');

                          return (
                            <path
                              key={discipline.id}
                              d={pathData}
                              fill={colors[index % colors.length]}
                              className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                              onMouseEnter={() => setHoveredDiscipline(`${discipline.name}: ${percentage}% (${discipline.estimatedHours}h)`)}
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>

                  <div className="mt-6 space-y-2">
                    {studyTimeCalculation && studyTimeCalculation.disciplines.map((discipline, index) => {
                      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];

                      return (
                        <div key={discipline.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="truncate">{discipline.name}</span>
                          </div>
                          <span className="font-medium">{discipline.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

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
