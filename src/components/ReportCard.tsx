import Image from "next/image";
import { Check, Seal } from "./Icons";

/**
 * Exemple fictif de compte rendu d'intervention : il montre la façon de rendre compte
 * après un passage dans une grande maison. Il est présenté comme un exemple, jamais comme un client réel.
 */
export function ReportCard() {
  return (
    <figure className="report" style={{ margin: 0 }} aria-label="Exemple de compte rendu d'intervention">
      <div className="report-head">
        <div>
          <h2>Compte rendu de passage</h2>
          <p>Maison de caractère, 6 pièces</p>
        </div>
        <Seal />
      </div>
      <ul>
        <li>
          <Check />
          <div>
            Cuisine et office
            <span>Plan de travail, plaques, évier, sol</span>
          </div>
        </li>
        <li>
          <Check />
          <div>
            Salles de bains
            <span>Sanitaires, robinetterie, miroirs</span>
          </div>
        </li>
        <li>
          <Check />
          <div>
            Chambres
            <span>Poussières, sols, surfaces</span>
          </div>
        </li>
      </ul>
      <p className="report-note">
        <strong>À signaler :</strong> légère trace d'humidité au plafond de la buanderie, photo jointe.
      </p>
      <div className="report-photos">
        <div>
          <Image
            src="/images/compte-rendu-cuisine.webp"
            alt="Cuisine remise en ordre après le passage : plan de travail dégagé, plaque et évier nettoyés"
            width={900}
            height={600}
            sizes="(max-width: 900px) 45vw, 220px"
          />
        </div>
        <div>
          <Image
            src="/images/compte-rendu-humidite-buanderie.webp"
            alt="Trace d'humidité au plafond de la buanderie, près de l'angle du mur"
            width={900}
            height={600}
            sizes="(max-width: 900px) 45vw, 220px"
          />
        </div>
      </div>
      <figcaption className="report-foot">Exemple de compte rendu, à titre d'illustration.</figcaption>
    </figure>
  );
}
