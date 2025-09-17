import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { authClient } from "@/lib/auth-client";
import { BookOpen, Home, BarChart3, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export default function Header() {
	const { data: session } = authClient.useSession();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const publicLinks = [
		{ to: "/", label: "Home", icon: Home },
	] as const;

	const protectedLinks = [
		{ to: "/planos", label: "Meus Planos", icon: BookOpen },
		{ to: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
	] as const;

	const links = session ? protectedLinks : publicLinks;
	const homeLink = session ? "/planos" : "/";

	return (
		<div className="sticky top-0 z-50 w-full py-6">
			<div className="container mx-auto px-6">
				<header className="bg-card rounded-xl border border-border shadow-lg">
					<div className="flex h-16 items-center justify-between px-6">
				{/* Logo e Branding */}
				<div className="flex items-center gap-3">
					<Link
						to={homeLink}
						className="flex items-center gap-3 transition-opacity hover:opacity-80"
					>
						<img
							src="/logo.png"
							alt="Radegondes Logo"
							className="h-10 w-auto"
						/>
						<div className="flex flex-col">
							<span className="text-lg font-bold leading-none">Radegondes</span>
							<span className="text-xs text-muted-foreground">Resumos | Concursos</span>
						</div>
					</Link>
				</div>

				{/* Navegação Desktop */}
				{session && (
					<nav className="hidden md:flex items-center gap-6">
						{links.map(({ to, label, icon: Icon }) => (
							<Link
								key={to}
								to={to}
								className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:text-primary hover:bg-accent"
								activeProps={{
									className: "text-primary bg-accent"
								}}
							>
								<Icon className="h-4 w-4" />
								{label}
							</Link>
						))}
					</nav>
				)}

				{/* Menu Mobile + Controles */}
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />

					{/* Menu Mobile */}
					{session && (
						<div className="relative md:hidden">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							>
								<Menu className="h-5 w-5" />
								<span className="sr-only">Toggle menu</span>
							</Button>

							{/* Overlay para fechar o menu */}
							{isMobileMenuOpen && (
								<div
									className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
									onClick={() => setIsMobileMenuOpen(false)}
								/>
							)}

							{/* Menu Dropdown */}
							{isMobileMenuOpen && (
								<div className="fixed left-0 right-0 z-50 pt-6">
									<div className="container mx-auto px-6">
										<nav className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
											{/* Header do Menu */}
											<header className="flex items-center gap-3 p-6 border-b bg-muted/30">
												<img
													src="/logo.png"
													alt="Radegondes Logo"
													className="h-10 w-auto"
												/>
												<div>
													<h1 className="text-lg font-bold leading-none">Radegondes</h1>
													<small className="text-xs text-muted-foreground">Resumos | Concursos</small>
												</div>
											</header>

											{/* Links de Navegação */}
											<nav className="p-4">
												<ul className="space-y-2">
													{links.map(({ to, label, icon: Icon }) => (
														<li key={to}>
															<Link
																to={to}
																onClick={() => setIsMobileMenuOpen(false)}
																className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-accent w-full"
																activeProps={{
																	className: "bg-primary/10 text-primary border border-primary/20"
																}}
															>
																<Icon className="h-5 w-5" />
																{label}
															</Link>
														</li>
													))}
												</ul>
											</nav>

											{/* User Info */}
											<div className="border-t p-4">
												<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
														{session?.user.name?.slice(0, 2).toUpperCase()}
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm truncate">Olá, {session?.user.name}</div>
														<div className="text-xs text-muted-foreground truncate">{session?.user.email}</div>
													</div>
												</div>
											</div>
										</nav>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
					</div>
				</header>
			</div>
		</div>
	);
}
