import { authClient } from "@/lib/auth-client";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context, location }) => {
    const { data: session } = await authClient.getSession();

    if (!session || !session.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href }
      });
    }
    return { ...context, session };
  },
  component: () => <Outlet />,
});