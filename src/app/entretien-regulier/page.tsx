import { ServicePage } from "@/components/ServicePage";
import { pageMeta } from "@/lib/meta";

const path = "/entretien-regulier";
const description = "Ménage à domicile régulier à Joigny et alentour : un passage par semaine ou tous les quinze jours, selon un cahier des charges écrit avec vous.";
export const metadata = pageMeta({ title: "Ménage à domicile régulier à Joigny", description, path });

export default function Page() {
  return (
    <ServicePage
      title="Ménage à domicile régulier"
      lede="Le même rythme, la même exigence, à chaque passage. Vous retrouvez une maison tenue sans avoir à y penser."
      path={path}
      serviceType="Ménage à domicile"
      description={description}
      intro={[
        "L'entretien régulier convient à un appartement comme à une grande maison. Nous fixons avec vous la fréquence, la durée d'un passage et les pièces à privilégier, puis nous l'écrivons.",
        "Ce cahier des charges évolue : vous pouvez ajouter une tâche, déplacer un jour ou suspendre pendant vos vacances. Vous n'avez pas à ré-expliquer à chaque fois.",
        "Nous privilégions la même personne à chaque passage, pour qu'elle connaisse votre logement et vos habitudes.",
      ]}
      included={{
        title: "Ce que comprend un passage",
        items: ["Dépoussiérage des surfaces et du mobilier", "Aspiration et lavage des sols", "Cuisine : plan de travail, plaques, évier, façades", "Salles de bains et sanitaires", "Lits refaits, poubelles sorties sur demande", "Repassage possible en complément"],
      }}
      forWhom={{
        title: "Pour qui",
        items: ["Familles et actifs qui manquent de temps", "Personnes qui souhaitent déléguer l'entretien", "Propriétaires d'une grande maison à suivre régulièrement"],
      }}
      sap="menage"
    />
  );
}
