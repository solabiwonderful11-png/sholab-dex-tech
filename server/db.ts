// ── AGENT-OWNED: business data-access ────────────────────────────────────────
// Every Drizzle query for the Sholab Dex Tech site lives here so the tRPC
// procedures in routers.ts stay thin.
//
// Shape of the app: NO user accounts. The public site reads content, the public
// contact form writes messages, and /sholab (also public, by the owner's
// explicit request) can edit every content table. See README › Security.
import { asc, desc, eq, count } from "drizzle-orm";
import { db } from "./_core/db";
import {
  siteSettings,
  services,
  pricingPackages,
  projects,
  testimonials,
  stats,
  faqs,
  contactMessages,
} from "../drizzle/schema";
import {
  SEED_SETTINGS,
  SEED_SERVICES,
  SEED_PACKAGES,
  SEED_PROJECTS,
  SEED_TESTIMONIALS,
  SEED_STATS,
  SEED_FAQS,
} from "./seed";

// ── Settings ─────────────────────────────────────────────────────────────────

export type SiteSettings = typeof siteSettings.$inferSelect;

const SETTINGS_ID = "main";

/**
 * The single settings row, created from the seed defaults on first read.
 * Without the upsert a fresh database would render an empty site, and every
 * page would have to handle "no settings yet".
 */
export async function getSettings(): Promise<SiteSettings> {
  const [existing] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(siteSettings)
    .values({ id: SETTINGS_ID, ...SEED_SETTINGS } as typeof siteSettings.$inferInsert)
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Another request won the race between our SELECT and INSERT.
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .limit(1);
  return row;
}

/**
 * Patch the settings row. Only the keys present in `patch` are written, so the
 * admin panel can save one tab without sending the whole record back.
 * `updatedAt` is bumped on every write.
 */
export async function updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  await getSettings(); // guarantees the row exists

  // Never let a caller rewrite identity or the timestamp by hand.
  const { id: _id, updatedAt: _updatedAt, ...rest } = patch;

  const clean = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  ) as Partial<SiteSettings>;

  if (Object.keys(clean).length === 0) return getSettings();

  const [row] = await db
    .update(siteSettings)
    .set({ ...clean, updatedAt: new Date() })
    .where(eq(siteSettings.id, SETTINGS_ID))
    .returning();
  return row;
}

// ── Services ─────────────────────────────────────────────────────────────────

export type Service = typeof services.$inferSelect;

export async function listServices(): Promise<Service[]> {
  return db.select().from(services).orderBy(asc(services.category), asc(services.sortOrder));
}

