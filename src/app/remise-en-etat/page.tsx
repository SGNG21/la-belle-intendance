import { ServicePage } from "@/components/ServicePage";
import { pageMeta } from "@/lib/meta";

const path = "/remise-en-etat";
const description = "Nettoyage de remise en état à Joigny et ses alentours : après travaux, avant ou après un déménagement, avant une remise des clés.";
export const metadata = pageMeta({ title: "Nettoyage de remise en état à Joigny", description, path });

export default function Page() {
  return (
    <ServicePage
      title="Remise en état"
      lede="Un logement rendu propre et net : après des travaux, avant un déménagement ou avant de rendre les clés."
      path={path}
      serviceType="Nettoyage de remise en état"
      description={description}
      image={{ src: "/images/remise-cles-intendance.webp", alt: "Remise de clés sur le pas d'une porte de maison" }}
      intro={[
        "Après un chantier, après un déménagement ou avant un état des lieux, le logement a besoin d'un nettoyage plus poussé que le ménage ordinaire : poussière fine, traces, résidus, sols à reprendre.",
        "Nous intervenons sur un créneau convenu, avec une liste de ce qui doit être remis en état. Le devis est établi après un échange, parfois une visite, car l'ampleur dépend vraiment du chantier.",
      ]}
      included={{
        title: "Ce que nous traitons",
        items: ["Poussière fine après travaux sur toutes les surfaces", "Vitres, huisseries et encadrements", "Sols, plinthes et seuils", "Cuisine et salles de bains remises à neuf", "Pièces vidées avant un état des lieux"],
      }}
      forWhom={{
        title: "Pour qui",
        items: ["Particuliers après travaux ou rénovation", "Locataires et propriétaires lors d'un changement de logement", "Agences et professionnels de l'immobilier"],
      }}
      sap="autre"
    />
  );
}
