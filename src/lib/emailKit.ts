/**
 * La trousse commune aux e-mails : palette, échappement, et les briques de
 * mise en page.
 *
 * Deux contraintes dictent ce HTML : il doit survivre à Outlook, qui ignore
 * flex, grid et la plupart des styles modernes — d'où des tableaux et des
 * styles en ligne — et il doit rester lisible si les images sont bloquées,
 * ce que font beaucoup de messageries par défaut. Le bandeau d'en-tête est
 * donc un aplat de couleur avec du texte, le logo n'est qu'un ornement.
 */

export const NAVY = "#182a45";
export const CREAM = "#f4eee2";
export const PAPER = "#fbf8f1";
export const GOLD = "#ae8130";
export const INK = "#1b2a40";
export const MUTED = "#4d5f74";
export const SLATE = "#4f7288";
export const RULE = "#d8cdb6";
export const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const SERIF = "Georgia,'Times New Roman',serif";

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const nl2br = (s: string) => esc(s).replace(/\r?\n/g, "<br>");
/** Les liens tel: n'acceptent ni espaces ni points. */
export const telHref = (p: string) => p.replace(/[^\d+]/g, "");

/* ------------------------------ briques ------------------------------ */

export const shell = (site: string, kicker: string, title: string, body: string, foot: string) => `
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

export const rows = (list: [string, string][]) => `
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
export const button = (href: string, label: string, bg = NAVY, fg = "#ffffff") => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 8px 8px 0;display:inline-block">
  <tr><td bgcolor="${bg}" style="border-radius:3px">
    <a href="${esc(href)}" style="display:inline-block;padding:12px 22px;font-family:${SANS};font-size:14px;font-weight:600;color:${fg};text-decoration:none;letter-spacing:.02em">${esc(label)}</a>
  </td></tr>
</table>`;

export const quoteBlock = (text: string, label: string) => `
<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${SLATE};margin:26px 0 8px">${esc(label)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
  <tr>
    <td width="3" bgcolor="${GOLD}" style="font-size:0;line-height:0">&nbsp;</td>
    <td style="background:${CREAM};padding:14px 18px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK}">${nl2br(text)}</td>
  </tr>
</table>`;

