import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const studyCycle = pgTable("study_cycle", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  hoursPerWeek: integer("hours_per_week").notNull().default(10),
  studyDays: text("study_days").notNull().default("1,2,3,4,5"), // 0=domingo, 1=segunda, etc
  minSessionDuration: integer("min_session_duration").notNull().default(30), // minutos
  maxSessionDuration: integer("max_session_duration").notNull().default(120), // minutos
  startedAt: timestamp("started_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cycleDiscipline = pgTable("cycle_discipline", {
  id: text("id").primaryKey(),
  cycleId: text("cycle_id")
    .notNull()
    .references(() => studyCycle.id, { onDelete: "cascade" }),
  disciplineId: text("discipline_id")
    .notNull()
    .references(() => (require("./study")).discipline.id, { onDelete: "cascade" }),
  importance: integer("importance").notNull().default(3), // 1-5
  knowledge: integer("knowledge").notNull().default(3), // 1-5 (5 = mais conhecimento)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  idxCycleId: index("idx_cycle_discipline_cycle_id").on(table.cycleId),
  idxDisciplineId: index("idx_cycle_discipline_discipline_id").on(table.disciplineId),
}));