import Link from "next/link";
import { COMMUNES, PRICING, SITE } from "@/config/site";
import { PageHero } from "@/components/PageHero";
import { Band } from "@/components/Figure";
import { pageMeta } from "@/lib/meta";

const path = "/joigny";
const description = "Ménage et intendance de maison à Joigny : centre ancien, bords de l'Yonne et coteaux. Zone d'intervention de La Belle Intendance, rayon d'environ 25 km.";
export const metadata = pageMeta({ title: "Ménage à Joigny et dans un rayon de 25 km", description, path });

export default function Page() {
  return (
    <>
      <PageHero title="Ménage et intendance à Joigny" lede="Nous sommes installés à Joigny et nous intervenons dans un rayon d'environ vingt-cinq kilomètres." path={path} crumbLabel="Joigny et alentour" />

      <Band
        src="/images/maison-terrasse-vallee.webp"
        alt="Terrasse d'une maison de pierre ouverte sur la vallée de l'Yonne"
      />

      <section className="section">
        <div className="wrap split">
          <div className="prose">
            <h2>Une ville de maisons anciennes</h2>
            <p>
              Joigny compte environ 9 000 habitants (INSEE 2023). Son centre ancien, groupé autour de l'Yonne, mêle maisons à pans de bois, hôtels particuliers et immeubles de pierre, avec des escaliers étroits, des planchers anciens et des boiseries qui demandent des gestes précis.
            </p>
            <p>Sur les coteaux et dans les quartiers plus récents, on trouve des maisons plus grandes, avec jardin. Certaines sont des résidences que leurs propriétaires ne fréquentent que par périodes.</p>
            <h3>Ce que cela change pour le ménage</h3>
            <ul>
              <li>Des sols anciens à entretenir selon leur nature : parquet, tomettes, pierre.</li>
              <li>Des maisons sur plusieurs niveaux, dont la durée de passage se chiffre après visite.</li>
              <li>Des logements vides une partie de l'année, qui gagnent à être aérés et contrôlés.</li>
            </ul>
          </div>
          <div className="prose">
            <h2>Communes desservies</h2>
            <p className="communes">
              {COMMUNES.map((c) => (
                <span key={c} className={c === "Joigny" ? "core" : undefined}>
                  {c}
                </span>
              ))}
            </p>
            <p>Le déplacement est inclus jusqu'à {PRICING.travel.zoneAKm} km de {SITE.city}. Au-delà, le supplément dépend de la distance et figure dans le devis.</p>
            <p className="muted">Votre commune n'est pas dans la liste ? Écrivez-nous : nous répondons selon la distance.</p>
            <div className="btn-row">
              <Link className="btn" href="/contact">
                Demander un devis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
