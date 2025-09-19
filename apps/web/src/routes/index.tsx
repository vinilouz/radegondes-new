import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const { data: session } = await authClient.getSession();

		if (session && session.user) {
			throw redirect({
				to: "/planos",
			});
		} else {
			throw redirect({
				to: "/login",
			});
		}
	},
});
