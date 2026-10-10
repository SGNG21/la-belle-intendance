import { NextResponse } from "next/server";
import { scoreLead, validateLead, type LeadInput } from "@/lib/lead";
import { confirmHtml, confirmSubject, confirmText, leadHtml, leadSubject, leadText, type LeadMailContext } from "@/lib/leadEmail";
import { CONTACT, SITE } from "@/config/site";
import { crmEnabled, recordDemande } from "@/lib/crm";
import { envoiPret, envoyer } from "@/lib/mail";

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

  // Deux acheminements possibles, dans cet ordre : le webhook n8n s'il est
  // configuré, sinon l'envoi direct par e-mail. Sans l'un des deux, la demande
  // serait perdue : on refuse explicitement plutôt que de faire semblant.
  const webhook = process.env.N8N_LEAD_WEBHOOK_URL;
  const to = process.env.LEAD_EMAIL_TO;
  const pret = envoiPret();

  // L'accusé de réception part dès que l'envoi est configuré, quel que soit
  // l'acheminement de la notification : sans lui, la personne ne sait pas si
  // son message est parti.
  const ack = pret ? () => sendConfirmation(payload) : null;

  // La fiche prospect avant tout envoi : si la messagerie tombe, la demande
  // est quand même dans le back-office, avec son origine (référencement,
  // campagne, réseaux sociaux) telle que le lien l'a transmise.
  if (crmEnabled()) await saveDemande(payload).catch((e) => console.error("[lead] fiche prospect non enregistrée :", e instanceof Error ? e.message : e));

  if (webhook) return send(() => postWebhook(webhook, payload), "webhook", ack);
  if (pret && to) return send(() => sendEmail(to, payload), "e-mail", ack);

  if (process.env.NODE_ENV !== "production") {
    console.log("[lead:dev] aucun acheminement configuré, demande non transmise :", JSON.stringify(payload));
    return NextResponse.json({ ok: true });
  }
  console.error("[lead] ni N8N_LEAD_WEBHOOK_URL ni RESEND_API_KEY + LEAD_EMAIL_TO : demande perdue.");
  return NextResponse.json({ ok: false, error: "Le service de demande est momentanément indisponible. Contactez-nous directement." }, { status: 503 });
}

type Payload = LeadMailContext & { source: string; consentGiven: boolean; consentAt: string };

/** Dépose la demande dans la base du back-office. Best effort : jamais bloquant. */
async function saveDemande(p: Payload): Promise<void> {
  const l = p.lead;
  await recordDemande({
    nom: l.name,
    email: l.email,
    telephone: l.phone || null,
    commune: l.commune || null,
    type_client: l.clientType,
    logement: l.housing ?? null,
    surface: l.surface ?? null,
    chambres: l.bedrooms ?? null,
    salles_de_bains: l.bathrooms ?? null,
    frequence: l.frequency,
    besoin: l.needs || null,
    score: p.scoring.score,
    priorite: p.scoring.tier,
    raisons: p.scoring.reasons,
    page: p.page || null,
    utm: p.utm,
  });
}

async function send(run: () => Promise<void>, label: string, ack: (() => Promise<void>) | null) {
  try {
    await run();
  } catch (e) {
    console.error(`[lead] échec d'envoi (${label}) :`, e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Votre demande n'a pas pu être transmise. Réessayez ou contactez-nous directement." }, { status: 502 });
  }
  // La demande est enregistrée : un accusé de réception raté ne doit pas la
  // faire échouer côté visiteur. On le signale dans les journaux, rien de plus.
  if (ack) await ack().catch((e) => console.error("[lead] accusé de réception non envoyé :", e instanceof Error ? e.message : e));
  return NextResponse.json({ ok: true });
}

/** fetch avec garde-temps : une API lente ne doit pas bloquer la fonction. */
async function fetchWithTimeout(url: string, init: RequestInit, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function postWebhook(url: string, payload: Payload): Promise<void> {
  const secret = process.env.N8N_LEAD_WEBHOOK_SECRET;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(secret ? { "X-Webhook-Secret": secret } : {}) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`webhook ${res.status}`);
}

async function sendEmail(to: string, payload: Payload): Promise<void> {
  await envoyer({
    to: to.split(","),
    // La réponse va au prospect, pas à soi-même.
    replyTo: payload.lead.email,
    subject: leadSubject(payload),
    text: leadText(payload),
    html: leadHtml(payload, SITE.url),
  });
}

/** Accusé de réception au visiteur. Les réponses arrivent dans la boîte de l'entreprise. */
async function sendConfirmation(payload: Payload): Promise<void> {
  await envoyer({
    to: [payload.lead.email],
    subject: confirmSubject(),
    text: confirmText(payload, CONTACT.replyDelay, CONTACT.phone, SITE.url),
    html: confirmHtml(payload, CONTACT.replyDelay, CONTACT.phone, SITE.url),
  });
}
