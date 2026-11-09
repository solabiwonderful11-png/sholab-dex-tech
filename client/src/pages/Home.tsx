import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle, Mail, Phone, Clock, ArrowRight, Check, Star, ChevronDown,
  Globe, Bot, Megaphone, Sparkles, ShieldCheck, Zap, Users, Headphones, Palette,
  MapPin, Share2, AtSign, Link2, Music2, Send, Loader2,
} from "lucide-react";
import { trpc } from "../_core/trpc";
import { Nav } from "../components/site/Nav";
import { FloatingWhatsApp } from "../components/site/FloatingWhatsApp";
import { QuoteProvider, useQuote } from "../components/site/QuotePopup";
import { Reveal, useCountUp } from "../components/site/Reveal";
import { CATEGORIES, categoryLabel, categoryShort, buildWhatsAppLink } from "@shared/site";

const CAT_ICON: Record<string, typeof Globe> = { websites: Globe, automation: Bot, promotions: Megaphone };
const WHY_ICONS = [Zap, ShieldCheck, Palette, Sparkles, Headphones, Users];

function SectionHeading({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full border border-sky-400/25 bg-sky-500/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-300">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3.5 text-[15px] leading-relaxed text-slate-400">{sub}</p>}
    </Reveal>
  );
}

function StatCounter({ value, label }: { value: string; label: string }) {
  const m = value.match(/^(\d+)(.*)$/);
  const target = m ? parseInt(m[1], 10) : 0;
  const suffix = m ? m[2] : value;
  const { ref, value: n } = useCountUp(target);
  return (
    <div className="text-center">
      <div className="text-3xl font-extrabold text-white sm:text-4xl">
        {m ? <><span ref={ref}>{n}</span>{suffix}</> : value}
      </div>
      <div className="mt-1.5 text-xs font-medium uppercase tracking-wider text-sky-300/80 sm:text-sm">{label}</div>
    </div>
  );
}

function HeroParticles() {
  const dots = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({
      left: `${(i * 37) % 100}%`,
      bottom: `${(i * 23) % 60}%`,
      dur: `${9 + (i % 7) * 1.6}s`,
      delay: `${(i % 9) * 0.9}s`,
    })),
    [],
  );
  return (
    <>
      {dots.map((d, i) => (
        <span key={i} className="sdt-particle" style={{ left: d.left, bottom: d.bottom, animationDuration: d.dur, animationDelay: d.delay }} />
      ))}
    </>
  );
}

