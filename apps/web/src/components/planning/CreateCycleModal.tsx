import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion } from '@/components/ui/accordion';
import { Target, ChevronRight, ChevronLeft, Plus, BookOpen, CheckCircle2, ArrowRight, Clock, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CreateCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCycle?: {
    id: string;
    name: string;
    hoursPerWeek: number;
    studyDays: string;
    minSessionDuration: number;
    maxSessionDuration: number;
  };
}

interface DisciplineSelection {
  disciplineId: string;
  name: string;
  topicCount: number;
  selected: boolean;
  importance: number;
  knowledge: number;
}

export function CreateCycleModal({ isOpen, onClose, onSuccess, existingCycle }: CreateCycleModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [cycleName, setCycleName] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState<DisciplineSelection[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);

  const disciplinesQuery = useQuery({
    ...trpc.getDisciplinesWithTopicCount.queryOptions(),
    enabled: isOpen,
  });

  const cycleDetailsQuery = useQuery({
    ...trpc.getCycleDetails.queryOptions({ cycleId: existingCycle?.id || '' }),
    enabled: isOpen && !!existingCycle,
  });

  const createCycleMutation = useMutation({
    ...trpc.createStudyCycle.mutationOptions(),
    onSuccess: () => {
      onSuccess();
      resetForm();
    },
  });

  const updateCycleMutation = useMutation({
    ...trpc.updateStudyCycle.mutationOptions(),
    onSuccess: () => {
      onSuccess();
      resetForm();
    },
  });

  const resetForm = () => {
    setCurrentStep(1);
    setCycleName('');
    setSelectedDisciplines([]);
    setHoursPerWeek(10);
  };

  useEffect(() => {
    if (isOpen && !existingCycle) {
      setCurrentStep(1);
      setCycleName('');
      setSelectedDisciplines([]);
      setHoursPerWeek(10);
    }
  }, [isOpen, existingCycle]);

  useEffect(() => {
    if (existingCycle && cycleDetailsQuery.data) {
      setCycleName(existingCycle.name);
      setHoursPerWeek(existingCycle.hoursPerWeek);

      const cycleDisciplines = cycleDetailsQuery.data.disciplines || [];
      setSelectedDisciplines(cycleDisciplines.map(cd => ({
        disciplineId: cd.disciplineId,
        name: cd.disciplineName || '',
        topicCount: cd.topicCount || 0,
        selected: true,
        importance: cd.importance,
        knowledge: cd.knowledge,
      })));
    }
  }, [existingCycle, cycleDetailsQuery.data]);

  const handleDisciplineToggle = (disciplineId: string) => {
    setSelectedDisciplines(prev => {
      const disc = disciplinesQuery.data?.find(d => d.id === disciplineId);
      if (!disc) return prev;

      if (prev.find(d => d.disciplineId === disciplineId)) {
        return prev.filter(d => d.disciplineId !== disciplineId);
      } else {
        return [...prev, {
          disciplineId: disc.id,
          name: disc.name,
          topicCount: disc.topicCount || 0,
          selected: true,
          importance: 3,
          knowledge: 3,
        }];
      }
    });
  };

  const handleDisciplineImportanceChange = (disciplineId: string, value: number) => {
    setSelectedDisciplines(prev => prev.map(d =>
      d.disciplineId === disciplineId ? { ...d, importance: value } : d
    ));
  };

  const handleDisciplineKnowledgeChange = (disciplineId: string, value: number) => {
    setSelectedDisciplines(prev => prev.map(d =>
      d.disciplineId === disciplineId ? { ...d, knowledge: value } : d
    ));
  };

  const handleSubmit = () => {
    if (selectedDisciplines.length === 0) return;

    const payload = {
      name: cycleName || `Ciclo ${new Date().toLocaleDateString('pt-BR')}`,
      disciplines: selectedDisciplines.map(d => ({
        disciplineId: d.disciplineId,
        importance: d.importance,
        knowledge: d.knowledge,
      })),
      hoursPerWeek,
    };

    if (existingCycle) {
      updateCycleMutation.mutate({
        cycleId: existingCycle.id,
        ...payload,
      });
    } else {
      createCycleMutation.mutate(payload);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedDisciplines.length > 0;
      case 2:
        return hoursPerWeek > 0;
      case 3:
        return selectedDisciplines.every(d => d.importance >= 1 && d.importance <= 5 && d.knowledge >= 1 && d.knowledge <= 5);
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl">{existingCycle ? 'Editar Ciclo de Estudo' : 'Criar Ciclo de Estudo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4 border-b">
          <Progress value={(currentStep / 3) * 100} className="h-2" />

          <div className="flex items-center justify-between">
            {[
              { id: 1, title: "Disciplinas", description: "Selecione as disciplinas", icon: BookOpen },
              { id: 2, title: "Disponibilidade", description: "Defina horas semanais", icon: Clock },
              { id: 3, title: "Relevância", description: "Ajuste importância e conhecimento", icon: Target }
            ].map((step, index, steps) => (
              <div key={step.id} className="flex items-center space-x-3 flex-1">
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentStep >= step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted-foreground/30 text-muted-foreground'
                      }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className={`h-4 w-4 flex-shrink-0 mx-2 ${currentStep > step.id ? 'text-primary' : 'text-muted-foreground/30'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className='flex-1 py-4 h-100 overflow-y-auto'>

          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="border-2 border-primary/20 bg-primary/5 p-0">
                <CardContent className="px-3 py-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Selecione as Disciplinas</h3>
                      <p className="text-muted-foreground">
                        Escolha as disciplinas que farão parte do seu ciclo de estudos.
                      </p>
                      {selectedDisciplines.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            {selectedDisciplines.length} disciplina{selectedDisciplines.length > 1 ? 's' : ''} selecionada{selectedDisciplines.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {disciplinesQuery.data && disciplinesQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {disciplinesQuery.data.map((discipline) => {
                    const isSelected = selectedDisciplines.find(d => d.disciplineId === discipline.id);
                    return (
                      <Card
                        key={discipline.id}
                        className={`py-0 cursor-pointer transition-all hover:shadow-sm ${isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                          }`}
                        onClick={() => handleDisciplineToggle(discipline.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-base truncate ${isSelected ? 'text-primary' : ''
                                }`}>
                                {discipline.name}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>{discipline.topicCount || 0} tópico{discipline.topicCount !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma disciplina encontrada. Crie uma disciplina primeiro.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="border-2 border-primary/20 bg-primary/5 p-0">
                <CardContent className="px-3 py-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Disponibilidade de Tempo</h3>
                      <p className="text-muted-foreground mb-4">Quantas horas semanais você pode estudar?</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Horas por semana</Label>
                          <Badge variant="secondary" className="text-xs">{hoursPerWeek}h</Badge>
                        </div>
                        <Slider
                          value={[hoursPerWeek]}
                          onValueChange={([value]) => setHoursPerWeek(value)}
                          min={1}
                          max={40}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>1h</span>
                          <span>40h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="p-0">
                <CardContent className="px-3 py-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold">Relevância por Disciplina</h3>
                    <p className="text-xs text-muted-foreground">Ajuste rapidamente importância e conhecimento.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedDisciplines.map((discipline) => (
                      <div key={discipline.disciplineId} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium truncate">{discipline.name}</div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <span className="text-xs text-muted-foreground">Déficit:</span>
                                  <Badge variant="outline" className="text-xs">{discipline.importance * (6 - discipline.knowledge)}</Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Pontuação que indica prioridade de estudo baseada na importância × falta de conhecimento</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Importância</span>
                              <Badge variant="secondary" className="text-xs">{discipline.importance}/5</Badge>
                            </div>
                            <Slider
                              value={[discipline.importance]}
                              onValueChange={([value]) => handleDisciplineImportanceChange(discipline.disciplineId, value)}
                              min={1}
                              max={5}
                              step={1}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Conhecimento</span>
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{discipline.knowledge}/5</Badge>
                            </div>
                            <Slider
                              value={[discipline.knowledge]}
                              onValueChange={([value]) => handleDisciplineKnowledgeChange(discipline.disciplineId, value)}
                              min={1}
                              max={5}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 pb-4 border-t bg-background">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={createCycleMutation.isPending}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={createCycleMutation.isPending}
            >
              Cancelar
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || createCycleMutation.isPending || updateCycleMutation.isPending}
              >
                {existingCycle ? (
                  updateCycleMutation.isPending ? 'Salvando...' : 'Salvar Alterações'
                ) : (
                  createCycleMutation.isPending ? 'Criando...' : 'Criar Ciclo'
                )}
                <Plus className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
