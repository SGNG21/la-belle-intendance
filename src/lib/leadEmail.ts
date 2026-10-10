import { FREQUENCY_LABEL, HOUSING_LABEL, type LeadInput } from "./lead";
import { CREAM, GOLD, INK, MUTED, NAVY, RULE, SANS, SERIF, SLATE, button, esc, nl2br, quoteBlock, rows, shell, telHref } from "./emailKit";

/** Les deux e-mails du formulaire : la notification et l'accusé de réception. */

export interface LeadMailContext {
  lead: LeadInput;
  scoring: { score: number; tier: string; reasons: string[] };
  page?: string;
  utm?: Record<string, string>;
  receivedAt: string;
}

/* --------------------- notification à l'entreprise --------------------- */

function detailRows(c: LeadMailContext): [string, string][] {
  const l = c.lead;
  const out: [string, string][] = [
    ["Téléphone", `<a href="tel:${telHref(l.phone)}" style="color:${INK};text-decoration:none">${esc(l.phone)}</a>`],
    ["E-mail", `<a href="mailto:${esc(l.email)}" style="color:${INK};text-decoration:none">${esc(l.email)}</a>`],
    ["Commune", esc(l.commune)],
    ["Type de client", l.clientType === "professionnel" ? "Professionnel" : "Particulier"],
    ["Fréquence", esc(FREQUENCY_LABEL[l.frequency] ?? l.frequency)],
  ];
  if (l.housing) out.push(["Logement", esc(HOUSING_LABEL[l.housing] ?? l.housing)]);
  const taille = [l.surface != null ? `${l.surface} m²` : null, l.bedrooms != null ? `${l.bedrooms} ch.` : null, l.bathrooms != null ? `${l.bathrooms} sdb` : null].filter(Boolean);
  if (taille.length) out.push(["Taille", taille.join(" · ")]);
  return out;
}

export function leadSubject(c: LeadMailContext): string {
  return `Demande de devis : ${c.lead.name}${c.lead.commune ? ` — ${c.lead.commune}` : ""}`;
}

export function leadText(c: LeadMailContext): string {
  const l = c.lead;
  const base = [
    `Nom : ${l.name}`,
    `Téléphone : ${l.phone}`,
    `E-mail : ${l.email}`,
    `Commune : ${l.commune}`,
    `Type de client : ${l.clientType === "professionnel" ? "Professionnel" : "Particulier"}`,
    `Fréquence : ${FREQUENCY_LABEL[l.frequency] ?? l.frequency}`,
    l.housing ? `Logement : ${HOUSING_LABEL[l.housing] ?? l.housing}` : null,
    l.surface != null ? `Surface : ${l.surface} m²` : null,
    l.bedrooms != null ? `Chambres : ${l.bedrooms}` : null,
    l.bathrooms != null ? `Salles de bains : ${l.bathrooms}` : null,
    `Priorité : ${c.scoring.tier} (${c.scoring.score})`,
    c.scoring.reasons.length ? `Pourquoi : ${c.scoring.reasons.join(" · ")}` : null,
    c.page ? `Page d'origine : ${c.page}` : null,
  ].filter(Boolean);
  const utm = Object.entries(c.utm ?? {});
  if (utm.length) base.push(`Campagne : ${utm.map(([k, v]) => `${k}=${v}`).join(" · ")}`);
  const needs = l.needs ? `\n\nSon message\n-----------\n${l.needs}` : "";
  return `Nouvelle demande reçue sur le site.\n\n${base.join("\n")}${needs}\n\nConsentement donné le ${c.receivedAt}.\nRépondez directement à cet e-mail pour joindre la personne.`;
}

