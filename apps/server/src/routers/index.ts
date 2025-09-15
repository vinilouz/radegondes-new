import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { db } from "../db";
import { study, module, topic, timeSession } from "../db/schema/study";
import { eq, desc, count, sum } from "drizzle-orm";
import { z } from "zod";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),

	// Study CRUD operations
	getStudies: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const studies = await db
			.select({
				id: study.id,
				name: study.name,
				description: study.description,
				createdAt: study.createdAt,
				moduleCount: count(module.id),
				topicCount: count(topic.id),
			})
			.from(study)
			.leftJoin(module, eq(module.studyId, study.id))
			.leftJoin(topic, eq(topic.moduleId, module.id))
			.where(eq(study.userId, userId))
			.groupBy(study.id, study.name, study.description, study.createdAt)
			.orderBy(desc(study.createdAt));

		return studies;
	}),

	createStudy: protectedProcedure
		.input(z.object({
			name: z.string().min(1),
			description: z.string().optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const { createId } = await import("@paralleldrive/cuid2");
			const studyId = createId();

			await db
				.insert(study)
				.values({
					id: studyId,
					name: input.name,
					description: input.description || null,
					userId,
				});

			return { id: studyId, name: input.name, description: input.description, userId, createdAt: new Date(), updatedAt: new Date() };
		}),

	updateStudy: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().min(1).optional(),
			description: z.string().optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const existingStudy = await db
				.select()
				.from(study)
				.where(eq(study.id, input.id))
				.limit(1);

			if (!existingStudy.length || existingStudy[0].userId !== userId) {
				throw new Error("Study not found or access denied");
			}

			const updateData: any = {};
			if (input.name) updateData.name = input.name;
			if (input.description !== undefined) updateData.description = input.description;
			updateData.updatedAt = new Date();

			const updated = await db
				.update(study)
				.set(updateData)
				.where(eq(study.id, input.id))
				.returning();

			return updated[0];
		}),

	deleteStudy: protectedProcedure
		.input(z.object({
			id: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const existingStudy = await db
				.select()
				.from(study)
				.where(eq(study.id, input.id))
				.limit(1);

			if (!existingStudy.length || existingStudy[0].userId !== userId) {
				throw new Error("Study not found or access denied");
			}

			await db
				.delete(study)
				.where(eq(study.id, input.id));

			return { success: true };
		}),

	// Module operations
	getModules: protectedProcedure
		.input(z.object({
			studyId: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const studyCheck = await db
				.select()
				.from(study)
				.where(eq(study.id, input.studyId))
				.limit(1);

			if (!studyCheck.length || studyCheck[0].userId !== userId) {
				throw new Error("Study not found or access denied");
			}

			const modules = await db
				.select({
					id: module.id,
					name: module.name,
					studyId: module.studyId,
					createdAt: module.createdAt,
					topicCount: count(topic.id),
				})
				.from(module)
				.leftJoin(topic, eq(topic.moduleId, module.id))
				.where(eq(module.studyId, input.studyId))
				.groupBy(module.id, module.name, module.studyId, module.createdAt)
				.orderBy(desc(module.createdAt));

			return modules;
		}),

	createModule: protectedProcedure
		.input(z.object({
			studyId: z.string(),
			name: z.string().min(1),
		}))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const studyCheck = await db
				.select()
				.from(study)
				.where(eq(study.id, input.studyId))
				.limit(1);

			if (!studyCheck.length || studyCheck[0].userId !== userId) {
				throw new Error("Study not found or access denied");
			}

			const { createId } = await import("@paralleldrive/cuid2");
			const moduleId = createId();

			await db
				.insert(module)
				.values({
					id: moduleId,
					name: input.name,
					studyId: input.studyId,
				});

			return { id: moduleId, name: input.name, studyId: input.studyId, createdAt: new Date(), updatedAt: new Date() };
		}),
});
export type AppRouter = typeof appRouter;