export async function createService(input: {
  category: string;
  name: string;
  description?: string;
  icon?: string | null;
  sortOrder?: number;
}): Promise<Service> {
  const [row] = await db
    .insert(services)
    .values({
      category: input.category,
      name: input.name,
      description: input.description ?? "",
      icon: input.icon ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return row;
}

export async function updateService(
  id: string,
  patch: {
    category?: string;
    name?: string;
    description?: string;
    icon?: string | null;
    sortOrder?: number;
  },
): Promise<Service | undefined> {
  const [row] = await db.update(services).set(patch).where(eq(services.id, id)).returning();
  return row;
}

export async function deleteService(id: string): Promise<boolean> {
  const rows = await db.delete(services).where(eq(services.id, id)).returning();
  return rows.length > 0;
}

/** Persist a new order for one category's services (index in the array = sortOrder). */
export async function reorderServices(ids: string[]): Promise<boolean> {
  await Promise.all(
    ids.map((id, i) => db.update(services).set({ sortOrder: i }).where(eq(services.id, id))),
  );
  return true;
}

// ── Pricing packages ─────────────────────────────────────────────────────────

export type PricingPackage = typeof pricingPackages.$inferSelect;

export async function listPricing(): Promise<PricingPackage[]> {
  return db
    .select()
    .from(pricingPackages)
    .orderBy(asc(pricingPackages.category), asc(pricingPackages.sortOrder));
}

export async function createPricing(input: {
  category: string;
  name: string;
  priceNgn?: string;
  priceUsd?: string;
  features?: string[];
  isPopular?: boolean;
  sortOrder?: number;
}): Promise<PricingPackage> {
  const [row] = await db
    .insert(pricingPackages)
    .values({
      category: input.category,
      name: input.name,
      priceNgn: input.priceNgn ?? "",
      priceUsd: input.priceUsd ?? "",
      features: input.features ?? [],
      isPopular: input.isPopular ?? false,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return row;
}

export async function updatePricing(
  id: string,
  patch: {
    category?: string;
    name?: string;
    priceNgn?: string;
    priceUsd?: string;
    features?: string[];
    isPopular?: boolean;
    sortOrder?: number;
  },
): Promise<PricingPackage | undefined> {
  const [row] = await db
    .update(pricingPackages)
    .set(patch)
    .where(eq(pricingPackages.id, id))
    .returning();
  return row;
}

export async function deletePricing(id: string): Promise<boolean> {
  const rows = await db.delete(pricingPackages).where(eq(pricingPackages.id, id)).returning();
  return rows.length > 0;
}

/**
 * Set the "Most Popular" badge. Only ONE package per category may carry it, so
 * this clears the others in the same category first — otherwise the site could
 * show two "Most Popular" cards and the badge would stop meaning anything.
 */
export async function setPopular(id: string, isPopular: boolean): Promise<boolean> {
  const [target] = await db
    .select()
    .from(pricingPackages)
    .where(eq(pricingPackages.id, id))
    .limit(1);
  if (!target) return false;

  if (isPopular) {
    await db
      .update(pricingPackages)
      .set({ isPopular: false })
      .where(eq(pricingPackages.category, target.category));
  }
  await db.update(pricingPackages).set({ isPopular }).where(eq(pricingPackages.id, id));
  return true;
}

// ── Portfolio projects ───────────────────────────────────────────────────────

export type Project = typeof projects.$inferSelect;

export async function listProjects(): Promise<Project[]> {
  return db.select().from(projects).orderBy(asc(projects.sortOrder));
}

export async function createProject(input: {
  title: string;
  category: string;
  description?: string;
  image?: string | null;
  link?: string | null;
  sortOrder?: number;
}): Promise<Project> {
  const [row] = await db
    .insert(projects)
    .values({
      title: input.title,
      category: input.category,
      description: input.description ?? "",
      image: input.image ?? null,
      link: input.link ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return row;
}

export async function updateProject(
  id: string,
  patch: {
    title?: string;
    category?: string;
    description?: string;
    image?: string | null;
    link?: string | null;
    sortOrder?: number;
  },
): Promise<Project | undefined> {
  const [row] = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
  return row;
}

export async function deleteProject(id: string): Promise<boolean> {
  const rows = await db.delete(projects).where(eq(projects.id, id)).returning();
  return rows.length > 0;
}

// ── Testimonials ─────────────────────────────────────────────────────────────

export type Testimonial = typeof testimonials.$inferSelect;

export async function listTestimonials(): Promise<Testimonial[]> {
  return db.select().from(testimonials).orderBy(asc(testimonials.sortOrder));
}

export async function createTestimonial(input: {
  clientName: string;
  businessName?: string;
  rating?: number;
  reviewText?: string;
  photo?: string | null;
  sortOrder?: number;
}): Promise<Testimonial> {
  const [row] = await db
    .insert(testimonials)
    .values({
      clientName: input.clientName,
      businessName: input.businessName ?? "",
      rating: input.rating ?? 5,
      reviewText: input.reviewText ?? "",
      photo: input.photo ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return row;
}

export async function updateTestimonial(
  id: string,
  patch: {
    clientName?: string;
    businessName?: string;
    rating?: number;
    reviewText?: string;
    photo?: string | null;
    sortOrder?: number;
  },
): Promise<Testimonial | undefined> {
  const [row] = await db.update(testimonials).set(patch).where(eq(testimonials.id, id)).returning();
  return row;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  const rows = await db.delete(testimonials).where(eq(testimonials.id, id)).returning();
  return rows.length > 0;
}

// ── Stats counters ───────────────────────────────────────────────────────────

export type Stat = typeof stats.$inferSelect;

export async function listStats(): Promise<Stat[]> {
  return db.select().from(stats).orderBy(asc(stats.sortOrder));
}

export async function createStat(input: {
  label: string;
  value: string;
  sortOrder?: number;
}): Promise<Stat> {
  const [row] = await db
    .insert(stats)
    .values({ label: input.label, value: input.value, sortOrder: input.sortOrder ?? 0 })
    .returning();
  return row;
}

export async function updateStat(
  id: string,
  patch: { label?: string; value?: string; sortOrder?: number },
): Promise<Stat | undefined> {
  const [row] = await db.update(stats).set(patch).where(eq(stats.id, id)).returning();
  return row;
}

export async function deleteStat(id: string): Promise<boolean> {
  const rows = await db.delete(stats).where(eq(stats.id, id)).returning();
  return rows.length > 0;
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

export type Faq = typeof faqs.$inferSelect;

export async function listFaqs(): Promise<Faq[]> {
  return db.select().from(faqs).orderBy(asc(faqs.sortOrder));
}

export async function createFaq(input: {
  question: string;
  answer: string;
  sortOrder?: number;
}): Promise<Faq> {
  const [row] = await db
    .insert(faqs)
    .values({ question: input.question, answer: input.answer, sortOrder: input.sortOrder ?? 0 })
    .returning();
  return row;
}

export async function updateFaq(
  id: string,
  patch: { question?: string; answer?: string; sortOrder?: number },
): Promise<Faq | undefined> {
  const [row] = await db.update(faqs).set(patch).where(eq(faqs.id, id)).returning();
  return row;
}

export async function deleteFaq(id: string): Promise<boolean> {
  const rows = await db.delete(faqs).where(eq(faqs.id, id)).returning();
  return rows.length > 0;
}

// ── Contact messages ─────────────────────────────────────────────────────────

export type ContactMessage = typeof contactMessages.$inferSelect;

export async function createContactMessage(input: {
  name: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
}): Promise<ContactMessage> {
  const [row] = await db
    .insert(contactMessages)
    .values({
      name: input.name.trim(),
      email: input.email?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      service: input.service?.trim() ?? "",
      message: input.message?.trim() ?? "",
    })
    .returning();
  return row;
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const rows = await db.delete(contactMessages).where(eq(contactMessages.id, id)).returning();
  return rows.length > 0;
}

// ── Public content bundle ────────────────────────────────────────────────────

/**
 * Everything the public page needs, in ONE round trip. A single query per table
 * rather than one big join: the tables are independent lists, and a join would
 * multiply rows and have to be de-duplicated in the client.
 */
export async function getSiteContent() {
  const [settings, serviceRows, pricing, projectRows, testimonialRows, statRows, faqRows] =
    await Promise.all([
      getSettings(),
      listServices(),
      listPricing(),
      listProjects(),
      listTestimonials(),
      listStats(),
      listFaqs(),
    ]);

  return {
    settings,
    services: serviceRows,
    pricing,
    projects: projectRows,
    testimonials: testimonialRows,
    stats: statRows,
    faqs: faqRows,
  };
}

// ── Admin: counts + reset ────────────────────────────────────────────────────

export async function countRows() {
  const [serviceCount, pricingCount, projectCount, testimonialCount, statCount, faqCount, messageCount] =
    await Promise.all([
      db.select({ value: count() }).from(services),
      db.select({ value: count() }).from(pricingPackages),
      db.select({ value: count() }).from(projects),
      db.select({ value: count() }).from(testimonials),
      db.select({ value: count() }).from(stats),
      db.select({ value: count() }).from(faqs),
      db.select({ value: count() }).from(contactMessages),
    ]);

  return {
    services: serviceCount[0]?.value ?? 0,
    pricing: pricingCount[0]?.value ?? 0,
    projects: projectCount[0]?.value ?? 0,
    testimonials: testimonialCount[0]?.value ?? 0,
    stats: statCount[0]?.value ?? 0,
    faqs: faqCount[0]?.value ?? 0,
    messages: messageCount[0]?.value ?? 0,
  };
}

/**
 * Delete every content row and restore the seed defaults. Contact messages are
 * deliberately NOT deleted — a reset is "put my content back", not "throw away
 * customer enquiries".
 */
export async function resetAllContent(): Promise<boolean> {
  await Promise.all([
    db.delete(services),
    db.delete(pricingPackages),
    db.delete(projects),
    db.delete(testimonials),
    db.delete(stats),
    db.delete(faqs),
  ]);

  await db.delete(siteSettings);

  await db.insert(siteSettings).values({ id: SETTINGS_ID, ...SEED_SETTINGS } as typeof siteSettings.$inferInsert);
  if (SEED_SERVICES.length) await db.insert(services).values(SEED_SERVICES);
  if (SEED_PACKAGES.length) await db.insert(pricingPackages).values(SEED_PACKAGES);
  if (SEED_PROJECTS.length) await db.insert(projects).values(SEED_PROJECTS);
  if (SEED_TESTIMONIALS.length) await db.insert(testimonials).values(SEED_TESTIMONIALS);
  if (SEED_STATS.length) await db.insert(stats).values(SEED_STATS);
  if (SEED_FAQS.length) await db.insert(faqs).values(SEED_FAQS);

  return true;
}
