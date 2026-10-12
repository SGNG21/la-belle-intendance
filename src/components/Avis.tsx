import { AVIS, CONTACT } from "@/config/site";

/** Une étoile pleine ou vide, dessinée plutôt que chargée. */
function Etoile({ pleine }: { pleine: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={pleine ? "etoile is-pleine" : "etoile"}>
      <path d="M10 1.6l2.47 5.36 5.86.68-4.35 3.98 1.18 5.78L10 14.47l-5.16 2.93 1.18-5.78L1.67 7.64l5.86-.68z" />
    </svg>
  );
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const moisLisible = (d: string) => {
  const [a, m] = d.split("-");
  return MOIS[Number(m) - 1] ? `${MOIS[Number(m) - 1]} ${a}` : a;
};

/**
 * Les avis laissés sur la fiche Google de l'entreprise.
 *
 * Rien ne s'affiche tant qu'il n'y a pas d'avis réel : une section de
 * témoignages vide, ou pire inventée, coûte plus de confiance qu'elle n'en
 * rapporte.
 */
export function Avis() {
  if (!AVIS.length) return null;

  return (
    <section className="section" aria-labelledby="avis-titre">
      <div className="wrap">
        <div className="kicker">Ce qu'en disent nos clients</div>
        <h2 id="avis-titre">Les avis laissés sur Google</h2>
        <ul className="avis">
          {AVIS.map((a) => (
            <li key={`${a.auteur}-${a.date}`}>
              <div className="avis-notes" aria-label={`${a.note} étoiles sur 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Etoile key={n} pleine={n <= a.note} />
                ))}
              </div>
              <blockquote>{a.texte}</blockquote>
              <p className="avis-signature">
                {a.auteur} <span>· {moisLisible(a.date)}</span>
              </p>
            </li>
          ))}
        </ul>
        {CONTACT.googleBusinessUrl ? (
          <p className="avis-lien">
            <a href={CONTACT.googleBusinessUrl} target="_blank" rel="noopener noreferrer">
              Voir la fiche et tous les avis sur Google
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
