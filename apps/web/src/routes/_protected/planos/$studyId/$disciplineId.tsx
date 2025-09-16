import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Clock, BookOpen, MoreHorizontal, Play, Pause, CheckCircle, Circle, Target, Timer } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_protected/planos/$studyId/$disciplineId")({
	component: DisciplineDetailsPage,
});

function DisciplineDetailsPage() {
	const { studyId, disciplineId } = useParams({ from: "/_protected/planos/$studyId/$disciplineId" });
	const { data: session, isPending: authPending } = authClient.useSession();
	const navigate = useNavigate();
	const [isCreateTopicDialogOpen, setIsCreateTopicDialogOpen] = useState(false);
	const [newTopicName, setNewTopicName] = useState("");
	const [editingTopic, setEditingTopic] = useState<string | null>(null);
	const [editTopicName, setEditTopicName] = useState("");
	const [studyModalTopic, setStudyModalTopic] = useState<string | null>(null);
	const [topicNotes, setTopicNotes] = useState("");
	const [activeSession, setActiveSession] = useState<{ topicId: string; sessionId: string; startTime: Date } | null>(null);
	const [sessionTime, setSessionTime] = useState(0);
	const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const queryClient = useQueryClient();

	const disciplineQuery = useQuery(trpc.getDiscipline.queryOptions({ disciplineId }));
	const topicsQuery = useQuery(trpc.getTopicsByDiscipline.queryOptions({ disciplineId }));
	const studyQuery = useQuery(trpc.getStudy.queryOptions({ id: studyId }));

	const createTopicMutation = useMutation({
		...trpc.createTopic.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey() });
			queryClient.invalidateQueries({ queryKey: trpc.getDisciplines.queryKey() });
			setIsCreateTopicDialogOpen(false);
			setNewTopicName("");
		},
	});

	const updateTopicMutation = useMutation({
		...trpc.updateTopic.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey() });
			setEditingTopic(null);
			setEditTopicName("");
		},
	});

	const deleteTopicMutation = useMutation({
		...trpc.deleteTopic.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey() });
			queryClient.invalidateQueries({ queryKey: trpc.getDisciplines.queryKey() });
		},
	});

	const createSessionMutation = useMutation({
		...trpc.createTimeSession.mutationOptions(),
		onSuccess: (data) => {
			setActiveSession({
				topicId: data.topicId,
				sessionId: data.id,
				startTime: new Date(data.startTime),
			});
		},
	});

	const updateSessionMutation = useMutation({
		...trpc.updateTimeSession.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trpc.getTimeSessionsByTopic.queryKey() });
		},
	});

	const updateTopicProgressMutation = useMutation({
		...trpc.updateTopicProgress.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trpc.getTopicsByDiscipline.queryKey() });
		},
	});

	const handleCreateTopic = () => {
		if (!newTopicName.trim()) return;

		createTopicMutation.mutate({
			disciplineId,
			name: newTopicName,
		});
	};

	const handleEditTopic = (topic: { id: string; name: string; notes?: string }) => {
		setEditingTopic(topic.id);
		setEditTopicName(topic.name);
	};

	const handleUpdateTopic = () => {
		if (!editingTopic || !editTopicName.trim()) return;

		updateTopicMutation.mutate({
			topicId: editingTopic,
			name: editTopicName,
		});
	};

	const handleDeleteTopic = (topicId: string) => {
		if (confirm("Tem certeza que deseja excluir este tópico? Esta ação não pode ser desfeita.")) {
			deleteTopicMutation.mutate({ topicId });
		}
	};

	const handleStartStudy = (topicId: string) => {
		createSessionMutation.mutate({ topicId, sessionType: "study" });
	};

	const handleStopStudy = () => {
		if (activeSession) {
			const endTime = new Date();
			const duration = Math.floor((endTime.getTime() - activeSession.startTime.getTime()) / 1000);

			updateSessionMutation.mutate({
				sessionId: activeSession.sessionId,
				endTime,
				duration,
			});

			updateTopicProgressMutation.mutate({
				topicId: activeSession.topicId,
				status: "in_progress",
			});

			setActiveSession(null);
			setSessionTime(0);
		}
	};

	const handleTopicStatusChange = (topicId: string, status: "not_started" | "in_progress" | "completed") => {
		updateTopicProgressMutation.mutate({
			topicId,
			status,
		});
	};

	const handleQuestionUpdate = (topicId: string, correct: number, wrong: number) => {
		updateTopicProgressMutation.mutate({
			topicId,
			correct,
			wrong,
		});
	};

	const handleSaveNotes = (topicId: string) => {
		updateTopicProgressMutation.mutate({
			topicId,
			notes: topicNotes,
		});
	};

	const openStudyModal = (topic: { id: string; name: string; notes?: string; status: string; correct: number; wrong: number }) => {
		setStudyModalTopic(topic.id);
		setTopicNotes(topic.notes || "");
	};

	// Timer effect for active study session
	useEffect(() => {
		if (activeSession) {
			sessionIntervalRef.current = setInterval(() => {
				setSessionTime(prev => prev + 1);
			}, 1000);
		} else {
			if (sessionIntervalRef.current) {
				clearInterval(sessionIntervalRef.current);
				sessionIntervalRef.current = null;
			}
		}

		return () => {
			if (sessionIntervalRef.current) {
				clearInterval(sessionIntervalRef.current);
			}
		};
	}, [activeSession]);

	const formatCreatedAt = (date: Date | string) => {
		return new Date(date).toLocaleDateString("pt-BR", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatDuration = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed": return "default";
			case "in_progress": return "secondary";
			default: return "outline";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed": return <CheckCircle className="h-4 w-4" />;
			case "in_progress": return <Circle className="h-4 w-4" />;
			default: return <Circle className="h-4 w-4 opacity-50" />;
		}
	};

	if (authPending || disciplineQuery.isLoading || studyQuery.isLoading) {
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
									<Skeleton className="h-8 w-16" />
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!disciplineQuery.data || !studyQuery.data) {
		return (
			<div className="container mx-auto p-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Disciplina não encontrada</h1>
					<Button onClick={() => navigate({ to: `/planos/${studyId}` })}>
						Voltar para o Estudo
					</Button>
				</div>
			</div>
		);
	}

	const discipline = disciplineQuery.data as any;
	const study = studyQuery.data as any;
	const topics = topicsQuery.data || [];

	if (!discipline || !study) {
		return (
			<div className="container mx-auto p-6">
				<div className="space-y-6">
					<div className="h-40 bg-muted rounded-lg animate-pulse" />
				</div>
			</div>
		);
	}

	const completedTopics = topics.filter(topic => topic.status === "completed").length;
	const inProgressTopics = topics.filter(topic => topic.status === "in_progress").length;
	const totalCorrect = topics.reduce((sum, topic) => sum + topic.correct, 0);
	const totalWrong = topics.reduce((sum, topic) => sum + topic.wrong, 0);

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="flex justify-between items-start mb-8">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => navigate({ to: `/planos/${studyId}` })}
							className="p-0 h-auto"
						>
							←
						</Button>
						<h1 className="text-3xl font-bold tracking-tight">{discipline?.name}</h1>
					</div>
					<p className="text-muted-foreground">{study?.name}</p>
					<p className="text-xs text-muted-foreground mt-2 italic">
						Criado em {formatCreatedAt(discipline?.createdAt || new Date().toISOString())}
					</p>
				</div>

				{activeSession && (
					<div className="flex items-center gap-4 bg-destructive/10 p-3 rounded-lg">
						<Timer className="h-5 w-5 text-destructive animate-pulse" />
						<span className="font-mono text-lg">{formatDuration(sessionTime)}</span>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleStopStudy}
						>
							<Pause className="h-4 w-4 mr-1" />
							Parar
						</Button>
					</div>
				)}
			</div>

			{/* Statistics */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Tópicos</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{topics.length}</div>
						<p className="text-xs text-muted-foreground">
							{completedTopics} concluídos, {inProgressTopics} em andamento
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Questões Corretas</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">{totalCorrect}</div>
						<p className="text-xs text-muted-foreground">
							acertos totais
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Questões Erradas</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">{totalWrong}</div>
						<p className="text-xs text-muted-foreground">
							erros totais
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Progresso</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0}%
						</div>
						<p className="text-xs text-muted-foreground">
							concluído
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Topics Section */}
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-xl font-semibold">Tópicos</h2>

				<Dialog open={isCreateTopicDialogOpen} onOpenChange={setIsCreateTopicDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Novo Tópico
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Novo Tópico</DialogTitle>
							<DialogDescription>
								Adicione um novo tópico à disciplina.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="topic-name">Nome do Tópico</Label>
								<Input
									id="topic-name"
									value={newTopicName}
									onChange={(e) => setNewTopicName(e.target.value)}
									placeholder="Digite o nome do tópico"
									className="mt-1"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsCreateTopicDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button
								onClick={handleCreateTopic}
								disabled={!newTopicName.trim() || createTopicMutation.isPending}
							>
								{createTopicMutation.isPending ? "Criando..." : "Criar Tópico"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{topicsQuery.isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-8 w-16" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : topics.length === 0 ? (
				<Card className="text-center py-12">
					<CardContent>
						<div className="space-y-4">
							<BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="text-lg font-semibold">Nenhum tópico criado</h3>
							<p className="text-muted-foreground">
								Comece criando seu primeiro tópico para organizar seus estudos.
							</p>
							<Button onClick={() => setIsCreateTopicDialogOpen(true)} className="mt-4">
								<Plus className="mr-2 h-4 w-4" />
								Criar Primeiro Tópico
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{topics.map((topic) => {
						const isCurrentSession = activeSession?.topicId === topic.id;

						return (
							<Card key={topic.id} className={`hover:shadow-md transition-shadow ${isCurrentSession ? 'ring-2 ring-destructive' : ''}`}>
								<CardHeader>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<CardTitle className="text-lg flex items-center gap-2">
												{getStatusIcon(topic.status)}
												{editingTopic === topic.id ? (
													<Input
														value={editTopicName}
														onChange={(e) => setEditTopicName(e.target.value)}
														onBlur={handleUpdateTopic}
														onKeyPress={(e) => {
															if (e.key === "Enter") handleUpdateTopic();
														}}
														className="h-6 text-xs"
														autoFocus
													/>
												) : (
													<span
														className="cursor-pointer hover:text-primary"
														onClick={() => handleEditTopic({...topic, notes: topic.notes ?? undefined})}
													>
														{topic.name}
													</span>
												)}
											</CardTitle>
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => openStudyModal({...topic, notes: topic.notes ?? undefined})}>
													Estudar
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => handleTopicStatusChange(topic.id, topic.status === "completed" ? "not_started" : "completed")}>
													{topic.status === "completed" ? "Marcar como não iniciado" : "Marcar como concluído"}
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => handleEditTopic({...topic, notes: topic.notes ?? undefined})}>
													Editar
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDeleteTopic(topic.id)}
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
											<Badge variant={getStatusColor(topic.status)}>
												{topic.status === "completed" ? "Concluído" :
												 topic.status === "in_progress" ? "Em andamento" : "Não iniciado"}
											</Badge>
											{!isCurrentSession && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleStartStudy(topic.id)}
													disabled={!!activeSession}
												>
													<Play className="h-3 w-3 mr-1" />
													Estudar
												</Button>
											)}
										</div>

										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<span className="text-muted-foreground">Acertos:</span>
												<span className="ml-1 font-medium text-green-600">{topic.correct}</span>
											</div>
											<div>
												<span className="text-muted-foreground">Erros:</span>
												<span className="ml-1 font-medium text-red-600">{topic.wrong}</span>
											</div>
										</div>

										{topic.notes && (
											<div className="text-sm">
												<span className="text-muted-foreground">Notas:</span>
												<p className="mt-1 text-xs bg-muted p-2 rounded">
													{topic.notes.length > 50 ? topic.notes.substring(0, 50) + "..." : topic.notes}
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* Study Modal */}
			{studyModalTopic && (
				<Dialog open={!!studyModalTopic} onOpenChange={() => setStudyModalTopic(null)}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>
								Estudando: {topics.find(t => t.id === studyModalTopic)?.name}
							</DialogTitle>
						</DialogHeader>

						<Tabs defaultValue="study" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="study">Estudo</TabsTrigger>
								<TabsTrigger value="questions">Questões</TabsTrigger>
								<TabsTrigger value="notes">Notas</TabsTrigger>
							</TabsList>

							<TabsContent value="study" className="space-y-4">
								<div className="text-center py-8">
									{activeSession?.topicId === studyModalTopic ? (
										<div className="space-y-4">
											<div className="text-4xl font-mono">{formatDuration(sessionTime)}</div>
											<p className="text-muted-foreground">Sessão de estudo em andamento</p>
											<Button onClick={handleStopStudy} variant="destructive">
												<Pause className="h-4 w-4 mr-2" />
												Parar Sessão
											</Button>
										</div>
									) : (
										<div className="space-y-4">
											<p className="text-muted-foreground">Inicie uma sessão de estudo para registrar seu tempo</p>
											<Button
												onClick={() => {
													handleStartStudy(studyModalTopic);
												}}
												disabled={!!activeSession}
											>
												<Play className="h-4 w-4 mr-2" />
												Iniciar Sessão
											</Button>
										</div>
									)}
								</div>
							</TabsContent>

							<TabsContent value="questions" className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Questões Corretas</Label>
										<Input
											type="number"
											value={topics.find(t => t.id === studyModalTopic)?.correct || 0}
											onChange={(e) => {
												const topic = topics.find(t => t.id === studyModalTopic);
												if (topic) {
													handleQuestionUpdate(studyModalTopic, parseInt(e.target.value) || 0, topic.wrong);
												}
											}}
											min="0"
										/>
									</div>
									<div className="space-y-2">
										<Label>Questões Erradas</Label>
										<Input
											type="number"
											value={topics.find(t => t.id === studyModalTopic)?.wrong || 0}
											onChange={(e) => {
												const topic = topics.find(t => t.id === studyModalTopic);
												if (topic) {
													handleQuestionUpdate(studyModalTopic, topic.correct, parseInt(e.target.value) || 0);
												}
											}}
											min="0"
										/>
									</div>
								</div>

								{topics.find(t => t.id === studyModalTopic) && (
									<div className="text-center pt-4 border-t">
										<p className="text-sm text-muted-foreground">
											Taxa de acerto: {
												Math.round(
													(topics.find(t => t.id === studyModalTopic)!.correct /
													(topics.find(t => t.id === studyModalTopic)!.correct + topics.find(t => t.id === studyModalTopic)!.wrong || 1)) * 100
												)
											}%
										</p>
									</div>
								)}
							</TabsContent>

							<TabsContent value="notes" className="space-y-4">
								<div className="space-y-2">
									<Label>Anotações</Label>
									<Textarea
										value={topicNotes}
										onChange={(e) => setTopicNotes(e.target.value)}
										placeholder="Adicione suas anotações sobre este tópico..."
										rows={6}
									/>
								</div>
								<Button onClick={() => handleSaveNotes(studyModalTopic)}>
									Salvar Anotações
								</Button>
							</TabsContent>
						</Tabs>
					</DialogContent>
				</Dialog>
			)}

			{/* Edit Topic Dialog */}
			<Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Tópico</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-topic-name">Nome do Tópico</Label>
							<Input
								id="edit-topic-name"
								value={editTopicName}
								onChange={(e) => setEditTopicName(e.target.value)}
								className="mt-1"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingTopic(null)}>
							Cancelar
						</Button>
						<Button
							onClick={handleUpdateTopic}
							disabled={!editTopicName.trim() || updateTopicMutation.isPending}
						>
							{updateTopicMutation.isPending ? "Salvando..." : "Salvar Alterações"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}