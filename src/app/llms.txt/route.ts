import { COMMUNES, CONTACT, SERVICES, SITE, sapActive } from "@/config/site";

export const dynamic = "force-static";

/** Résumé factuel du site pour les moteurs génératifs (ChatGPT, Gemini, Perplexity, Claude). */
export function GET() {
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "## Entreprise",
    `- Nom : ${SITE.name}`,
    `- Activité : ménage à domicile, grand ménage, remise en état, entretien de grandes demeures, intendance de résidences secondaires, nettoyage de locaux professionnels`,
    `- Implantation : ${SITE.postalCode} ${SITE.city}, ${SITE.department} (${SITE.region})`,
    `- Zone d'intervention : ${SITE.city} et environ ${SITE.radiusKm} km autour (${COMMUNES.join(", ")})`,
    ...(CONTACT.phone ? [`- Téléphone : ${CONTACT.phone}`] : []),
    ...(CONTACT.email ? [`- E-mail : ${CONTACT.email}`] : []),
    `- Devis : écrit, remis avant toute intervention`,
    `- Crédit d'impôt services à la personne : ${sapActive() ? "entreprise déclarée, crédit d'impôt de 50 % pour le ménage et l'entretien courant du domicile" : "déclaration en cours, aucun avantage fiscal annoncé tant qu'elle n'est pas effective"}`,
    "",
    "## Prestations",
    ...SERVICES.map((s) => `- [${s.name}](${SITE.url}${s.href}) : ${s.short}`),
    "",
    "## Pages utiles",
    `- [Tarifs et crédit d'impôt](${SITE.url}/tarifs)`,
    `- [Zone d'intervention](${SITE.url}/joigny)`,
    `- [À propos](${SITE.url}/a-propos)`,
    `- [Demander un devis](${SITE.url}/contact)`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
