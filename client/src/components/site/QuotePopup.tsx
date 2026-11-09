import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { X, MessageCircle, Check } from "lucide-react";
import { CATEGORIES, buildWhatsAppLink, categoryLabel } from "@shared/site";

export type QuotePreset = { service?: string; packageLabel?: string; category?: string };

type QuoteCtx = {
  open: (preset?: QuotePreset) => void;
  close: () => void;
};

const Ctx = createContext<QuoteCtx | null>(null);

export function useQuote() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useQuote must be used inside <QuoteProvider>");
  return c;
}

type ServiceOpt = { id: string; name: string; category: string };
type PkgOpt = { id: string; name: string; category: string; priceNgn: string; priceUsd: string };

export function QuoteProvider({
  children,
  companyName,
  whatsappNumber,
  services,
  packages,
}: {
  children: ReactNode;
  companyName: string;
  whatsappNumber: string;
  services: ServiceOpt[];
  packages: PkgOpt[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const [service, setService] = useState<string>("");
  const [pkgId, setPkgId] = useState<string>("");
  const [touched, setTouched] = useState(false);

  const open = useCallback((preset?: QuotePreset) => {
    if (preset?.category) setCategory(preset.category);
    if (preset?.service) setService(preset.service);
    if (preset?.packageLabel) {
      const match = packages.find((p) => `${p.name} (${p.priceNgn})` === preset.packageLabel || p.name === preset.packageLabel);
      if (match) {
        setPkgId(match.id);
        setCategory(match.category);
      }
    }
    setTouched(false);
    setIsOpen(true);
  }, [packages]);

  const close = useCallback(() => setIsOpen(false), []);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const catServices = useMemo(() => services.filter((s) => s.category === category), [services, category]);
  const catPackages = useMemo(() => packages.filter((p) => p.category === category), [packages, category]);

  const selectedPkg = packages.find((p) => p.id === pkgId);
  const packageLabel = selectedPkg ? `${selectedPkg.name} (${selectedPkg.priceNgn})` : "";

  const link = buildWhatsAppLink({
    number: whatsappNumber,
    companyName,
    name,
    service: service || categoryLabel(category),
    packageLabel,
  });

  const nameMissing = touched && !name.trim();

  function send() {
    setTouched(true);
    // Name is required, but if skipped we still send with the friendly default
    // greeting rather than blocking the visitor.
    window.open(link, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  }

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Get a quote on WhatsApp"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-sky-400/25 bg-[#0a1633] p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Get a Quote on WhatsApp</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Tell us your name and what you need — we'll open WhatsApp with your message ready to send.
                </p>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Name */}
            <label className="mb-1.5 block text-sm font-medium text-slate-200" htmlFor="qp-name">
              Your Name <span className="text-sky-400">*</span>
            </label>
            <input
              id="qp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John"
              autoComplete="name"
              className={`mb-1 w-full rounded-lg border bg-[#060d1f] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                nameMissing ? "border-red-500/70" : "border-sky-400/20"
              }`}
            />
            {nameMissing ? (
              <p className="mb-3 text-xs text-red-400">
                Please enter your name — or just tap Send and we'll greet you anyway.
              </p>
            ) : (
              <p className="mb-3 text-xs text-slate-500">Required — so we know who we're talking to.</p>
            )}

            {/* Category */}
            <p className="mb-1.5 text-sm font-medium text-slate-200">What do you need?</p>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setCategory(c.id); setService(""); setPkgId(""); }}
                  className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition ${
                    category === c.id
                      ? "border-sky-400 bg-sky-500/20 text-white"
                      : "border-sky-400/15 bg-[#060d1f] text-slate-300 hover:border-sky-400/40"
                  }`}
                >
                  <span className="mr-1">{c.icon}</span>
                  {c.short}
                </button>
              ))}
            </div>

            {/* Service */}
            <label className="mb-1.5 block text-sm font-medium text-slate-200" htmlFor="qp-service">
              Service
            </label>
            <select
              id="qp-service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="mb-3 w-full rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/60"
            >
              <option value="">{categoryLabel(category)} (general)</option>
              {catServices.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>

            {/* Package */}
            <label className="mb-1.5 block text-sm font-medium text-slate-200" htmlFor="qp-package">
              Package / Pricing
            </label>
            <select
              id="qp-package"
              value={pkgId}
              onChange={(e) => setPkgId(e.target.value)}
              className="mb-4 w-full rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/60"
            >
              <option value="">Not sure yet — send me options</option>
              {catPackages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.priceNgn} {p.priceUsd ? `(${p.priceUsd})` : ""}
                </option>
              ))}
            </select>

            {/* Preview */}
            <div className="mb-4 rounded-lg border border-sky-400/15 bg-[#060d1f] p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-sky-400">Message preview</p>
              <p className="text-xs leading-relaxed text-slate-300">
                {name.trim() ? `Hi ${companyName}, my name is ${name.trim()}.` : `Hi ${companyName},`}{" "}
                I am interested in {service || categoryLabel(category)}
                {packageLabel ? ` - ${packageLabel}` : ""}. Please send me more details and a quote.
              </p>
            </div>

            <button
              onClick={send}
              className="sdt-wa flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold"
            >
              <MessageCircle className="h-4 w-4" />
              Send on WhatsApp
            </button>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
              <Check className="h-3 w-3" /> Opens WhatsApp with your message already written
            </p>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
