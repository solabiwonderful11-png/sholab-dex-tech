// Shared constants + helpers for the Sholab Dex Tech site.

export const CATEGORIES = [
  { id: "websites", label: "Website Development", short: "Websites", icon: "🌐" },
  { id: "automation", label: "AI Automation", short: "AI Automation", icon: "🤖" },
  { id: "promotions", label: "Business Promotions", short: "Business Promotions", icon: "📣" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryShort(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.short ?? id;
}

/**
 * Build the pre-filled WhatsApp message + link.
 * Format: "Hi Sholab Dex Tech, my name is [NAME]. I am interested in
 * [SERVICE] - [PACKAGE/PRICING]. Please send me more details and a quote."
 * When the visitor skips the name, a friendly default greeting is used.
 */
export function buildWhatsAppLink(opts: {
  number: string;
  companyName: string;
  name?: string;
  service?: string;
  packageLabel?: string;
}): string {
  const company = opts.companyName || "Sholab Dex Tech";
  const who = (opts.name ?? "").trim();
  const service = (opts.service ?? "").trim();
  const pkg = (opts.packageLabel ?? "").trim();

  const interest = [service, pkg].filter(Boolean).join(" - ");

  let msg: string;
  if (who) {
    msg = `Hi ${company}, my name is ${who}.`;
  } else {
    msg = `Hi ${company},`;
  }
  if (interest) {
    msg += ` I am interested in ${interest}.`;
  } else {
    msg += ` I am interested in your services.`;
  }
  msg += ` Please send me more details and a quote.`;

  const digits = (opts.number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

export function waLink(number: string, text: string): string {
  const digits = (number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
