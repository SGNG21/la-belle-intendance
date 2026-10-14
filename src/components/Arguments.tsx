import { ReportCard } from "./ReportCard";
import { Check, Seal } from "./Icons";

/**
 * Les blocs qui convainquent, partagés par /devis et /contact.
 *
 * Écrits une seule fois : la page de destination et la page de contact du
 * site doivent dire la même chose, de la même façon. Elles ne diffèrent que
 * par leur cadre — l'une sans navigation pour les campagnes, l'autre dans le
 * site, où le visiteur doit pouvoir continuer sa visite.
 */

const POINTS = [
  ["La même personne", "Coralie intervient elle-même. Pas de rotation d'équipe, pas d'inconnu chez vous."],
  ["Un compte rendu", "Après chaque passage : ce qui a été fait, et ce qui mérite votre attention."],
  ["Un devis écrit", "Le prix est fixé avant de commencer. Rien ne démarre sans votre accord."],
] as const;

const ETAPES = [
  ["Vous décrivez votre besoin", "Le formulaire prend deux minutes."],
  ["Nous en parlons", "Un appel pour préciser, et une visite si la taille du logement le justifie."],
  ["Vous recevez un devis écrit", "Le contenu des passages, la durée, le prix. Vous décidez ensuite."],
] as const;

export function PointsCles() {
  return (
    <section className="lp-sec lp-sec--paper">
      <div className="lp-in">
        <h2>Confier ses clés, ce n&apos;est pas un détail</h2>
        <p style={{ maxWidth: "40rem" }}>
          On ne cherche pas seulement quelqu&apos;un qui nettoie. On cherche quelqu&apos;un à qui on peut ouvrir sa porte, qui connaît
          la maison, et qui dit ce qu&apos;il a vu.
        </p>
        <ul className="lp-points">
          {POINTS.map(([t, d]) => (
            <li key={t}>
              <Check />
              <div>
                <strong>{t}</strong>
                <span>{d}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Citation() {
  return (
    <section className="lp-sec lp-sec--cream">
      <div className="lp-in lp-in--narrow lp-quote">
        <span className="seal-wrap">
          <Seal />
        </span>
        <q>Je suis vos yeux.</q>
        <div>
          <div className="who">Coralie</div>
          <div className="role">Votre intervenante</div>
        </div>
        <p style={{ maxWidth: "32rem" }}>
          Une maison qu&apos;on ne voit pas tout le temps mérite qu&apos;on la suive. Une fuite qui commence, une trace
          d&apos;humidité, un volet qui coince : vous le saurez le jour même.
        </p>
      </div>
    </section>
  );
}

export function ApercuCompteRendu() {
  return (
    <section className="lp-sec lp-sec--paper">
      <div className="lp-in lp-in--narrow">
        <h2 style={{ textAlign: "center" }}>Ce que vous recevez après un passage</h2>
        <div style={{ marginTop: "1.8rem" }}>
          <ReportCard />
        </div>
      </div>
    </section>
  );
}

export function Etapes() {
  return (
    <section className="lp-sec lp-sec--cream">
      <div className="lp-in">
        <h2 style={{ textAlign: "center" }}>Ce qui se passe ensuite</h2>
        <ol className="lp-steps">
          {ETAPES.map(([t, d]) => (
            <li key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
