import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { timerActions, selectors, studyTimerStore } from '@/store/studyTimerStore';
import { TopicTime } from '@/components/TopicTime';
import { ChevronLeft, BookCopy, Timer, Trash2, Plus, CheckCircle2, Loader, Edit, History, Minus, BarChart3, X, Percent, Circle, Check, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@tanstack/react-store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatTime } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const Route = createFileRoute('/_protected/planos/$studyId/$disciplineId')({
  loader: async ({ params, context }) => {
    const { disciplineId } = params;
    const discipline = await context.trpcClient.getDiscipline.query({ disciplineId });
    return { discipline };
  },
  component: DisciplinePage,
});

interface TopicCardProps {
  topic: {
    id: string;
    name: string;
    disciplineId: string;
    status: string;
    notes: string | null | undefined;
    correct: number;
    wrong: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  };
  performance: number;
  studyId: string;
  onTopicClick: () => void;
  onEditClick: (e: React.MouseEvent) => void;
  onDeleteClick: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

interface SortableTopicCardProps extends TopicCardProps {
  isDraggingGlobal: boolean;
}

function SortableTopicCard({
  topic,
  performance,
  studyId,
  onTopicClick,
  onEditClick,
  onDeleteClick,
  getStatusBadge,
}: SortableTopicCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="group relative border rounded-xl shadow-sm cursor-pointer p-0 hover:border-primary hover:shadow-lg transition-all"
        onClick={onTopicClick}
      >
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <h3 className="font-semibold text-lg">{topic.name}</h3>
                {getStatusBadge(topic.status)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 px-2 py-1 bg-success/10 border border-success/30 rounded-md text-sm font-semibold text-success cursor-pointer hover:bg-success/20 transition-all"
                  title="Questões corretas - Clique para editar"
                  onClick={onEditClick}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {topic.correct}
                </div>
                <div
                  className="flex items-center gap-1 px-2 py-1 bg-destructive/10 border border-destructive/30 rounded-md text-sm font-semibold text-destructive cursor-pointer hover:bg-destructive/20 transition-all"
                  title="Questões erradas - Clique para editar"
                  onClick={onEditClick}
                >
                  <X className="h-4 w-4" />
                  {topic.wrong}
                </div>
              </div>

              <div
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/30 rounded-md text-sm font-semibold text-primary cursor-pointer hover:bg-primary/20 transition-all"
                title="Performance - Clique para editar"
                onClick={onEditClick}
              >
                <Percent className="h-4 w-4" />
                {performance.toFixed(0)}
              </div>
              <TopicTime topicId={topic.id} disciplineId={topic.disciplineId} studyId={studyId} showButton={true} />
              <div className="flex items-center gap-1 ml-auto sm:ml-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEditClick} title="Editar">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDeleteClick} title="Excluir">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DisciplinePage() {
  const { discipline } = Route.useLoaderData();
  const navigate = useNavigate();
  const storeState = useStore(studyTimerStore);
  const queryClient = useQueryClient();
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  const topicsQuery = useQuery({
    ...trpc.getTopicsByDiscipline.queryOptions({ disciplineId: discipline.id }),
  });

  const topics = topicsQuery.data ?? [];

  useEffect(() => {
    setTopicsState(topics.map(topic => ({
      ...topic,
      createdAt: new Date(topic.createdAt),
      updatedAt: new Date(topic.updatedAt),
    })));
  }, [topics]);

  const [newTopicName, setNewTopicName] = useState("");
  const [studyTopic, setStudyTopic] = useState<{
    id: string;
    name: string;
    disciplineId: string;
    status: string;
    notes: string | null | undefined;
    correct: number;
    wrong: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  } | null>(null);
  const [topicsState, setTopicsState] = useState<{
    id: string;
    name: string;
    disciplineId: string;
    status: string;
    notes: string | null | undefined;
    correct: number;
    wrong: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }[]>([]);

  const topicSessionsQuery = useQuery({
    ...trpc.getTimeSessionsByTopic.queryOptions({ topicId: studyTopic?.id ?? '' }),
    enabled: !!studyTopic,
  });

  useEffect(() => {
    const topicIds = topics.map(t => t.id);
    if (topicIds.length > 0) {
      timerActions.loadTotals(topicIds);
    }
  }, [topics.map(t => t.id).join(',')]);


  const totalDisciplineTime = useMemo(() => topics.map(t => t.id).reduce((total, topicId) => total + selectors.getTopicTime(topicId)(storeState), 0), [topics, storeState]);
  const completedTopics = useMemo(() => topics.filter(topic => topic.status === "completed").length, [topics]);
  const disciplineProgress = useMemo(() => topics.length > 0 ? (completedTopics / topics.length) * 100 : 0, [completedTopics, topics.length]);

  const createTopicMutation = useMutation({
    ...trpc.createTopic.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey({ disciplineId: discipline.id }) });
      setNewTopicName("");
    },
  });


  const updateTopicProgressMutation = useMutation({
    ...trpc.updateTopicProgress.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey({ disciplineId: discipline.id }) });
      setStudyTopic(null);
    },
  });

  const reorderTopicsMutation = useMutation({
    ...trpc.reorderTopics.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey({ disciplineId: discipline.id }) });
    },
  });

  const deleteTopicMutation = useMutation({
    ...trpc.deleteTopic.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey({ disciplineId: discipline.id }) });
    },
  });

  const handleCreateTopic = () => {
    if (!newTopicName.trim()) return;
    createTopicMutation.mutate({ disciplineId: discipline.id, name: newTopicName });
  };

  const handleUpdateTopicDetails = () => {
    if (!studyTopic) return;
    updateTopicProgressMutation.mutate({
      topicId: studyTopic.id,
      status: studyTopic.status as "not_started" | "completed",
      correct: studyTopic.correct,
      wrong: studyTopic.wrong,
      notes: studyTopic.notes || undefined
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    // Reset dragging state when drag ends
    setIsDraggingGlobal(false);

    if (active.id !== over?.id) {
      setTopicsState((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        const topicOrders = newItems.map((topic, index) => ({
          topicId: topic.id,
          order: index,
        }));

        reorderTopicsMutation.mutate({ topicOrders });

        return newItems;
      });
    }
  }
  const handleDeleteTopic = (topicId: string) => {
    if (confirm("Tem certeza que deseja excluir este tópico?")) {
      deleteTopicMutation.mutate({ topicId });
    }
  };


  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <Badge variant="outline" className="border-success text-success"><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</Badge>;
    }
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb />

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{discipline.name}</h1>
          <p className="text-muted-foreground mt-2">Acompanhe e gerencie seus tópicos de estudo.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate({ to: `/planos/${discipline.studyId}` })} className="flex items-center gap-2 text-primary bg-primary/10 border-1 border-primary/40 hover:bg-primary/20 hover:border-primary/50">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="flex flex-row items-center p-4 lg:p-6">
          <div className="mr-3 lg:mr-6">
            <BookCopy className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-bold">{topics.length}</div>
            <p className="text-sm text-muted-foreground">Tópicos</p>
          </div>
        </Card>

        <Card className="flex flex-row items-center p-4 lg:p-6">
          <div className="mr-3 lg:mr-6">
            <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-bold">{Math.round(disciplineProgress)}%</div>
            <p className="text-sm text-muted-foreground">Progresso</p>
          </div>
        </Card>

        <Card className="flex flex-row items-center p-4 lg:p-6">
          <div className="mr-3 lg:mr-6">
            <Timer className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-bold">{formatTime(totalDisciplineTime)}</div>
            <p className="text-sm text-muted-foreground">Tempo de Estudo</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Lista de Tópicos</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Input placeholder="Adicionar novo tópico... (ex: PDF 1 Radegondes)" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTopic() }} className="flex-1" />
            <Button onClick={handleCreateTopic} disabled={createTopicMutation.isPending || topicsQuery.isLoading} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {topicsQuery.isLoading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Loader className="mx-auto h-6 w-6 animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Carregando tópicos...</p>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={() => setIsDraggingGlobal(true)}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setIsDraggingGlobal(false)}
              >
                <SortableContext items={topicsState.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {topicsState.map(topic => {
                    const performance = topic.correct + topic.wrong > 0 ? (topic.correct / (topic.correct + topic.wrong)) * 100 : 0;
                    return (
                      <SortableTopicCard
                        key={topic.id}
                        topic={topic}
                        performance={performance}
                        studyId={discipline.studyId!}
                        isDraggingGlobal={isDraggingGlobal}
                        onTopicClick={() => setStudyTopic(topic)}
                        onEditClick={(e) => { e.stopPropagation(); setStudyTopic(topic); }}
                        onDeleteClick={() => handleDeleteTopic(topic.id)}
                        getStatusBadge={getStatusBadge}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}
            {!topicsQuery.isLoading && topicsState.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum tópico adicionado ainda.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!studyTopic} onOpenChange={() => setStudyTopic(null)}>
        <DialogContent className="max-w-3xl w-[95%] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{studyTopic?.name}</DialogTitle>
            <DialogDescription>
              Gerencie questões, status e anotações de estudo
            </DialogDescription>
          </DialogHeader>

          {studyTopic && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Questões Corretas</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStudyTopic(t => t ? { ...t, correct: Math.max(0, t.correct - 1) } : null)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={studyTopic.correct}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setStudyTopic(t => t ? { ...t, correct: Math.max(0, value) } : null);
                      }}
                      className="text-center py-2 bg-success/10 text-success border-success/30 focus:border-success/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStudyTopic(t => t ? { ...t, correct: t.correct + 1 } : null)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Questões Erradas</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStudyTopic(t => t ? { ...t, wrong: Math.max(0, t.wrong - 1) } : null)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={studyTopic.wrong}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setStudyTopic(t => t ? { ...t, wrong: Math.max(0, value) } : null);
                      }}
                      className="text-center py-2 bg-destructive/10 text-destructive border-destructive/30 focus:border-destructive/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStudyTopic(t => t ? { ...t, wrong: t.wrong + 1 } : null)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Performance</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg text-center">
                  <span className="text-xl font-bold text-primary">
                    {studyTopic.correct + studyTopic.wrong > 0
                      ? Math.round((studyTopic.correct / (studyTopic.correct + studyTopic.wrong)) * 100)
                      : 0}%
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {studyTopic.correct + studyTopic.wrong} questões respondidas
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setStudyTopic(t => t ? {
                      ...t,
                      status: t.status === 'completed' ? 'not_started' : 'completed'
                    } : null)
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    studyTopic.status === 'completed'
                      ? 'bg-success/10 text-success hover:bg-success/20 border border-success/30'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-muted'
                  }`}
                >
                  {studyTopic.status === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">
                    {studyTopic.status === 'completed' ? 'Concluído' : 'Marcar como concluído'}
                  </span>
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium">Anotações e Materiais</Label>
                <Textarea
                  placeholder="Adicione suas anotações, links de materiais, vídeos, etc."
                  value={studyTopic.notes ?? ''}
                  onChange={(e) => setStudyTopic(t => t ? { ...t, notes: e.target.value } : null)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Histórico de Sessões</Label>
                {topicSessionsQuery.isLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                  </div>
                ) : topicSessionsQuery.data && topicSessionsQuery.data.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto mt-2">
                    {topicSessionsQuery.data.map(session => (
                      <div key={session.id} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                        <span className="text-sm">{new Date(session.startTime).toLocaleString('pt-BR')}</span>
                        <span className="text-sm font-mono font-bold">{formatTime(session.duration)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 mt-2">
                    <History className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma sessão registrada</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStudyTopic(null)}>Cancelar</Button>
            <Button onClick={handleUpdateTopicDetails} disabled={updateTopicProgressMutation.isPending}>
              {updateTopicProgressMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}