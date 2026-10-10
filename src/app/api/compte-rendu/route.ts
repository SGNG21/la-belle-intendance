import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CONTACT, SITE } from "@/config/site";
import { validateReport, type ReportInput } from "@/lib/report";
import { reportHtml, reportSubject, reportText } from "@/lib/reportEmail";
import { SESSION_COOKIE, codeIsValid, tokenIsValid } from "@/lib/intendance";

export const runtime = "nodejs";

/** Quatre photos de 1,5 Mo laissent de la marge sous la limite de Resend. */
const MAX_BODY = 12_000_000;

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "";

export async function POST(req: Request) {
  const expected = process.env.INTENDANCE_CODE;
  if (!expected) {
    console.error("[compte-rendu] INTENDANCE_CODE absent : la page est inutilisable.");
    return NextResponse.json({ ok: false, error: "Service non configuré." }, { status: 503 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, error: "Photos trop lourdes. Réessayez avec moins de photos." }, { status: 413 });

  let body: Partial<ReportInput>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  // Le cookie de session suffit ; le code en clair reste accepté en secours,
  // par exemple depuis un onglet dont la session a expiré.
  const jar = await cookies();
  const authorized =
    tokenIsValid(jar.get(SESSION_COOKIE)?.value, expected) || codeIsValid(clean(body.code, 200), expected);
  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Session expirée. Saisissez à nouveau le mot de passe." }, { status: 401 });
  }

  const report: ReportInput = {
    code: "",
    clientName: clean(body.clientName, 120),
    clientEmail: clean(body.clientEmail, 160),
    property: clean(body.property, 160),
    date: clean(body.date, 10),
    rooms: (Array.isArray(body.rooms) ? body.rooms : [])
      .slice(0, 12)
      .map((r) => ({ label: clean(r?.label, 60), detail: clean(r?.detail, 160) }))
      .filter((r) => r.label),
    alert: clean(body.alert, 600),
    photos: (Array.isArray(body.photos) ? body.photos : [])
      .slice(0, 4)
      .filter((p) => typeof p?.dataUrl === "string" && p.dataUrl.startsWith("data:image/"))
      .map((p, i) => ({ name: clean(p.name, 60) || `photo-${i + 1}.jpg`, dataUrl: p.dataUrl })),
  };

  const errors = validateReport(report);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors, error: "Vérifiez les champs signalés." }, { status: 422 });

  const { RESEND_API_KEY: key, LEAD_EMAIL_FROM: from } = process.env;
  if (!key || !from) {
    console.error("[compte-rendu] RESEND_API_KEY ou LEAD_EMAIL_FROM absent : compte rendu non envoyé.");
    return NextResponse.json({ ok: false, error: "L'envoi n'est pas configuré." }, { status: 503 });
  }

  const attachments = (report.photos ?? []).map((p, i) => ({
    filename: p.name.endsWith(".jpg") ? p.name : `photo-${i + 1}.jpg`,
    content: p.dataUrl.slice(p.dataUrl.indexOf(",") + 1),
    content_id: `photo${i + 1}`,
  }));
  const cids = attachments.map((a) => a.content_id);

  // Une copie à l'entreprise : c'est elle qui sert d'archive tant qu'il n'y en
  // a pas d'autre, et elle permet de vérifier ce qui est réellement parti.
  const to = [report.clientEmail, ...(CONTACT.email ? [CONTACT.email] : [])];

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from.includes("<") ? from : `${SITE.name} <${from}>`,
        to,
        ...(CONTACT.email ? { reply_to: CONTACT.email } : {}),
        subject: reportSubject(report),
        text: reportText(report, SITE.url),
        html: reportHtml(report, SITE.url, cids),
        ...(attachments.length ? { attachments } : {}),
      }),
      signal: ctrl.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(timer));
    if (!res.ok) throw new Error(`resend ${res.status} ${await res.text().catch(() => "")}`.trim());
  } catch (e) {
    console.error("[compte-rendu] échec d'envoi :", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Le compte rendu n'a pas pu être envoyé. Réessayez." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
