CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"service" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"size" bigint NOT NULL,
	"content_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "pricing_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"price_ngn" text DEFAULT '' NOT NULL,
	"price_usd" text DEFAULT '' NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image" text,
	"link" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"company_name" text DEFAULT 'Sholab Dex Tech' NOT NULL,
	"ceo_name" text DEFAULT 'Natlus Niel' NOT NULL,
	"ceo_title" text DEFAULT 'CEO & Founder' NOT NULL,
	"ceo_bio" text DEFAULT '' NOT NULL,
	"ceo_photo" text,
	"email" text DEFAULT 'solabiwonderful09@gmail.com' NOT NULL,
	"phone" text DEFAULT '+2348169781185' NOT NULL,
	"whatsapp_number" text DEFAULT '2348169781185' NOT NULL,
	"business_hours" text DEFAULT 'Monday – Saturday, 8:00 AM – 8:00 PM (WAT)' NOT NULL,
	"socials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hero_headline" text DEFAULT 'Sholab Dex Tech' NOT NULL,
	"hero_tagline" text DEFAULT 'We Build Websites, Automate Businesses, and Grow Brands.' NOT NULL,
	"hero_intro" text DEFAULT '' NOT NULL,
	"hero_cta_primary" text DEFAULT 'Get a Free Quote' NOT NULL,
	"hero_cta_secondary" text DEFAULT 'Chat on WhatsApp' NOT NULL,
	"hero_image" text,
	"about_heading" text DEFAULT 'About Sholab Dex Tech' NOT NULL,
	"about_body" text DEFAULT '' NOT NULL,
	"mission" text DEFAULT '' NOT NULL,
	"vision" text DEFAULT '' NOT NULL,
	"why_choose_us" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"process_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pricing_note" text DEFAULT '' NOT NULL,
	"footer_description" text DEFAULT '' NOT NULL,
	"footer_copyright" text DEFAULT '© 2026 Sholab Dex Tech. All rights reserved.' NOT NULL,
	"footer_credit" text DEFAULT 'Designed by Sholab Dex Tech' NOT NULL,
	"seo_title" text DEFAULT 'Sholab Dex Tech | Websites, AI Automation & Business Promotions' NOT NULL,
	"seo_description" text DEFAULT '' NOT NULL,
	"seo_keywords" text DEFAULT '' NOT NULL,
	"seo_og_image" text,
	"logo" text,
	"favicon" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_name" text NOT NULL,
	"business_name" text DEFAULT '' NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"review_text" text DEFAULT '' NOT NULL,
	"photo" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_created_idx" ON "contact_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "files_owner_idx" ON "files" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "files_created_idx" ON "files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pricing_category_idx" ON "pricing_packages" USING btree ("category","sort_order");--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category","sort_order");--> statement-breakpoint
CREATE INDEX "services_category_idx" ON "services" USING btree ("category","sort_order");