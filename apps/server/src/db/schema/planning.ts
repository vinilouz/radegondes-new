import { pgTable, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const studyCycle = pgTable("study_cycle", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"), // active, completed, paused
  hoursPerWeek: integer("hours_per_week").notNull().default(10),
  studyDays: text("study_days").notNull().default("1,2,3,4,5"), // 0=domingo, 1=segunda, etc
  minSessionDuration: integer("min_session_duration").notNull().default(30), // minutos
  maxSessionDuration: integer("max_session_duration").notNull().default(120), // minutos
  totalRequiredTime: integer("total_required_time").notNull().default(0), // milissegundos totais
  completedTime: integer("completed_time").notNull().default(0), // milissegundos completos
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cycleTopic = pgTable("cycle_topic", {
  id: text("id").primaryKey(),
  cycleId: text("cycle_id")
    .notNull()
    .references(() => studyCycle.id, { onDelete: "cascade" }),
  topicId: text("topic_id")
    .notNull()
    .references(() => (require("./study")).topic.id, { onDelete: "cascade" }),
  importance: integer("importance").notNull().default(3), // 1-5
  knowledge: integer("knowledge").notNull().default(3), // 1-5 (5 = mais conhecimento)
  priority: integer("priority").notNull().default(0), // calculado: (importance * 2) + (5 - knowledge)
  requiredTime: integer("required_time").notNull().default(0), // minutos necessários para este tópico
  completedTime: integer("completed_time").notNull().default(0), // milissegundos estudados neste tópico
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  idxCycleId: index("idx_cycle_topic_cycle_id").on(table.cycleId),
  idxTopicId: index("idx_cycle_topic_topic_id").on(table.topicId),
  idxPriority: index("idx_cycle_topic_priority").on(table.priority),
}));

export const cycleSession = pgTable("cycle_session", {
  id: text("id").primaryKey(),
  cycleId: text("cycle_id")
    .notNull()
    .references(() => studyCycle.id, { onDelete: "cascade" }),
  topicId: text("topic_id")
    .notNull()
    .references(() => (require("./study")).topic.id, { onDelete: "cascade" }),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull().default(0), // minutos agendados
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, skipped
  actualDuration: integer("actual_duration").notNull().default(0), // minutos reais estudados
  timeSessionId: text("time_session_id"), // referência para a sessão real de estudo
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  idxCycleId: index("idx_cycle_session_cycle_id").on(table.cycleId),
  idxTopicId: index("idx_cycle_session_topic_id").on(table.topicId),
  idxScheduledDate: index("idx_cycle_session_scheduled_date").on(table.scheduledDate),
  idxStatus: index("idx_cycle_session_status").on(table.status),
}));