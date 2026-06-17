CREATE TABLE "status_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"online" boolean NOT NULL,
	"players_current" integer,
	"players_max" integer,
	"ping" integer,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "status_snapshots_slug_checked_idx" ON "status_snapshots" USING btree ("slug","checked_at");