import type { AppRouter } from "../../../server/src/routers";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import {
	TRPCClientError,
	createTRPCClient,
	httpBatchLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "UNAUTHORIZED"
			) {
				toast.error("Sessão expirada", {
					description: "Sua sessão expirou, faça login novamente.",
				});
				queryClient.clear();
				if (window.location.pathname !== "/login") {
					window.location.href = "/login";
				}
				return;
			}

			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: () => {
						queryClient.invalidateQueries();
					},
				},
			});
		},
	}),
});

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
