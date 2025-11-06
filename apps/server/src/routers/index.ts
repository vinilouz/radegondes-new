import { protectedProcedure, publicProcedure, router, loggerMiddleware } from "../lib/trpc";
import { timerRouter } from "./timer";
import { revisionRouter } from "./revision";
import { db } from "../db";
import { study, discipline, topic, timeSession } from "../db/schema/study";
import { user } from "../db/schema/auth";
import { studyCycle, cycleDiscipline } from "../db/schema/planning";
import { eq, and, desc, asc, count, gte, sql, inArray } from "drizzle-orm";
import { z } from "zod";

export const appRouter = router({
  healthCheck: publicProcedure.use(loggerMiddleware).query(() => {
    return "OK";
  }),
  timer: timerRouter,
  revision: revisionRouter,
  privateData: protectedProcedure.use(loggerMiddleware).query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),

  // Study CRUD operations
  getStudies: protectedProcedure.use(loggerMiddleware).query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const studies = await db
      .select({
        id: study.id,
        name: study.name,
        description: study.description,
        createdAt: study.createdAt,
        disciplineCount: sql<number>`COUNT(DISTINCT ${discipline.id})`,
        topicCount: sql<number>`COUNT(DISTINCT ${topic.id})`,
      })
      .from(study)
      .leftJoin(discipline, eq(discipline.studyId, study.id))
      .leftJoin(topic, eq(topic.disciplineId, discipline.id))
      .where(eq(study.userId, userId))
      .groupBy(study.id, study.name, study.description, study.createdAt)
      .orderBy(desc(study.createdAt));

    return studies;
  }),

  createStudy: protectedProcedure.use(loggerMiddleware)
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        const { randomUUID } = await import('crypto');
        const studyId = randomUUID();

        const result = await db
          .insert(study)
          .values({
            id: studyId,
            name: input.name,
            description: input.description || null,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return result[0];
      } catch (error) {
        console.error("Database error in createStudy:", error);
        throw new Error("Failed to create study");
      }
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

  // Discipline operations
  getDisciplines: protectedProcedure
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

      const disciplines = await db
        .select({
          id: discipline.id,
          name: discipline.name,
          studyId: discipline.studyId,
          order: discipline.order,
          createdAt: discipline.createdAt,
          topicCount: count(topic.id),
        })
        .from(discipline)
        .leftJoin(topic, eq(topic.disciplineId, discipline.id))
        .where(eq(discipline.studyId, input.studyId))
        .groupBy(discipline.id, discipline.name, discipline.studyId, discipline.order, discipline.createdAt)
        .orderBy(asc(discipline.order));

      return disciplines;
    }),

  createDiscipline: protectedProcedure
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

      const { randomUUID } = await import('crypto');
      const disciplineId = randomUUID();

      await db
        .insert(discipline)
        .values({
          id: disciplineId,
          name: input.name,
          studyId: input.studyId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      return { id: disciplineId, name: input.name, studyId: input.studyId, createdAt: new Date(), updatedAt: new Date() };
    }),

  getStudy: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const studyResult = await db
        .select()
        .from(study)
        .where(eq(study.id, input.id))
        .limit(1);

      if (!studyResult.length || studyResult[0].userId !== userId) {
        throw new Error("Study not found or access denied");
      }

      return studyResult[0];
    }),

  getTopics: protectedProcedure
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

      const topics = await db
        .select()
        .from(topic)
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .where(eq(discipline.studyId, input.studyId))
        .orderBy(desc(topic.createdAt));

      return topics.map(t => t.topic);
    }),

  updateDiscipline: protectedProcedure
    .input(z.object({
      disciplineId: z.string(),
      name: z.string().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const disciplineCheck = await db
        .select({
          disciplineId: discipline.id,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(discipline)
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(discipline.id, input.disciplineId))
        .limit(1);

      if (!disciplineCheck.length || disciplineCheck[0].userId !== userId) {
        throw new Error("Discipline not found or access denied");
      }

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      updateData.updatedAt = new Date();

      const updated = await db
        .update(discipline)
        .set(updateData)
        .where(eq(discipline.id, input.disciplineId))
        .returning();

      return updated[0];
    }),

  deleteDiscipline: protectedProcedure
    .input(z.object({
      disciplineId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const disciplineCheck = await db
        .select({
          disciplineId: discipline.id,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(discipline)
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(discipline.id, input.disciplineId))
        .limit(1);

      if (!disciplineCheck.length || disciplineCheck[0].userId !== userId) {
        throw new Error("Discipline not found or access denied");
      }

      await db
        .delete(discipline)
        .where(eq(discipline.id, input.disciplineId));

      return { success: true };
    }),

  reorderDisciplines: protectedProcedure
    .input(z.object({
      disciplineOrders: z.array(z.object({
        disciplineId: z.string(),
        order: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      for (const { disciplineId, order } of input.disciplineOrders) {
        const disciplineCheck = await db
          .select({
            disciplineId: discipline.id,
            studyId: discipline.studyId,
            userId: study.userId
          })
          .from(discipline)
          .leftJoin(study, eq(discipline.studyId, study.id))
          .where(eq(discipline.id, disciplineId))
          .limit(1);

        if (!disciplineCheck.length || disciplineCheck[0].userId !== userId) {
          throw new Error("Discipline not found or access denied");
        }

        await db
          .update(discipline)
          .set({ order, updatedAt: new Date() })
          .where(eq(discipline.id, disciplineId));
      }

      return { success: true };
    }),

  createTopic: protectedProcedure
    .input(z.object({
      disciplineId: z.string(),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const disciplineCheck = await db
        .select({
          disciplineId: discipline.id,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(discipline)
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(discipline.id, input.disciplineId))
        .limit(1);

      if (!disciplineCheck.length || disciplineCheck[0].userId !== userId) {
        throw new Error("Discipline not found or access denied");
      }

      const { randomUUID } = await import('crypto');
      const topicId = randomUUID();

      await db
        .insert(topic)
        .values({
          id: topicId,
          name: input.name,
          disciplineId: input.disciplineId,
          status: "not_started",
          correct: 0,
          wrong: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      return { id: topicId, name: input.name, disciplineId: input.disciplineId, status: "not_started", correct: 0, wrong: 0, createdAt: new Date(), updatedAt: new Date() };
    }),

  updateTopic: protectedProcedure
    .input(z.object({
      topicId: z.string(),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const topicCheck = await db
        .select({
          topicId: topic.id,
          disciplineId: topic.disciplineId,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(topic)
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(topic.id, input.topicId))
        .limit(1);

      if (!topicCheck.length || topicCheck[0].userId !== userId) {
        throw new Error("Topic not found or access denied");
      }

      const updated = await db
        .update(topic)
        .set({
          name: input.name,
          updatedAt: new Date()
        })
        .where(eq(topic.id, input.topicId))
        .returning();

      return updated[0];
    }),

  deleteTopic: protectedProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const topicCheck = await db
        .select({
          topicId: topic.id,
          disciplineId: topic.disciplineId,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(topic)
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(topic.id, input.topicId))
        .limit(1);

      if (!topicCheck.length || topicCheck[0].userId !== userId) {
        throw new Error("Topic not found or access denied");
      }

      await db
        .delete(topic)
        .where(eq(topic.id, input.topicId));

      return { success: true };
    }),

  // Discipline details operations
  getDiscipline: protectedProcedure
    .input(z.object({
      disciplineId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const disciplineResult = await db
        .select({
          id: discipline.id,
          name: discipline.name,
          studyId: discipline.studyId,
          createdAt: discipline.createdAt,
        })
        .from(discipline)
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(and(eq(discipline.id, input.disciplineId), eq(study.userId, userId)))
        .limit(1);

      if (!disciplineResult.length) {
        throw new Error("Discipline not found or access denied");
      }

      return disciplineResult[0];
    }),

  getTopicsByDiscipline: protectedProcedure
    .input(z.object({
      disciplineId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const disciplineCheck = await db
        .select({
          disciplineId: discipline.id,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(discipline)
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(discipline.id, input.disciplineId))
        .limit(1);

      if (!disciplineCheck.length || disciplineCheck[0].userId !== userId) {
        throw new Error("Discipline not found or access denied");
      }

      const topics = await db
        .select()
        .from(topic)
        .where(eq(topic.disciplineId, input.disciplineId))
        .orderBy(asc(topic.order));

      return topics;
    }),

  // Time session operations
  getTimeSessionsByTopic: protectedProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const topicCheck = await db
        .select({
          topicId: topic.id,
          disciplineId: topic.disciplineId,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(topic)
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(topic.id, input.topicId))
        .limit(1);

      if (!topicCheck.length || topicCheck[0].userId !== userId) {
        throw new Error("Topic not found or access denied");
      }

      const sessions = await db
        .select()
        .from(timeSession)
        .where(eq(timeSession.topicId, input.topicId))
        .orderBy(desc(timeSession.startTime));

      return sessions;
    }),

  createTimeSession: protectedProcedure
    .input(z.object({
      topicId: z.string(),
      sessionType: z.enum(["study", "review", "practice"]).default("study"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const topicCheck = await db
        .select({
          topicId: topic.id,
          disciplineId: topic.disciplineId,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(topic)
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(topic.id, input.topicId))
        .limit(1);

      if (!topicCheck.length || topicCheck[0].userId !== userId) {
        throw new Error("Topic not found or access denied");
      }

      const { randomUUID } = await import('crypto');
      const sessionId = randomUUID();

      const result = await db
        .insert(timeSession)
        .values({
          id: sessionId,
          topicId: input.topicId,
          startTime: new Date(),
          sessionType: input.sessionType,
          duration: 0,
          createdAt: new Date(),
        })
        .returning();

      return result[0];
    }),

  updateTimeSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      endTime: z.date().optional(),
      duration: z.number().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const sessionCheck = await db
        .select({
          sessionId: timeSession.id,
          topicId: timeSession.topicId,
          disciplineId: topic.disciplineId,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(timeSession)
        .leftJoin(topic, eq(timeSession.topicId, topic.id))
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(timeSession.id, input.sessionId))
        .limit(1);

      if (!sessionCheck.length || sessionCheck[0].userId !== userId) {
        throw new Error("Session not found or access denied");
      }

      const updateData: any = {};
      if (input.endTime) updateData.endTime = input.endTime;
      if (input.duration !== undefined) updateData.duration = input.duration;

      const updated = await db
        .update(timeSession)
        .set(updateData)
        .where(eq(timeSession.id, input.sessionId))
        .returning();

      return updated[0];
    }),

  updateTopicProgress: protectedProcedure
    .input(z.object({
      topicId: z.string(),
      status: z.enum(["not_started", "completed"]).optional(),
      correct: z.number().min(0).optional(),
      wrong: z.number().min(0).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const topicCheck = await db
        .select({
          topicId: topic.id,
          disciplineId: topic.disciplineId,
          studyId: discipline.studyId,
          userId: study.userId
        })
        .from(topic)
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(eq(topic.id, input.topicId))
        .limit(1);

      if (!topicCheck.length || topicCheck[0].userId !== userId) {
        throw new Error("Topic not found or access denied");
      }

      const updateData: any = { updatedAt: new Date() };
      if (input.status !== undefined) updateData.status = input.status;
      if (input.correct !== undefined) updateData.correct = input.correct;
      if (input.wrong !== undefined) updateData.wrong = input.wrong;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const updated = await db
        .update(topic)
        .set(updateData)
        .where(eq(topic.id, input.topicId))
        .returning();

      return updated[0];
    }),

  reorderTopics: protectedProcedure
    .input(z.object({
      topicOrders: z.array(z.object({
        topicId: z.string(),
        order: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      for (const { topicId, order } of input.topicOrders) {
        const topicCheck = await db
          .select({
            topicId: topic.id,
            disciplineId: topic.disciplineId,
            studyId: discipline.studyId,
            userId: study.userId
          })
          .from(topic)
          .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
          .leftJoin(study, eq(discipline.studyId, study.id))
          .where(eq(topic.id, topicId))
          .limit(1);

        if (!topicCheck.length || topicCheck[0].userId !== userId) {
          throw new Error("Topic not found or access denied");
        }

        await db
          .update(topic)
          .set({ order, updatedAt: new Date() })
          .where(eq(topic.id, topicId));
      }

      return { success: true };
    }),

  getUserSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const userResult = await db
        .select({
          dailyStudyHours: user.dailyStudyHours,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userResult.length) {
        throw new Error("User not found");
      }

      return userResult[0];
    }),

  updateUserSettings: protectedProcedure
    .input(z.object({
      dailyStudyHours: z.number().min(1).max(24),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updated = await db
        .update(user)
        .set({
          dailyStudyHours: input.dailyStudyHours,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning({
          dailyStudyHours: user.dailyStudyHours,
        });

      return updated[0];
    }),

  getTodayDisciplines: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sessions = await db
        .select({
          disciplineName: discipline.name,
          duration: timeSession.duration,
          startTime: timeSession.startTime,
        })
        .from(timeSession)
        .leftJoin(topic, eq(timeSession.topicId, topic.id))
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(and(
          eq(study.userId, userId),
          gte(timeSession.startTime, today)
        ))
        .orderBy(desc(timeSession.startTime));

      const disciplineMap: Record<string, { name: string; time: number; sessions: number }> = {};

      sessions.forEach(session => {
        const name = session.disciplineName || 'Sem disciplina';
        if (!disciplineMap[name]) {
          disciplineMap[name] = { name, time: 0, sessions: 0 };
        }
        disciplineMap[name].time += session.duration;
        disciplineMap[name].sessions += 1;
      });

      return Object.values(disciplineMap).sort((a, b) => b.time - a.time);
    }),

  getStudyStatistics: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(10000).default(30),
    }))
    .query(async ({ ctx, input }) => {
      console.log('=== DEBUG getStudyStatistics ===');
      console.log('UserId:', ctx.session.user.id);
      console.log('Days:', input.days);

      const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

      const toSaoPauloDateString = (date: Date): string => {
        return new Date(date.toLocaleString('en-US', { timeZone: SAO_PAULO_TIMEZONE }))
          .toISOString().split('T')[0];
      };

      const getSaoPauloHour = (date: Date): number => {
        return parseInt(new Date(date.toLocaleString('en-US', { timeZone: SAO_PAULO_TIMEZONE }))
          .toTimeString().split(':')[0]);
      };

      const getSaoPauloDayOfWeek = (date: Date): number => {
        return new Date(date.toLocaleString('en-US', { timeZone: SAO_PAULO_TIMEZONE })).getDay();
      };

      const userId = ctx.session.user.id;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);

      // Buscar sessões dos últimos N dias
      const sessions = await db
        .select({
          date: timeSession.startTime,
          duration: timeSession.duration,
          topicId: timeSession.topicId,
          topicName: topic.name,
          disciplineName: discipline.name,
        })
        .from(timeSession)
        .leftJoin(topic, eq(timeSession.topicId, topic.id))
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(and(
          eq(study.userId, userId),
          gte(timeSession.startTime, daysAgo)
        ))
        .orderBy(desc(timeSession.startTime));

      console.log('Sessions found:', sessions.length);
      console.log('Sample sessions:', sessions.slice(0, 3));

      // Buscar desempenho dos tópicos atualizados no período
      const topicPerformance = await db
        .select({
          date: topic.updatedAt,
          correct: topic.correct,
          wrong: topic.wrong,
          topicId: topic.id,
          topicName: topic.name,
          disciplineName: discipline.name,
        })
        .from(topic)
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .where(and(
          eq(study.userId, userId),
          gte(topic.updatedAt, daysAgo)
        ))
        .orderBy(desc(topic.updatedAt));

      console.log('Topic performance records:', topicPerformance.length);

      // Agrupar por data para gráfico - combinar tempo de estudo e desempenho
      const dailyData: Record<string, { duration: number; correct: number; wrong: number }> = {};

      // Agrupar sessões por data
      sessions.forEach(session => {
        const date = toSaoPauloDateString(session.date);
        if (!dailyData[date]) {
          dailyData[date] = { duration: 0, correct: 0, wrong: 0 };
        }
        dailyData[date].duration += session.duration;
      });

      // Agrupar desempenho por data
      topicPerformance.forEach(perf => {
        const date = toSaoPauloDateString(perf.date);
        if (!dailyData[date]) {
          dailyData[date] = { duration: 0, correct: 0, wrong: 0 };
        }
        dailyData[date].correct += perf.correct;
        dailyData[date].wrong += perf.wrong;
      });

      // Calcular streak de dias estudando
      let currentStreak = 0;
      const today = new Date();
      for (let i = 0; i < input.days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = toSaoPauloDateString(date);

        if (dailyData[dateStr] && dailyData[dateStr].duration > 0) {
          currentStreak++;
        } else if (i === 0) {
          // Se hoje não estudou, verifica ontem
          continue;
        } else {
          break;
        }
      }

      // Análise de horários mais produtivos
      const hourlyStats: Record<number, number> = {};
      sessions.forEach(session => {
        const hour = getSaoPauloHour(session.date);
        hourlyStats[hour] = (hourlyStats[hour] || 0) + session.duration;
      });

      const mostProductiveHour = Object.entries(hourlyStats)
        .sort(([,a], [,b]) => b - a)[0]?.[0];

      // Estatísticas por disciplina
      const disciplineStats: Record<string, { time: number, sessions: number, correct: number, wrong: number }> = {};
      sessions.forEach(session => {
        const discipline = session.disciplineName || 'Sem disciplina';
        if (!disciplineStats[discipline]) {
          disciplineStats[discipline] = { time: 0, sessions: 0, correct: 0, wrong: 0 };
        }
        disciplineStats[discipline].time += session.duration;
        disciplineStats[discipline].sessions += 1;
      });

      // Agregar desempenho por disciplina
      topicPerformance.forEach(perf => {
        const discipline = perf.disciplineName || 'Sem disciplina';
        if (!disciplineStats[discipline]) {
          disciplineStats[discipline] = { time: 0, sessions: 0, correct: 0, wrong: 0 };
        }
        disciplineStats[discipline].correct += perf.correct;
        disciplineStats[discipline].wrong += perf.wrong;
      });

      // Matriz de calor: dias da semana x horas do dia
      const weekHourMatrix: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
      const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      sessions.forEach(session => {
        const dayOfWeek = getSaoPauloDayOfWeek(session.date);
        const hour = getSaoPauloHour(session.date);
        weekHourMatrix[dayOfWeek][hour] += session.duration;
      });

      const result = {
        dailyData: Object.entries(dailyData).map(([date, data]) => {
          const performance = data.correct + data.wrong > 0
            ? Math.round((data.correct / (data.correct + data.wrong)) * 100)
            : 0;
          return {
            date,
            duration: data.duration,
            performance,
            questions: data.correct + data.wrong,
            correct: data.correct,
            wrong: data.wrong,
          };
        }),
        totalTime: sessions.reduce((sum, s) => sum + s.duration, 0),
        totalSessions: sessions.length,
        averageSessionTime: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0,
        currentStreak,
        mostProductiveHour: mostProductiveHour ? parseInt(mostProductiveHour) : null,
        disciplineStats: Object.entries(disciplineStats).map(([name, stats]) => ({
          name,
          ...stats,
        })).sort((a, b) => b.time - a.time),
        weekHourMatrix: weekHourMatrix.map((day, dayIndex) => ({
          day: weekDays[dayIndex],
          hours: day.map((duration, hourIndex) => ({
            hour: hourIndex,
            duration: duration,
            minutes: Math.round(duration / 1000 / 60 * 10) / 10
          }))
        }))
      };

      console.log('=== FINAL RESULT ===');
      console.log('Total sessions:', result.totalSessions);
      console.log('Average session time (ms):', result.averageSessionTime);
      console.log('Average session time (min):', result.averageSessionTime / 1000 / 60);
      console.log('Total time (ms):', result.totalTime);
      console.log('Sample daily data:', result.dailyData.slice(0, 3));

      return result;
    }),

  // Planning endpoints
  createStudyCycle: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      disciplines: z.array(z.object({
        disciplineId: z.string(),
        importance: z.number().min(1).max(5),
        knowledge: z.number().min(1).max(5),
      })),
      hoursPerWeek: z.number().min(1).max(40),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { randomUUID } = await import('crypto');

      const cycleId = randomUUID();

      const newCycle = await db
        .insert(studyCycle)
        .values({
          id: cycleId,
          name: input.name,
          userId,
          hoursPerWeek: input.hoursPerWeek,
          studyDays: "1,2,3,4,5",
          minSessionDuration: 30,
          maxSessionDuration: 90,
          startedAt: new Date(),
        })
        .returning();

      for (const disc of input.disciplines) {
        await db
          .insert(cycleDiscipline)
          .values({
            id: randomUUID(),
            cycleId,
            disciplineId: disc.disciplineId,
            importance: disc.importance,
            knowledge: disc.knowledge,
          });
      }

      return newCycle[0];
    }),

  updateStudyCycle: protectedProcedure
    .input(z.object({
      cycleId: z.string(),
      name: z.string().min(1),
      disciplines: z.array(z.object({
        disciplineId: z.string(),
        importance: z.number().min(1).max(5),
        knowledge: z.number().min(1).max(5),
      })),
      hoursPerWeek: z.number().min(1).max(40),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { randomUUID } = await import('crypto');

      const cycleCheck = await db
        .select()
        .from(studyCycle)
        .where(and(eq(studyCycle.id, input.cycleId), eq(studyCycle.userId, userId)))
        .limit(1);

      if (!cycleCheck.length) {
        throw new Error("Cycle not found or access denied");
      }

      await db
        .update(studyCycle)
        .set({
          name: input.name,
          hoursPerWeek: input.hoursPerWeek,
          updatedAt: new Date(),
        })
        .where(eq(studyCycle.id, input.cycleId));

      await db.delete(cycleDiscipline).where(eq(cycleDiscipline.cycleId, input.cycleId));

      for (const disc of input.disciplines) {
        await db
          .insert(cycleDiscipline)
          .values({
            id: randomUUID(),
            cycleId: input.cycleId,
            disciplineId: disc.disciplineId,
            importance: disc.importance,
            knowledge: disc.knowledge,
          });
      }

      const updatedCycle = await db
        .select()
        .from(studyCycle)
        .where(eq(studyCycle.id, input.cycleId))
        .limit(1);

      return updatedCycle[0];
    }),

  getCycles: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const cycles = await db
        .select({
          id: studyCycle.id,
          name: studyCycle.name,
          hoursPerWeek: studyCycle.hoursPerWeek,
          studyDays: studyCycle.studyDays,
          minSessionDuration: studyCycle.minSessionDuration,
          maxSessionDuration: studyCycle.maxSessionDuration,
          startedAt: studyCycle.startedAt,
          createdAt: studyCycle.createdAt,
          disciplineCount: count(cycleDiscipline.id),
        })
        .from(studyCycle)
        .leftJoin(cycleDiscipline, eq(studyCycle.id, cycleDiscipline.cycleId))
        .where(eq(studyCycle.userId, userId))
        .groupBy(studyCycle.id, studyCycle.name, studyCycle.hoursPerWeek,
                studyCycle.studyDays, studyCycle.minSessionDuration, studyCycle.maxSessionDuration,
                studyCycle.startedAt, studyCycle.createdAt)
        .orderBy(desc(studyCycle.createdAt));

      return cycles;
    }),

  getCycleDetails: protectedProcedure
    .input(z.object({ cycleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const cycleCheck = await db
        .select()
        .from(studyCycle)
        .where(and(eq(studyCycle.id, input.cycleId), eq(studyCycle.userId, userId)))
        .limit(1);

      if (!cycleCheck.length) {
        throw new Error("Cycle not found or access denied");
      }

      const cycle = cycleCheck[0];

      const cycleDisciplines = await db
        .select({
          id: cycleDiscipline.disciplineId,
          disciplineId: cycleDiscipline.disciplineId,
          studyId: discipline.studyId,
          importance: cycleDiscipline.importance,
          knowledge: cycleDiscipline.knowledge,
          disciplineName: discipline.name,
          topicCount: count(topic.id),
        })
        .from(cycleDiscipline)
        .leftJoin(discipline, eq(cycleDiscipline.disciplineId, discipline.id))
        .leftJoin(topic, eq(discipline.id, topic.disciplineId))
        .where(eq(cycleDiscipline.cycleId, input.cycleId))
        .groupBy(cycleDiscipline.disciplineId, discipline.studyId, cycleDiscipline.importance,
                cycleDiscipline.knowledge, discipline.name);

      return {
        cycle,
        disciplines: cycleDisciplines,
      };
    }),

  deleteCycle: protectedProcedure
    .input(z.object({ cycleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const cycleCheck = await db
        .select()
        .from(studyCycle)
        .where(and(eq(studyCycle.id, input.cycleId), eq(studyCycle.userId, userId)))
        .limit(1);

      if (!cycleCheck.length) {
        throw new Error("Cycle not found or access denied");
      }

      await db.delete(cycleDiscipline).where(eq(cycleDiscipline.cycleId, input.cycleId));
      await db.delete(studyCycle).where(eq(studyCycle.id, input.cycleId));

      return { success: true };
    }),

  getTopicsWithUsage: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      // Buscar todos os tópicos com estatísticas de uso
      const topics = await db
        .select({
          id: topic.id,
          name: topic.name,
          disciplineId: topic.disciplineId,
          disciplineName: discipline.name,
          totalStudyTime: sql<number>`COALESCE(SUM(${timeSession.duration}), 0)`,
          sessionCount: count(timeSession.id)
        })
        .from(topic)
        .leftJoin(discipline, eq(topic.disciplineId, discipline.id))
        .leftJoin(study, eq(discipline.studyId, study.id))
        .leftJoin(timeSession, eq(topic.id, timeSession.topicId))
        .where(eq(study.userId, userId))
        .groupBy(topic.id, topic.name, topic.disciplineId, discipline.name)
        .orderBy(desc(sql`COALESCE(SUM(${timeSession.duration}), 0)`));

      // Converter tempo de estudo para formato correto (já está em ms, só garantir que não seja null/undefined)
      const formattedTopics = topics.map(topic => ({
        ...topic,
        totalStudyTime: topic.totalStudyTime || 0,
        sessionCount: topic.sessionCount || 0
      }));

      return formattedTopics;
    }),

  getDisciplinesWithTopicCount: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const disciplines = await db
        .select({
          id: discipline.id,
          name: discipline.name,
          studyId: discipline.studyId,
          topicCount: count(topic.id),
        })
        .from(discipline)
        .leftJoin(study, eq(discipline.studyId, study.id))
        .leftJoin(topic, eq(discipline.id, topic.disciplineId))
        .where(eq(study.userId, userId))
        .groupBy(discipline.id, discipline.name, discipline.studyId)
        .orderBy(desc(discipline.name));

      return disciplines;
    }),

  getCycleWeeklyStudyTime: protectedProcedure
    .input(z.object({ cycleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const cycleCheck = await db
        .select()
        .from(studyCycle)
        .where(and(eq(studyCycle.id, input.cycleId), eq(studyCycle.userId, userId)))
        .limit(1);

      if (!cycleCheck.length) {
        throw new Error("Cycle not found or access denied");
      }

      const cycleDisciplines = await db
        .select({ disciplineId: cycleDiscipline.disciplineId })
        .from(cycleDiscipline)
        .where(eq(cycleDiscipline.cycleId, input.cycleId));

      const disciplineIds = cycleDisciplines.map(cd => cd.disciplineId);

      if (disciplineIds.length === 0) {
        return { totalTime: 0 };
      }

      const topicsInCycle = await db
        .select({ topicId: topic.id })
        .from(topic)
        .where(inArray(topic.disciplineId, disciplineIds));

      const topicIds = topicsInCycle.map(t => t.topicId);

      if (topicIds.length === 0) {
        return { totalTime: 0 };
      }

      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const weeklyTime = await db
        .select({
          totalTime: sql<number>`COALESCE(SUM(${timeSession.duration}), 0)`.mapWith(Number),
        })
        .from(timeSession)
        .where(and(
          inArray(timeSession.topicId, topicIds),
          gte(timeSession.startTime, startOfWeek)
        ));

      return { totalTime: weeklyTime[0]?.totalTime || 0 };
    }),
});

export type AppRouter = typeof appRouter;