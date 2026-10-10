import { FREQUENCY_LABEL, HOUSING_LABEL, type LeadInput } from "./lead";

/**
 * Mise en forme d'une demande pour l'envoi par e-mail.
 *
 * Utilisé quand aucun webhook n8n n'est configuré : la demande part
 * directement dans la boîte de l'entreprise, au lieu d'être perdue.
 */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export interface LeadMailContext {
  lead: LeadInput;
  scoring: { score: number; tier: string; reasons: string[] };
  page?: string;
  utm?: Record<string, string>;
  receivedAt: string;
}

function rows(c: LeadMailContext): [string, string][] {
  const l = c.lead;
  const out: [string, string][] = [
    ["Nom", l.name],
    ["Téléphone", l.phone],
    ["E-mail", l.email],
    ["Commune", l.commune],
    ["Type de client", l.clientType === "professionnel" ? "Professionnel" : "Particulier"],
    ["Fréquence souhaitée", FREQUENCY_LABEL[l.frequency] ?? l.frequency],
  ];
  if (l.housing) out.push(["Logement", HOUSING_LABEL[l.housing] ?? l.housing]);
  if (l.surface != null) out.push(["Surface", `${l.surface} m²`]);
  if (l.bedrooms != null) out.push(["Chambres", String(l.bedrooms)]);
  if (l.bathrooms != null) out.push(["Salles de bains", String(l.bathrooms)]);
  out.push(["Priorité", `${c.scoring.tier} (${c.scoring.score})`]);
  if (c.scoring.reasons.length) out.push(["Pourquoi", c.scoring.reasons.join(" · ")]);
  if (c.page) out.push(["Page d'origine", c.page]);
  const utm = Object.entries(c.utm ?? {});
  if (utm.length) out.push(["Campagne", utm.map(([k, v]) => `${k}=${v}`).join(" · ")]);
  return out;
}

export function leadSubject(c: LeadMailContext): string {
  const where = c.lead.commune ? ` — ${c.lead.commune}` : "";
  return `Demande de devis : ${c.lead.name}${where}`;
}

export function leadText(c: LeadMailContext): string {
  const body = rows(c)
    .map(([k, v]) => `${k} : ${v}`)
    .join("\n");
  const needs = c.lead.needs ? `\n\nSon message\n-----------\n${c.lead.needs}` : "";
  return `Nouvelle demande reçue sur le site.\n\n${body}${needs}\n\nConsentement donné le ${c.receivedAt}.\nRépondez directement à cet e-mail pour joindre la personne.`;
}

export function leadHtml(c: LeadMailContext): string {
  const tr = rows(c)
    .map(
      ([k, v]) =>
        `<tr><th align="left" style="padding:6px 16px 6px 0;font:500 13px/1.5 system-ui,sans-serif;color:#4f7288;white-space:nowrap;vertical-align:top">${esc(k)}</th>` +
        `<td style="padding:6px 0;font:400 15px/1.5 system-ui,sans-serif;color:#1b2a40">${esc(v)}</td></tr>`,
    )
    .join("");
  const needs = c.lead.needs
    ? `<p style="margin:24px 0 8px;font:500 13px/1.5 system-ui,sans-serif;color:#4f7288">SON MESSAGE</p>
       <div style="background:#f4eee2;border-left:2px solid #ae8130;padding:14px 18px;font:400 15px/1.6 system-ui,sans-serif;color:#1b2a40;white-space:pre-wrap">${esc(c.lead.needs)}</div>`
    : "";
  return `<div style="max-width:620px;margin:0 auto;padding:28px 24px;background:#fbf8f1">
  <p style="margin:0 0 4px;font:500 11px/1.4 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#ae8130">La Belle Intendance</p>
  <h1 style="margin:0 0 22px;font:400 24px/1.2 Georgia,serif;color:#182a45">Nouvelle demande de devis</h1>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${tr}</table>
  ${needs}
  <p style="margin:26px 0 0;padding-top:14px;border-top:1px solid #d8cdb6;font:400 12px/1.6 system-ui,sans-serif;color:#4f7288">
    Consentement donné le ${esc(c.receivedAt)}. Répondez directement à cet e-mail pour joindre la personne.
  </p>
</div>`;
}

/* ------------------------------------------------------------------ *
 * Accusé de réception envoyé à la personne qui a rempli le formulaire.
 * Elle doit pouvoir vérifier ce qu'elle a demandé et savoir ce qui suit.
 * ------------------------------------------------------------------ */

const recap = (l: LeadInput): [string, string][] => {
  const out: [string, string][] = [["Commune", l.commune], ["Fréquence souhaitée", FREQUENCY_LABEL[l.frequency] ?? l.frequency]];
  if (l.housing) out.unshift(["Logement", HOUSING_LABEL[l.housing] ?? l.housing]);
  if (l.surface != null) out.push(["Surface", `${l.surface} m²`]);
  return out;
};

