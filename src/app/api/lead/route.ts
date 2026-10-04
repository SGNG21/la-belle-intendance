import { NextResponse } from "next/server";
import { scoreLead, validateLead, type LeadInput } from "@/lib/lead";

export const runtime = "nodejs";

const MAX_BODY = 20_000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
// Limite par instance serverless : un frein contre les rafales, pas un pare-feu. Voir README.
const hits = new Map<string, number[]>();

function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "");

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, error: "Message trop volumineux." }, { status: 413 });

  let body: Partial<LeadInput>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  // Robots : champ piège rempli ou formulaire envoyé en moins de 3 s. Réponse « ok » sans rien transmettre.
  const tooFast = typeof body.startedAt === "number" && Date.now() - body.startedAt < 3000;
  if ((body.website && String(body.website).length > 0) || tooFast) return NextResponse.json({ ok: true });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "inconnu";
  if (tooMany(ip)) return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez dans quelques minutes ou appelez-nous." }, { status: 429 });

  const lead: LeadInput = {
    clientType: body.clientType as LeadInput["clientType"],
    housing: body.housing,
    surface: typeof body.surface === "number" ? body.surface : undefined,
    bedrooms: typeof body.bedrooms === "number" ? body.bedrooms : undefined,
    bathrooms: typeof body.bathrooms === "number" ? body.bathrooms : undefined,
    frequency: body.frequency as LeadInput["frequency"],
    commune: clean(body.commune, 80),
    needs: clean(body.needs, 1500),
    name: clean(body.name, 120),
    phone: clean(body.phone, 30),
    email: clean(body.email, 160),
    consent: body.consent === true,
  };

  const errors = validateLead(lead);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors, error: "Vérifiez les champs signalés." }, { status: 422 });

  const { score, tier, reasons } = scoreLead(lead);
  const utm: Record<string, string> = {};
  if (body.utm && typeof body.utm === "object") {
    for (const [k, v] of Object.entries(body.utm)) if (/^(utm_[a-z]+|gclid)$/.test(k)) utm[k] = clean(v, 120);
  }

  const payload = {
    receivedAt: new Date().toISOString(),
    source: "site-la-belle-intendance",
    page: clean(body.page, 200),
    utm,
    consentGiven: true,
    consentAt: new Date().toISOString(),
    lead,
    scoring: { score, tier, reasons },
  };

  const url = process.env.N8N_LEAD_WEBHOOK_URL;
  if (!url) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[lead:dev] webhook non configuré, demande non transmise :", JSON.stringify(payload));
      return NextResponse.json({ ok: true });
    }
    console.error("[lead] N8N_LEAD_WEBHOOK_URL manquant : demande perdue.");
    return NextResponse.json({ ok: false, error: "Le service de demande est momentanément indisponible. Contactez-nous directement." }, { status: 503 });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.N8N_LEAD_WEBHOOK_SECRET ? { "X-Webhook-Secret": process.env.N8N_LEAD_WEBHOOK_SECRET } : {}) },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[lead] échec d'envoi au webhook :", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Votre demande n'a pas pu être transmise. Réessayez ou contactez-nous directement." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
