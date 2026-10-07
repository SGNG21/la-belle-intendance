import { ServicePage } from "@/components/ServicePage";
import { pageMeta } from "@/lib/meta";

const path = "/professionnels";
const description = "Entretien de bureaux, cabinets médicaux et paramédicaux, commerces et agences à Joigny et ses alentours : contrat sur mesure, interlocuteur unique.";
export const metadata = pageMeta({ title: "Nettoyage de bureaux et cabinets", description, path });

export default function Page() {
  return (
    <ServicePage
      title="Entreprises, cabinets et commerces"
      lede="Des locaux propres à l'ouverture, un interlocuteur unique, un contrat qui suit votre activité."
      path={path}
      serviceType="Nettoyage de locaux professionnels"
      description={description}
      image={{ src: "/images/commerce-avant-ouverture.webp", alt: "Boutique de centre-ville avant l'ouverture : sol nettoyé, comptoir et rayonnages en bois dégagés" }}
      ctaLabel="Demander un devis professionnel"
      ctaHref="/contact?type=professionnel#formulaire"
      intro={[
        "Un cabinet, un bureau ou un commerce accueille du public : la propreté fait partie de l'image. Nous établissons un contrat d'entretien selon la surface, les horaires d'ouverture et la fréquence dont vous avez besoin.",
        "Nous intervenons en dehors des heures d'accueil lorsque c'est possible, et nous convenons d'une personne à qui vous adresser en cas de besoin.",
        "Le devis est établi après un échange et, le plus souvent, une visite des locaux.",
      ]}
      included={{
        title: "Ce que comprend un contrat",
        items: ["Sols, surfaces et poussières", "Sanitaires et points d'eau", "Corbeilles et poubelles", "Vitres selon la formule choisie", "Fréquence et horaires fixés au contrat"],
      }}
      forWhom={{
        title: "Pour qui",
        items: ["Cabinets médicaux, paramédicaux et professions libérales", "Agences immobilières, notaires, assurances", "Bureaux et petites entreprises", "Commerces et showrooms"],
      }}
      sap="none"
      faqs={[
        { q: "Intervenez-vous en dehors des heures d'ouverture ?", a: "Oui, lorsque c'est possible : tôt le matin, en soirée ou le week-end. Les horaires sont fixés dans le contrat." },
        { q: "Comment est établi le devis ?", a: "Après un échange sur vos besoins et, le plus souvent, une visite des locaux. Le contrat précise la fréquence, les horaires et le contenu de chaque passage." },
      ]}
    />
  );
}
