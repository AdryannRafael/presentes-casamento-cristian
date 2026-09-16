ALTER TABLE "presente" ADD COLUMN "category" varchar(250) NOT NULL;--> statement-breakpoint
ALTER TABLE "convidado" ALTER COLUMN "messagem" SET DATA TYPE varchar(250) USING "messagem"::varchar(250);--> statement-breakpoint
ALTER TABLE "presente" ALTER COLUMN "name" SET DATA TYPE varchar(250) USING "name"::varchar(250);