function Site() {
  const { data, isLoading, error } = trpc.site.content.useQuery();
  const { open: openQuote } = useQuote();
  const [filter, setFilter] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [sent, setSent] = useState(false);
  const [formErr, setFormErr] = useState("");

  const submit = trpc.contact.submit.useMutation({
    onSuccess: () => { setSent(true); setForm({ name: "", email: "", phone: "", service: "", message: "" }); },
    onError: (e) => setFormErr(e.message || "Something went wrong. Please try again."),
  });

  const s = data?.settings;
  const waNumber = s?.whatsappNumber ?? "2348169781185";
  const company = s?.companyName ?? "Sholab Dex Tech";

  // Apply SEO settings to the document head.
  useEffect(() => {
    if (!s) return;
    document.title = s.seoTitle || company;
    const set = (attr: "name" | "property", key: string, val: string) => {
      if (!val) return;
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", val);
    };
    set("name", "description", s.seoDescription);
    set("name", "keywords", s.seoKeywords);
    set("property", "og:title", s.seoTitle);
    set("property", "og:description", s.seoDescription);
    set("property", "og:type", "website");
    if (s.seoOgImage) set("property", "og:image", s.seoOgImage);
    if (s.favicon) {
      let link = document.head.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = s.favicon;
    }
  }, [s, company]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#060d1f]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !data || !s) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#060d1f] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-white">We couldn't load the site content</h1>
          <p className="mt-2 text-sm text-slate-400">
            Please refresh the page. If it keeps happening, the site content may need to be set up in the admin panel.
          </p>
          <a href="/sholab" className="sdt-btn-primary mt-5 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold">
            Open admin panel
          </a>
        </div>
      </div>
    );
  }

  const servicesByCat = CATEGORIES.map((c) => ({
    ...c,
    items: data.services.filter((x) => x.category === c.id),
  }));

  const pricingByCat = CATEGORIES.map((c) => ({
    ...c,
    items: data.pricing.filter((x) => x.category === c.id),
  }));

  const projects = filter === "all" ? data.projects : data.projects.filter((p) => p.category === filter);

  const socialIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("facebook")) return Share2;
    if (l.includes("instagram")) return AtSign;
    if (l.includes("linkedin")) return Link2;
    if (l.includes("tiktok")) return Music2;
    return Globe;
  };

  return (
    <div className="min-h-screen bg-[#060d1f]">
      <Nav companyName={company} ctaLabel={s.heroCtaPrimary} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section id="home" className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
        <div className="sdt-hero-bg">
          <div className="sdt-grid" />
          <div className="sdt-orb sdt-orb-1" />
          <div className="sdt-orb sdt-orb-2" />
          <div className="sdt-orb sdt-orb-3" />
          <HeroParticles />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                Websites • AI Automation • Business Promotions
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                <span className="sdt-gradient-text">{s.heroHeadline}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold text-sky-200/90 sm:text-xl">
                {s.heroTagline}
              </p>
            </Reveal>
            <Reveal delay={240}>
              <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-400 sm:text-base">
                {s.heroIntro}
              </p>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => openQuote()}
                  className="sdt-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold sm:w-auto"
                >
                  {s.heroCtaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href={buildWhatsAppLink({ number: waNumber, companyName: company })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sdt-btn-ghost inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  {s.heroCtaSecondary}
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      {data.stats.length > 0 && (
        <section className="border-y border-sky-400/10 bg-[#0a1633]/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
            {data.stats.map((st, i) => (
              <Reveal key={st.id} delay={i * 70}>
                <StatCounter value={st.value} label={st.label} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section id="services" className="sdt-section-alt py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Services"
            title="Everything your business needs to grow online"
            sub="Three areas of expertise, one team. Pick what you need — or let us handle the whole thing."
          />

          <div className="space-y-14">
            {servicesByCat.map((cat) => {
              const Icon = CAT_ICON[cat.id] ?? Globe;
              return (
                <div key={cat.id}>
                  <Reveal className="mb-6 flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white sm:text-2xl">{cat.label}</h3>
                      <p className="text-sm text-slate-400">{cat.items.length} services available</p>
                    </div>
                  </Reveal>

                  {cat.items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-sky-400/20 p-6 text-sm text-slate-500">
                      No services listed in this category yet.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {cat.items.map((sv, i) => (
                        <Reveal key={sv.id} delay={(i % 3) * 60}>
                          <div className="sdt-card flex h-full flex-col rounded-xl p-5">
                            <h4 className="text-[15px] font-bold text-white">{sv.name}</h4>
                            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{sv.description}</p>
                            <button
                              onClick={() => openQuote({ category: cat.id, service: sv.name })}
                              className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-sky-400 transition hover:text-sky-300"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Chat on WhatsApp
                            </button>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Reveal className="mt-14 text-center">
            <button
              onClick={() => openQuote()}
              className="sdt-btn-primary inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold"
            >
              {s.heroCtaPrimary}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── PORTFOLIO ────────────────────────────────────────────────────── */}
      <section id="portfolio" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Work"
            title="Projects we've delivered"
            sub="A selection of websites, automation systems and campaigns built for real businesses."
          />

          <Reveal className="mb-9 flex flex-wrap justify-center gap-2">
            {[{ id: "all", short: "All" }, ...CATEGORIES].map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  filter === c.id
                    ? "border-sky-400 bg-sky-500/20 text-white"
                    : "border-sky-400/15 text-slate-400 hover:border-sky-400/40 hover:text-white"
                }`}
              >
                {c.short}
              </button>
            ))}
          </Reveal>

          {projects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sky-400/20 p-10 text-center text-sm text-slate-500">
              No projects in this category yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 70}>
                  <article className="sdt-card group flex h-full flex-col overflow-hidden rounded-xl">
                    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#0f1e3d] to-[#0a1633]">
                      {p.image ? (
                        <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <div className="text-center">
                            <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-lg border border-sky-400/20 bg-sky-500/10">
                              {(() => { const I = CAT_ICON[p.category] ?? Globe; return <I className="h-5 w-5 text-sky-400" />; })()}
                            </div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Project image placeholder</p>
                          </div>
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-[#060d1f]/85 px-2.5 py-1 text-[11px] font-semibold text-sky-300 backdrop-blur">
                        {categoryShort(p.category)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-[15px] font-bold text-white">{p.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{p.description}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => openQuote({ category: p.category, service: categoryLabel(p.category) })}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 transition hover:text-sky-300"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Chat on WhatsApp
                        </button>
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-white">
                            View Project <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="sdt-section-alt py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Pricing"
            title="Clear pricing, no surprises"
            sub="Starting prices in Naira with USD equivalents. Every project is quoted to fit what you actually need."
          />

          <div className="space-y-14">
            {pricingByCat.map((cat) => (
              <div key={cat.id}>
                <Reveal className="mb-6">
                  <h3 className="text-xl font-bold text-white sm:text-2xl">{cat.label}</h3>
                </Reveal>
                {cat.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-sky-400/20 p-6 text-sm text-slate-500">
                    No packages listed in this category yet.
                  </p>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.items.map((pk, i) => (
                      <Reveal key={pk.id} delay={(i % 3) * 60}>
                        <div className={`sdt-card relative flex h-full flex-col rounded-xl p-6 ${pk.isPopular ? "border-sky-400/60 ring-1 ring-sky-400/30" : ""}`}>
                          {pk.isPopular && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                              Most Popular
                            </span>
                          )}
                          <h4 className="text-base font-bold text-white">{pk.name}</h4>
                          <div className="mt-3">
                            <div className="text-2xl font-extrabold text-white">{pk.priceNgn}</div>
                            {pk.priceUsd && <div className="text-sm font-medium text-sky-300">{pk.priceUsd}</div>}
                          </div>
                          {pk.features.length > 0 && (
                            <ul className="mt-4 flex-1 space-y-2">
                              {pk.features.map((f, k) => (
                                <li key={k} className="flex items-start gap-2 text-sm text-slate-300">
                                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )}
                          <button
                            onClick={() => openQuote({ category: cat.id, service: cat.label, packageLabel: `${pk.name} (${pk.priceNgn})` })}
                            className="sdt-wa mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold"
                          >
                            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                          </button>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <Reveal className="mt-14">
            <h3 className="mb-4 text-center text-lg font-bold text-white">What's included</h3>
            <div className="sdt-scroll-x overflow-x-auto rounded-xl border border-sky-400/15">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[#0a1633]">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-sky-300">Feature</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Starter</th>
                    <th className="px-4 py-3 font-semibold text-sky-300">Business</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Full / Custom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-400/10">
                  {[
                    ["Pages / scope", "3–5 pages", "6–10 pages", "Unlimited / custom"],
                    ["Mobile responsive", "✓", "✓", "✓"],
                    ["SEO setup", "Basic", "On-page", "Advanced"],
                    ["Contact forms", "✓", "✓", "✓"],
                    ["Payment integration", "—", "Optional", "✓"],
                    ["Automation / chatbot", "—", "1 workflow", "Multi-workflow"],
                    ["Dashboards & reporting", "—", "—", "✓"],
                    ["Support", "30 days", "60 days", "Ongoing"],
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 ? "bg-[#0a1633]/40" : ""}>
                      <td className="px-4 py-3 font-medium text-slate-200">{row[0]}</td>
                      <td className="px-4 py-3 text-slate-400">{row[1]}</td>
                      <td className="px-4 py-3 text-slate-300">{row[2]}</td>
                      <td className="px-4 py-3 text-slate-300">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {s.pricingNote && (
            <Reveal className="mt-6">
              <p className="mx-auto max-w-3xl rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-center text-sm leading-relaxed text-amber-200/90">
                {s.pricingNote}
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── PROCESS ──────────────────────────────────────────────────────── */}
      {s.processSteps.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="How We Work" title="A simple, clear process" sub="From first conversation to launch — you always know what's happening." />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {s.processSteps.map((step, i) => (
                <Reveal key={i} delay={i * 70}>
                  <div className="sdt-card relative h-full rounded-xl p-5">
                    <span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white">
                      {i + 1}
                    </span>
                    <h3 className="text-[15px] font-bold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT ────────────────────────────────────────────────────────── */}
      <section id="about" className="sdt-section-alt py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="mb-3 inline-block rounded-full border border-sky-400/25 bg-sky-500/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-300">
                About Us
              </span>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{s.aboutHeading}</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-slate-400">{s.aboutBody}</p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-sky-400/15 bg-[#0a1633]/60 p-5">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-sky-300">Our Mission</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{s.mission}</p>
                </div>
                <div className="rounded-xl border border-sky-400/15 bg-[#0a1633]/60 p-5">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-sky-300">Our Vision</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{s.vision}</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="sdt-card rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-sky-400/20 bg-gradient-to-br from-[#0f1e3d] to-[#0a1633]">
                    {s.ceoPhoto ? (
                      <img src={s.ceoPhoto} alt={s.ceoName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-center">
                        <span className="text-[9px] font-medium uppercase leading-tight tracking-wider text-slate-500">CEO<br />photo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{s.ceoName}</h3>
                    <p className="text-sm font-medium text-sky-300">{s.ceoTitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">{s.ceoBio}</p>
              </div>

              {s.whyChooseUs.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-sky-300">Why Choose Us</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {s.whyChooseUs.map((w, i) => {
                      const Icon = WHY_ICONS[i % WHY_ICONS.length];
                      return (
                        <div key={i} className="rounded-xl border border-sky-400/12 bg-[#0a1633]/50 p-4">
                          <Icon className="mb-2 h-4 w-4 text-sky-400" />
                          <h4 className="text-sm font-bold text-white">{w.title}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">{w.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      {data.testimonials.length > 0 && (
        <section id="testimonials" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Testimonials" title="What our clients say" sub="Real feedback from businesses we've worked with." />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.testimonials.map((t, i) => (
                <Reveal key={t.id} delay={(i % 3) * 70}>
                  <figure className="sdt-card flex h-full flex-col rounded-xl p-6">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: 5 }, (_, k) => (
                        <Star key={k} className={`h-4 w-4 ${k < t.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                      ))}
                    </div>
                    <blockquote className="flex-1 text-sm leading-relaxed text-slate-300">"{t.reviewText}"</blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-sky-400/10 pt-4">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-sky-400/20 bg-gradient-to-br from-[#0f1e3d] to-[#0a1633]">
                        {t.photo ? (
                          <img src={t.photo} alt={t.clientName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs font-bold text-sky-300">
                            {t.clientName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{t.clientName}</div>
                        <div className="text-xs text-slate-400">{t.businessName}</div>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {data.faqs.length > 0 && (
        <section id="faq" className="sdt-section-alt py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="FAQ" title="Frequently asked questions" sub="Everything you might want to know before getting started." />
            <div className="space-y-3">
              {data.faqs.map((f, i) => (
                <Reveal key={f.id} delay={Math.min(i, 5) * 40}>
                  <div className="overflow-hidden rounded-xl border border-sky-400/15 bg-[#0a1633]/50">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-white">{f.question}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-sky-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    {openFaq === i && (
                      <div className="border-t border-sky-400/10 px-5 py-4">
                        <p className="text-sm leading-relaxed text-slate-400">{f.answer}</p>
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ──────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Contact" title="Let's build something together" sub="Tell us what you need and we'll get back to you with the next steps and a quote." />

          <div className="grid gap-8 lg:grid-cols-5">
            {/* Form */}
            <Reveal className="lg:col-span-3">
              <div className="sdt-card rounded-2xl p-6 sm:p-7">
                {sent ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-green-500/15">
                      <Check className="h-7 w-7 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Message sent!</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
                      Thanks for reaching out. We've received your message and will get back to you shortly.
                    </p>
                    <button onClick={() => setSent(false)} className="sdt-btn-ghost mt-5 rounded-lg px-4 py-2 text-sm font-semibold">
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setFormErr("");
                      if (!form.name.trim()) { setFormErr("Please enter your name."); return; }
                      submit.mutate(form);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-slate-200">Name *</label>
                        <input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" placeholder="Your name" />
                      </div>
                      <div>
                        <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium text-slate-200">Email</label>
                        <input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" placeholder="you@example.com" />
                      </div>
                      <div>
                        <label htmlFor="c-phone" className="mb-1.5 block text-sm font-medium text-slate-200">Phone</label>
                        <input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60" placeholder="+234…" />
                      </div>
                      <div>
                        <label htmlFor="c-service" className="mb-1.5 block text-sm font-medium text-slate-200">Service Needed</label>
                        <select id="c-service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}
                          className="w-full rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/60">
                          <option value="">Select a service…</option>
                          {CATEGORIES.map((c) => (
                            <optgroup key={c.id} label={c.label}>
                              {data.services.filter((x) => x.category === c.id).map((x) => (
                                <option key={x.id} value={x.name}>{x.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="c-msg" className="mb-1.5 block text-sm font-medium text-slate-200">Message</label>
                      <textarea id="c-msg" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full resize-y rounded-lg border border-sky-400/20 bg-[#060d1f] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                        placeholder="Tell us a bit about your project…" />
                    </div>
                    {formErr && <p className="text-sm text-red-400">{formErr}</p>}
                    <button type="submit" disabled={submit.isPending}
                      className="sdt-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold disabled:opacity-60 sm:w-auto">
                      {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {submit.isPending ? "Sending…" : "Send Message"}
                    </button>
                  </form>
                )}
              </div>
            </Reveal>

            {/* Details */}
            <Reveal delay={120} className="lg:col-span-2">
              <div className="space-y-4">
                <a href={`mailto:${s.email}`} className="sdt-card flex items-start gap-3.5 rounded-xl p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-500/15"><Mail className="h-4 w-4 text-sky-400" /></span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</div>
                    <div className="truncate text-sm font-medium text-white">{s.email}</div>
                  </div>
                </a>
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="sdt-card flex items-start gap-3.5 rounded-xl p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-500/15"><Phone className="h-4 w-4 text-sky-400" /></span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</div>
                    <div className="text-sm font-medium text-white">{s.phone}</div>
                  </div>
                </a>
                <button onClick={() => openQuote()} className="sdt-wa flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold">
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </button>
                <div className="sdt-card flex items-start gap-3.5 rounded-xl p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-500/15"><Clock className="h-4 w-4 text-sky-400" /></span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business Hours</div>
                    <div className="text-sm font-medium text-white">{s.businessHours}</div>
                  </div>
                </div>

                {s.socials.length > 0 && (
                  <div className="sdt-card rounded-xl p-5">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Follow Us</div>
                    <div className="flex flex-wrap gap-2">
                      {s.socials.map((so, i) => {
                        const Icon = socialIcon(so.label);
                        return (
                          <a key={i} href={so.url || "#"} target="_blank" rel="noopener noreferrer" aria-label={so.label}
                            className="grid h-10 w-10 place-items-center rounded-lg border border-sky-400/20 bg-[#0a1633] text-slate-300 transition hover:border-sky-400/50 hover:text-sky-300">
                            <Icon className="h-4 w-4" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="sdt-card overflow-hidden rounded-xl">
                  <div className="grid h-40 place-items-center bg-gradient-to-br from-[#0f1e3d] to-[#0a1633]">
                    <div className="text-center">
                      <MapPin className="mx-auto mb-2 h-6 w-6 text-sky-400" />
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Map placeholder</p>
                      <p className="mt-1 text-xs text-slate-500">Embed Google Maps here</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-sky-400/12 bg-[#0a1633]/70">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white">SD</span>
                <span className="text-base font-bold text-white">{company}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">{s.footerDescription}</p>
              {s.socials.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {s.socials.map((so, i) => {
                    const Icon = socialIcon(so.label);
                    return (
                      <a key={i} href={so.url || "#"} target="_blank" rel="noopener noreferrer" aria-label={so.label}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-sky-400/20 text-slate-400 transition hover:border-sky-400/50 hover:text-sky-300">
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Quick Links</h3>
              <ul className="space-y-2.5">
                {["Home", "Services", "Portfolio", "Pricing", "About", "Testimonials", "FAQ", "Contact"].map((l) => (
                  <li key={l}>
                    <a href={`#${l.toLowerCase()}`} className="text-sm text-slate-400 transition hover:text-sky-300">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Services</h3>
              <ul className="space-y-2.5">
                {CATEGORIES.map((c) => (
                  <li key={c.id}>
                    <a href="#services" className="text-sm text-slate-400 transition hover:text-sky-300">{c.label}</a>
                  </li>
                ))}
                <li><a href="#pricing" className="text-sm text-slate-400 transition hover:text-sky-300">Custom Projects</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Get in Touch</h3>
              <ul className="space-y-3">
                <li>
                  <a href={`mailto:${s.email}`} className="flex items-start gap-2.5 text-sm text-slate-400 transition hover:text-sky-300">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" /><span className="break-all">{s.email}</span>
                  </a>
                </li>
                <li>
                  <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 text-sm text-slate-400 transition hover:text-sky-300">
                    <Phone className="h-4 w-4 shrink-0 text-sky-400" />{s.phone}
                  </a>
                </li>
                <li>
                  <button onClick={() => openQuote()} className="flex items-center gap-2.5 text-sm text-slate-400 transition hover:text-sky-300">
                    <MessageCircle className="h-4 w-4 shrink-0 text-sky-400" />WhatsApp Chat
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="sdt-divider my-9" />

          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-slate-500">{s.footerCopyright}</p>
            <div className="flex items-center gap-4">
              <p className="text-xs text-slate-500">{s.footerCredit}</p>
              <a href="/sholab" className="text-[11px] text-slate-600 transition hover:text-sky-400" title="Site Control">Admin</a>
            </div>
          </div>
        </div>
      </footer>

      <FloatingWhatsApp />
    </div>
  );
}

export default function Home() {
  const { data } = trpc.site.content.useQuery();
  const s = data?.settings;
  return (
    <QuoteProvider
      companyName={s?.companyName ?? "Sholab Dex Tech"}
      whatsappNumber={s?.whatsappNumber ?? "2348169781185"}
      services={(data?.services ?? []).map((x) => ({ id: x.id, name: x.name, category: x.category }))}
      packages={(data?.pricing ?? []).map((x) => ({ id: x.id, name: x.name, category: x.category, priceNgn: x.priceNgn, priceUsd: x.priceUsd }))}
    >
      <Site />
    </QuoteProvider>
  );
}
