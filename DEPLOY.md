# Deploying Sholab Dex Tech to Vercel

This guide takes the project from a ZIP on your computer to a live website on
your own Vercel account, with a real database behind it.

**Time needed:** about 15 minutes.
**Cost:** free. Vercel's Hobby plan and Neon's free tier are both enough.

---

## What you need first

1. A **GitHub account** — https://github.com/signup
2. A **Vercel account** — https://vercel.com/signup (sign in with GitHub)
3. A **Neon account** — https://neon.tech (free Postgres; sign in with GitHub)
4. **Node.js 20+** and **pnpm** on your computer, to run the migration once:
   ```bash
   npm install -g pnpm
   ```

---

## Step 1 — Get the code onto GitHub

Unzip the project, open a terminal in the folder, and run:

```bash
git init
git add .
git commit -m "Sholab Dex Tech website"
git branch -M main
```

Create an empty repository on GitHub (no README, no .gitignore), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/sholab-dex-tech.git
git push -u origin main
```

> `.env` is git-ignored, so your secrets are never pushed. `.env.example` **is**
> committed — that is intentional, it documents which variables are needed.

---

## Step 2 — Create the database (Neon)

1. Go to https://console.neon.tech and create a project.
2. Pick a region close to your users (e.g. `AWS eu-central-1` or `us-east-1`).
3. On the project dashboard, open **Connection string** and copy the
   **Pooled connection** string. It looks like:
   ```
   postgresql://user:password@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep it somewhere safe — this is your `DATABASE_URL`.

> Use the **pooled** string for the app. If you later run migrations from a
> machine that struggles to connect, Neon's **direct** (non-pooler) string is
> the one to use for that single command.

---

## Step 3 — Import the project into Vercel

1. Go to https://vercel.com/new
2. Choose **Import Git Repository** and pick your `sholab-dex-tech` repo.
3. Vercel reads `vercel.json`, so leave the build settings alone:
   - **Framework Preset:** Other
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist/public`
4. **Do not click Deploy yet** — add the environment variables first.

---

## Step 4 — Add the environment variables

In the import screen (or later under **Settings → Environment Variables**), add
these. Apply each to **Production, Preview and Development**.

| Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | your Neon **pooled** string | Required |
| `DB_DRIVER` | `http` | **Required on Vercel.** A serverless function has no long-lived process, so the TCP pool driver is wrong here. |
| `JWT_SECRET` | a long random string | Required. Generate one: `openssl rand -base64 32` |
| `AUTH_PROVIDER` | `none` | No login — the site is public and `/sholab` is open. |
| `APP_SLUG` | `sholab-dex-tech` | Namespaces the session cookie. |
| `APP_STORAGE_PRESIGN_URL` | *(leave blank)* | Only needed for image uploads in `/sholab`. |
| `APP_STORAGE_TOKEN` | *(leave blank)* | Same. |

> **Do not set `PORT` or `NODE_ENV`.** Vercel manages both.

Now click **Deploy**. The first build takes 1–3 minutes.

---

## Step 5 — Create the database tables

The deploy succeeds, but the site will show an error until the tables exist.
Run the migration **once** from your computer, pointed at the production
database:

```bash
# In the project folder
cp .env.example .env
# Edit .env and paste your Neon connection string into DATABASE_URL
# (for this one command, the DIRECT non-pooler string is safest)

pnpm install
pnpm db:migrate
```

Then load the default content:

```bash
pnpm seed
```

Reload your Vercel URL — the site is live.

> **Alternative:** if you would rather not run anything locally, open the Neon
> SQL editor and paste the contents of
> `drizzle/migrations/0000_*.sql`, then run it. The `pnpm seed` step still needs
> Node, but the site works without it — the settings row is created
> automatically on first page load, and you can add services and prices through
> `/sholab`.

---

## Step 6 — Check it works

Visit your Vercel URL and confirm:

- [ ] The hero, services, portfolio, pricing, about, testimonials, stats, FAQ
      and contact sections all render
- [ ] A "Chat on WhatsApp" button opens the popup, and sending opens WhatsApp
      with your name and chosen package in the message
- [ ] The contact form submits and the message appears in `/sholab → Messages`
- [ ] `/sholab` opens the control panel
- [ ] The site looks right on a phone

---

## Step 7 — Your own domain (optional)

1. In Vercel: **Settings → Domains → Add**.
2. Enter your domain (e.g. `sholabdextech.com`) and follow the DNS instructions.
3. Vercel issues an HTTPS certificate automatically.

---

## Updating the site later

**Content** (text, prices, projects, FAQs) — edit it in `/sholab` on the live
site. No redeploy needed; changes are saved to the database.

**Code** — commit and push:

```bash
git add .
git commit -m "Update the pricing section"
git push
```

Vercel rebuilds and redeploys automatically.

**Schema changes** — if you edit `drizzle/schema.ts`:

```bash
pnpm db:generate     # creates a new migration file
git add drizzle/ && git commit -m "Add migration" && git push
pnpm db:migrate      # apply it to the production database
```

---

## Troubleshooting

**"Missing required env var: DATABASE_URL"**
The variable is not set for the environment you are viewing. Add it under
**Settings → Environment Variables** and redeploy.

**The site loads but every section is empty**
The tables exist but have no rows. Run `pnpm seed`, or add content through
`/sholab`.

**"No transactions support in neon-http driver"**
Something is calling `db.transaction`. Use the `atomic()` helper from
`server/_core/db.ts` instead — it works on both drivers.

**Database connection errors on Vercel**
Check that `DB_DRIVER=http` is set. With `tcp`, each cold start builds a new
connection pool and Neon will start refusing connections.

**Build fails with "pnpm: command not found"**
Vercel detects pnpm from `packageManager` in `package.json`. If it does not,
add an environment variable `ENABLE_EXPERIMENTAL_COREPACK=1`.

**The WhatsApp popup opens but the message is empty**
Check that `whatsappNumber` in `/sholab → Site content` is digits only, with the
country code and no `+` or spaces (e.g. `2348169781185`).

---

## Deploying somewhere other than Vercel

The project also ships a `Dockerfile` that builds and runs the whole app as a
single Node process — suitable for Cloud Run, Railway, Render, Fly.io or any
VPS:

```bash
docker build -t sholab-dex-tech .
docker run -p 3000:3000 --env-file .env sholab-dex-tech
```

On a long-running host, set `DB_DRIVER=tcp` (the default) — the pool is the
right choice when the process stays alive.
