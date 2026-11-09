import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, FileText, Wrench, Tag, Images, Quote, BarChart3, Search,
  Settings as SettingsIcon, ExternalLink, RotateCcw, Plus, Trash2, ChevronUp,
  ChevronDown, Loader2, AlertCircle, Inbox, Menu, X, Star,
} from "lucide-react";
import { trpc } from "../../_core/trpc";
import { CATEGORIES, categoryLabel, type CategoryId } from "@shared/site";
import {
  AdminCard, Field, Area, Toggle, SaveButton, ErrorNote, ImageField,
  PairListEditor, StringListEditor, useSavedFlash,
} from "./ui";

type Tab = "dashboard" | "content" | "services" | "pricing" | "portfolio" | "testimonials" | "media" | "seo" | "settings" | "messages";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "content", label: "Content", icon: FileText },
  { id: "services", label: "Services", icon: Wrench },
  { id: "pricing", label: "Pricing", icon: Tag },
  { id: "portfolio", label: "Portfolio", icon: Images },
  { id: "testimonials", label: "Testimonials", icon: Quote },
  { id: "media", label: "Media", icon: BarChart3 },
  { id: "seo", label: "SEO", icon: Search },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "messages", label: "Messages", icon: Inbox },
];

const CAT_OPTS = CATEGORIES.map((c) => ({ value: c.id, label: c.label }));

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ go }: { go: (t: Tab) => void }) {
  const { data, isLoading } = trpc.admin.counts.useQuery();
  const cards = [
    { label: "Services", value: data?.services, tab: "services" as Tab, icon: Wrench },
    { label: "Pricing Packages", value: data?.pricing, tab: "pricing" as Tab, icon: Tag },
    { label: "Portfolio Projects", value: data?.projects, tab: "portfolio" as Tab, icon: Images },
    { label: "Testimonials", value: data?.testimonials, tab: "testimonials" as Tab, icon: Quote },
    { label: "Stats Counters", value: data?.stats, tab: "content" as Tab, icon: BarChart3 },
    { label: "FAQ Entries", value: data?.faqs, tab: "content" as Tab, icon: FileText },
    { label: "Contact Messages", value: data?.messages, tab: "messages" as Tab, icon: Inbox },
  ];
  return (
    <div className="space-y-6">
      <AdminCard title="Welcome to your control panel" desc="Everything on your public website is editable from here. Changes appear on the live site as soon as you save.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Edit your text", d: "Hero, about, mission, process, FAQ and footer copy.", tab: "content" as Tab },
            { t: "Manage services", d: "Add, edit, reorder or remove services in all three categories.", tab: "services" as Tab },
            { t: "Update pricing", d: "Change prices, features and the Most Popular badge.", tab: "pricing" as Tab },
            { t: "Portfolio & images", d: "Add projects and upload photos for the site.", tab: "portfolio" as Tab },
            { t: "SEO settings", d: "Page title, description, keywords and social image.", tab: "seo" as Tab },
            { t: "Company details", d: "Email, phone, WhatsApp number, hours and socials.", tab: "settings" as Tab },
          ].map((x) => (
            <button key={x.t} onClick={() => go(x.tab)} className="sdt-card rounded-xl p-4 text-left">
              <h3 className="text-sm font-bold text-white">{x.t}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{x.d}</p>
            </button>
          ))}
        </div>
      </AdminCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <button key={c.label} onClick={() => go(c.tab)} className="sdt-card rounded-xl p-5 text-left">
            <c.icon className="mb-3 h-5 w-5 text-sky-400" />
            <div className="text-2xl font-extrabold text-white">{isLoading ? "—" : c.value ?? 0}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Content ──────────────────────────────────────────────────────────────────

