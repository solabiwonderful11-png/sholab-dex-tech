# Sholab Dex Tech — Portfolio Website + `/sholab` Admin Panel

A modern, mobile-friendly portfolio website for **Sholab Dex Tech** (website development, AI automation and business promotions), with a built-in admin control panel at **`/sholab`** that lets the owner edit every piece of content on the site — no code, no login.

- **Public site:** `/` — hero, services, portfolio, pricing, process, about, testimonials, stats, FAQ, contact, footer, floating WhatsApp button
- **Admin panel:** `/sholab` — edit all text, services, pricing, portfolio, testimonials, stats, FAQ, images, SEO and company details
- **WhatsApp smart quote popup** — captures the visitor's name, service and package, then opens WhatsApp with a ready-made message

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| API | tRPC 11 on Hono |
| Database | PostgreSQL via Drizzle ORM |
| Deployment | Vercel (static SPA + one serverless function) |

> **No Next.js.** This project deliberately does **not** use Next.js, so it can never hit the `next@15.5.4` / CVE-2025-66478 security block. The stack is Vite + Hono, which has no such advisory.

---

## 1. Run it locally

```bash
pnpm install
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
pnpm db:migrate           # create the tables
pnpm seed                 # insert the default site content
pnpm dev                  # http://localhost:3000
```

- Public site → http://localhost:3000/
- Admin panel → http://localhost:3000/sholab

---

## 2. Deploy to Vercel (step by step)

### Step 1 — Get a Postgres database

Any Postgres works. The easiest is **Neon** (free tier, works perfectly with Vercel):

1. Go to <https://neon.tech> and create a project.
2. Copy **two** connection strings from the dashboard:
   - the **Pooled** connection string (host contains `-pooler`) → used by the app
   - the **Direct** connection string → used for migrations

> Vercel Postgres, Supabase, Railway and any other Postgres also work — just use their connection string.

### Step 2 — Push this code to GitHub

```bash
git init
git add .
git commit -m "Sholab Dex Tech portfolio + admin panel"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### Step 3 — Import the repo into Vercel

1. Go to <https://vercel.com/new> and click **Import** next to your repository.
2. Vercel reads `vercel.json`, so **leave the build settings as they are**:
   - Framework Preset: **Other**
   - Build Command: `pnpm build:web`
   - Output Directory: `dist/public`
   - Install Command: `pnpm install --frozen-lockfile`
3. **Do not deploy yet** — add the environment variables first (Step 4).

### Step 4 — Add environment variables

In Vercel → your project → **Settings → Environment Variables**, add each of these for **Production, Preview and Development**:

| Key | Value |
|---|---|
| `DATABASE_URL` | your **pooled** Postgres connection string |
| `DB_DRIVER` | `http` (Neon serverless — recommended on Vercel) |
| `JWT_SECRET` | a long random string (see below) |
| `AUTH_PROVIDER` | `none` |
| `APP_SLUG` | `sholab-dex-tech` |

Generate a `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> `APP_STORAGE_PRESIGN_URL` and `APP_STORAGE_TOKEN` are **optional**. Leave them out and the admin panel's image-upload buttons will say storage is not configured — everything else keeps working, and you can paste image URLs instead. See "Image uploads" below.

### Step 5 — Deploy

Click **Deploy**. The first build takes a couple of minutes.

### Step 6 — Create the database tables and seed the content

The deployed site needs its tables and default content. Run these **once** from your computer, pointing at the same database:

```bash
# in the project folder, with .env containing the DIRECT (non-pooler) URL
pnpm db:migrate
pnpm seed
```

`pnpm seed` is safe to re-run: it only fills tables that are empty, so it never duplicates rows and never overwrites edits you made in `/sholab`.

### Step 7 — Open your site

- Public site → `https://<your-project>.vercel.app/`
- Admin panel → `https://<your-project>.vercel.app/sholab`

### Step 8 — Custom domain (optional)

