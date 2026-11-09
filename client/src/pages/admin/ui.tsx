import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, AlertCircle, Upload, X, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { trpc } from "../../_core/trpc";

export function AdminCard({ title, desc, children, actions }: { title: string; desc?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-xl border border-sky-400/15 bg-[#0a1633]/60 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {desc && <p className="mt-1 text-sm text-slate-400">{desc}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, value, onChange, placeholder, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Area({ label, value, onChange, rows = 4, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/60"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-sky-500" : "bg-slate-700"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
      <span className="text-sm font-medium text-slate-200">{label}</span>
    </label>
  );
}

export function SaveButton({ onClick, pending, saved, label = "Save changes" }: {
  onClick: () => void; pending: boolean; saved: boolean; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="sdt-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
      {pending ? "Saving…" : saved ? "Saved ✓" : label}
    </button>
  );
}

export function ErrorNote({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      <AlertCircle className="h-4 w-4 shrink-0" /> {msg}
    </p>
  );
}

/** Image upload + preview + remove. Uploads through the platform storage flow. */
export function ImageField({ label, value, onChange, hint }: {
  label: string; value: string | null; onChange: (v: string | null) => void; hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadUrl = trpc.files.uploadUrl.useMutation();
  const commit = trpc.files.commit.useMutation();

  async function pick(file: File) {
    setErr("");
    setBusy(true);
    try {
      const { key, uploadUrl: put } = await uploadUrl.mutateAsync({ name: file.name, contentType: file.type || "image/png" });
      const res = await fetch(put, { method: "PUT", body: file, headers: { "Content-Type": file.type || "image/png" } });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const out = await commit.mutateAsync({ key, name: file.name });
      // storageCommit returns the file record (no publicPath); the served path
      // is the same one storagePutUrl advertises — /app-storage/<key>.
      onChange(`/app-storage/${out.key}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-sky-400/20 bg-[#060d1f]">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] uppercase tracking-wider text-slate-600">None</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="sdt-btn-ghost inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy ? "Uploading…" : value ? "Replace" : "Upload"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3.5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <X className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); }}
          />
          {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
          {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
        </div>
      </div>
    </div>
  );
}

/** A repeatable list of {title, description} pairs (why-choose-us, process steps). */
export function PairListEditor({ label, items, onChange, titleLabel = "Title", descLabel = "Description" }: {
  label: string; items: { title: string; description: string }[]; onChange: (v: { title: string; description: string }[]) => void;
  titleLabel?: string; descLabel?: string;
}) {
  const set = (i: number, patch: Partial<{ title: string; description: string }>) =>
    onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <button type="button" onClick={() => onChange([...items, { title: "", description: "" }])}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="rounded-lg border border-dashed border-sky-400/20 p-4 text-sm text-slate-500">Nothing here yet — click Add.</p>}
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-sky-400/15 bg-[#060d1f] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Delete" className="rounded p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <input value={it.title} onChange={(e) => set(i, { title: e.target.value })} placeholder={titleLabel}
              className="mb-2 w-full rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
            <textarea value={it.description} onChange={(e) => set(i, { description: e.target.value })} placeholder={descLabel} rows={2}
              className="w-full resize-y rounded-md border border-sky-400/20 bg-[#0a1633] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A repeatable list of plain strings (pricing features). */
export function StringListEditor({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <button type="button" onClick={() => onChange([...items, ""])}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input value={it} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} placeholder={placeholder}
              className="flex-1 rounded-md border border-sky-400/20 bg-[#060d1f] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" />
            <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Delete"
              className="rounded-md border border-red-500/25 px-2.5 text-red-400 transition hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Debounced "saved" flash. */
export function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);
  const flash = () => {
    setSaved(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setSaved(false), 2200);
  };
  return { saved, flash };
}
