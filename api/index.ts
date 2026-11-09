// ── Vercel serverless entry ──────────────────────────────────────────────────
// Vercel runs this file as a Node function. It mounts the SAME Hono app the
// long-running server uses (server/_core/index.ts) minus two things that only
// make sense on a resident process:
//
//   • `serve()`            — Vercel owns the HTTP listener.
//   • `mountClient()`      — Vercel serves the built SPA (dist/public) as static
//                            files, so the function never reads the filesystem.
//
// Routing is declared in vercel.json: /trpc/*, /app-storage/* and /api/* are
// rewritten here; /sholab is rewritten to /index.html so the SPA deep link
// works; everything else is served from dist/public.
//
// IMPORTANT — set DB_DRIVER=http in the Vercel environment. A serverless
// function has no long-lived process, so a node-postgres TCP pool would be
// rebuilt (and leaked) on every cold start. The Neon HTTP driver opens one
// request per query and is the correct fit. See DEPLOY.md.
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { serveAppStorage } from "../server/_core/storage";
import { getJob } from "../server/_core/jobs";

export const config = { runtime: "nodejs" };

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));

// tRPC — every business endpoint lives under /trpc.
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
  }),
);

// Scoped per-app file storage: 307 → short-lived signed S3 URL.
app.all("/app-storage/*", (c) => serveAppStorage(c));

// Platform-signed scheduled-job callback. Same guard as the resident server:
// a registered job can never be triggered by an anonymous caller.
app.post("/api/_jobs/:name", async (c) => {
  const signature = c.req.header("x-platform-signature");
  if (!signature) {
    return c.text("unauthorized (job callback signature required)", 401);
  }
  const handler = getJob(c.req.param("name"));
  if (!handler) return c.text("no such job", 404);
  try {
    await handler();
    return c.json({ ok: true });
  } catch (err) {
    console.error(`[jobs] "${c.req.param("name")}" failed`, err);
    return c.text("job failed", 500);
  }
});

export default handle(app);
