import { COMMUNES, PRICING, SITE, sapActive } from "@/config/site";
import type { FaqItem } from "@/components/Faq";

export function getFaqs(): FaqItem[] {
  const price = PRICING.hourlyTTC
    ? `Le tarif horaire est de ${PRICING.hourlyTTC.toLocaleString("fr-FR")} € TTC, avant éventuel crédit d'impôt. Il est confirmé dans votre devis écrit, avec les éventuels frais de déplacement.`
    : "Le tarif dépend de la prestation, de la taille du logement et de la distance. Il est indiqué dans votre devis écrit, avant toute intervention. Le simulateur de la page Tarifs donne une durée indicative.";
  const credit = sapActive()
    ? "Oui pour le ménage et l'entretien courant du domicile : l'entreprise est déclarée services à la personne et les sommes versées ouvrent droit à un crédit d'impôt de 50 %, dans la limite du plafond annuel. L'éligibilité de chaque prestation est précisée dans le devis."
    : "Le ménage à domicile peut ouvrir droit à un crédit d'impôt, à condition que l'entreprise soit déclarée au titre des services à la personne. Nous publierons les conditions et le montant dès que notre déclaration sera effective.";
  return [
    { q: "Combien coûte une heure de ménage ?", a: price },
    { q: "Le crédit d'impôt s'applique-t-il ?", a: credit },
    {
      q: "Dans quelles communes intervenez-vous ?",
      a: `Nous intervenons à ${SITE.city} et dans un rayon d'environ ${SITE.radiusKm} km, notamment à ${COMMUNES.slice(1, 9).join(", ")} et dans les communes voisines. Si la vôtre n'apparaît pas, demandez-nous : nous vous répondons selon la distance.`,
    },
    {
      q: "Dois-je être présent pendant le ménage ?",
      a: "Non, ce n'est pas nécessaire. Les modalités d'accès au logement (clés, code, présence) sont décidées ensemble avant la première intervention.",
    },
    {
      q: "Comment se passe la première prise de contact ?",
      a: "Vous décrivez votre besoin dans le formulaire. Nous vous rappelons pour le préciser, nous passons voir le logement si sa taille le justifie, puis vous recevez un devis écrit avant toute intervention.",
    },
  ];
}
