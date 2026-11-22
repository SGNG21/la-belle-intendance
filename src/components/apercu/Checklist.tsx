"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Carte, Tag } from "./Os";
import { avancement, heures, type LigneChecklist } from "@/lib/apercu/modele";
import { enfiler, garder, reprendre } from "@/lib/apercu/horsLigne";
import { EtatReseau } from "./EtatReseau";

/**
 * Le relevé d'un passage.
 *
 * Trois états par ligne, pas deux : pas encore vu, fait, écarté. L'écart est
 * une information pour le client — « le bureau était fermé à clé » vaut mieux
 * qu'une case vide qu'il interprétera comme un oubli.
 *
 * Un appui fait tourner l'état. La ligne entière est la cible, 56 px de haut :
 * on coche debout, parfois avec des gants.
 */
export function Checklist({ initial, prevue, interventionId = "demo" }: { initial: LigneChecklist[]; prevue: number; interventionId?: string }) {
  const [lignes, setLignes] = useState(initial);
  const cle = `releve:${interventionId}`;

  // Au retour sur l'écran — téléphone verrouillé, onglet fermé, réseau tombé —
  // on repart du relevé gardé localement plutôt que de la liste vierge.
  useEffect(() => {
    const b = reprendre<LigneChecklist[]>(cle);
    if (b?.valeur?.length) setLignes(b.valeur);
  }, [cle]);

  const tourner = (id: string) =>
    setLignes((ls) => {
      const suite = ls.map((l) =>
        l.id === id ? { ...l, fait: l.fait === null ? true : l.fait === true ? false : null } : l,
      );
      // Écrit à chaque geste, pas à la validation : c'est ce qui sauve l'heure
      // de relevé quand le téléphone s'éteint.
      garder(cle, suite);
      return suite;
    });

  const av = avancement(lignes);
  const reste = av.restants;

  // Clore sans réseau : l'action part en file avec sa clé d'idempotence, et
  // le serveur refusera un second passage si elle revient.
  const clore = () =>
    enfiler({
      cle: `clore:${interventionId}`,
      url: `/api/intendance/interventions/${interventionId}/clore`,
      methode: "POST",
      corps: { checklist: lignes },
      cree_le: Date.now(),
    });

  return (
    <>
      <EtatReseau />
      <Carte
       
        titre="Relevé du passage"
        action={
          reste === 0 ? <Tag ton="fait">Complet</Tag> : <Tag ton="cours">{reste} à voir</Tag>
        }
      >
        <div className="os-jauge" aria-hidden="true">
          <div className="os-jauge__in" style={{ width: `${Math.round(av.part * 100)}%` }} />
        </div>
        <p className="os-sub" style={{ margin: "0.5rem 0 1rem" }}>
          {av.faits} faits · {av.ecartes} écartés · {av.restants} non relevés · {heures(prevue)} prévues
        </p>

        <ul className="os-check">
          {lignes.map((l) => {
            const etat = l.fait === true ? "fait" : l.fait === false ? "ecarte" : "vierge";
            return (
              <li key={l.id} className="os-check__li">
                <button
                  type="button"
                  className="os-check__btn"
                  data-etat={etat}
                  onClick={() => tourner(l.id)}
                  aria-pressed={l.fait === true}
                >
                  <span className="os-check__box" aria-hidden="true">
                    {l.fait === true ? "✓" : l.fait === false ? "–" : ""}
                  </span>
                  <span className="os-check__label">
                    {l.label}
                    {l.note && <span className="os-check__note">{l.note}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="os-sub" style={{ marginTop: "1rem" }}>
          Appuyez sur une ligne pour la faire passer de « non relevé » à « fait », puis à « écarté ».
        </p>
      </Carte>

      <div className="os-sticky">
        {reste > 0 ? (
          <>
            <span className="os-btn os-btn--plein" aria-disabled="true">
              Clore le passage
            </span>
            <span className="os-why">
              {reste} poste{reste > 1 ? "s" : ""} non relevé{reste > 1 ? "s" : ""}. Marquez-les faits ou écartés.
            </span>
          </>
        ) : (
          <>
            <Link href="/intendance/apercu/compte-rendu" className="os-btn os-btn--plein" onClick={clore}>
              Clore et rédiger le compte rendu
            </Link>
            <span className="os-why">Le compte rendu reprendra ce relevé.</span>
          </>
        )}
      </div>
    </>
  );
}
