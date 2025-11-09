CREATE TYPE "public"."unit" AS ENUM('m²', 'm³', 'kg', 'ton', 'liter', 'gallon', 'bag', 'quintal', 'piece', 'roll', 'sheet', 'bundle', 'foot (ft)', 'inch (in)', 'lm', 'Per Point', 'Per hour', 'Per day', 'Per week', 'Per month', 'Per shift', 'Per project (lumpsum)');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type_id" text,
	"address" text,
	"user_id" text,
	"logo_url" text,
	"email" text,
	"phone" text,
	"location" text,
	"description" text,
	"website" text,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"company_type" text
);
--> statement-breakpoint
CREATE TABLE "company_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "company_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "item_category" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"parent_id" text
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company_id" text,
	"user_id" text,
	"category_id" text,
	"price" real,
	"unit" "unit",
	"description" text,
	"image_urls" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text,
	"description" text NOT NULL,
	"company_id" text,
	"user_id" text,
	"location" text,
	"salary" text,
	"type" text,
	"position" text,
	"experience" text,
	"required_skills" jsonb,
	"qualifications" text,
	"how_to_apply" text,
	"additional_notes" text,
	"application_link" text,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"region" text
);
--> statement-breakpoint
CREATE TABLE "rfq" (
	"id" text PRIMARY KEY NOT NULL,
	"item_name" text NOT NULL,
	"company_id" text,
	"user_id" text,
	"quantity" integer,
	"unit" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "units_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"company" text,
	"bio" text,
	"location" text,
	"profile_picture_url" text,
	"role" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_type_id_company_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."company_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_category" ADD CONSTRAINT "item_category_parent_id_item_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."item_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_item_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;