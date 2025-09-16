import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { timerActions, selectors, studyTimerStore } from '@/store/studyTimerStore';
import { TopicTime } from '@/components/TopicTime';
import { ChevronLeft, BookCopy, Timer, MoreHorizontal, Trash2, Plus, CheckCircle2, Loader, Circle, Edit, History, Link as LinkIcon, Minus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@tanstack/react-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTime } from '@/lib/utils';

export const Route = createFileRoute('/_protected/planos/$studyId/$disciplineId')({
  loader: async ({ params, context }) => {
    const { disciplineId } = params;
    const discipline = await context.trpcClient.getDiscipline.query({ disciplineId });
    const topics = await context.trpcClient.getTopicsByDiscipline.query({ disciplineId });
    return { discipline, topics };
  },
  component: DisciplinePage,
});

function DisciplinePage() {
  const { discipline, topics } = Route.useLoaderData();
  const navigate = useNavigate();
  const storeState = useStore(studyTimerStore);
  const queryClient = useQueryClient();

  const [newTopicName, setNewTopicName] = useState("");
  const [setEditingTopic] = useState<{id: string, name: string} | null>(null);
  const [studyTopic, setStudyTopic] = useState<typeof topics[0] | null>(null);

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

  const updateTopicMutation = useMutation({
    ...trpc.updateTopic.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey({ disciplineId: discipline.id }) });
      if (studyTopic && data && studyTopic.id === data.id) {
        setStudyTopic(data);
      }
      setEditingTopic(null);
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
    updateTopicMutation.mutate({ topicId: studyTopic.id, name: studyTopic.name });
  }

  const handleDeleteTopic = (topicId: string) => {
    if (confirm("Tem certeza que deseja excluir este tópico?")) {
      deleteTopicMutation.mutate({ topicId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="border-success text-success"><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="border-warning text-warning"><Loader className="h-3 w-3 mr-1 animate-spin" />Em progresso</Badge>;
      default:
        return <Badge variant="outline"><Circle className="h-3 w-3 mr-1" />Não iniciado</Badge>;
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb />
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{discipline.name}</h1>
          <p className="text-muted-foreground mt-2">Acompanhe e gerencie seus tópicos de estudo.</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: `/planos/${discipline.studyId}` })} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="flex flex-row items-center p-4 lg:p-6">
          <div className="mr-4 lg:mr-6">
            <BookCopy className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="text-3xl font-bold">{topics.length}</div>
            <p className="text-sm text-muted-foreground">Tópicos</p>
          </div>
        </Card>

        <Card className="flex flex-row items-center p-4 lg:p-6">
          <div className="mr-4 lg:mr-6">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="text-3xl font-bold">{Math.round(disciplineProgress)}%</div>
            <p className="text-sm text-muted-foreground">Progresso</p>
          </div>
        </Card>

        <Card className="flex flex-row items-center p-4 lg:p-6">
          <div className="mr-4 lg:mr-6">
            <Timer className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="text-3xl font-bold">{formatTime(totalDisciplineTime)}</div>
            <p className="text-sm text-muted-foreground">Tempo de Estudo</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Lista de Tópicos</CardTitle>
          <div className="flex space-x-2 pt-4">
            <Input placeholder="Adicionar novo tópico..." value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') handleCreateTopic() }} className="flex-1" />
            <Button onClick={handleCreateTopic} disabled={createTopicMutation.isPending}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
              {topics.map(topic => {
                const performance = topic.correct + topic.wrong > 0 ? (topic.correct / (topic.correct + topic.wrong)) * 100 : 0;
                return (
                  <Card key={topic.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => setStudyTopic(topic)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{topic.name}</h3>
                            {getStatusBadge(topic.status)}
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Questões:</span>
                              <span className="font-semibold text-success">{topic.correct} C</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="font-semibold text-destructive">{topic.wrong} E</span>
                              <span className="text-muted-foreground">({performance.toFixed(0)}%)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={() => setStudyTopic(topic)} className="gap-2">
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                          <TopicTime topicId={topic.id} disciplineId={discipline.id} studyId={discipline.studyId!} showButton={true} />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTopic(topic.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {topics.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <ListTodo className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Nenhum tópico adicionado ainda.</p>
                  </CardContent>
                </Card>
              )}
            </div>
        </CardContent>
      </Card>

      <Dialog open={!!studyTopic} onOpenChange={() => setStudyTopic(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{studyTopic?.name}</DialogTitle>
            <DialogDescription>
              Gerencie questões, status e anotações de estudo
            </DialogDescription>
          </DialogHeader>

          {studyTopic && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Questões Corretas</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStudyTopic(t => t ? {...t, correct: Math.max(0, t.correct - 1)} : null)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center py-2 bg-success/10 text-success rounded border">
                      <span className="text-xl font-bold">{studyTopic.correct}</span>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStudyTopic(t => t ? {...t, correct: t.correct + 1} : null)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Questões Erradas</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStudyTopic(t => t ? {...t, wrong: Math.max(0, t.wrong - 1)} : null)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center py-2 bg-destructive/10 text-destructive rounded border">
                      <span className="text-xl font-bold">{studyTopic.wrong}</span>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStudyTopic(t => t ? {...t, wrong: t.wrong + 1} : null)}>
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

              <div>
                <Label className="text-sm font-medium">Anotações e Materiais</Label>
                <Textarea
                  placeholder="Adicione suas anotações, links de materiais, vídeos, etc."
                  value={studyTopic.notes ?? ''}
                  onChange={(e) => setStudyTopic(t => t ? {...t, notes: e.target.value} : null)}
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
            <Button onClick={handleUpdateTopicDetails} disabled={updateTopicMutation.isPending}>
              {updateTopicMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}