import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const study = pgTable("study", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const module = pgTable("module", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	studyId: text("study_id")
		.notNull()
		.references(() => study.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const topic = pgTable("topic", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	moduleId: text("module_id")
		.notNull()
		.references(() => module.id, { onDelete: "cascade" }),
	status: text("status").notNull().default("not_started"),
	notes: text("notes"),
	correct: integer("correct").notNull().default(0),
	wrong: integer("wrong").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const timeSession = pgTable("time_session", {
	id: text("id").primaryKey(),
	topicId: text("topic_id")
		.notNull()
		.references(() => topic.id, { onDelete: "cascade" }),
	startTime: timestamp("start_time").notNull().defaultNow(),
	endTime: timestamp("end_time"),
	duration: integer("duration").notNull().default(0),
	sessionType: text("session_type").notNull().default("study"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});