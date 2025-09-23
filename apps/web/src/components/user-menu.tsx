import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [dailyStudyHours, setDailyStudyHours] = useState(3);

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link to="/login">Entrar</Link>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="flex items-center gap-2">
					<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
						{session.user.name?.slice(0, 2).toUpperCase()}
					</div>
					<span className="hidden sm:inline">{session.user.name}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card w-56">
				<DropdownMenuLabel className="text-center">
					<div className="flex flex-col">
						<span className="font-semibold">{session.user.name}</span>
						<span className="text-xs text-muted-foreground font-normal">{session.user.email}</span>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
					<DialogTrigger asChild>
						<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
							<div className="flex items-center gap-2 w-full">
								<Settings className="h-4 w-4" />
								Configurações
							</div>
						</DropdownMenuItem>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Configurações de Estudo</DialogTitle>
							<DialogDescription>
								Configure suas preferências de estudo.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="daily-hours">Horas de Estudo por Dia</Label>
								<Input
									id="daily-hours"
									type="number"
									min="1"
									max="24"
									value={dailyStudyHours}
									onChange={(e) => setDailyStudyHours(parseInt(e.target.value) || 3)}
									className="mt-1"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Quantas horas você estuda por dia em média?
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={() => setIsSettingsOpen(false)}>
								Salvar
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Button
						variant="destructive"
						className="w-full"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({
											to: "/",
										});
									},
								},
							});
						}}
					>
						Sair
					</Button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}