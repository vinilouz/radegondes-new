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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
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
  const [editingTopic, setEditingTopic] = useState<{id: string, name: string} | null>(null);
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

  const handleUpdateTopicName = () => {
    if (!editingTopic || !editingTopic.name.trim()) return;
    updateTopicMutation.mutate({ topicId: editingTopic.id, name: editingTopic.name });
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
      
      <div className="flex justify-between items-start">
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
      
      <Dialog>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Lista de Tópicos</CardTitle>
            <div className="flex space-x-2 pt-4">
              <Input placeholder="Adicionar novo tópico..." value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') handleCreateTopic() }} className="flex-1" />
              <Button onClick={handleCreateTopic} disabled={createTopicMutation.isPending}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topics.map(topic => {
                const performance = topic.correct + topic.wrong > 0 ? (topic.correct / (topic.correct + topic.wrong)) * 100 : 0;
                return (
                  <div key={topic.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-3 rounded-lg hover:bg-muted">
                    <div className="flex-1 mb-2 md:mb-0">
                      <h3 className="font-semibold text-md">{topic.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        {getStatusBadge(topic.status)}
                        <span className="text-xs text-muted-foreground">{formatTime(selectors.getTopicTime(topic.id)(storeState))}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="flex-1 flex items-center justify-center text-xs text-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-success">{topic.correct} C</span>
                          <span>/</span>
                          <span className="font-bold text-destructive">{topic.wrong} E</span>
                        </div>
                        <div className="w-px h-5 bg-border mx-3"></div>
                        <div>{performance.toFixed(0)}%</div>
                      </div>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setStudyTopic(topic)}>Detalhes</Button>
                      </DialogTrigger>
                      <TopicTime topicId={topic.id} disciplineId={discipline.id} studyId={discipline.studyId!} showButton={true} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTopic(topic.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                )
              })}
              {topics.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground mb-4">Nenhum tópico adicionado ainda.</p></div>}
            </div>
          </CardContent>
        </Card>

        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{studyTopic?.name}</DialogTitle>
            <DialogDescription>Gerencie sua sessão de estudo para este tópico.</DialogDescription>
          </DialogHeader>
          {studyTopic && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Questões</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 border rounded-lg flex items-center justify-between">
                        <span className="text-sm text-success">Corretas</span>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setStudyTopic(t => t ? {...t, correct: t.correct - 1} : null)}><Minus className="h-3 w-3" /></Button>
                          <span className="font-bold text-lg w-8 text-center">{studyTopic.correct}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setStudyTopic(t => t ? {...t, correct: t.correct + 1} : null)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <div className="flex-1 p-2 border rounded-lg flex items-center justify-between">
                        <span className="text-sm text-destructive">Erradas</span>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setStudyTopic(t => t ? {...t, wrong: t.wrong - 1} : null)}><Minus className="h-3 w-3" /></Button>
                          <span className="font-bold text-lg w-8 text-center">{studyTopic.wrong}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setStudyTopic(t => t ? {...t, wrong: t.wrong + 1} : null)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Status</h4>
                     <select value={studyTopic.status} onChange={(e) => setStudyTopic(t => t ? {...t, status: e.target.value} : null)} className="w-full p-2 border rounded-lg bg-background">
                        <option value="not_started">Não iniciado</option>
                        <option value="in_progress">Em progresso</option>
                        <option value="completed">Concluído</option>
                     </select>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Anotações, Materiais e Links</h4>
                  <Textarea 
                    placeholder="Use este espaço para suas anotações, links de materiais, vídeos, etc."
                    value={studyTopic.notes ?? ''} 
                    onChange={(e) => setStudyTopic(t => t ? {...t, notes: e.target.value} : null)}
                    rows={8}
                  />
                </div>
              </TabsContent>
              <TabsContent value="history">
                {topicSessionsQuery.isLoading && <p>Carregando histórico...</p>}
                {topicSessionsQuery.data && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {topicSessionsQuery.data.map(session => (
                      <div key={session.id} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                        <span className="text-sm">{new Date(session.startTime).toLocaleString('pt-BR')}</span>
                        <span className="text-sm font-bold">{formatTime(session.duration)}</span>
                      </div>
                    ))}
                    {topicSessionsQuery.data.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão de estudo registrada para este tópico.</p>}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudyTopic(null)}>Cancelar</Button>
            <Button onClick={handleUpdateTopicDetails} disabled={updateTopicMutation.isPending}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}