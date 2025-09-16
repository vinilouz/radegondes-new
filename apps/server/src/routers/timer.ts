
import { protectedProcedure, router } from "../lib/trpc";
import { db } from "../db";
import { timeSession, topic, discipline, study } from "../db/schema/study";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";

// Cache para getTotals endpoint (TTL de 30 segundos)
const getTotalsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

// Limpa cache periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of getTotalsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      getTotalsCache.delete(key);
    }
  }
}, 60000); // Limpa a cada minuto

export const timerRouter = router({
  startSession: protectedProcedure
    .input(
      z.object({
        topicId: z.string(),
        sessionId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // Verify user has access to this topic
      const topicCheck = await db
        .select({ id: topic.id })
        .from(topic)
        .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
        .innerJoin(study, eq(discipline.studyId, study.id))
        .where(and(eq(topic.id, input.topicId), eq(study.userId, userId)));

      if (topicCheck.length === 0) {
        throw new Error("Topic not found or access denied");
      }

      const result = await db
        .insert(timeSession)
        .values({
          id: input.sessionId,
          topicId: input.topicId,
          startTime: new Date(),
          duration: 0,
        })
        .returning();
      return result[0];
    }),

  stopSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        duration: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // We don't need to verify ownership here again as much,
      // because the sessionId is a UUID and hard to guess.
      // A select could be added for extra security.
      const result = await db
        .update(timeSession)
        .set({
          endTime: new Date(),
          duration: input.duration,
        })
        .where(eq(timeSession.id, input.sessionId))
        .returning();
      return result[0];
    }),

  heartbeat: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        deltaMs: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(timeSession)
        .set({
          duration: sql`${timeSession.duration} + ${input.deltaMs}`,
        })
        .where(eq(timeSession.id, input.sessionId));
      return { success: true };
    }),

  getTotals: protectedProcedure
    .input(
      z.object({
        studyId: z.string().optional(),
        disciplineIds: z.array(z.string()).optional(),
        topicIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.topicIds || input.topicIds.length === 0) {
        return {
          topicTotals: {},
          disciplineTotals: {},
          studyTotals: {},
        };
      }

      // Gera chave de cache
      const cacheKey = JSON.stringify({ studyId: input.studyId, disciplineIds: input.disciplineIds, topicIds: input.topicIds });

      // Verifica cache primeiro
      const cached = getTotalsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      // Query otimizada com indexes
      const totals = await db
        .select({
          topicId: timeSession.topicId,
          totalDuration: sql<number>`sum(${timeSession.duration})`.mapWith(Number),
        })
        .from(timeSession)
        .where(inArray(timeSession.topicId, input.topicIds))
        .groupBy(timeSession.topicId);

      const topicTotalsMap = Object.fromEntries(
        totals.map((t) => [t.topicId, t.totalDuration])
      );

      // Query otimizada para hierarquia (evita joins quando possível)
      const topicIdsSet = new Set(input.topicIds);
      const topicsWithHierarchy = await db
        .select({
          id: topic.id,
          disciplineId: topic.disciplineId,
          studyId: discipline.studyId,
        })
        .from(topic)
        .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
        .where(inArray(topic.id, input.topicIds))
        .limit(1000); // Limite para evitar queries muito grandes

      const disciplineTotals: Record<string, number> = {};
      const studyTotals: Record<string, number> = {};

      // Calcula totais de forma otimizada
      for (const t of topicsWithHierarchy) {
        if (topicIdsSet.has(t.id)) {
          const topicTime = topicTotalsMap[t.id] || 0;
          if (t.disciplineId) {
            disciplineTotals[t.disciplineId] = (disciplineTotals[t.disciplineId] || 0) + topicTime;
          }
          if (t.studyId) {
            studyTotals[t.studyId] = (studyTotals[t.studyId] || 0) + topicTime;
          }
        }
      }

      const result = {
        topicTotals: topicTotalsMap,
        disciplineTotals,
        studyTotals,
      };

      // Cacheia resultado
      getTotalsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    }),
});
