import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "./lib/context";
import { appRouter } from "./routers/index";
import { auth } from "./lib/auth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// app.use(logger());

app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

app.get("/health", async (c) => {
	try {
		await db.execute(sql`SELECT 1`);

		const requiredTables = [
			"user", "session", "account", "verification",
			"study", "discipline", "topic", "time_session"
		];

		const tableExists = await Promise.all(
			requiredTables.map(async (table) => {
				const result = await db.execute<{ exists: boolean }>(
					sql`SELECT EXISTS (
						SELECT FROM information_schema.tables
						WHERE table_schema = 'public'
						AND table_name = ${table}
					) as exists`
				);
				return result.rows[0]?.exists || false;
			})
		);

		const allTablesExist = tableExists.every(exists => exists);

		return c.json({
			connected: true,
			hasTables: allTablesExist
		});
	} catch (error) {
		return c.json({
			connected: false,
			hasTables: false
		});
	}
});

import { serve } from "@hono/node-server";

serve(
	{
		fetch: app.fetch,
		port: Number(process.env.PORT || 3000),
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