export function leadHtml(c: LeadMailContext, site: string): string {
  const l = c.lead;
  const utm = Object.entries(c.utm ?? {});
  const body = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:4px 0 20px">
  <tr><td style="font-family:${SANS};font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${GOLD}">
    Priorité ${esc(c.scoring.tier)} &middot; ${c.scoring.score}
  </td></tr>
</table>
<div style="margin:0 0 22px">
  ${button(`tel:${telHref(l.phone)}`, `Appeler ${l.phone}`)}
  ${button(`mailto:${l.email}`, "Répondre par e-mail", CREAM, NAVY)}
</div>
${rows(detailRows(c))}
${l.needs ? quoteBlock(l.needs, "Son message") : ""}`;
  const foot = [
    `Consentement donné le ${esc(c.receivedAt)}. Répondez directement à cet e-mail pour joindre la personne.`,
    c.page ? `Page d’origine : ${esc(c.page)}` : "",
    utm.length ? `Campagne : ${esc(utm.map(([k, v]) => `${k}=${v}`).join(" · "))}` : "",
    c.scoring.reasons.length ? `Scoring : ${esc(c.scoring.reasons.join(" · "))}` : "",
  ]
    .filter(Boolean)
    .join("<br>");
  return shell(site, "Nouvelle demande", `${l.name}${l.commune ? ` — ${l.commune}` : ""}`, body, foot);
}

/* ------------------- accusé de réception au visiteur ------------------- */

const recap = (l: LeadInput): [string, string][] => {
  const out: [string, string][] = [["Commune", esc(l.commune)], ["Fréquence souhaitée", esc(FREQUENCY_LABEL[l.frequency] ?? l.frequency)]];
  if (l.housing) out.unshift(["Logement", esc(HOUSING_LABEL[l.housing] ?? l.housing)]);
  if (l.surface != null) out.push(["Surface", `${l.surface} m²`]);
  return out;
};

export function confirmSubject(): string {
  return "Votre demande est bien arrivée — La Belle Intendance";
}

export function confirmText(c: LeadMailContext, delay: string | null, phone: string | null, site: string): string {
  const first = c.lead.name.trim().split(/\s+/)[0] || "";
  const when = delay ? `Je reviens vers vous ${delay}.` : "Je reviens vers vous rapidement.";
  const lines = recap(c.lead)
    .map(([k, v]) => `${k} : ${v.replace(/&[a-z]+;/g, " ")}`)
    .join("\n");
  const needs = c.lead.needs ? `\n\nCe que vous m'avez écrit :\n${c.lead.needs}` : "";
  const tel = phone ? `\n\nSi c'est urgent, appelez-moi au ${phone}.` : "";
  return [
    `Bonjour ${first},`.trim(),
    "",
    `J'ai bien reçu votre demande. ${when}`,
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
  const body = `
<p style="margin:14px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${INK}">Bonjour ${first},</p>
<p style="margin:12px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${INK}">J’ai bien reçu votre demande. ${when}</p>
<p style="margin:12px 0 22px;font-family:${SANS};font-size:15px;line-height:1.65;color:${MUTED}">
  Nous en parlons au téléphone, je passe voir le logement si sa taille le justifie, et vous recevez ensuite un devis écrit.
  Rien ne commence avant que vous l’ayez accepté.
</p>
<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${SLATE};margin:0 0 8px">Ce que vous avez indiqué</div>
${rows(recap(c.lead))}
${c.lead.needs ? quoteBlock(c.lead.needs, "Votre message") : ""}
${
  phone
    ? `<div style="margin:26px 0 0">
  <div style="font-family:${SANS};font-size:14px;color:${MUTED};margin-bottom:10px">Une question d’ici là ?</div>
  ${button(`tel:${telHref(phone)}`, `Appeler ${phone}`)}
</div>`
    : ""
}
<p style="margin:26px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${INK}">À bientôt,</p>
<p style="margin:4px 0 0;font-family:${SERIF};font-size:19px;color:${NAVY}">Coralie</p>
<p style="margin:3px 0 0;font-family:${SANS};font-size:13px;color:${SLATE}">La Belle Intendance</p>`;
  const foot = `Ce message confirme l’enregistrement de votre demande le ${esc(c.receivedAt)}. Vos informations servent uniquement à vous répondre et à établir votre devis ; vous pouvez demander leur suppression à tout moment en répondant à cet e-mail.`;
  return shell(site, "Demande de devis", "Votre demande est bien arrivée", body, foot);
}
