import { FREQUENCY_LABEL, HOUSING_LABEL, type LeadInput } from "./lead";

/**
 * Mise en forme des e-mails déclenchés par le formulaire.
 *
 * Deux contraintes dictent le HTML : il doit survivre à Outlook, qui ignore
 * flex, grid et la plupart des styles modernes — d'où des tableaux et des
 * styles en ligne — et il doit rester lisible si les images sont bloquées,
 * ce que font beaucoup de messageries par défaut. Le bandeau d'en-tête est
 * donc un aplat de couleur avec du texte, le logo n'est qu'un ornement.
 */

const NAVY = "#182a45";
const CREAM = "#f4eee2";
const PAPER = "#fbf8f1";
const GOLD = "#ae8130";
const INK = "#1b2a40";
const MUTED = "#4d5f74";
const SLATE = "#4f7288";
const RULE = "#d8cdb6";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const nl2br = (s: string) => esc(s).replace(/\r?\n/g, "<br>");
/** Les liens tel: n'acceptent ni espaces ni points. */
const telHref = (p: string) => p.replace(/[^\d+]/g, "");

export interface LeadMailContext {
  lead: LeadInput;
  scoring: { score: number; tier: string; reasons: string[] };
  page?: string;
  utm?: Record<string, string>;
  receivedAt: string;
}

/* ------------------------------ briques ------------------------------ */

const shell = (site: string, kicker: string, title: string, body: string, foot: string) => `
<div style="background:${CREAM};padding:24px 12px;font-family:${SANS}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;border-collapse:collapse;background:${PAPER}">
  <tr><td style="background:${NAVY};padding:22px 28px" align="center">
    <img src="${site}/email/monogramme.png" width="42" height="38" alt="" style="display:block;border:0;margin:0 auto 10px">
    <div style="font-family:${SERIF};font-size:17px;letter-spacing:.06em;color:${CREAM}">La Belle Intendance</div>
    <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#aec6d2;margin-top:5px">${esc(kicker)}</div>
  </td></tr>
  <tr><td style="height:3px;background:${GOLD};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:30px 28px 8px">
    <h1 style="margin:0;font-family:${SERIF};font-weight:normal;font-size:23px;line-height:1.25;color:${NAVY}">${esc(title)}</h1>
  </td></tr>
  <tr><td style="padding:0 28px 28px">${body}</td></tr>
  <tr><td style="padding:16px 28px 24px;border-top:1px solid ${RULE}">
    <div style="font-size:11px;line-height:1.6;color:${SLATE}">${foot}</div>
  </td></tr>
</table>
<div style="max-width:600px;margin:12px auto 0;text-align:center;font-size:11px;color:${SLATE}">
  ${esc(site.replace(/^https?:\/\//, ""))}
</div>
</div>`;

const rows = (list: [string, string][]) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0">
${list
  .map(
    ([k, v]) => `<tr>
  <td style="padding:7px 18px 7px 0;font-family:${SANS};font-size:12px;color:${SLATE};white-space:nowrap;vertical-align:top;border-bottom:1px solid ${RULE}">${esc(k)}</td>
  <td style="padding:7px 0;font-family:${SANS};font-size:15px;color:${INK};vertical-align:top;border-bottom:1px solid ${RULE}">${v}</td>
</tr>`,
  )
  .join("")}
</table>`;

/** Bouton « à toute épreuve » : un tableau coloré, pas un <a> stylé. */
const button = (href: string, label: string, bg = NAVY, fg = "#ffffff") => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 8px 8px 0;display:inline-block">
  <tr><td bgcolor="${bg}" style="border-radius:3px">
    <a href="${esc(href)}" style="display:inline-block;padding:12px 22px;font-family:${SANS};font-size:14px;font-weight:600;color:${fg};text-decoration:none;letter-spacing:.02em">${esc(label)}</a>
  </td></tr>
</table>`;

const quoteBlock = (text: string, label: string) => `
<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${SLATE};margin:26px 0 8px">${esc(label)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
  <tr>
    <td width="3" bgcolor="${GOLD}" style="font-size:0;line-height:0">&nbsp;</td>
    <td style="background:${CREAM};padding:14px 18px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK}">${nl2br(text)}</td>
  </tr>
</table>`;

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
