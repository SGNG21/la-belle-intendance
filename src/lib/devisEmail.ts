import { CONTACT, LEGAL, SITE } from "@/config/site";
import { CREAM, GOLD, INK, NAVY, RULE, SANS, SLATE, button, esc, nl2br, shell, telHref } from "./emailKit";
import { dateLongue, euros, totalLigne, type Devis } from "./devisModel";

/**
 * Le devis tel que le client le reçoit.
 *
 * Il n'engage rien tant qu'il n'est pas accepté, mais il en a la forme : un
 * numéro, une date de validité, le détail des lignes, la mention de TVA. Les
 * coordonnées viennent de la configuration du site — rien n'est inventé ici,
 * et ce qui manque ne s'affiche pas.
 */

export const devisSubject = (d: Devis) => `Votre devis ${d.numero} — ${SITE.name}`;

export function devisText(d: Devis): string {
  const lignes = d.lignes
    .map((l) => `- ${l.libelle} : ${l.quantite} ${l.unite} × ${euros(l.pu)} = ${euros(totalLigne(l))}`)
    .join("\n");
  // null = ligne absente, "" = ligne vide voulue. Le filtre ne retire que la
  // première, sinon le message arrive d'un seul bloc.
  const bloc: (string | null)[] = [
    `Bonjour ${d.client_nom},`,
    "",
    `Voici le devis ${d.numero} pour : ${d.prestation}.`,
    d.bien_libelle ? `Bien concerné : ${d.bien_libelle}.` : null,
    "",
    lignes,
    "",
    `Total : ${euros(d.total_ttc)}`,
    LEGAL.vatMention,
    d.valide_jusqu_au ? `Devis valable jusqu'au ${dateLongue(d.valide_jusqu_au)}.` : null,
    "",
    RETRACTATION,
    d.notes ? `\n${d.notes}` : null,
    "",
    "Pour l'accepter, répondez simplement à ce message.",
    "",
    `${SITE.name}${CONTACT.phone ? ` — ${CONTACT.phone}` : ""}`,
    SITE.url,
  ];
  return bloc.filter((x) => x !== null).join("\n");
}

/**
 * Accepté par retour d'e-mail, le devis est un contrat conclu à distance : le
 * client particulier dispose alors de quatorze jours pour se rétracter. Ne pas
 * l'en informer porterait ce délai à douze mois — la mention protège autant
 * l'entreprise que le client.
 */
const RETRACTATION = `Pour un contrat conclu à distance ou hors établissement, le client consommateur dispose d'un délai de rétractation de quatorze jours à compter de son acceptation (art. L221-18 du code de la consommation). Si vous souhaitez que la première intervention ait lieu avant la fin de ce délai, nous vous ferons signer une demande expresse d'exécution anticipée.`;

const CESU = `Réglé en CESU déclaratif, l'emploi à domicile ouvre droit au crédit d'impôt de 50 % prévu à l'article 199 sexdecies du code général des impôts, dans les limites fixées par la loi.`;

export function devisHtml(d: Devis): string {
  const lignes = d.lignes
    .map(
      (l) => `<tr>
  <td style="padding:10px 12px 10px 0;font-family:${SANS};font-size:14px;color:${INK};border-bottom:1px solid ${RULE}">${esc(l.libelle)}</td>
  <td align="right" style="padding:10px 12px;font-family:${SANS};font-size:13px;color:${SLATE};white-space:nowrap;border-bottom:1px solid ${RULE}">${esc(String(l.quantite).replace(".", ","))} ${esc(l.unite)} × ${euros(l.pu)}</td>
  <td align="right" style="padding:10px 0;font-family:${SANS};font-size:14px;color:${INK};white-space:nowrap;border-bottom:1px solid ${RULE}">${euros(totalLigne(l))}</td>
</tr>`,
    )
    .join("");

  const corps = `
<p style="margin:0 0 18px;font-family:${SANS};font-size:15px;line-height:1.65;color:${INK}">
  Bonjour ${esc(d.client_nom)}, voici le devis correspondant à notre échange. Il est gratuit et sans engagement.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${CREAM};margin:0 0 22px">
  <tr><td style="padding:14px 18px;font-family:${SANS};font-size:13px;color:${SLATE}">
    <strong style="color:${NAVY}">${esc(d.prestation)}</strong>${d.bien_libelle ? `<br>${esc(d.bien_libelle)}` : ""}
  </td></tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
  ${lignes}
  <tr>
    <td colspan="2" style="padding:14px 12px 0 0;font-family:${SANS};font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:${SLATE}">Total</td>
    <td align="right" style="padding:14px 0 0;font-family:${SANS};font-size:19px;font-weight:600;color:${NAVY};white-space:nowrap">${euros(d.total_ttc)}</td>
  </tr>
</table>

${LEGAL.vatMention ? `<p style="margin:10px 0 0;font-family:${SANS};font-size:12px;color:${SLATE}">${esc(LEGAL.vatMention)}</p>` : ""}
${d.valide_jusqu_au ? `<p style="margin:4px 0 0;font-family:${SANS};font-size:12px;color:${SLATE}">Devis valable jusqu'au ${esc(dateLongue(d.valide_jusqu_au))}.</p>` : ""}
${d.mode === "cesu" ? `<p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${SLATE}">${esc(CESU)}</p>` : ""}
<p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${SLATE}">${esc(RETRACTATION)}</p>
${d.notes ? `<div style="margin:22px 0 0;padding:14px 18px;background:${CREAM};font-family:${SANS};font-size:14px;line-height:1.6;color:${INK};border-left:3px solid ${GOLD}">${nl2br(d.notes)}</div>` : ""}

<p style="margin:26px 0 10px;font-family:${SANS};font-size:15px;line-height:1.65;color:${INK}">
  Pour l'accepter, répondez simplement à ce message. Une question, une précision à ajouter : c'est le moment.
</p>
${CONTACT.phone ? button(`tel:${telHref(CONTACT.phone)}`, `Appeler le ${CONTACT.phone}`) : ""}
${CONTACT.email ? button(`mailto:${CONTACT.email}`, "Répondre par e-mail", CREAM, NAVY) : ""}`;

  // Ce qui n'est pas renseigné ne s'affiche pas : mieux vaut un pied de page
  // court qu'une mention inventée sur un document qui engage.
  const pied = [
    [LEGAL.publisherName, SITE.name].filter(Boolean).map((x) => esc(x!)).join(" — "),
    [LEGAL.legalForm, LEGAL.siret ? `SIRET ${LEGAL.siret}` : null].filter(Boolean).map((x) => esc(x!)).join(", "),
    LEGAL.vatMention ? esc(LEGAL.vatMention) : "",
    [CONTACT.phone, CONTACT.email].filter(Boolean).map((x) => esc(x!)).join(" · "),
  ]
    .filter(Boolean)
    .join("<br>");

  return shell(SITE.url, `Devis ${esc(d.numero)}`, "Votre devis", corps, pied);
}