Vercel → your project → **Settings → Domains** → add `sholabdextech.com` and follow the DNS instructions. The admin panel then lives at `https://sholabdextech.com/sholab`.

---

## 3. How the admin panel works

Open **`/sholab`** — there is **no login by design** (as requested). Keep the URL private.

| Tab | What you can edit |
|---|---|
| **Dashboard** | Overview + quick links to every section |
| **Content** | Hero headline/tagline/intro, about text, mission, vision, why-choose-us, process steps, pricing note, footer, FAQ |
| **Services** | Add / edit / delete / reorder services in all three categories |
| **Pricing** | Add / edit / delete packages, change ₦ and $ prices, features, and the "Most Popular" badge |
| **Portfolio** | Add / edit / delete projects, upload images, set title, category tag, description and link |
| **Testimonials** | Add / edit / delete reviews, set name, business, star rating, text and photo |
| **Media** | Stats counters, logo, favicon, hero image |
| **SEO** | Page title, meta description, keywords, Open Graph image |
| **Settings** | Company name, CEO name/bio/photo, email, phone, WhatsApp number, business hours, social links, and **Reset to default** |
| **Messages** | Every message submitted through the contact form |

**Changes appear on the live site immediately after you save** — the public site reads the same database.

### Where the content is stored

Content lives in **PostgreSQL**, not in files. That is what makes the admin panel work on Vercel's serverless environment: serverless functions have a read-only filesystem, so writing to a JSON file would silently fail. Every save is a database row, which works identically in local dev and on Vercel.

### Image uploads

Image uploads use the platform's signed-URL storage service. On the Teamily platform this is configured automatically. On your own Vercel deployment, either:

- leave `APP_STORAGE_PRESIGN_URL` / `APP_STORAGE_TOKEN` empty and **paste image URLs** into the image fields, or
- wire up your own storage (Vercel Blob, S3, Cloudinary) and set those two variables.

---

## 4. The WhatsApp smart quote popup

Every WhatsApp button on the site — the floating button, the hero button, each service card, each pricing card and the contact section — opens a small popup that:

1. asks for the visitor's **name** (required),
2. lets them pick a **service** and a **package/price**,
3. shows a live preview of the message, and
4. opens WhatsApp with the message pre-filled:

```
Hi Sholab Dex Tech, my name is [NAME]. I am interested in [SERVICE] - [PACKAGE/PRICING]. Please send me more details and a quote.
```

The message is URL-encoded and sent to `https://wa.me/2348169781185?text=...`. If the visitor skips the name, a friendly default greeting is used instead of leaving it blank.

To change the WhatsApp number, edit it in **`/sholab` → Settings → WhatsApp number** (digits only, with country code).

---

## 5. Project structure

```
api/index.ts              Vercel serverless entry (Hono app)
vercel.json               Vercel build + routing config
drizzle/schema.ts         Database tables
drizzle/migrations/       Generated SQL migrations
server/routers.ts         tRPC API (public + admin procedures)
server/db.ts              All database queries
server/seed.ts            Default site content
scripts/seed.ts           Seed runner (pnpm seed)
client/src/pages/Home.tsx         Public site
client/src/pages/admin/Admin.tsx  Admin panel
client/src/components/site/       Nav, footer, WhatsApp popup, animations
shared/site.ts            Shared constants + WhatsApp link builder
```

---

## 6. Useful commands

```bash
pnpm dev          # run locally (API + web)
pnpm build        # production build
pnpm typecheck    # TypeScript check
pnpm test         # run the test suite
pnpm db:migrate   # apply migrations
pnpm seed         # insert default content (safe to re-run)
```

---

## 7. Security notes

- The `/sholab` admin panel has **no authentication**, exactly as requested. Anyone who knows the URL can edit the site. If you later want a password, that is a small change — ask and it can be added.
- Never commit your `.env` file. It is already in `.gitignore`.
- `JWT_SECRET` must be a long random value in production.

---

*Designed by Sholab Dex Tech.*
