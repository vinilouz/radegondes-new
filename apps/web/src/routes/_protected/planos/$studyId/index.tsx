import { authClient } from "@/lib/auth-client";
import { trpc, trpcClient } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { timerActions, selectors, studyTimerStore } from '@/store/studyTimerStore';
import { formatTime } from '@/lib/utils';
import { useStore } from '@tanstack/react-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Clock, BookOpen, MoreHorizontal, ChevronLeft } from "lucide-react";
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_protected/planos/$studyId/")({
  component: StudyDetailsPage,
});

function StudyDetailsPage() {
  const { studyId } = useParams({ from: "/_protected/planos/$studyId/" });
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const [isCreateDisciplineDialogOpen, setIsCreateDisciplineDialogOpen] = useState(false);
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [editingDiscipline, setEditingDiscipline] = useState<string | null>(null);
  const [editDisciplineName, setEditDisciplineName] = useState("");
  const [newTopicNames, setNewTopicNames] = useState<Record<string, string>>({});
  const [editingTopics, setEditingTopics] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const studyQuery = useQuery(trpc.getStudy.queryOptions({ id: studyId }));
  const disciplinesQuery = useQuery(trpc.getDisciplines.queryOptions({ studyId }));
  const topicsQuery = useQuery(trpc.getTopics.queryOptions({ studyId }));

  const allTopicIds = topicsQuery.data?.map(topic => topic.id) || [];
  const storeState = useStore(studyTimerStore);

  // Load study totals - otimizado para evitar loops
  useEffect(() => {
    if (allTopicIds.length > 0) {
      timerActions.loadTotals(studyId, undefined, allTopicIds, trpcClient);
    }
  }, [studyId, allTopicIds.join(',')]); // Usa join como dependência para evitar mudanças de referência

  const createDisciplineMutation = useMutation({
    ...trpc.createDiscipline.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getDisciplines.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.getStudy.queryKey() });
      setIsCreateDisciplineDialogOpen(false);
      setNewDisciplineName("");
    },
  });

  const updateDisciplineMutation = useMutation({
    ...trpc.updateDiscipline.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getDisciplines.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.getTopics.queryKey() });
      setEditingDiscipline(null);
      setEditDisciplineName("");
    },
  });

  const deleteDisciplineMutation = useMutation({
    ...trpc.deleteDiscipline.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getDisciplines.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.getStudy.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.getTopics.queryKey() });
    },
  });

  const createTopicMutation = useMutation({
    ...trpc.createTopic.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: trpc.getTopics.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.getDisciplines.queryKey() });
      setNewTopicNames(prev => ({ ...prev, [variables.disciplineId]: "" }));
    },
  });

  const updateTopicMutation = useMutation({
    ...trpc.updateTopic.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getTopics.queryKey() });
      setEditingTopics({});
    },
  });

  const deleteTopicMutation = useMutation({
    ...trpc.deleteTopic.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getTopics.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.getDisciplines.queryKey() });
    },
  });

  const handleCreateDiscipline = () => {
    if (!newDisciplineName.trim()) return;

    createDisciplineMutation.mutate({
      studyId,
      name: newDisciplineName,
    });
  };

  const handleEditDiscipline = (discipline: { id: string; name: string }) => {
    setEditingDiscipline(discipline.id);
    setEditDisciplineName(discipline.name);
  };

  const handleUpdateDiscipline = () => {
    if (!editingDiscipline || !editDisciplineName.trim()) return;

    updateDisciplineMutation.mutate({
      disciplineId: editingDiscipline,
      name: editDisciplineName,
    });
  };

  const handleDeleteDiscipline = (disciplineId: string) => {
    if (confirm("Tem certeza que deseja excluir esta disciplina? Esta ação não pode ser desfeita.")) {
      deleteDisciplineMutation.mutate({ disciplineId });
    }
  };

  const handleCreateTopic = (disciplineId: string) => {
    const topicName = newTopicNames[disciplineId] || "";
    if (!topicName.trim()) return;

    createTopicMutation.mutate({
      disciplineId,
      name: topicName,
    });
  };

  const handleUpdateTopic = (topicId: string, newName: string) => {
    if (!newName.trim()) return;

    updateTopicMutation.mutate({
      topicId,
      name: newName,
    });
  };

  const handleDeleteTopic = (topicId: string) => {
    if (confirm("Tem certeza que deseja excluir este tópico?")) {
      deleteTopicMutation.mutate({ topicId });
    }
  };

  const startEditingTopic = (topicId: string, currentName: string) => {
    setEditingTopics(prev => ({ ...prev, [topicId]: currentName }));
  };

  const formatCreatedAt = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authPending || studyQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!studyQuery.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Estudo não encontrado</h1>
          <Button onClick={() => navigate({ to: "/planos" })}>
            Voltar para Estudos
          </Button>
        </div>
      </div>
    );
  }

  const study = studyQuery.data;
  const disciplines = disciplinesQuery.data || [];
  const topics = topicsQuery.data || [];

  const totalStudyTime = selectors.getStudyTime(studyId, allTopicIds)(storeState);
  const completedTopics = topics.filter(topic => topic.status === "completed").length;

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb />

      {/* Row 2: Title & description | back btn */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{study.name}</h1>
          {study.description && (
            <p className="text-muted-foreground mt-2">{study.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2 italic">
            Criado em {formatCreatedAt(study.createdAt)}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate({ to: "/planos" })}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disciplines.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tópicos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTopics} concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Estudo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(totalStudyTime)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Disciplinas</h2>

        <Dialog open={isCreateDisciplineDialogOpen} onOpenChange={setIsCreateDisciplineDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Disciplina</DialogTitle>
              <DialogDescription>
                Adicione uma nova disciplina ao seu plano de estudos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="discipline-name">Nome da Disciplina</Label>
                <Input
                  id="discipline-name"
                  value={newDisciplineName}
                  onChange={(e) => setNewDisciplineName(e.target.value)}
                  placeholder="Digite o nome da disciplina"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDisciplineDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateDiscipline}
                disabled={!newDisciplineName.trim() || createDisciplineMutation.isPending}
              >
                {createDisciplineMutation.isPending ? "Criando..." : "Criar Disciplina"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {disciplinesQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : disciplines.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Nenhuma disciplina criada</h3>
              <p className="text-muted-foreground">
                Comece criando sua primeira disciplina para organizar seus tópicos de estudo.
              </p>
              <Button onClick={() => setIsCreateDisciplineDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Disciplina
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disciplines.map((discipline) => {
            const disciplineTopics = topics.filter(topic => topic.disciplineId === discipline.id);
            const disciplineTopicIds = disciplineTopics.map(topic => topic.id);
            const disciplineTime = selectors.getDisciplineTime(discipline.id, disciplineTopicIds)(storeState);
            const completedDisciplineTopics = disciplineTopics.filter(topic => topic.status === "completed").length;
            const disciplineProgress = disciplineTopics.length > 0 ? (completedDisciplineTopics / disciplineTopics.length) * 100 : 0;

            return (
              <Card key={discipline.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{discipline.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditDiscipline(discipline)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteDiscipline(discipline.id)}
                          className="text-destructive"
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {disciplineTopics.length} tópicos
                      </span>
                      <div className="text-right">
                        <Badge variant={disciplineProgress === 100 ? "default" : "secondary"}>
                          {Math.round(disciplineProgress)}% concluído
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTime(disciplineTime)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Tópicos:</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate({ to: `/planos/${studyId}/${discipline.id}` })}
                          className="h-6 text-xs"
                        >
                          Ver todos →
                        </Button>
                      </div>
                      {disciplineTopics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum tópico adicionado</p>
                      ) : (
                        <div className="space-y-1">
                          {disciplineTopics.slice(0, 3).map((topic) => (
                            <div key={topic.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  topic.status === "completed" ? "bg-green-500" :
                                  topic.status === "in_progress" ? "bg-yellow-500" : "bg-gray-300"
                                }`} />
                                {editingTopics[topic.id] !== undefined ? (
                                  <Input
                                    value={editingTopics[topic.id]}
                                    onChange={(e) => setEditingTopics(prev => ({
                                      ...prev,
                                      [topic.id]: e.target.value
                                    }))}
                                    onBlur={() => {
                                      if (editingTopics[topic.id] !== topic.name) {
                                        handleUpdateTopic(topic.id, editingTopics[topic.id]);
                                      } else {
                                        setEditingTopics(prev => {
                                          const newTopics = { ...prev };
                                          delete newTopics[topic.id];
                                          return newTopics;
                                        });
                                      }
                                    }}
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        if (editingTopics[topic.id] !== topic.name) {
                                          handleUpdateTopic(topic.id, editingTopics[topic.id]);
                                        } else {
                                          setEditingTopics(prev => {
                                            const newTopics = { ...prev };
                                            delete newTopics[topic.id];
                                            return newTopics;
                                          });
                                        }
                                      }
                                    }}
                                    className="h-6 text-xs"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    className="text-sm cursor-pointer hover:text-primary"
                                    onClick={() => startEditingTopic(topic.id, topic.name)}
                                  >
                                    {topic.name}
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTopic(topic.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {disciplineTopics.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center pt-1">
                              +{disciplineTopics.length - 3} mais tópicos
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Input
                        placeholder="PDF 1..."
                        value={newTopicNames[discipline.id] || ""}
                        onChange={(e) => setNewTopicNames(prev => ({ ...prev, [discipline.id]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleCreateTopic(discipline.id);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleCreateTopic(discipline.id)}
                        disabled={!(newTopicNames[discipline.id] || "").trim() || createTopicMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingDiscipline} onOpenChange={() => setEditingDiscipline(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Disciplina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-discipline-name">Nome da Disciplina</Label>
              <Input
                id="edit-discipline-name"
                value={editDisciplineName}
                onChange={(e) => setEditDisciplineName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDiscipline(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateDiscipline}
              disabled={!editDisciplineName.trim() || updateDisciplineMutation.isPending}
            >
              {updateDisciplineMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}