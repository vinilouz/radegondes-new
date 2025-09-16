import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { trpcClient } from "@/utils/trpc";
import { timerActions, selectors, studyTimerStore } from '@/store/studyTimerStore';
import { formatTime } from '@/lib/utils';
import { useStore } from '@tanstack/react-store';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, BookOpen, MoreHorizontal, Timer, Target, CalendarIcon, Home } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_protected/planos/")({
  component: StudiesPage,
});

function StudyCard({ study, navigate, handleDeleteStudy }: { study: any; navigate: any; handleDeleteStudy: any }) {
  const [studyTime, setStudyTime] = useState(0);
  const storeState = useStore(studyTimerStore);

  const formatCreatedAt = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  useEffect(() => {
    const fetchTopics = async () => {
      const topics = await trpcClient.getTopics.query({ studyId: study.id });
      const topicIds = topics.map((topic: any) => topic.id);

      if (topicIds.length > 0) {
        await timerActions.loadTotals(undefined, undefined, topicIds, trpcClient);
        const time = selectors.getStudyTime(study.id, topicIds)(storeState);
        setStudyTime(time);
      }
    };

    fetchTopics();
  }, [study.id, storeState]);

  return (
    <a
      key={study.id}
      className="study-card bg-card border border-transparent hover:border-primary rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:translate-y-[-2px] cursor-pointer overflow-hidden flex flex-col min-h-[180px] no-underline"
      href={`/planos/${study.id}`}
      onClick={(e) => {
        e.preventDefault();
        navigate({ to: "/planos/$studyId", params: { studyId: study.id } });
      }}
      draggable="true"
    >
      <div className="ellipsis-menu absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ellipsis-button bg-transparent border-none text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteStudy(study.id)
              }}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="trash-icon absolute top-2 right-10 hidden">
        <Trash2 className="h-4 w-4 text-destructive" />
      </div>

      <div className="study-header p-4 pb-2">
        <h3 className="study-title text-lg font-bold text-card-foreground mb-0">
          {study.name}
        </h3>
      </div>

      <div className="study-stats p-4 pt-2 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="study-stat flex-1 text-center rounded-[6px] p-[14px_8px] bg-primary/10 border border-primary/20">
            <div className="study-stat-value text-xl font-bold mb-1 flex items-center justify-center gap-1 text-primary">
              <BookOpen className="h-4 w-4" />
              {study.disciplineCount || 0}
            </div>
            <div className="study-stat-label text-xs text-muted-foreground uppercase">
              Disciplinas
            </div>
          </div>
          <div className="study-stat flex-1 text-center rounded-[6px] p-[14px_8px] bg-primary/10 border border-primary/20">
            <div className="study-stat-value text-xl font-bold mb-1 flex items-center justify-center gap-1 text-primary">
              <Target className="h-4 w-4" />
              {study.topicCount || 0}
            </div>
            <div className="study-stat-label text-xs text-muted-foreground uppercase">
              Tópicos
            </div>
          </div>
        </div>
        <div className="study-stat text-center rounded-[6px] p-[14px_8px] bg-primary/10 border border-primary/20">
          <div className="study-stat-value text-xl font-bold mb-1 flex items-center justify-center gap-1 text-primary">
            <Timer className="h-4 w-4" />
            {formatTime(studyTime)}
          </div>
          <div className="study-stat-label text-xs text-muted-foreground uppercase">
            Tempo
          </div>
        </div>
      </div>

      <div className="study-footer mt-auto p-4 pt-2">
        <span className="text-xs text-muted-foreground">
          <CalendarIcon /> Criado em {formatCreatedAt(study.createdAt)}
        </span>
      </div>
    </a>
  );
}

function StudiesPage() {
  const { isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStudyName, setNewStudyName] = useState("");
  const [newStudyDescription, setNewStudyDescription] = useState("");

  const queryClient = useQueryClient();

  const studiesQuery = useQuery(trpc.getStudies.queryOptions());

  
  const createStudyMutation = useMutation({
    ...trpc.createStudy.mutationOptions(),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: trpc.getStudies.queryKey() });
      setIsCreateDialogOpen(false);
      setNewStudyName("");
      setNewStudyDescription("");
      if (data?.id) {
        navigate({ to: "/planos/$studyId", params: { studyId: data.id } });
      }
    },
  })

  const deleteStudyMutation = useMutation({
    ...trpc.deleteStudy.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getStudies.queryKey() });
    },
  })

  const handleCreateStudy = () => {
    if (!newStudyName.trim()) return;

    createStudyMutation.mutate({
      name: newStudyName,
      description: newStudyDescription || undefined,
    })
  }

  const handleDeleteStudy = (studyId: string) => {
    if (confirm("Tem certeza que deseja excluir este estudo? Esta ação não pode ser desfeita.")) {
      deleteStudyMutation.mutate({ id: studyId });
    }
  }

  const formatCreatedAt = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (authPending) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">

      {/* Row 2: Title & description | back btn */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estudos</h1>
          <p className="text-muted-foreground mt-2">Organize e acompanhe seu progresso de aprendizado</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Estudo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Estudo</DialogTitle>
              <DialogDescription>
                Crie um novo plano de estudo para organizar seus módulos e tópicos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="study-name">Nome do Estudo</Label>
                <Input
                  id="study-name"
                  value={newStudyName}
                  onChange={(e) => setNewStudyName(e.target.value)}
                  placeholder="Digite o nome do estudo"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="study-description">Descrição (Opcional)</Label>
                <Textarea
                  id="study-description"
                  value={newStudyDescription}
                  onChange={(e) => setNewStudyDescription(e.target.value)}
                  placeholder="Digite a descrição do estudo"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateStudy}
                disabled={!newStudyName.trim() || createStudyMutation.isPending}
              >
                {createStudyMutation.isPending ? "Criando..." : "Criar Estudo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {studiesQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : studiesQuery.data?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Nenhum plano de estudo criado ainda</h3>
              <p className="text-muted-foreground">
                Comece criando seu primeiro plano de estudo para organizar sua jornada de aprendizado.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar Estudo Personalizado
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="studies-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {studiesQuery.data?.map((study) => (
            <StudyCard
              key={study.id}
              study={study}
              navigate={navigate}
              handleDeleteStudy={handleDeleteStudy}
            />
          ))}
        </div>
      )}
    </div>
  )
}