function ContentTab() {
  const utils = trpc.useUtils();
  const { data } = trpc.site.settings.useQuery();
  const [f, setF] = useState<Record<string, unknown> | null>(null);
  const { saved, flash } = useSavedFlash();
  const [err, setErr] = useState("");
  const save = trpc.settings.update.useMutation({
    onSuccess: () => { flash(); void utils.site.content.invalidate(); void utils.site.settings.invalidate(); },
    onError: (e) => setErr(e.message),
  });

  useEffect(() => { if (data && !f) setF({ ...data }); }, [data, f]);
  if (!f) return <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /></div>;

  const g = (k: string) => (f[k] as string) ?? "";
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });

  return (
    <div className="space-y-6">
      <AdminCard title="Hero section" desc="The first thing visitors see.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline" value={g("heroHeadline")} onChange={(v) => set("heroHeadline", v)} />
          <Field label="Tagline" value={g("heroTagline")} onChange={(v) => set("heroTagline", v)} />
          <Field label="Primary button label" value={g("heroCtaPrimary")} onChange={(v) => set("heroCtaPrimary", v)} />
          <Field label="Secondary button label" value={g("heroCtaSecondary")} onChange={(v) => set("heroCtaSecondary", v)} />
        </div>
        <div className="mt-4">
          <Area label="Intro paragraph" value={g("heroIntro")} onChange={(v) => set("heroIntro", v)} rows={3} />
        </div>
      </AdminCard>

      <AdminCard title="About section" desc="Who you are, your mission and vision.">
        <div className="space-y-4">
          <Field label="About heading" value={g("aboutHeading")} onChange={(v) => set("aboutHeading", v)} />
          <Area label="About text" value={g("aboutBody")} onChange={(v) => set("aboutBody", v)} rows={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Area label="Mission" value={g("mission")} onChange={(v) => set("mission", v)} rows={3} />
            <Area label="Vision" value={g("vision")} onChange={(v) => set("vision", v)} rows={3} />
          </div>
          <PairListEditor label="Why Choose Us" items={(f.whyChooseUs as { title: string; description: string }[]) ?? []} onChange={(v) => set("whyChooseUs", v)} />
        </div>
      </AdminCard>

      <AdminCard title="Process steps" desc="Your 'How We Work' section.">
        <PairListEditor label="Steps" items={(f.processSteps as { title: string; description: string }[]) ?? []} onChange={(v) => set("processSteps", v)} titleLabel="Step title" descLabel="Step description" />
      </AdminCard>

      <AdminCard title="Pricing note" desc="Shown under the pricing section.">
        <Area label="Note" value={g("pricingNote")} onChange={(v) => set("pricingNote", v)} rows={3} />
      </AdminCard>

      <AdminCard title="Footer" desc="Bottom of every page.">
        <div className="space-y-4">
          <Area label="Footer description" value={g("footerDescription")} onChange={(v) => set("footerDescription", v)} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Copyright line" value={g("footerCopyright")} onChange={(v) => set("footerCopyright", v)} />
            <Field label="Credit line" value={g("footerCredit")} onChange={(v) => set("footerCredit", v)} />
          </div>
        </div>
      </AdminCard>

      <FaqEditor />

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-sky-400/20 bg-[#0a1633]/95 p-3 backdrop-blur">
        <SaveButton onClick={() => { setErr(""); save.mutate(f as never); }} pending={save.isPending} saved={saved} />
        <span className="text-xs text-slate-500">Saves all text content above.</span>
      </div>
      <ErrorNote msg={err} />
    </div>
  );
}

function FaqEditor() {
  const utils = trpc.useUtils();
  const { data } = trpc.faqs.list.useQuery();
  const [items, setItems] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [dirty, setDirty] = useState(false);
  const { saved, flash } = useSavedFlash();
  const [err, setErr] = useState("");

  useEffect(() => { if (data && !dirty) setItems(data.map((x) => ({ id: x.id, question: x.question, answer: x.answer }))); }, [data, dirty]);

  const create = trpc.faqs.create.useMutation();
  const update = trpc.faqs.update.useMutation();
  const remove = trpc.faqs.remove.useMutation();

  async function saveAll() {
    setErr("");
    try {
      for (let i = 0; i < items.length; i++) {
        await update.mutateAsync({ id: items[i].id, question: items[i].question, answer: items[i].answer, sortOrder: i });
      }
      setDirty(false);
      flash();
      void utils.site.content.invalidate();
      void utils.faqs.list.invalidate();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
  }

  return (
    <AdminCard
      title="FAQ"
      desc="Questions and answers shown in the accordion."
      actions={
        <button
          onClick={async () => {
            const r = await create.mutateAsync({ question: "New question", answer: "", sortOrder: items.length });
            setItems([...items, { id: r!.id, question: r!.question, answer: r!.answer }]);
            setDirty(true);
          }}
          className="sdt-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" /> Add question
        </button>
      }
    >
      <div className="space-y-3">
        {items.length === 0 && <p className="rounded-lg border border-dashed border-sky-400/20 p-4 text-sm text-slate-500">No FAQ entries yet.</p>}
        {items.map((it, i) => (
          <div key={it.id} className="rounded-lg border border-sky-400/15 bg-[#060d1f] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
              <div className="flex gap-1">
                <button onClick={() => { const n = [...items]; if (i > 0) { [n[i - 1], n[i]] = [n[i], n[i - 1]]; setItems(n); setDirty(true); } }} aria-label="Move up" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => { const n = [...items]; if (i < n.length - 1) { [n[i + 1], n[i]] = [n[i], n[i + 1]]; setItems(n); setDirty(true); } }} aria-label="Move down" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button onClick={async () => { await remove.mutateAsync({ id: it.id }); setItems(items.filter((x) => x.id !== it.id)); void utils.site.content.invalidate(); }} aria-label="Delete" className="rounded p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <input value={it.question} onChange={(e) => { setItems(items.map((x, k) => k === i ? { ...x, question: e.target.value } : x)); setDirty(true); }} placeholder="Question"
              className="mb-2 w-full rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
            <textarea value={it.answer} onChange={(e) => { setItems(items.map((x, k) => k === i ? { ...x, answer: e.target.value } : x)); setDirty(true); }} placeholder="Answer" rows={2}
              className="w-full resize-y rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <SaveButton onClick={saveAll} pending={update.isPending} saved={saved} label="Save FAQ" />
        {dirty && <span className="text-xs text-amber-400">Unsaved changes</span>}
      </div>
      <ErrorNote msg={err} />
    </AdminCard>
  );
}

// ── Services ─────────────────────────────────────────────────────────────────

function ServicesTab() {
  const utils = trpc.useUtils();
  const { data } = trpc.services.list.useQuery();
  const [cat, setCat] = useState<CategoryId>(CATEGORIES[0].id);
  const [err, setErr] = useState("");
  const create = trpc.services.create.useMutation();
  const update = trpc.services.update.useMutation();
  const remove = trpc.services.remove.useMutation();
  const reorder = trpc.services.reorder.useMutation();

  const items = useMemo(() => (data ?? []).filter((s) => s.category === cat), [data, cat]);
  const refresh = () => { void utils.site.content.invalidate(); void utils.services.list.invalidate(); };

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    await reorder.mutateAsync({ ids: next.map((x) => x.id) });
    refresh();
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Services"
        desc="Add, edit, reorder or delete services. Order here is the order on your site."
        actions={
          <button
            onClick={async () => { setErr(""); try { await create.mutateAsync({ category: cat, name: "New service", description: "", sortOrder: items.length }); refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } }}
            className="sdt-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" /> Add service
          </button>
        }
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${cat === c.id ? "border-sky-400 bg-sky-500/20 text-white" : "border-sky-400/15 text-slate-400 hover:text-white"}`}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {items.length === 0 && <p className="rounded-lg border border-dashed border-sky-400/20 p-4 text-sm text-slate-500">No services in this category yet.</p>}
          {items.map((s, i) => (
            <div key={s.id} className="rounded-lg border border-sky-400/15 bg-[#060d1f] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
                <div className="flex gap-1">
                  <button onClick={() => void move(i, -1)} aria-label="Move up" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => void move(i, 1)} aria-label="Move down" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronDown className="h-3.5 w-3.5" /></button>
                  <button onClick={async () => { await remove.mutateAsync({ id: s.id }); refresh(); }} aria-label="Delete" className="rounded p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <input defaultValue={s.name} onBlur={(e) => { if (e.target.value !== s.name) void update.mutateAsync({ id: s.id, name: e.target.value }).then(refresh); }} placeholder="Service name"
                className="mb-2 w-full rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
              <textarea defaultValue={s.description} onBlur={(e) => { if (e.target.value !== s.description) void update.mutateAsync({ id: s.id, description: e.target.value }).then(refresh); }} placeholder="Short description" rows={2}
                className="w-full resize-y rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">Edits save automatically when you click away from a field.</p>
        <ErrorNote msg={err} />
      </AdminCard>
    </div>
  );
}

// ── Pricing ──────────────────────────────────────────────────────────────────

function PricingTab() {
  const utils = trpc.useUtils();
  const { data } = trpc.pricing.list.useQuery();
  const [cat, setCat] = useState<CategoryId>(CATEGORIES[0].id);
  const [err, setErr] = useState("");
  const create = trpc.pricing.create.useMutation();
  const update = trpc.pricing.update.useMutation();
  const remove = trpc.pricing.remove.useMutation();
  const setPopular = trpc.pricing.setPopular.useMutation();

  const items = useMemo(() => (data ?? []).filter((p) => p.category === cat), [data, cat]);
  const refresh = () => { void utils.site.content.invalidate(); void utils.pricing.list.invalidate(); };

  return (
    <div className="space-y-6">
      <AdminCard
        title="Pricing packages"
        desc="Change prices, features and the Most Popular badge. Only one package per category can be Most Popular."
        actions={
          <button
            onClick={async () => { setErr(""); try { await create.mutateAsync({ category: cat, name: "New package", priceNgn: "₦0", priceUsd: "~$0", features: [], sortOrder: items.length }); refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } }}
            className="sdt-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" /> Add package
          </button>
        }
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${cat === c.id ? "border-sky-400 bg-sky-500/20 text-white" : "border-sky-400/15 text-slate-400 hover:text-white"}`}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {items.length === 0 && <p className="rounded-lg border border-dashed border-sky-400/20 p-4 text-sm text-slate-500">No packages in this category yet.</p>}
          {items.map((p) => (
            <div key={p.id} className="rounded-lg border border-sky-400/15 bg-[#060d1f] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <Toggle label="Most Popular" checked={p.isPopular} onChange={async (v) => { await setPopular.mutateAsync({ id: p.id, isPopular: v }); refresh(); }} />
                <button onClick={async () => { await remove.mutateAsync({ id: p.id }); refresh(); }} aria-label="Delete" className="rounded p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input defaultValue={p.name} onBlur={(e) => { if (e.target.value !== p.name) void update.mutateAsync({ id: p.id, name: e.target.value }).then(refresh); }} placeholder="Package name"
                  className="rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
                <input defaultValue={p.priceNgn} onBlur={(e) => { if (e.target.value !== p.priceNgn) void update.mutateAsync({ id: p.id, priceNgn: e.target.value }).then(refresh); }} placeholder="₦ price"
                  className="rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
                <input defaultValue={p.priceUsd} onBlur={(e) => { if (e.target.value !== p.priceUsd) void update.mutateAsync({ id: p.id, priceUsd: e.target.value }).then(refresh); }} placeholder="~$ price"
                  className="rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
              </div>
              <div className="mt-3">
                <StringListEditor label="Features" items={p.features} placeholder="Feature"
                  onChange={async (v) => { await update.mutateAsync({ id: p.id, features: v }); refresh(); }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">Edits save automatically when you click away from a field.</p>
        <ErrorNote msg={err} />
      </AdminCard>
    </div>
  );
}

// ── Portfolio ────────────────────────────────────────────────────────────────

function PortfolioTab() {
  const utils = trpc.useUtils();
  const { data } = trpc.projects.list.useQuery();
  const [err, setErr] = useState("");
  const create = trpc.projects.create.useMutation();
  const update = trpc.projects.update.useMutation();
  const remove = trpc.projects.remove.useMutation();
  const refresh = () => { void utils.site.content.invalidate(); void utils.projects.list.invalidate(); };

  return (
    <AdminCard
      title="Portfolio projects"
      desc="Add projects, upload images, set the category tag and description."
      actions={
        <button
          onClick={async () => { setErr(""); try { await create.mutateAsync({ title: "New project", category: CATEGORIES[0].id, description: "", sortOrder: (data ?? []).length }); refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } }}
          className="sdt-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5" /> Add project
        </button>
      }
    >
      <div className="space-y-4">
        {(data ?? []).length === 0 && <p className="rounded-lg border border-dashed border-sky-400/20 p-4 text-sm text-slate-500">No projects yet — click Add project.</p>}
        {(data ?? []).map((p) => (
          <div key={p.id} className="rounded-lg border border-sky-400/15 bg-[#060d1f] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300">{categoryLabel(p.category)}</span>
              <button onClick={async () => { await remove.mutateAsync({ id: p.id }); refresh(); }} aria-label="Delete" className="rounded p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <input defaultValue={p.title} onBlur={(e) => { if (e.target.value !== p.title) void update.mutateAsync({ id: p.id, title: e.target.value }).then(refresh); }} placeholder="Project title"
                  className="w-full rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
                <select defaultValue={p.category} onChange={async (e) => { await update.mutateAsync({ id: p.id, category: e.target.value as never }); refresh(); }}
                  className="w-full rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/60">
                  {CAT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <textarea defaultValue={p.description} onBlur={(e) => { if (e.target.value !== p.description) void update.mutateAsync({ id: p.id, description: e.target.value }).then(refresh); }} placeholder="Short description" rows={3}
                  className="w-full resize-y rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
                <input defaultValue={p.link ?? ""} onBlur={(e) => { if (e.target.value !== (p.link ?? "")) void update.mutateAsync({ id: p.id, link: e.target.value || null }).then(refresh); }} placeholder="External link (optional)"
                  className="w-full rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
              </div>
              <ImageField label="Project image" value={p.image} hint="PNG, JPG, WebP or GIF."
                onChange={async (v) => { await update.mutateAsync({ id: p.id, image: v }); refresh(); }} />
            </div>
          </div>
        ))}
      </div>
      <ErrorNote msg={err} />
    </AdminCard>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsTab() {
  const utils = trpc.useUtils();
  const { data } = trpc.testimonials.list.useQuery();
  const [err, setErr] = useState("");
  const create = trpc.testimonials.create.useMutation();
  const update = trpc.testimonials.update.useMutation();
  const remove = trpc.testimonials.remove.useMutation();
  const refresh = () => { void utils.site.content.invalidate(); void utils.testimonials.list.invalidate(); };

  return (
    <AdminCard
      title="Testimonials"
      desc="Client reviews shown on your site."
      actions={
        <button
          onClick={async () => { setErr(""); try { await create.mutateAsync({ clientName: "New client", businessName: "", rating: 5, reviewText: "", sortOrder: (data ?? []).length }); refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } }}
          className="sdt-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5" /> Add review
        </button>
      }
    >
      <div className="space-y-4">
        {(data ?? []).length === 0 && <p className="rounded-lg border border-dashed border-sky-400/20 p-4 text-sm text-slate-500">No testimonials yet.</p>}
        {(data ?? []).map((t) => (
          <div key={t.id} className="rounded-lg border border-sky-400/15 bg-[#060d1f] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={async () => { await update.mutateAsync({ id: t.id, rating: n }); refresh(); }} aria-label={`${n} stars`}>
                    <Star className={`h-4 w-4 ${n <= t.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                  </button>
                ))}
              </div>
              <button onClick={async () => { await remove.mutateAsync({ id: t.id }); refresh(); }} aria-label="Delete" className="rounded p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <input defaultValue={t.clientName} onBlur={(e) => { if (e.target.value !== t.clientName) void update.mutateAsync({ id: t.id, clientName: e.target.value }).then(refresh); }} placeholder="Client name"
                  className="w-full rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
                <input defaultValue={t.businessName} onBlur={(e) => { if (e.target.value !== t.businessName) void update.mutateAsync({ id: t.id, businessName: e.target.value }).then(refresh); }} placeholder="Business name"
                  className="w-full rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
                <textarea defaultValue={t.reviewText} onBlur={(e) => { if (e.target.value !== t.reviewText) void update.mutateAsync({ id: t.id, reviewText: e.target.value }).then(refresh); }} placeholder="Review text" rows={3}
                  className="w-full resize-y rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
              </div>
              <ImageField label="Client photo" value={t.photo} hint="Optional — a letter avatar is used if empty."
                onChange={async (v) => { await update.mutateAsync({ id: t.id, photo: v }); refresh(); }} />
            </div>
          </div>
        ))}
      </div>
      <ErrorNote msg={err} />
    </AdminCard>
  );
}

// ── Media (stats + branding) ─────────────────────────────────────────────────

function MediaTab() {
  const utils = trpc.useUtils();
  const { data: stats } = trpc.stats.list.useQuery();
  const { data: settings } = trpc.site.settings.useQuery();
  const [err, setErr] = useState("");
  const create = trpc.stats.create.useMutation();
  const update = trpc.stats.update.useMutation();
  const remove = trpc.stats.remove.useMutation();
  const saveSettings = trpc.settings.update.useMutation();
  const refresh = () => { void utils.site.content.invalidate(); void utils.stats.list.invalidate(); void utils.site.settings.invalidate(); };

  return (
    <div className="space-y-6">
      <AdminCard
        title="Stats counters"
        desc="The animated numbers on your site. Use a number plus a suffix, e.g. 50+ or 24/7."
        actions={
          <button onClick={async () => { setErr(""); try { await create.mutateAsync({ label: "New stat", value: "0", sortOrder: (stats ?? []).length }); refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } }}
            className="sdt-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Add stat
          </button>
        }
      >
        <div className="space-y-3">
          {(stats ?? []).length === 0 && <p className="rounded-lg border border-dashed border-sky-400/20 p-4 text-sm text-slate-500">No stats yet.</p>}
          {(stats ?? []).map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-sky-400/15 bg-[#060d1f] p-3">
              <input defaultValue={s.value} onBlur={(e) => { if (e.target.value !== s.value) void update.mutateAsync({ id: s.id, value: e.target.value }).then(refresh); }} placeholder="50+"
                className="w-24 rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
              <input defaultValue={s.label} onBlur={(e) => { if (e.target.value !== s.label) void update.mutateAsync({ id: s.id, label: e.target.value }).then(refresh); }} placeholder="Label"
                className="min-w-[180px] flex-1 rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
              <button onClick={async () => { await remove.mutateAsync({ id: s.id }); refresh(); }} aria-label="Delete" className="rounded p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <ErrorNote msg={err} />
      </AdminCard>

      <AdminCard title="Branding images" desc="Your logo and favicon.">
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageField label="Logo" value={settings?.logo ?? null} hint="Shown in the header and footer."
            onChange={async (v) => { await saveSettings.mutateAsync({ logo: v }); refresh(); }} />
          <ImageField label="Favicon" value={settings?.favicon ?? null} hint="The small icon in the browser tab."
            onChange={async (v) => { await saveSettings.mutateAsync({ favicon: v }); refresh(); }} />
        </div>
      </AdminCard>

      <AdminCard title="Hero image" desc="Optional image for the hero section.">
        <ImageField label="Hero image" value={settings?.heroImage ?? null} hint="Leave empty to use the animated background."
          onChange={async (v) => { await saveSettings.mutateAsync({ heroImage: v }); refresh(); }} />
      </AdminCard>
    </div>
  );
}

// ── SEO ──────────────────────────────────────────────────────────────────────

function SeoTab() {
  const utils = trpc.useUtils();
  const { data } = trpc.site.settings.useQuery();
  const [f, setF] = useState<Record<string, unknown> | null>(null);
  const { saved, flash } = useSavedFlash();
  const [err, setErr] = useState("");
  const save = trpc.settings.update.useMutation({
    onSuccess: () => { flash(); void utils.site.content.invalidate(); void utils.site.settings.invalidate(); },
    onError: (e) => setErr(e.message),
  });
  useEffect(() => { if (data && !f) setF({ ...data }); }, [data, f]);
  if (!f) return <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /></div>;
  const g = (k: string) => (f[k] as string) ?? "";

  return (
    <div className="space-y-6">
      <AdminCard title="SEO settings" desc="How your site appears in search results and when shared.">
        <div className="space-y-4">
          <Field label="Page title" value={g("seoTitle")} onChange={(v) => setF({ ...f, seoTitle: v })} hint="Shown in the browser tab and search results." />
          <Area label="Meta description" value={g("seoDescription")} onChange={(v) => setF({ ...f, seoDescription: v })} rows={3} hint="Aim for 150–160 characters." />
          <Field label="Keywords" value={g("seoKeywords")} onChange={(v) => setF({ ...f, seoKeywords: v })} hint="Comma-separated." />
          <ImageField label="Open Graph image" value={(f.seoOgImage as string) ?? null} hint="Shown when your site is shared on social media."
            onChange={(v) => setF({ ...f, seoOgImage: v })} />
        </div>
        <div className="mt-5">
          <SaveButton onClick={() => { setErr(""); save.mutate(f as never); }} pending={save.isPending} saved={saved} label="Save SEO settings" />
        </div>
        <ErrorNote msg={err} />
      </AdminCard>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

function SettingsTab() {
  const utils = trpc.useUtils();
  const { data } = trpc.site.settings.useQuery();
  const [f, setF] = useState<Record<string, unknown> | null>(null);
  const { saved, flash } = useSavedFlash();
  const [err, setErr] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const save = trpc.settings.update.useMutation({
    onSuccess: () => { flash(); void utils.site.content.invalidate(); void utils.site.settings.invalidate(); },
    onError: (e) => setErr(e.message),
  });
  const reset = trpc.admin.reset.useMutation({
    onSuccess: () => { void utils.invalidate(); window.location.reload(); },
    onError: (e) => setErr(e.message),
  });
  useEffect(() => { if (data && !f) setF({ ...data }); }, [data, f]);
  if (!f) return <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /></div>;
  const g = (k: string) => (f[k] as string) ?? "";
  const socials = (f.socials as { label: string; url: string }[]) ?? [];

  return (
    <div className="space-y-6">
      <AdminCard title="Company details" desc="Used across the site, including every WhatsApp link.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" value={g("companyName")} onChange={(v) => setF({ ...f, companyName: v })} />
          <Field label="Business hours" value={g("businessHours")} onChange={(v) => setF({ ...f, businessHours: v })} />
          <Field label="Email" value={g("email")} onChange={(v) => setF({ ...f, email: v })} />
          <Field label="Phone" value={g("phone")} onChange={(v) => setF({ ...f, phone: v })} />
          <Field label="WhatsApp number" value={g("whatsappNumber")} onChange={(v) => setF({ ...f, whatsappNumber: v })} hint="Digits only, with country code — e.g. 2348169781185." />
        </div>
      </AdminCard>

      <AdminCard title="CEO / Founder" desc="Shown in the About section.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={g("ceoName")} onChange={(v) => setF({ ...f, ceoName: v })} />
          <Field label="Title" value={g("ceoTitle")} onChange={(v) => setF({ ...f, ceoTitle: v })} />
        </div>
        <div className="mt-4">
          <Area label="Short bio" value={g("ceoBio")} onChange={(v) => setF({ ...f, ceoBio: v })} rows={4} />
        </div>
        <div className="mt-4">
          <ImageField label="CEO photo" value={(f.ceoPhoto as string) ?? null} onChange={(v) => setF({ ...f, ceoPhoto: v })} />
        </div>
      </AdminCard>

      <AdminCard title="Social media links" desc="Leave a URL empty to hide that icon.">
        <div className="space-y-3">
          {socials.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3">
              <input value={s.label} onChange={(e) => setF({ ...f, socials: socials.map((x, k) => k === i ? { ...x, label: e.target.value } : x) })} placeholder="Label"
                className="w-32 rounded-md border border-sky-400/20 bg-[#060d1f] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
              <input value={s.url} onChange={(e) => setF({ ...f, socials: socials.map((x, k) => k === i ? { ...x, url: e.target.value } : x) })} placeholder="https://…"
                className="min-w-[200px] flex-1 rounded-md border border-sky-400/20 bg-[#060d1f] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
              <button onClick={() => setF({ ...f, socials: socials.filter((_, k) => k !== i) })} aria-label="Delete" className="rounded p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={() => setF({ ...f, socials: [...socials, { label: "New", url: "" }] })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300">
            <Plus className="h-3.5 w-3.5" /> Add social link
          </button>
        </div>
      </AdminCard>

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-sky-400/20 bg-[#0a1633]/95 p-3 backdrop-blur">
        <SaveButton onClick={() => { setErr(""); save.mutate(f as never); }} pending={save.isPending} saved={saved} label="Save settings" />
      </div>
      <ErrorNote msg={err} />

      <AdminCard title="Reset to default" desc="Deletes all content and restores the original defaults. This cannot be undone.">
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-amber-300">Are you sure? All your edits will be lost.</span>
            <button onClick={() => reset.mutate()} disabled={reset.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-60">
              {reset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Yes, reset everything
            </button>
            <button onClick={() => setConfirmReset(false)} className="sdt-btn-ghost rounded-lg px-4 py-2.5 text-sm font-semibold">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10">
            <RotateCcw className="h-4 w-4" /> Reset to default
          </button>
        )}
      </AdminCard>
    </div>
  );
}

// ── Messages ─────────────────────────────────────────────────────────────────

function MessagesTab() {
  const utils = trpc.useUtils();
  const { data } = trpc.contact.list.useQuery();
  const remove = trpc.contact.remove.useMutation({ onSuccess: () => void utils.contact.list.invalidate() });

  return (
    <AdminCard title="Contact messages" desc="Messages sent through the contact form on your site.">
      {(data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-sky-400/20 p-10 text-center">
          <Inbox className="mx-auto mb-3 h-7 w-7 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">No messages yet</p>
          <p className="mt-1 text-xs text-slate-500">When someone fills in the contact form, their message will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((m) => (
            <div key={m.id} className="rounded-lg border border-sky-400/15 bg-[#060d1f] p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white">{m.name}</div>
                  <div className="text-xs text-slate-400">
                    {[m.email, m.phone].filter(Boolean).join(" · ")}
                    {m.service ? ` · ${m.service}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
                  <button onClick={() => remove.mutate({ id: m.id })} aria-label="Delete" className="rounded p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {m.message && <p className="text-sm leading-relaxed text-slate-300">{m.message}</p>}
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

export default function Admin() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { document.title = "Site Control — Sholab Dex Tech"; }, []);
  useEffect(() => { setNavOpen(false); window.scrollTo({ top: 0 }); }, [tab]);

  const body = useMemo(() => {
    switch (tab) {
      case "dashboard": return <Dashboard go={setTab} />;
      case "content": return <ContentTab />;
      case "services": return <ServicesTab />;
      case "pricing": return <PricingTab />;
      case "portfolio": return <PortfolioTab />;
      case "testimonials": return <TestimonialsTab />;
      case "media": return <MediaTab />;
      case "seo": return <SeoTab />;
      case "settings": return <SettingsTab />;
      case "messages": return <MessagesTab />;
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-[#060d1f]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-sky-400/15 bg-[#0a1633]/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen((v) => !v)} aria-label="Toggle menu" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden">
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white">SD</span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-white">Site Control</div>
                <div className="text-[11px] text-slate-400">Sholab Dex Tech</div>
              </div>
            </div>
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer" className="sdt-btn-ghost inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold">
            <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View Site</span>
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar */}
        <aside className={`${navOpen ? "block" : "hidden"} fixed inset-x-0 top-16 z-30 border-b border-sky-400/15 bg-[#0a1633] p-3 lg:sticky lg:top-24 lg:block lg:w-56 lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0`}>
          <nav className="space-y-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  tab === t.id ? "bg-sky-500/20 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}>
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3">
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-200/90">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This page has no login by design. Keep the URL private.
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">{body}</main>
      </div>
    </div>
  );
}
