import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Clock, BookOpen, MoreHorizontal } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_protected/planos")({
	component: StudiesPage,
});

function StudiesPage() {
	const { data: session, isPending: authPending } = authClient.useSession();
	const navigate = useNavigate();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newStudyName, setNewStudyName] = useState("");
	const [newStudyDescription, setNewStudyDescription] = useState("");

	const queryClient = useQueryClient();

	const studiesQuery = useQuery(trpc.getStudies.queryOptions());

	const createStudyMutation = useMutation({
		...trpc.createStudy.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trpc.getStudies.queryKey() });
			setIsCreateDialogOpen(false);
			setNewStudyName("");
			setNewStudyDescription("");
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
		if (confirm("Are you sure you want to delete this study? This action cannot be undone.")) {
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
			<div className="flex justify-between items-start mb-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Studies</h1>
					<p className="text-muted-foreground mt-2">Organize and track your learning progress</p>
				</div>

				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create Study
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Study</DialogTitle>
							<DialogDescription>
								Create a new study plan to organize your learning modules and topics.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="study-name">Study Name</Label>
								<Input
									id="study-name"
									value={newStudyName}
									onChange={(e) => setNewStudyName(e.target.value)}
									placeholder="Enter study name"
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="study-description">Description (Optional)</Label>
								<Textarea
									id="study-description"
									value={newStudyDescription}
									onChange={(e) => setNewStudyDescription(e.target.value)}
									placeholder="Enter study description"
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
								Cancel
							</Button>
							<Button
								onClick={handleCreateStudy}
								disabled={!newStudyName.trim() || createStudyMutation.isPending}
							>
								{createStudyMutation.isPending ? "Creating..." : "Create Study"}
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
							<h3 className="text-lg font-semibold">No studies created yet</h3>
							<p className="text-muted-foreground">
								Start by creating your first study plan to organize your learning journey.
							</p>
							<Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
								<Plus className="mr-2 h-4 w-4" />
								Create Your First Study
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{studiesQuery.data?.map((study) => (
						<Card
							key={study.id}
							className="cursor-pointer hover:shadow-md transition-shadow"
							onClick={() => navigate({ to: `/planos/${study.id}` })}
						>
							<CardHeader className="pb-3">
								<div className="flex justify-between items-start">
									<CardTitle className="text-lg">{study.name}</CardTitle>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => e.stopPropagation()}
											>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation()
													handleDeleteStudy(study.id)
												}}
												className="text-destructive"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								{study.description && (
									<CardDescription className="line-clamp-2">
										{study.description}
									</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<div className="flex items-center space-x-2">
											<BookOpen className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">
												{study.moduleCount || 0} Modules
											</span>
										</div>
										<Badge variant="secondary">
											{study.topicCount || 0} Topics
										</Badge>
									</div>
									<div className="flex items-center space-x-2 text-xs text-muted-foreground">
										<Clock className="h-3 w-3" />
										<span>Created {formatCreatedAt(study.createdAt)}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}