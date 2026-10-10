import { COMMUNES, PRICING, SITE } from "@/config/site";
import type { FaqItem } from "@/components/Faq";

export function getFaqs(): FaqItem[] {
  const price = PRICING.hourlyTTC
    ? `Le tarif horaire est de ${PRICING.hourlyTTC.toLocaleString("fr-FR")} € TTC. Il est confirmé dans votre devis écrit, avec les éventuels frais de déplacement.`
    : "Le tarif dépend de la prestation, de la taille du logement et de la distance. Il est indiqué dans votre devis écrit, avant toute intervention.";
  return [
    { q: "Combien coûte une heure de ménage ?", a: price },
    {
      q: "Comment se passe la facturation ?",
      a: "De deux façons, au choix, décidé avant la première intervention. En prestation, vous recevez un devis puis une facture, et vous n'avez aucune démarche à faire. En emploi direct, vous m'employez et vous déclarez les heures sur cesu.urssaf.fr : vous êtes alors particulier employeur.",
    },
    {
      q: "Le crédit d'impôt s'applique-t-il ?",
      a: "Uniquement en emploi direct déclaré au CESU : c'est l'emploi d'un salarié à domicile qui ouvre droit au crédit d'impôt de 50 % sur le salaire et les cotisations (article 199 sexdecies du CGI), avec l'avance immédiate possible via CESU+. En prestation facturée, non.",
    },
    {
      q: "Dans quelles communes intervenez-vous ?",
      a: `Nous intervenons à ${SITE.city} et dans ses alentours, notamment à ${COMMUNES.slice(1, 9).join(", ")} et dans les communes voisines. Si la vôtre n'apparaît pas, demandez-nous : nous vous répondons selon la distance.`,
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
