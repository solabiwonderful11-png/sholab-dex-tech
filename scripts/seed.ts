// ── Seed a fresh database ────────────────────────────────────────────────────
//   pnpm seed
//
// Inserts the default Sholab Dex Tech content. SAFE TO RE-RUN: each table is
// only filled when it is empty, so running this twice never duplicates rows and
// never overwrites content you have already edited in /sholab.
//
// To wipe everything and go back to these defaults, use the "Restore defaults"
// button in /sholab → Dashboard (that one DOES delete your edits).
import "dotenv/config";
import { count } from "drizzle-orm";
import { db } from "../server/_core/db";
import {
  siteSettings,
  services,
  pricingPackages,
  projects,
  testimonials,
  stats,
  faqs,
} from "../drizzle/schema";
import {
  SEED_SETTINGS,
  SEED_SERVICES,
  SEED_PACKAGES,
  SEED_PROJECTS,
  SEED_TESTIMONIALS,
  SEED_STATS,
  SEED_FAQS,
} from "../server/seed";

async function rowsIn(table: typeof services | typeof pricingPackages | typeof projects | typeof testimonials | typeof stats | typeof faqs) {
  const [row] = await db.select({ value: count() }).from(table);
  return row?.value ?? 0;
}

async function main() {
  const report: string[] = [];

  // Settings — a single row keyed "main".
  const [settingsRow] = await db.select({ value: count() }).from(siteSettings);
  if ((settingsRow?.value ?? 0) === 0) {
    await db.insert(siteSettings).values({ id: "main", ...SEED_SETTINGS } as typeof siteSettings.$inferInsert);
    report.push(`settings: inserted`);
  } else {
    report.push(`settings: already present, left alone`);
  }

  const tables = [
    { name: "services", table: services, rows: SEED_SERVICES },
    { name: "pricing", table: pricingPackages, rows: SEED_PACKAGES },
    { name: "projects", table: projects, rows: SEED_PROJECTS },
    { name: "testimonials", table: testimonials, rows: SEED_TESTIMONIALS },
    { name: "stats", table: stats, rows: SEED_STATS },
    { name: "faqs", table: faqs, rows: SEED_FAQS },
  ] as const;

  for (const { name, table, rows } of tables) {
    const existing = await rowsIn(table);
    if (existing > 0) {
      report.push(`${name}: ${existing} row(s) already present, left alone`);
      continue;
    }
    if (rows.length === 0) {
      report.push(`${name}: nothing to insert`);
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(table).values(rows as any);
    report.push(`${name}: inserted ${rows.length}`);
  }

  console.log("\nSeed complete:");
  for (const line of report) console.log(`  • ${line}`);
  console.log("\nOpen /sholab to edit your content.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nSeed failed:", err);
    process.exit(1);
  });
