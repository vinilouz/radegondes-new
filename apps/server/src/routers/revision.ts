import { protectedProcedure, router } from "../lib/trpc";
import { db } from "../db";
import { revision, topic, discipline, study } from "../db/schema/study";
import { eq, and, inArray, gte, lte, desc, asc, sql } from "drizzle-orm";
import { z } from "zod";

export const revisionRouter = router({
  createRevisions: protectedProcedure
    .input(z.object({
      topicId: z.string(),
      dates: z.array(z.coerce.date()),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const topicCheck = await db
        .select({ id: topic.id })
        .from(topic)
        .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
        .innerJoin(study, eq(discipline.studyId, study.id))
        .where(and(eq(topic.id, input.topicId), eq(study.userId, userId)));

      if (topicCheck.length === 0) {
        throw new Error("Topic not found or access denied");
      }

      const existingRevisions = await db
        .select({ scheduledDate: revision.scheduledDate })
        .from(revision)
        .where(eq(revision.topicId, input.topicId));

      const existingDatesSet = new Set(
        existingRevisions.map(r => r.scheduledDate.toISOString().split('T')[0])
      );

      const newDates = input.dates.filter(date => {
        const dateStr = new Date(date).toISOString().split('T')[0];
        return !existingDatesSet.has(dateStr);
      });

      if (newDates.length === 0) {
        return { created: 0, message: "All dates already exist" };
      }

      const { randomUUID } = await import('crypto');

      const revisionsToInsert = newDates.map(date => ({
        id: randomUUID(),
        topicId: input.topicId,
        scheduledDate: new Date(date),
        completed: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(revision).values(revisionsToInsert);

      return { created: revisionsToInsert.length, message: "Revisions created successfully" };
    }),

  getRevisionsByTopic: protectedProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const topicCheck = await db
        .select({ id: topic.id })
        .from(topic)
        .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
        .innerJoin(study, eq(discipline.studyId, study.id))
        .where(and(eq(topic.id, input.topicId), eq(study.userId, userId)));

      if (topicCheck.length === 0) {
        throw new Error("Topic not found or access denied");
      }

      const revisions = await db
        .select()
        .from(revision)
        .where(eq(revision.topicId, input.topicId))
        .orderBy(asc(revision.scheduledDate));

      return revisions;
    }),

  getRevisionsByUser: protectedProcedure
    .input(z.object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      completed: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const conditions = [eq(study.userId, userId)];

      if (input.startDate) {
        conditions.push(gte(revision.scheduledDate, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(revision.scheduledDate, input.endDate));
      }

      if (input.completed !== undefined) {
        conditions.push(eq(revision.completed, input.completed ? 1 : 0));
      }

      const revisions = await db
        .select({
          id: revision.id,
          topicId: revision.topicId,
          topicName: topic.name,
          disciplineId: discipline.id,
          disciplineName: discipline.name,
          studyId: study.id,
          studyName: study.name,
          scheduledDate: revision.scheduledDate,
          completed: revision.completed,
          completedAt: revision.completedAt,
          createdAt: revision.createdAt,
        })
        .from(revision)
        .innerJoin(topic, eq(revision.topicId, topic.id))
        .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
        .innerJoin(study, eq(discipline.studyId, study.id))
        .where(and(...conditions))
        .orderBy(asc(revision.scheduledDate));

      return revisions;
    }),

  updateRevision: protectedProcedure
    .input(z.object({
      revisionId: z.string(),
      completed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const revisionCheck = await db
        .select({ id: revision.id })
        .from(revision)
        .innerJoin(topic, eq(revision.topicId, topic.id))
        .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
        .innerJoin(study, eq(discipline.studyId, study.id))
        .where(and(eq(revision.id, input.revisionId), eq(study.userId, userId)));

      if (revisionCheck.length === 0) {
        throw new Error("Revision not found or access denied");
      }

      const result = await db
        .update(revision)
        .set({
          completed: input.completed ? 1 : 0,
          completedAt: input.completed ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(revision.id, input.revisionId))
        .returning();

      return result[0];
    }),

  deleteRevisions: protectedProcedure
    .input(z.object({
      revisionIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      for (const revisionId of input.revisionIds) {
        const revisionCheck = await db
          .select({ id: revision.id })
          .from(revision)
          .innerJoin(topic, eq(revision.topicId, topic.id))
          .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
          .innerJoin(study, eq(discipline.studyId, study.id))
          .where(and(eq(revision.id, revisionId), eq(study.userId, userId)));

        if (revisionCheck.length === 0) {
          throw new Error("Revision not found or access denied");
        }

        await db.delete(revision).where(eq(revision.id, revisionId));
      }

      return { success: true, deleted: input.revisionIds.length };
    }),
});
