import { protectedProcedure, router } from "../lib/trpc";
import { db } from "../db";
import { timeSession, topic, discipline, study } from "../db/schema/study";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";

export const timerRouter = router({
  // Inicia sessão
  startSession: protectedProcedure
    .input(
      z.object({
        topicId: z.string(),
        sessionId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Verifica acesso ao tópico
      const topicCheck = await db
        .select({ id: topic.id })
        .from(topic)
        .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
        .innerJoin(study, eq(discipline.studyId, study.id))
        .where(and(eq(topic.id, input.topicId), eq(study.userId, userId)));

      if (topicCheck.length === 0) {
        throw new Error("Topic not found or access denied");
      }

      // Cria sessão com duration 0
      const result = await db
        .insert(timeSession)
        .values({
          id: input.sessionId,
          topicId: input.topicId,
          startTime: new Date(),
          duration: 0,
          sessionType: "study",
        })
        .returning();
        
      return result[0];
    }),

  // Para sessão com duração TOTAL
  stopSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        duration: z.number().int().min(0).max(86400000), // Duração em MILISSEGUNDOS (ms) - Max 24h
      })
    )
    .mutation(async ({ input }) => {
      // Atualiza sessão com duração FINAL e endTime
      const result = await db
        .update(timeSession)
        .set({
          endTime: new Date(),
          duration: input.duration, // Duration TOTAL em MILISSEGUNDOS, não incremental
        })
        .where(eq(timeSession.id, input.sessionId))
        .returning();
        
      if (result.length === 0) {
        console.warn('Session not found:', input.sessionId);
        return null;
      }
      
      return result[0];
    }),

  // Heartbeat opcional (não crítico)
  heartbeat: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        deltaMs: z.number().int().min(0), // Duração em MILISSEGUNDOS (ms)
      })
    )
    .mutation(async ({ input }) => {
      // Atualiza duration com o valor total recebido
      // (não soma, apenas sobrescreve com o valor mais recente)
      await db
        .update(timeSession)
        .set({
          duration: input.deltaMs, // Sobrescreve com valor total em MILISSEGUNDOS
        })
        .where(eq(timeSession.id, input.sessionId));
        
      return { success: true };
    }),

  updateSessionDuration: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      duration: z.number().int().min(0).max(86400000), // Duração em MILISSEGUNDOS (ms) - Max 24h
    }))
    .mutation(async ({ ctx, input }) => {
      const sessionCheck = await db
        .select({ id: timeSession.id })
        .from(timeSession)
        .innerJoin(topic, eq(timeSession.topicId, topic.id))
        .innerJoin(discipline, eq(topic.disciplineId, discipline.id))
        .innerJoin(study, eq(discipline.studyId, study.id))
        .where(and(
          eq(timeSession.id, input.sessionId),
          eq(study.userId, ctx.session.user.id)
        ));

      if (!sessionCheck.length) throw new Error("Session not found or access denied");

      const result = await db
        .update(timeSession)
        .set({ duration: input.duration })
        .where(eq(timeSession.id, input.sessionId))
        .returning();

      return result[0];
    }),

  // Busca totais
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

      // Busca soma de TODAS as sessões (finalizadas ou não)
      const totals = await db
        .select({
          topicId: timeSession.topicId,
          totalDuration: sql<number>`COALESCE(SUM(${timeSession.duration}), 0)`.mapWith(Number),
        })
        .from(timeSession)
        .where(inArray(timeSession.topicId, input.topicIds))
        .groupBy(timeSession.topicId);

      const topicTotals = Object.fromEntries(
        totals.map((t) => [t.topicId, t.totalDuration])
      );

      // Para disciplinas e estudos, apenas retorna vazio por enquanto
      return {
        topicTotals,
        disciplineTotals: {},
        studyTotals: {},
      };
    }),

  // Limpa sessões com duração 0 (endpoint de manutenção)
  cleanupZeroDurationSessions: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      // Exclui todas as sessões com duração 0 do usuário
      const deletedCount = await db
        .delete(timeSession)
        .where(and(
          eq(timeSession.duration, 0),
          sql`${timeSession.id} IN (
            SELECT ${timeSession.id}
            FROM ${timeSession}
            INNER JOIN ${topic} ON ${timeSession.topicId} = ${topic.id}
            INNER JOIN ${discipline} ON ${topic.disciplineId} = ${discipline.id}
            INNER JOIN ${study} ON ${discipline.studyId} = ${study.id}
            WHERE ${study.userId} = ${userId}
          )`
        ));

      return {
        deletedCount: deletedCount,
        message: `Foram removidas ${deletedCount} sessões com duração 0`
      };
    }),
  });