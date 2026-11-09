// ── AGENT-OWNED: tRPC API surface ────────────────────────────────────────────
// Compose the app's procedures here. Keep them thin: validate input with zod,
// call server/db.ts for data and server/services/* for external integrations.
// This app ships WITHOUT user accounts: use publicProcedure only. Do not use
// protectedProcedure / adminProcedure / ctx.user unless accounts are enabled —
// see AGENT.md › Accounts. Auth is provided by _core — do NOT reimplement sessions.
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { authProvider, registerLocalUser, AuthError, EmailTakenError } from "./_core/auth";
import { storageCommit, storageDeleteAnonymous, storagePutUrl, StorageError } from "./_core/storage";
import * as q from "./db";

// Auth: login/logout are provider-agnostic (go through the AuthProvider).
// signup is LOCAL-only (SSO signup happens at the IdP) — guard if you switch.
const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  signup: publicProcedure
    .input(z.object({ email: z.email(), password: z.string().min(8), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await registerLocalUser(input.email, input.password, input.name);
        await authProvider().login(ctx.c, input.email, input.password); // set session cookie
        return user;
      } catch (e: unknown) {
        // CONFLICT, not a 500: the request was well-formed, the address is just
        // taken. registerLocalUser has already turned the driver's SQLSTATE
        // 23505 into this type — never pattern-match a DB error message here,
        // Drizzle hides it behind a "Failed query: <sql>" wrapper.
        if (e instanceof EmailTakenError) throw new TRPCError({ code: "CONFLICT", message: e.message });
        throw e;
      }
    }),

  login: publicProcedure
    .input(z.object({ email: z.email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await authProvider().login(ctx.c, input.email, input.password);
      } catch (e) {
        if (e instanceof AuthError) throw new TRPCError({ code: "UNAUTHORIZED", message: e.message });
        throw e;
      }
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await authProvider().logout(ctx.c);
    return { ok: true };
  }),
});

// Sanitize a caller-supplied filename down to a safe key BASENAME: take the
// last path segment (so "/../shared/report.pdf" can't steer the rest of the
// key), keep only [A-Za-z0-9._-], strip leading dots (so a survivor of "." or
// ".." can't slip through as a bare segment), and fall back to a fixed constant
// when nothing survives. Exported so it can be unit-tested directly.
//
// The stem and the extension are sanitized SEPARATELY, and that split is the
// whole point. Sanitizing the basename as one string used to destroy the
// extension of any file whose stem was entirely non-ASCII: the allowlist below
// deleted every CJK character in "风景.png", leaving ".png", and the leading-dot
// strip — there to kill "." / ".." / dotfiles — then ate the extension
// separator, because by that point it was the only dot left. The object landed
// in storage as "<uuid>-png". Splitting first means the leading-dot rule only
// ever sees the stem, where a leading dot really is a dotfile prefix.
export function sanitizeBasename(name: string): string {
  // Split on "\\" too: it cannot steer a path segment (the key joins on "/"),
  // but a Windows path would otherwise fold its directories into the stem.
  const last = name.split(/[/\\]/).pop() ?? "";
  // `> 0`, not `>= 0`: in ".gitignore" the dot is a dotfile prefix, not an
  // extension separator, so the whole name is the stem.
  const dot = last.lastIndexOf(".");
  const rawStem = dot > 0 ? last.slice(0, dot) : last;
  const rawExt = dot > 0 ? last.slice(dot + 1) : "";
  const stem =
    rawStem.replace(/[^A-Za-z0-9._-]/g, "").replace(/^\.+/, "") || "upload";
  // No dots or separators in an extension, and capped — the key is
  // `${uuid}-${basename}`, so a long tail buys nothing.
  const ext = rawExt.replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
  return ext ? `${stem}.${ext}` : stem;
}

