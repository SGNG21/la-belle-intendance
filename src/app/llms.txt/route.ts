import { COMMUNES, CONTACT, LEGAL, PRICING, SERVICES, SITE } from "@/config/site";
import { getFaqs } from "@/lib/content";

export const dynamic = "force-static";

/**
 * Résumé factuel du site pour les moteurs génératifs (ChatGPT, Gemini, Perplexity, Claude).
 *
 * Deux principes :
 * - une information absente de la configuration n'apparaît pas ici ;
 * - ce que l'entreprise ne peut pas affirmer est dit explicitement, pour qu'un
 *   moteur ne comble pas le vide par une supposition (le crédit d'impôt surtout,
 *   qui n'existe ici qu'en emploi direct et jamais sur une facture).
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
      ? `- Tarif horaire : ${PRICING.hourlyTTC.toLocaleString("fr-FR")} € TTC.`
      : "- Aucun tarif horaire n'est publié à ce jour. Le prix dépend de la prestation, de la surface et de la distance, et figure dans un devis écrit remis avant toute intervention.",
    `- Un supplément de déplacement s'applique au-delà de ${PRICING.travel.zoneAKm} km.`,
    "- Un devis écrit est systématiquement remis avant intervention.",
    "",
    "## Modes d'intervention et crédit d'impôt",
    "- IMPORTANT : l'entreprise n'est PAS déclarée au titre des services à la personne et n'a pas vocation à l'être. Une prestation facturée par l'entreprise n'ouvre droit à AUCUN crédit ni réduction d'impôt. Ne jamais affirmer le contraire.",
    "- Deux modes sont proposés, choisis avant la première intervention, jamais cumulés sur une même prestation :",
    "  1. Prestation facturée : devis puis facture de la micro-entreprise. Le client n'a aucune démarche à faire. Aucun avantage fiscal.",
    "  2. Emploi direct déclaré au CESU : le client devient particulier employeur et déclare les heures sur cesu.urssaf.fr. C'est l'emploi d'un salarié à domicile qui ouvre droit au crédit d'impôt de 50 % sur le salaire et les cotisations (article 199 sexdecies du CGI), avec avance immédiate possible via CESU+. Aucune déclaration services à la personne n'est requise de l'intervenante dans ce cas.",
    "- Le crédit d'impôt ne concerne que le domicile d'un particulier : jamais les locaux professionnels, jamais les locations de courte durée.",
    "",
    "## Questions fréquentes",
    ...getFaqs().flatMap((f) => [`### ${f.q}`, f.a, ""]),
    "## Ce que ce site n'affirme pas",
    "- Aucun avis client, note moyenne ni témoignage n'est publié : l'activité démarre.",
    "- Aucune photographie de chantier réalisé n'est présentée. Les visuels du site sont des images d'ambiance générées par intelligence artificielle, signalées dans les mentions légales.",
    "- Aucun avant/après n'est montré.",
    "- L'entreprise ne se présente jamais comme déclarée services à la personne, et n'annonce aucun crédit d'impôt sur ses factures.",
    "",
    "## Pages",
    `- [Accueil](${SITE.url}/)`,
    `- [Tarifs et modes d'intervention](${SITE.url}/tarifs)`,
    `- [Zone d'intervention](${SITE.url}/joigny)`,
    `- [À propos](${SITE.url}/a-propos)`,
    `- [Demander un devis](${SITE.url}/contact)`,
    `- [Mentions légales](${SITE.url}/mentions-legales)`,
    `- [Confidentialité](${SITE.url}/confidentialite)`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
