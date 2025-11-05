CREATE TABLE "cycle_session" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"actual_duration" integer DEFAULT 0 NOT NULL,
	"time_session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycle_topic" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"importance" integer DEFAULT 3 NOT NULL,
	"knowledge" integer DEFAULT 3 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"required_time" integer DEFAULT 0 NOT NULL,
	"completed_time" integer DEFAULT 0 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_cycle" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"hours_per_week" integer DEFAULT 10 NOT NULL,
	"study_days" text DEFAULT '1,2,3,4,5' NOT NULL,
	"min_session_duration" integer DEFAULT 30 NOT NULL,
	"max_session_duration" integer DEFAULT 120 NOT NULL,
	"total_required_time" integer DEFAULT 0 NOT NULL,
	"completed_time" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revision" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discipline" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cycle_session" ADD CONSTRAINT "cycle_session_cycle_id_study_cycle_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."study_cycle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_session" ADD CONSTRAINT "cycle_session_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_topic" ADD CONSTRAINT "cycle_topic_cycle_id_study_cycle_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."study_cycle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_topic" ADD CONSTRAINT "cycle_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_cycle" ADD CONSTRAINT "study_cycle_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision" ADD CONSTRAINT "revision_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cycle_session_cycle_id" ON "cycle_session" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_session_topic_id" ON "cycle_session" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_session_scheduled_date" ON "cycle_session" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_cycle_session_status" ON "cycle_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cycle_topic_cycle_id" ON "cycle_topic" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_topic_topic_id" ON "cycle_topic" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_topic_priority" ON "cycle_topic" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_revision_topic_id" ON "revision" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_revision_scheduled_date" ON "revision" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_revision_topic_id_scheduled_date" ON "revision" USING btree ("topic_id","scheduled_date");--> statement-breakpoint
ALTER TABLE "discipline" DROP COLUMN "estimated_hours";