// Example file-upload router. The three-step protocol matters: the browser PUTs
// straight to object storage, so the server only learns the upload succeeded when
// the client calls `commit`. Skipping commit leaves an unindexed orphan object —
// never a row pointing at nothing.
//
//   1. uploadUrl  → signed PUT URL + the key to commit later
//   2. browser    → PUT the bytes to uploadUrl
//   3. commit     → index it (size/type are read back from storage)
const filesRouter = router({
  uploadUrl: publicProcedure
    .input(z.object({ name: z.string().min(1), contentType: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // The uuid prefix makes the key unguessable ONLY if the rest of the key
      // isn't attacker-controlled — sanitizeBasename strips the client-supplied
      // `name` down to a safe basename first, so it can't steer path segments
      // (e.g. "/../report.pdf") into someone else's key.
      const key = `${crypto.randomUUID()}-${sanitizeBasename(input.name)}`;
      try {
        const { uploadUrl, publicPath } = await storagePutUrl(key, input.contentType);
        return { key, uploadUrl, publicPath };
      } catch (e) {
        if (e instanceof StorageError && e.code === "failed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "upload rejected by storage — check contentType is on the platform's whitelist " +
              "(see AGENT.md: png/jpeg/gif/webp/avif, pdf, text/plain, csv, json, mpeg/wav audio, mp4/webm video)",
          });
        }
        throw e;
      }
    }),

  commit: publicProcedure
    .input(z.object({ key: z.string().min(1), name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        return await storageCommit(input.key, { name: input.name });
      } catch (e) {
        if (e instanceof StorageError && e.code === "not_found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "upload not found — did the PUT succeed?" });
        }
        if (e instanceof StorageError && e.code === "forbidden") {
          throw new TRPCError({ code: "FORBIDDEN", message: "that upload cannot be committed" });
        }
        throw e;
      }
    }),

  // Anonymous uploads have no owner; storageDeleteAnonymous only ever matches
  // rows with a null owner, so a visitor cannot delete an owned file.
  remove: publicProcedure
    .input(z.object({ key: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        return await storageDeleteAnonymous(input.key);
      } catch (e) {
        if (e instanceof StorageError && e.code === "forbidden") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "malformed key" });
        }
        throw e;
      }
    }),
});


// ══════════════════════════════════════════════════════════════════════════════
// Sholab Dex Tech — business routers
// Accounts are OFF: every procedure is public. The owner edits content through
// the open /sholab admin panel (see webapp-spec.md).
// ══════════════════════════════════════════════════════════════════════════════

const CATEGORY = z.enum(["websites", "automation", "promotions"]);

// ── Public site content ──────────────────────────────────────────────────────

const siteRouter = router({
  content: publicProcedure.query(() => q.getSiteContent()),
  settings: publicProcedure.query(() => q.getSettings()),
});

// ── Settings ─────────────────────────────────────────────────────────────────

const settingsRouter = router({
  update: publicProcedure
    .input(
      z.object({
        companyName: z.string().optional(),
        ceoName: z.string().optional(),
        ceoTitle: z.string().optional(),
        ceoBio: z.string().optional(),
        ceoPhoto: z.string().nullable().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        whatsappNumber: z.string().optional(),
        businessHours: z.string().optional(),
        socials: z.array(z.object({ label: z.string(), url: z.string() })).optional(),

        heroHeadline: z.string().optional(),
        heroTagline: z.string().optional(),
        heroIntro: z.string().optional(),
        heroCtaPrimary: z.string().optional(),
        heroCtaSecondary: z.string().optional(),
        heroImage: z.string().nullable().optional(),

        aboutHeading: z.string().optional(),
        aboutBody: z.string().optional(),
        mission: z.string().optional(),
        vision: z.string().optional(),
        whyChooseUs: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
        processSteps: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
        pricingNote: z.string().optional(),

        footerDescription: z.string().optional(),
        footerCopyright: z.string().optional(),
        footerCredit: z.string().optional(),

        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
        seoOgImage: z.string().nullable().optional(),

        logo: z.string().nullable().optional(),
        favicon: z.string().nullable().optional(),
      }),
    )
    .mutation(({ input }) => q.updateSettings(input)),
});

// ── Services ─────────────────────────────────────────────────────────────────

const servicesRouter = router({
  list: publicProcedure.query(() => q.listServices()),

  create: publicProcedure
    .input(
      z.object({
        category: CATEGORY,
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => q.createService(input)),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        category: CATEGORY.optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        icon: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...patch } = input;
      return q.updateService(id, patch);
    }),

  remove: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ input }) => q.deleteService(input.id)),

  reorder: publicProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(({ input }) => q.reorderServices(input.ids)),
});

// ── Pricing ──────────────────────────────────────────────────────────────────

