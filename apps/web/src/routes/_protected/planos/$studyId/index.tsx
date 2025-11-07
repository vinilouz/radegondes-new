import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { timerActions, selectors, studyTimerStore } from '@/store/studyTimerStore';
import { formatTime, formatRemainingDays, calculateStudyProgress } from '@/lib/utils';
import { useStore } from '@tanstack/react-store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen, MoreHorizontal, ChevronLeft, BookCopy, Timer, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const Route = createFileRoute("/_protected/planos/$studyId/")({
  component: StudyDetailsPage,
});

interface SortableDisciplineCardProps {
  discipline: {
    id: string;
    name: string;
    studyId: string;
  };
  disciplineTopics: any[];
  disciplineTime: number;
  disciplineProgress: number;
  studyId: string;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableDisciplineCard({
  discipline,
  disciplineTopics,
  disciplineTime,
  disciplineProgress,
  studyId,
  onNavigate,
  onEdit,
  onDelete,
}: SortableDisciplineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: discipline.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="group relative border hover:border-primary rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col no-underline"
        onClick={onNavigate}
      >
        <div className="absolute top-1 left-1 z-10">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 flex flex-col bg-background/80 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronUp className="h-3 w-3" />
            <ChevronDown className="h-3 w-3" />
          </div>
        </div>
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => { e.stopPropagation(); }}>
              <DropdownMenuItem onClick={onEdit}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-3 pl-7">
          <CardTitle className="text-lg md:text-xl line-clamp-2">{discipline.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 flex-1 flex flex-col justify-end">
          <div className="flex items-center gap-2 text-sm">
            <BookCopy className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{disciplineTopics.length}</span>
            <span className="text-muted-foreground">tópicos</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{formatTime(disciplineTime)}</span>
            <span className="text-muted-foreground">estudados</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-primary">{Math.round(disciplineProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${disciplineProgress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudyDetailsPage() {
  const { studyId } = useParams({ from: "/_protected/planos/$studyId/" });
  const { isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const [isCreateDisciplineDialogOpen, setIsCreateDisciplineDialogOpen] = useState(false);
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [editingDiscipline, setEditingDiscipline] = useState<string | null>(null);
  const [editDisciplineName, setEditDisciplineName] = useState("");
  const [disciplinesState, setDisciplinesState] = useState<Array<{
    id: string;
    name: string;
    studyId: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }>>([]);

  const queryClient = useQueryClient();

  const studyQuery = useQuery(trpc.getStudy.queryOptions({ id: studyId }));
  const disciplinesQuery = useQuery(trpc.getDisciplines.queryOptions({ studyId }));
  const topicsQuery = useQuery(trpc.getTopics.queryOptions({ studyId }));

  const allTopicIds = topicsQuery.data?.map(topic => topic.id) || [];
  const storeState = useStore(studyTimerStore);

  // Load study totals - otimizado para evitar loops
  useEffect(() => {
    if (allTopicIds.length > 0) {
      timerActions.loadTotals(allTopicIds);
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

  const reorderDisciplinesMutation = useMutation({
    ...trpc.reorderDisciplines.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getDisciplines.queryKey({ studyId }) });
    },
  });

  const handleCreateDiscipline = () => {
    if (!newDisciplineName.trim()) return;

    const disciplineLines = newDisciplineName.split('\n').filter(line => line.trim());

    disciplineLines.forEach(disciplineName => {
      if (disciplineName.trim()) {
        createDisciplineMutation.mutate({
          studyId,
          name: disciplineName.trim(),
        });
      }
    });

    setNewDisciplineName('');
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


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const disciplines = disciplinesQuery.data || [];
    setDisciplinesState(disciplines.map(d => ({
      id: d.id,
      name: d.name,
      studyId: d.studyId,
      order: 0,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(),
    })));
  }, [disciplinesQuery.data?.map(d => d.id).join(',')]);

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setDisciplinesState((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        const disciplineOrders = newItems.map((discipline, index) => ({
          disciplineId: discipline.id,
          order: index,
        }));

        reorderDisciplinesMutation.mutate({ disciplineOrders });

        return newItems;
      });
    }
  }

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

  const totalStudyTime = allTopicIds.reduce((total, topicId) => total + selectors.getTopicTime(topicId)(storeState), 0);
  const completedTopics = topics.filter(topic => topic.status === "completed").length;

  const dailyStudyHours = 3;
  const totalEstimatedHours = topics.length;
  const studiedHours = totalStudyTime / 1000 / 60 / 60;
  const remainingDaysText = formatRemainingDays(totalEstimatedHours, studiedHours, dailyStudyHours);

  const overallProgress = disciplines.length > 0
    ? disciplines.reduce((sum, discipline) => {
        const disciplineTopics = topics.filter(topic => topic.disciplineId === discipline.id);
        const completedDisciplineTopics = disciplineTopics.filter(topic => topic.status === "completed").length;
        const disciplineProgress = disciplineTopics.length > 0 ? (completedDisciplineTopics / disciplineTopics.length) * 100 : 0;
        return sum + disciplineProgress;
      }, 0) / disciplines.length
    : 0;

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
          variant="secondary"
          onClick={() => navigate({ to: "/planos" })}
          className="flex items-center gap-2 text-primary bg-primary/10 border-1 border-primary/40 hover:bg-primary/20 hover:border-primary/50">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="flex flex-row items-center p-3 md:p-4">
          <div className="mr-3 md:mr-4">
            <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <div>
            <div className="text-xl md:text-3xl font-bold">{disciplines.length}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Disciplinas</p>
          </div>
        </Card>

        <Card className="flex flex-row items-center p-3 md:p-4">
          <div className="mr-3 md:mr-4">
            <BookCopy className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <div>
            <div className="text-xl md:text-3xl font-bold">{topics.length}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Tópicos</p>
          </div>
        </Card>

        <Card className="flex flex-row items-center p-3 md:p-4">
          <div className="mr-3 md:mr-4">
            <Timer className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <div>
            <div className="text-xl md:text-3xl font-bold">{formatTime(totalStudyTime)}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Tempo Estudado</p>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Progresso do Plano de Estudos</span>
                <span className="text-2xl font-bold text-primary">{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">Baseado na conclusão de tópicos</span>
            </div>

            <div className="flex flex-col justify-center items-center md:items-start space-y-2 md:border-l md:pl-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Prazo para terminar o plano</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{remainingDaysText}</span>
            </div>
          </div>
        </CardContent>
      </Card>


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
                Adicione uma ou mais disciplinas ao seu plano de estudos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="discipline-name">Nome(s) da Disciplina</Label>
                <Textarea
                  id="discipline-name"
                  value={newDisciplineName}
                  onChange={(e) => setNewDisciplineName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateDiscipline();
                    }
                  }}
                  placeholder="Adicionar nova disciplina...&#10;Uma disciplina por linha para adicionar múltiplas"
                  className="mt-1 min-h-10 resize-none"
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={disciplinesState.map(d => d.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {disciplinesState.map((discipline) => {
                const disciplineTopics = topics.filter(topic => topic.disciplineId === discipline.id);
                const disciplineTopicIds = disciplineTopics.map(topic => topic.id);
                const disciplineTime = disciplineTopicIds.reduce((total, topicId) => total + selectors.getTopicTime(topicId)(storeState), 0);
                const completedDisciplineTopics = disciplineTopics.filter(topic => topic.status === "completed").length;
                const disciplineProgress = disciplineTopics.length > 0 ? (completedDisciplineTopics / disciplineTopics.length) * 100 : 0;

                return (
                  <SortableDisciplineCard
                    key={discipline.id}
                    discipline={discipline}
                    disciplineTopics={disciplineTopics}
                    disciplineTime={disciplineTime}
                    disciplineProgress={disciplineProgress}
                    studyId={studyId}
                    onNavigate={() => navigate({ to: "/planos/$studyId/$disciplineId", params: { studyId, disciplineId: discipline.id } })}
                    onEdit={() => handleEditDiscipline(discipline)}
                    onDelete={() => handleDeleteDiscipline(discipline.id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
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