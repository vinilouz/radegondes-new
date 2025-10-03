import { authClient } from "@/lib/auth-client";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

const LOGOUT_IN_PROGRESS_KEY = "__logout_in_progress";
const SESSION_CHECK_COOLDOWN_MS = 2000;
let cachedSession: { session: any; timestamp: number } | null = null;

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context, location }) => {
    if (sessionStorage.getItem(LOGOUT_IN_PROGRESS_KEY)) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href }
      });
    }

    const now = Date.now();

    if (cachedSession && (now - cachedSession.timestamp) < SESSION_CHECK_COOLDOWN_MS) {
      return { ...context, session: cachedSession.session };
    }

    const { data: session, error } = await authClient.getSession();

    if (!session || !session.user || error) {
      cachedSession = null;
      sessionStorage.setItem(LOGOUT_IN_PROGRESS_KEY, "true");

      document.cookie.split(";").forEach((cookie) => {
        const [name] = cookie.split("=");
        if (name.trim().startsWith("better-auth")) {
          document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });

      throw redirect({
        to: "/login",
        search: { redirect: location.href }
      });
    }

    cachedSession = { session, timestamp: now };
    sessionStorage.removeItem(LOGOUT_IN_PROGRESS_KEY);
    return { ...context, session };
  },
  component: () => <Outlet />,
});