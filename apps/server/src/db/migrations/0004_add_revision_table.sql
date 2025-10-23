CREATE TABLE IF NOT EXISTS "revision" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "revision" ADD CONSTRAINT "revision_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "topic"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "idx_revision_topic_id" ON "revision" ("topic_id");
CREATE INDEX IF NOT EXISTS "idx_revision_scheduled_date" ON "revision" ("scheduled_date");
CREATE INDEX IF NOT EXISTS "idx_revision_topic_id_scheduled_date" ON "revision" ("topic_id","scheduled_date");
