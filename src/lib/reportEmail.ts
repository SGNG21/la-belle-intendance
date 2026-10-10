import { frenchDate, type ReportInput } from "./report";

/**
 * Le compte rendu tel que le client le reçoit : la carte du site, en e-mail.
 *
 * Mêmes contraintes que les autres courriels — tableaux et styles en ligne pour
 * Outlook. Les photos sont jointes au message et appelées par `cid:` ; si la
 * messagerie refuse de les afficher, elles restent accessibles en pièces
 * jointes et le reste du compte rendu se lit sans elles.
 */

const NAVY = "#182a45";
const CREAM = "#f4eee2";
const PAPER = "#fbf8f1";
const GOLD = "#ae8130";
const SAGE = "#5f7658";
const TERRA = "#be7a54";
const INK = "#1b2a40";
const SLATE = "#4f7288";
const RULE = "#d8cdb6";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const nl2br = (s: string) => esc(s).replace(/\r?\n/g, "<br>");

export const reportSubject = (r: ReportInput) => `Compte rendu de passage — ${frenchDate(r.date)}`;

export function reportText(r: ReportInput, site: string): string {
  const rooms = r.rooms.map((x) => `- ${x.label}${x.detail ? ` : ${x.detail}` : ""}`).join("\n");
  const alert = r.alert?.trim() ? `\n\nÀ SIGNALER\n${r.alert.trim()}` : "";
  const photos = r.photos?.length ? `\n\n${r.photos.length} photo${r.photos.length > 1 ? "s" : ""} jointe${r.photos.length > 1 ? "s" : ""}.` : "";
  return [
    `Bonjour,`,
    "",
    `Voici le compte rendu du passage du ${frenchDate(r.date)}.`,
    `${r.property}`,
    "",
    "CE QUI A ÉTÉ FAIT",
    rooms,
    alert,
    photos,
    "",
    "À votre disposition,",
    "Coralie — La Belle Intendance",
    site,
  ].join("\n");
}

export function reportHtml(r: ReportInput, site: string, cids: string[]): string {
  const rooms = r.rooms
    .map(
      (x) => `<tr>
  <td width="26" style="padding:9px 0 9px 0;vertical-align:top">
    <div style="width:16px;height:16px;border:1.5px solid ${SAGE};border-radius:50%;margin-top:3px;text-align:center;font-family:${SANS};font-size:10px;line-height:16px;color:${SAGE}">&#10003;</div>
  </td>
  <td style="padding:9px 0;vertical-align:top">
    <div style="font-family:${SANS};font-size:15px;font-weight:600;color:${INK}">${esc(x.label)}</div>
    ${x.detail.trim() ? `<div style="font-family:${SANS};font-size:13px;color:${SLATE};margin-top:2px">${esc(x.detail)}</div>` : ""}
  </td>
</tr>`,
    )
    .join("");

  const alert = r.alert?.trim()
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:22px 0 0">
  <tr>
    <td width="3" bgcolor="${TERRA}" style="font-size:0;line-height:0">&nbsp;</td>
    <td style="background:#f3e7df;padding:14px 18px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK}">
      <strong>À signaler :</strong> ${nl2br(r.alert.trim())}
    </td>
  </tr>
</table>`
    : "";

  const photos = cids.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:18px 0 0">
  <tr>${cids
    .map(
      (cid) =>
        `<td style="padding:0 6px 6px 0;vertical-align:top"><img src="cid:${cid}" width="246" alt="" style="display:block;border:0;width:100%;max-width:246px;height:auto;border-radius:2px"></td>`,
    )
    .join("")}</tr>
</table>`
    : "";

  return `<div style="background:${CREAM};padding:24px 12px;font-family:${SANS}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;border-collapse:collapse;background:${PAPER}">
  <tr><td style="background:${NAVY};padding:22px 28px" align="center">
    <img src="${site}/email/monogramme.png" width="42" height="38" alt="" style="display:block;border:0;margin:0 auto 10px">
    <div style="font-family:${SERIF};font-size:17px;letter-spacing:.06em;color:${CREAM}">La Belle Intendance</div>
    <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#aec6d2;margin-top:5px">Compte rendu de passage</div>
  </td></tr>
  <tr><td style="height:3px;background:${GOLD};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:30px 28px 0">
    <h1 style="margin:0;font-family:${SERIF};font-weight:normal;font-size:23px;line-height:1.25;color:${NAVY}">${esc(frenchDate(r.date))}</h1>
    <div style="font-family:${SANS};font-size:14px;color:${SLATE};margin-top:6px">${esc(r.property)}</div>
    <div style="height:1px;background:${RULE};margin:18px 0 4px"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">${rooms}</table>
    ${alert}
    ${photos}
  </td></tr>
  <tr><td style="padding:26px 28px 28px">
    <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK}">À votre disposition,</p>
    <p style="margin:4px 0 0;font-family:${SERIF};font-size:19px;color:${NAVY}">Coralie</p>
    <p style="margin:3px 0 0;font-family:${SANS};font-size:13px;color:${SLATE}">La Belle Intendance</p>
  </td></tr>
</table>
<div style="max-width:600px;margin:12px auto 0;text-align:center;font-size:11px;color:${SLATE}">
  ${esc(site.replace(/^https?:\/\//, ""))}
</div>
</div>`;
}