const pricingRouter = router({
  list: publicProcedure.query(() => q.listPricing()),

  create: publicProcedure
    .input(
      z.object({
        category: CATEGORY,
        name: z.string().min(1),
        priceNgn: z.string().optional(),
        priceUsd: z.string().optional(),
        features: z.array(z.string()).optional(),
        isPopular: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => q.createPricing(input)),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        category: CATEGORY.optional(),
        name: z.string().min(1).optional(),
        priceNgn: z.string().optional(),
        priceUsd: z.string().optional(),
        features: z.array(z.string()).optional(),
        isPopular: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...patch } = input;
      return q.updatePricing(id, patch);
    }),

  remove: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ input }) => q.deletePricing(input.id)),

  setPopular: publicProcedure
    .input(z.object({ id: z.string().uuid(), isPopular: z.boolean() }))
    .mutation(({ input }) => q.setPopular(input.id, input.isPopular)),
});

// ── Projects ─────────────────────────────────────────────────────────────────

const projectsRouter = router({
  list: publicProcedure.query(() => q.listProjects()),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        category: CATEGORY,
        description: z.string().optional(),
        image: z.string().nullable().optional(),
        link: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => q.createProject(input)),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        category: CATEGORY.optional(),
        description: z.string().optional(),
        image: z.string().nullable().optional(),
        link: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...patch } = input;
      return q.updateProject(id, patch);
    }),

  remove: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ input }) => q.deleteProject(input.id)),
});

// ── Testimonials ─────────────────────────────────────────────────────────────

const testimonialsRouter = router({
  list: publicProcedure.query(() => q.listTestimonials()),

  create: publicProcedure
    .input(
      z.object({
        clientName: z.string().min(1),
        businessName: z.string().optional(),
        rating: z.number().int().min(1).max(5).optional(),
        reviewText: z.string().optional(),
        photo: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => q.createTestimonial(input)),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        clientName: z.string().min(1).optional(),
        businessName: z.string().optional(),
        rating: z.number().int().min(1).max(5).optional(),
        reviewText: z.string().optional(),
        photo: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...patch } = input;
      return q.updateTestimonial(id, patch);
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => q.deleteTestimonial(input.id)),
});

// ── Stats ────────────────────────────────────────────────────────────────────

const statsRouter = router({
  list: publicProcedure.query(() => q.listStats()),

  create: publicProcedure
    .input(z.object({ label: z.string().min(1), value: z.string().min(1), sortOrder: z.number().int().optional() }))
    .mutation(({ input }) => q.createStat(input)),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        label: z.string().min(1).optional(),
        value: z.string().min(1).optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...patch } = input;
      return q.updateStat(id, patch);
    }),

  remove: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ input }) => q.deleteStat(input.id)),
});

// ── FAQs ─────────────────────────────────────────────────────────────────────

const faqsRouter = router({
  list: publicProcedure.query(() => q.listFaqs()),

  create: publicProcedure
    .input(z.object({ question: z.string().min(1), answer: z.string(), sortOrder: z.number().int().optional() }))
    .mutation(({ input }) => q.createFaq(input)),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        question: z.string().min(1).optional(),
        answer: z.string().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...patch } = input;
      return q.updateFaq(id, patch);
    }),

  remove: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ input }) => q.deleteFaq(input.id)),
});

// ── Contact form ─────────────────────────────────────────────────────────────

const contactRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Please enter your name"),
        email: z.string().optional(),
        phone: z.string().optional(),
        service: z.string().optional(),
        message: z.string().optional(),
      }),
    )
    .mutation(({ input }) => q.createContactMessage(input)),

  list: publicProcedure.query(() => q.listContactMessages()),

  remove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => q.deleteContactMessage(input.id)),
});

// ── Admin dashboard + reset ──────────────────────────────────────────────────

const adminRouter = router({
  counts: publicProcedure.query(() => q.countRows()),
  reset: publicProcedure.mutation(() => q.resetAllContent()),
});

export const appRouter = router({
  auth: authRouter,
  files: filesRouter,
  site: siteRouter,
  settings: settingsRouter,
  services: servicesRouter,
  pricing: pricingRouter,
  projects: projectsRouter,
  testimonials: testimonialsRouter,
  stats: statsRouter,
  faqs: faqsRouter,
  contact: contactRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
