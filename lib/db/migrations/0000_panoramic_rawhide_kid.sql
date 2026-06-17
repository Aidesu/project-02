CREATE TABLE "server_downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"label" text NOT NULL,
	"file" text,
	"url" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "server_mods" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"required" boolean DEFAULT false NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"game_id" text NOT NULL,
	"summary" text NOT NULL,
	"description" text,
	"query_host" text,
	"query_port" integer,
	"connect" text,
	"proxmox_node" text,
	"proxmox_vmid" integer,
	"proxmox_type" text,
	"started_at" date NOT NULL,
	"ended_at" date,
	"archived" boolean DEFAULT false NOT NULL,
	"current" boolean DEFAULT false NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "servers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "server_downloads" ADD CONSTRAINT "server_downloads_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_mods" ADD CONSTRAINT "server_mods_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;