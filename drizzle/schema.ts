import { pgTable, uuid, text, timestamp, index, bigint, integer, boolean, jsonb } from "drizzle-orm/pg-core";

// SYSTEM TABLE — managed by the scaffold. Do not redefine auth columns.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// SYSTEM TABLE — written by server/_core/storage.ts.
export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    contentType: text("content_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("files_owner_idx").on(t.ownerId), index("files_created_idx").on(t.createdAt)],
);

// ── BUSINESS TABLES ─────────────────────────────────────────────────────────

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("main"),

  companyName: text("company_name").notNull().default("Sholab Dex Tech"),
  ceoName: text("ceo_name").notNull().default("Natlus Niel"),
  ceoTitle: text("ceo_title").notNull().default("CEO & Founder"),
  ceoBio: text("ceo_bio").notNull().default(""),
  ceoPhoto: text("ceo_photo"),
  email: text("email").notNull().default("solabiwonderful09@gmail.com"),
  phone: text("phone").notNull().default("+2348169781185"),
  whatsappNumber: text("whatsapp_number").notNull().default("2348169781185"),
  businessHours: text("business_hours").notNull().default("Monday – Saturday, 8:00 AM – 8:00 PM (WAT)"),
  socials: jsonb("socials").$type<{ label: string; url: string }[]>().notNull().default([]),

  heroHeadline: text("hero_headline").notNull().default("Sholab Dex Tech"),
  heroTagline: text("hero_tagline").notNull().default("We Build Websites, Automate Businesses, and Grow Brands."),
  heroIntro: text("hero_intro").notNull().default(""),
  heroCtaPrimary: text("hero_cta_primary").notNull().default("Get a Free Quote"),
  heroCtaSecondary: text("hero_cta_secondary").notNull().default("Chat on WhatsApp"),
  heroImage: text("hero_image"),

  aboutHeading: text("about_heading").notNull().default("About Sholab Dex Tech"),
  aboutBody: text("about_body").notNull().default(""),
  mission: text("mission").notNull().default(""),
  vision: text("vision").notNull().default(""),
  whyChooseUs: jsonb("why_choose_us").$type<{ title: string; description: string }[]>().notNull().default([]),

  processSteps: jsonb("process_steps").$type<{ title: string; description: string }[]>().notNull().default([]),

  pricingNote: text("pricing_note").notNull().default(""),

  footerDescription: text("footer_description").notNull().default(""),
  footerCopyright: text("footer_copyright").notNull().default("© 2026 Sholab Dex Tech. All rights reserved."),
  footerCredit: text("footer_credit").notNull().default("Designed by Sholab Dex Tech"),

  seoTitle: text("seo_title").notNull().default("Sholab Dex Tech | Websites, AI Automation & Business Promotions"),
  seoDescription: text("seo_description").notNull().default(""),
  seoKeywords: text("seo_keywords").notNull().default(""),
  seoOgImage: text("seo_og_image"),

  logo: text("logo"),
  favicon: text("favicon"),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: text("category").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("services_category_idx").on(t.category, t.sortOrder)],
);

export const pricingPackages = pgTable(
  "pricing_packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: text("category").notNull(),
    name: text("name").notNull(),
    priceNgn: text("price_ngn").notNull().default(""),
    priceUsd: text("price_usd").notNull().default(""),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    isPopular: boolean("is_popular").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pricing_category_idx").on(t.category, t.sortOrder)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull().default(""),
    image: text("image"),
    link: text("link"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_category_idx").on(t.category, t.sortOrder)],
);

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientName: text("client_name").notNull(),
  businessName: text("business_name").notNull().default(""),
  rating: integer("rating").notNull().default(5),
  reviewText: text("review_text").notNull().default(""),
  photo: text("photo"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stats = pgTable("stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    service: text("service").notNull().default(""),
    message: text("message").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contact_created_idx").on(t.createdAt)],
);
