import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session || !ctx.session.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
	console.log(`[${new Date().toISOString()}] tRPC ${type.toUpperCase()}: ${path}`);
	return next();
});
