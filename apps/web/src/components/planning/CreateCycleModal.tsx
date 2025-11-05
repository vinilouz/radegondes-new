import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion } from '@/components/ui/accordion';
import { Target, Clock, Calendar, ChevronRight, ChevronLeft, Plus, BookOpen, CheckCircle2, Circle, ArrowRight, Loader2 } from 'lucide-react';
import { formatTime } from '@/lib/utils';

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

const STUDY_DAYS = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30min' },
  { value: 45, label: '45min' },
  { value: 60, label: '1h' },
  { value: 75, label: '1h15min' },
  { value: 90, label: '1h30min' },
  { value: 105, label: '1h45min' },
  { value: 120, label: '2h' },
  { value: 135, label: '2h15min' },
  { value: 150, label: '2h30min' },
  { value: 165, label: '2h45min' },
  { value: 180, label: '3h' },
];

interface TopicSelection {
  topicId: string;
  name: string;
  disciplineName: string;
  totalStudyTime: number;
  sessionCount: number;
  selected: boolean;
  importance: number;
  knowledge: number;
}

export function CreateCycleModal({ isOpen, onClose, onSuccess, existingCycle }: CreateCycleModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [cycleName, setCycleName] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<TopicSelection[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [studyDays, setStudyDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [minSessionDuration, setMinSessionDuration] = useState(30);
  const [maxSessionDuration, setMaxSessionDuration] = useState(90);

  const topicsQuery = useQuery({
    ...trpc.getTopicsWithUsage.queryOptions(),
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
    setSelectedTopics([]);
    setHoursPerWeek(10);
    setStudyDays([1, 2, 3, 4, 5]);
    setMinSessionDuration(30);
    setMaxSessionDuration(90);
  };

  useEffect(() => {
    if (existingCycle && cycleDetailsQuery.data) {
      setCycleName(existingCycle.name);
      setHoursPerWeek(existingCycle.hoursPerWeek);
      setStudyDays(existingCycle.studyDays.split(',').map(Number).filter(n => !isNaN(n)));
      setMinSessionDuration(existingCycle.minSessionDuration || 30);
      setMaxSessionDuration(existingCycle.maxSessionDuration || 90);

      const cycleTopics = cycleDetailsQuery.data.topics || [];
      setSelectedTopics(cycleTopics.map(ct => ({
        topicId: ct.topicId,
        name: ct.topicName || '',
        disciplineName: ct.disciplineName || '',
        totalStudyTime: 0,
        sessionCount: 0,
        selected: true,
        importance: ct.importance,
        knowledge: ct.knowledge,
      })));
    }
  }, [existingCycle, cycleDetailsQuery.data]);

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => {
      const topic = topicsQuery.data?.find(t => t.id === topicId);
      if (!topic) return prev;

      if (prev.find(t => t.topicId === topicId)) {
        return prev.filter(t => t.topicId !== topicId);
      } else {
        return [...prev, {
          topicId: topic.id,
          name: topic.name,
          disciplineName: topic.disciplineName,
          totalStudyTime: topic.totalStudyTime,
          sessionCount: topic.sessionCount,
          selected: true,
          importance: 3,
          knowledge: 3,
        }];
      }
    });
  };

  const handleTopicImportanceChange = (topicId: string, value: number) => {
    setSelectedTopics(prev => prev.map(t =>
      t.topicId === topicId ? { ...t, importance: value } : t
    ));
  };

  const handleTopicKnowledgeChange = (topicId: string, value: number) => {
    setSelectedTopics(prev => prev.map(t =>
      t.topicId === topicId ? { ...t, knowledge: value } : t
    ));
  };

  const handleSubmit = () => {
    if (selectedTopics.length === 0) return;

    const payload = {
      name: cycleName || `Ciclo ${new Date().toLocaleDateString('pt-BR')}`,
      topics: selectedTopics.map(t => ({
        topicId: t.topicId,
        importance: t.importance,
        knowledge: t.knowledge,
      })),
      hoursPerWeek,
      studyDays,
      minSessionDuration,
      maxSessionDuration,
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
        return selectedTopics.length > 0;
      case 2:
        return selectedTopics.every(t => t.importance >= 1 && t.importance <= 5 && t.knowledge >= 1 && t.knowledge <= 5);
      case 3:
        return hoursPerWeek > 0 && studyDays.length > 0 && minSessionDuration < maxSessionDuration;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl">{existingCycle ? 'Editar Ciclo de Estudo' : 'Criar Ciclo de Estudo'}</DialogTitle>
        </DialogHeader>

        {/* Progress Section - Fixed in header */}
        <div className="space-y-3 py-4 border-b">
          {/* Progress Bar */}
          <Progress value={(currentStep / 3) * 100} className="h-2" />

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {[
              { id: 1, title: "Tópicos", description: "Selecione os tópicos de estudo", icon: BookOpen },
              { id: 2, title: "Relevância", description: "Defina importância e conhecimento", icon: Target },
              { id: 3, title: "Horários", description: "Configure disponibilidade", icon: Clock }
            ].map((step, index) => (
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
                {index < 2 && (
                  <ArrowRight className={`h-4 w-4 flex-shrink-0 mx-2 ${currentStep > step.id ? 'text-primary' : 'text-muted-foreground/30'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Content - Scrollable area */}
        <div className='flex-1 overflow-y-auto py-4'>

          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Step Header */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Selecione os Tópicos de Estudo</h3>
                      <p className="text-muted-foreground">
                        Escolha os tópicos que farão parte do seu ciclo de estudos.
                        Eles estão organizados por disciplina e ordenados pelo tempo de estudo.
                      </p>
                      {selectedTopics.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            {selectedTopics.length} tópico{selectedTopics.length > 1 ? 's' : ''} selecionado{selectedTopics.length > 1 ? 's' : ''}
                          </Badge>
                            {/*
                            <span className="text-sm text-muted-foreground">
                              • {formatTime(selectedTopics.reduce((sum, t) => sum + Number(t.totalStudyTime || 0), 0))} total
                            </span> 
                            */}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {topicsQuery.data && topicsQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {/* Agrupar tópicos por disciplina */}
                  {(() => {
                    const groupedByDiscipline = topicsQuery.data.reduce((acc, topic) => {
                      const discipline = topic.disciplineName;
                      if (!acc[discipline]) {
                        acc[discipline] = [];
                      }
                      acc[discipline].push(topic);
                      return acc;
                    }, {} as Record<string, typeof topicsQuery.data>);

                    // Ordenar disciplinas por tempo total de estudo
                    const sortedDisciplines = Object.entries(groupedByDiscipline)
                      .sort(([, a], [, b]) => {
                        const timeA = a.reduce((sum, t) => sum + Number(t.totalStudyTime || 0), 0);
                        const timeB = b.reduce((sum, t) => sum + Number(t.totalStudyTime || 0), 0);
                        return timeB - timeA;
                      });

                    return (
                      <Accordion
                        items={sortedDisciplines.map(([disciplineName, topics]) => ({
                          id: disciplineName,
                          title: (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{disciplineName}</span>
                              <Badge variant="outline" className="text-xs">
                                {topics.length} tópico{topics.length > 1 ? 's' : ''}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {formatTime(topics.reduce((sum, t) => sum + Number(t.totalStudyTime || 0), 0))}
                              </Badge>
                            </div>
                          ),
                          children: (
                            <div className="space-y-2 py-3">
                              {topics
                                .sort((a, b) => Number(b.totalStudyTime || 0) - Number(a.totalStudyTime || 0)) // Ordenar por tempo de estudo
                                .map((topic) => {
                                  const isSelected = selectedTopics.find(t => t.topicId === topic.id);
                                  return (
                                    <Card
                                      key={topic.id}
                                      className={`py-0 cursor-pointer transition-all hover:shadow-sm ${isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'hover:border-primary/50'
                                        }`}
                                      onClick={() => handleTopicToggle(topic.id)}
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1 min-w-0">
                                            <h4 className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : ''
                                              }`}>
                                              {topic.name}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                              <span>{formatTime(Number(topic.totalStudyTime || 0))}</span>
                                              <span>{topic.sessionCount || 0} sessões</span>
                                            </div>
                                          </div>
                                          <Checkbox
                                            checked={!!isSelected}
                                            className="shrink-0 ml-2"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                            </div>
                          )
                        }))}
                        defaultValue={sortedDisciplines.length > 0 ? [sortedDisciplines[0][0]] : []}
                      />
                    );
                  })()}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum tópico encontrado. Comece estudando para criar ciclos personalizados.
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedTopics.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedTopics.length} tópico{selectedTopics.length > 1 ? 's' : ''} selecionado{selectedTopics.length > 1 ? 's' : ''}
                    </span>
                    <Badge variant="secondary">
                      {selectedTopics.map(t => t.disciplineName).filter((v, i, a) => a.indexOf(v) === i).length} disciplinas
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Step Header */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Defina a Relevância dos Tópicos</h3>
                      <p className="text-muted-foreground mb-3">
                        Configure a importância e seu nível de conhecimento atual para cada tópico.
                        Isso ajudará o algoritmo a priorizar os estudos de forma inteligente.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span><strong>Importância:</strong> Quão crucial é este tópico para seus objetivos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span><strong>Conhecimento:</strong> Seu nível atual de domínio</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {selectedTopics.map((topic) => (
                <Card key={topic.topicId} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{topic.name}</CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <BookOpen className="h-3 w-3" />
                            {topic.disciplineName}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Importância */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <Target className="h-3 w-3 text-green-600" />
                            </div>
                            <Label className="text-sm font-medium">Importância</Label>
                            <div className="ml-auto">
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-0">
                                {topic.importance}/5
                              </Badge>
                            </div>
                          </div>
                          <Slider
                            value={[topic.importance]}
                            onValueChange={([value]) => handleTopicImportanceChange(topic.topicId, value)}
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>Baixa</span>
                            <span>Alta</span>
                          </div>
                        </div>

                        {/* Conhecimento */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <Circle className="h-3 w-3 text-blue-600" />
                            </div>
                            <Label className="text-sm font-medium">Conhecimento</Label>
                            <div className="ml-auto">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0">
                                {topic.knowledge}/5
                              </Badge>
                            </div>
                          </div>
                          <Slider
                            value={[topic.knowledge]}
                            onValueChange={([value]) => handleTopicKnowledgeChange(topic.topicId, value)}
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>Iniciante</span>
                            <span>Avançado</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <Label className="text-lg font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Configure os Horários
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Defina sua disponibilidade e preferências de estudo
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Horas por semana */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Horas por semana</Label>
                    <div className="text-2xl font-bold text-primary">{hoursPerWeek}h</div>
                    <Slider
                      value={[hoursPerWeek]}
                      onValueChange={([value]) => setHoursPerWeek(value)}
                      min={1}
                      max={40}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1h</span>
                      <span>40h</span>
                    </div>
                  </div>
                </Card>

                {/* Dias de estudo */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Dias de estudo</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {STUDY_DAYS.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.id}`}
                            checked={studyDays.includes(day.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setStudyDays([...studyDays, day.id]);
                              } else {
                                setStudyDays(studyDays.filter(d => d !== day.id));
                              }
                            }}
                          />
                          <Label htmlFor={`day-${day.id}`} className="text-sm font-medium">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Duração das sessões */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <Label className="text-base font-medium">Duração das sessões</Label>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Qual duração <strong>mínima</strong> e <strong>máxima</strong> você deseja para uma sessão de estudos?
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <Select value={minSessionDuration.toString()} onValueChange={(value) => setMinSessionDuration(Number(value))}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground font-medium">a</span>
                        <Select value={maxSessionDuration.toString()} onValueChange={(value) => setMaxSessionDuration(Number(value))}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION_OPTIONS.filter(option => option.value > minSessionDuration).map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Resumo */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Resumo do Ciclo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedTopics.length}</div>
                      <div className="text-sm text-muted-foreground">Tópicos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{studyDays.length}</div>
                      <div className="text-sm text-muted-foreground">Dias/Semana</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{hoursPerWeek}h</div>
                      <div className="text-sm text-muted-foreground">Horas/Semana</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Modal Footer - Fixed */}
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