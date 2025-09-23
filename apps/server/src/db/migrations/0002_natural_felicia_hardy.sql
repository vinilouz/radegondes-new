ALTER TABLE "user" ADD COLUMN "daily_study_hours" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "discipline" ADD COLUMN "estimated_hours" integer DEFAULT 1 NOT NULL;