export function confirmSubject(): string {
  return "Votre demande est bien arrivée — La Belle Intendance";
}

export function confirmText(c: LeadMailContext, delay: string | null, phone: string | null, site: string): string {
  const first = c.lead.name.trim().split(/\s+/)[0] || "";
  const when = delay ? ` Je reviens vers vous ${delay}.` : " Je reviens vers vous rapidement.";
  const lines = recap(c.lead).map(([k, v]) => `${k} : ${v}`).join("\n");
  const needs = c.lead.needs ? `\n\nCe que vous m'avez écrit :\n${c.lead.needs}` : "";
  const tel = phone ? `\n\nSi c'est urgent, appelez-moi au ${phone}.` : "";
  return [
    `Bonjour ${first},`.trim(),
    "",
    `J'ai bien reçu votre demande.${when}`,
    "",
    "Nous en parlons au téléphone, je passe voir le logement si sa taille le justifie, et vous recevez ensuite un devis écrit. Rien ne commence avant que vous l'ayez accepté.",
    "",
    "Ce que vous avez indiqué",
    "------------------------",
    lines + needs,
    tel,
    "",
    "À bientôt,",
    "Coralie — La Belle Intendance",
    site,
    "",
    "--",
    `Ce message confirme l'enregistrement de votre demande le ${c.receivedAt}. Vos informations servent uniquement à vous répondre et à établir votre devis ; vous pouvez demander leur suppression à tout moment en répondant à cet e-mail.`,
  ].join("\n");
}

export function confirmHtml(c: LeadMailContext, delay: string | null, phone: string | null, site: string): string {
  const first = esc(c.lead.name.trim().split(/\s+/)[0] || "");
  const when = delay ? `Je reviens vers vous ${esc(delay)}.` : "Je reviens vers vous rapidement.";
  const tr = recap(c.lead)
    .map(
      ([k, v]) =>
        `<tr><th align="left" style="padding:5px 16px 5px 0;font:500 12px/1.5 system-ui,sans-serif;color:#4f7288;white-space:nowrap;vertical-align:top">${esc(k)}</th>` +
        `<td style="padding:5px 0;font:400 14px/1.5 system-ui,sans-serif;color:#1b2a40">${esc(v)}</td></tr>`,
    )
    .join("");
  const needs = c.lead.needs
    ? `<div style="margin-top:14px;background:#f4eee2;border-left:2px solid #ae8130;padding:12px 16px;font:400 14px/1.6 system-ui,sans-serif;color:#1b2a40;white-space:pre-wrap">${esc(c.lead.needs)}</div>`
    : "";
  const tel = phone
    ? `<p style="margin:22px 0 0;font:400 15px/1.6 system-ui,sans-serif;color:#1b2a40">Si c’est urgent, appelez-moi au <strong style="white-space:nowrap">${esc(phone)}</strong>.</p>`
    : "";
  return `<div style="max-width:600px;margin:0 auto;padding:30px 26px;background:#fbf8f1">
  <p style="margin:0 0 4px;font:500 11px/1.4 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#ae8130">La Belle Intendance</p>
  <h1 style="margin:0 0 20px;font:400 24px/1.25 Georgia,serif;color:#182a45">Votre demande est bien arrivée</h1>
  <p style="margin:0 0 14px;font:400 16px/1.6 system-ui,sans-serif;color:#1b2a40">Bonjour ${first},</p>
  <p style="margin:0 0 14px;font:400 16px/1.6 system-ui,sans-serif;color:#1b2a40">J’ai bien reçu votre demande. ${when}</p>
  <p style="margin:0 0 24px;font:400 15px/1.6 system-ui,sans-serif;color:#4d5f74">Nous en parlons au téléphone, je passe voir le logement si sa taille le justifie, et vous recevez ensuite un devis écrit. Rien ne commence avant que vous l’ayez accepté.</p>
  <p style="margin:0 0 8px;font:500 12px/1.5 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4f7288">Ce que vous avez indiqué</p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${tr}</table>
  ${needs}
  ${tel}
  <p style="margin:26px 0 0;font:400 16px/1.6 system-ui,sans-serif;color:#1b2a40">À bientôt,<br>
    <span style="font-family:Georgia,serif;font-size:18px;color:#182a45">Coralie</span><br>
    <span style="font:400 13px/1.6 system-ui,sans-serif;color:#4f7288">La Belle Intendance · <a href="${esc(site)}" style="color:#4f7288">${esc(site.replace(/^https?:\/\//, ""))}</a></span>
  </p>
  <p style="margin:26px 0 0;padding-top:14px;border-top:1px solid #d8cdb6;font:400 11px/1.6 system-ui,sans-serif;color:#4f7288">
    Ce message confirme l’enregistrement de votre demande le ${esc(c.receivedAt)}. Vos informations servent uniquement à vous répondre et à établir votre devis ; vous pouvez demander leur suppression à tout moment en répondant à cet e-mail.
  </p>
</div>`;
}
