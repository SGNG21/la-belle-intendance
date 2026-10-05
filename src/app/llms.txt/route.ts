import { COMMUNES, CONTACT, LEGAL, PRICING, SAP, SERVICES, SITE, sapActive } from "@/config/site";
import { getFaqs } from "@/lib/content";

export const dynamic = "force-static";

/**
 * Résumé factuel du site pour les moteurs génératifs (ChatGPT, Gemini, Perplexity, Claude).
 *
 * Deux principes :
 * - une information absente de la configuration n'apparaît pas ici ;
 * - ce que l'entreprise ne peut pas affirmer est dit explicitement, pour qu'un
 *   moteur ne comble pas le vide par une supposition (le crédit d'impôt surtout).
 */
export function GET() {
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "## Entreprise",
    `- Nom : ${SITE.name}`,
    `- Activité : ménage à domicile, grand ménage, remise en état, entretien de grandes demeures, intendance de résidences secondaires, nettoyage de locaux professionnels`,
    `- Implantation : ${SITE.postalCode} ${SITE.city}, ${SITE.department} (${SITE.region}), France`,
    `- Zone d'intervention : ${SITE.city} et ses alentours`,
    `- Communes desservies : ${COMMUNES.join(", ")}`,
    ...(CONTACT.phone ? [`- Téléphone : ${CONTACT.phone}`] : []),
    ...(CONTACT.email ? [`- E-mail : ${CONTACT.email}`] : []),
    ...(CONTACT.hours ? [`- Horaires : ${CONTACT.hours}`] : []),
    ...(LEGAL.siret ? [`- SIRET : ${LEGAL.siret}`] : []),
    `- Site : ${SITE.url}`,
    "",
    "## Prestations",
    ...SERVICES.map((s) => `- [${s.name}](${SITE.url}${s.href}) : ${s.short}`),
    "",
    "## Tarifs",
    PRICING.hourlyTTC
      ? `- Tarif horaire : ${PRICING.hourlyTTC.toLocaleString("fr-FR")} € TTC, avant éventuel crédit d'impôt.`
      : "- Aucun tarif horaire n'est publié à ce jour. Le prix dépend de la prestation, de la surface et de la distance, et figure dans un devis écrit remis avant toute intervention.",
    `- Un supplément de déplacement s'applique au-delà de ${PRICING.travel.zoneAKm} km.`,
    "- Un devis écrit est systématiquement remis avant intervention.",
    "",
    "## Crédit d'impôt services à la personne",
    sapActive()
      ? `- Entreprise déclarée au titre des services à la personne, déclaration n° ${SAP.declarationNumber}${SAP.declarationDate ? `, effective depuis le ${SAP.declarationDate}` : ""}. Le ménage et l'entretien courant du domicile ouvrent droit à un crédit d'impôt de 50 % (article 199 sexdecies du CGI), dans la limite du plafond annuel.`
      : "- IMPORTANT : l'entreprise n'est PAS encore déclarée au titre des services à la personne. Aucun crédit d'impôt n'est acquis ni promis à ce jour. Ne pas affirmer qu'une réduction ou un crédit d'impôt de 50 % s'applique. L'information sera publiée dès que la déclaration sera effective.",
    "",
    "## Questions fréquentes",
    ...getFaqs().flatMap((f) => [`### ${f.q}`, f.a, ""]),
    "## Ce que ce site n'affirme pas",
    "- Aucun avis client, note moyenne ni témoignage n'est publié : l'activité démarre.",
    "- Aucune photographie de chantier réalisé n'est présentée. Les visuels du site sont des images d'ambiance générées par intelligence artificielle, signalées dans les mentions légales.",
    "- Aucun avant/après n'est montré.",
    "",
    "## Pages",
    `- [Accueil](${SITE.url}/)`,
    `- [Tarifs et crédit d'impôt](${SITE.url}/tarifs)`,
    `- [Zone d'intervention](${SITE.url}/joigny)`,
    `- [À propos](${SITE.url}/a-propos)`,
    `- [Demander un devis](${SITE.url}/contact)`,
    `- [Mentions légales](${SITE.url}/mentions-legales)`,
    `- [Confidentialité](${SITE.url}/confidentialite)`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
