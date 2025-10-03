import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { createFileRoute, useNavigate, useSearch, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

const LOGOUT_IN_PROGRESS_KEY = "__logout_in_progress";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
	beforeLoad: async ({ location }) => {
		sessionStorage.removeItem(LOGOUT_IN_PROGRESS_KEY);

		const { data: session } = await authClient.getSession();

		if (session && session.user) {
			throw redirect({
				to: "/planos",
			});
		}
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: "/login" });
	const { data: session, isPending } = authClient.useSession();
	const [showSignIn, setShowSignIn] = useState(true);

	useEffect(() => {
		if (!isPending && session && session.user) {
			navigate({
				to: redirect || "/planos",
				replace: true,
			});
		}
	}, [session, isPending, navigate, redirect]);

	if (isPending) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (session && session.user) {
		return null;
	}

	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}
