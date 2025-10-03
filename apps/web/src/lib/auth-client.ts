import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_SERVER_URL,
	fetchOptions: {
		retry: 0,
		onError: (ctx) => {
			if (ctx.response?.status === 401 || ctx.response?.status === 403) {
				window.location.href = "/login";
			}
		},
	},
	session: {
		refetchInterval: false,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	},
});
