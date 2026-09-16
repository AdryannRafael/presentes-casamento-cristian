CREATE TABLE "convidado" (
	"id" text PRIMARY KEY,
	"messagem" text NOT NULL,
	"user_id" text NOT NULL,
	"presente_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presente" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"price" numeric NOT NULL,
	"image" text NOT NULL,
	"quantidade_total" numeric NOT NULL,
	"quantidade_reservada" numeric NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"numero" text NOT NULL UNIQUE,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "convidado" ADD CONSTRAINT "convidado_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "convidado" ADD CONSTRAINT "convidado_presente_id_presente_id_fkey" FOREIGN KEY ("presente_id") REFERENCES "presente"("id") ON DELETE CASCADE;