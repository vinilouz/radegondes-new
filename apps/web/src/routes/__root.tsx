import Header from "@/components/header";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { trpc, trpcClient } from "@/utils/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Outlet,
	createRootRouteWithContext,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { StudyTimerRuntime } from "@/components/StudyTimerRuntime";
import { StudyTimerWidget } from "@/components/StudyTimerWidget";
import { CycleTimerRuntime } from "@/components/CycleTimerRuntime";
import "../index.css";
import { TimerDiagnostics } from "@/components/TimerDiagnostics";

export interface RouterAppContext {
	trpc: typeof trpc;
  trpcClient: typeof trpcClient;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "radegondes",
			},
			{
				name: "description",
				content: "radegondes is a web application",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	const isFetching = useRouterState({
		select: (s) => s.isLoading,
	});

	const location = useRouterState({
		select: (s) => s.location.pathname,
	});

	const isLoginPage = location === '/login';

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				{isLoginPage ? (
					<div className="h-svh">
						{isFetching ? <Loader /> : <Outlet />}
					</div>
				) : (
					<div className="grid grid-rows-[auto_1fr] h-svh">
						<Header />
						{isFetching ? <Loader /> : <Outlet />}
					</div>
				)}
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
      <StudyTimerRuntime />
      <StudyTimerWidget />
      <CycleTimerRuntime />
      {/* {import.meta.env.DEV && <TimerDiagnostics />} */}
		</>
	);
}
