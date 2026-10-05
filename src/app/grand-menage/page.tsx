import { ServicePage } from "@/components/ServicePage";
import { pageMeta } from "@/lib/meta";

const path = "/grand-menage";
const description = "Grand ménage à Joigny et ses alentours : nettoyage approfondi d'une maison ou d'un appartement, au printemps, avant une réception ou après une longue absence.";
export const metadata = pageMeta({ title: "Grand ménage à Joigny", description, path });

export default function Page() {
  return (
    <ServicePage
      title="Grand ménage"
      lede="Une remise à neuf de fond en comble, quand l'entretien courant ne suffit plus."
      path={path}
      serviceType="Grand ménage"
      description={description}
      image={{ src: "/images/entretien-cuisine-maison.webp", alt: "Cuisine de maison de campagne, plan de travail dégagé", caption: "Image d'ambiance." }}
      intro={[
        "Le grand ménage reprend tout ce que l'entretien du quotidien laisse de côté : derrière les meubles, l'intérieur des placards, les plinthes, les vitres, les recoins de la cuisine et des salles de bains.",
        "Il se commande seul, à une date de votre choix, ou comme premier passage avant de passer à un entretien régulier. Dans ce cas, la maison part d'une base saine et les passages suivants sont plus courts.",
        "La durée dépend de la taille et de l'état du logement. Nous la chiffrons dans le devis, après un échange et, pour une grande maison, une visite.",
      ]}
      included={{
        title: "Ce que comprend un grand ménage",
        items: ["Nettoyage approfondi pièce par pièce", "Intérieur des placards et électroménager sur demande", "Plinthes, huisseries, interrupteurs, poignées", "Vitres intérieures", "Sols entretenus selon leur nature (parquet ancien, carrelage, pierre)"],
      }}
      forWhom={{
        title: "Quand le choisir",
        items: ["Au printemps ou à la rentrée", "Avant une réception ou l'arrivée d'invités", "Après une longue absence ou un hiver fermé", "En premier passage avant un entretien régulier"],
      }}
      sap="menage"
    />
  );
}
