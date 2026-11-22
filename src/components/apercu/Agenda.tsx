"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag } from "./Os";
import {
  CASES, INTERVENANTS, LABEL_STATUT, TON_STATUT, ajouter, casesDu, grilleMois, heuresDu,
  jourLong, lundi, memeMois, moisLong, nomJour, numJour, premierDuMois,
  type CaseAgenda,
} from "@/lib/apercu/agendaDemo";
import { heures } from "@/lib/apercu/modele";

type Vue = "jour" | "semaine" | "mois";

/**
 * L'agenda.
 *
 * Trois vues, mais une seule compte vraiment sur un téléphone : le jour. La
 * semaine sert à préparer, le mois à prendre du recul. Le réglage par défaut
 * est donc le jour sur petit écran, la semaine sur grand.
 *
 * Aucune occurrence récurrente n'est stockée : elles sont projetées depuis les
 * contrats, comme le fait projeter_agenda() en base. Un passage « à poser »
 * est une occurrence qui n'a pas encore d'intervention : on peut la déplacer
 * ou l'annuler sans toucher au contrat.
 */
export function Agenda({ aujourdhui }: { aujourdhui: string }) {
  const [vue, setVue] = useState<Vue>("semaine");
  const [curseur, setCurseur] = useState(aujourdhui);
  const [filtre, setFiltre] = useState<string | null>(null);
  const [aDeplacer, setADeplacer] = useState<CaseAgenda | null>(null);

  const garde = (c: CaseAgenda) => !filtre || c.intervenant_id === filtre;

  const pas = vue === "jour" ? 1 : vue === "semaine" ? 7 : 30;
  const reculer = () => setCurseur(ajouter(vue === "mois" ? premierDuMois(curseur) : curseur, -pas));
  const avancer = () => setCurseur(ajouter(vue === "mois" ? premierDuMois(curseur) : curseur, pas));

  const titre =
    vue === "jour" ? jourLong(curseur) : vue === "semaine" ? `Semaine du ${numJour(lundi(curseur))} ${moisLong(curseur)}` : moisLong(curseur);

  return (
    <>
      <div className="ag-barre">
        <div className="ag-vues" role="tablist" aria-label="Vue de l'agenda">
          {(["jour", "semaine", "mois"] as Vue[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={vue === v}
              className="ag-vue"
              onClick={() => setVue(v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="ag-nav">
          <button type="button" className="ag-fleche" onClick={reculer} aria-label="Période précédente">‹</button>
          <button type="button" className="os-btn os-btn--nu" onClick={() => setCurseur(aujourdhui)}>
            Aujourd&apos;hui
          </button>
          <button type="button" className="ag-fleche" onClick={avancer} aria-label="Période suivante">›</button>
        </div>
      </div>

      <h2 className="ag-titre">{titre}</h2>

      <div className="ag-filtres">
        <button type="button" className="ag-puce" aria-pressed={filtre === null} onClick={() => setFiltre(null)}>
          Tout le monde
        </button>
        {INTERVENANTS.map((i) => (
          <button
            key={i.id}
            type="button"
            className="ag-puce"
            aria-pressed={filtre === i.id}
            onClick={() => setFiltre(filtre === i.id ? null : i.id)}
          >
            <span className={`ag-pastille ag-pastille--${i.couleur}`} aria-hidden="true" />
            {i.nom}
          </button>
        ))}
      </div>

      {vue === "jour" && <VueJour jour={curseur} garde={garde} onDeplacer={setADeplacer} />}
      {vue === "semaine" && <VueSemaine debut={lundi(curseur)} garde={garde} onDeplacer={setADeplacer} onJour={(j) => { setCurseur(j); setVue("jour"); }} />}
      {vue === "mois" && <VueMois curseur={curseur} garde={garde} onJour={(j) => { setCurseur(j); setVue("jour"); }} />}

      {aDeplacer && <Deplacement c={aDeplacer} onFerme={() => setADeplacer(null)} />}
    </>
  );
}

/* ------------------------------------------------------------- vue jour */

function VueJour({ jour, garde, onDeplacer }: { jour: string; garde: (c: CaseAgenda) => boolean; onDeplacer: (c: CaseAgenda) => void }) {
  const liste = casesDu(jour).filter(garde);
  if (!liste.length) {
    return (
      <p className="os-vide">
        Aucun passage ce jour-là. Une journée libre pour les devis et les visites.
      </p>
    );
  }
  return (
    <>
      <p className="os-sub ag-bilan">{heures(heuresDu(jour))} au total</p>
      <div className="ag-liste">
        {liste.map((c) => (
          <Carte key={c.jour + c.client + (c.heure ?? "")} c={c} onDeplacer={onDeplacer} detaille />
        ))}
      </div>
    </>
  );
}

/* ---------------------------------------------------------- vue semaine */

function VueSemaine({
  debut, garde, onDeplacer, onJour,
}: { debut: string; garde: (c: CaseAgenda) => boolean; onDeplacer: (c: CaseAgenda) => void; onJour: (j: string) => void }) {
  const jours = Array.from({ length: 7 }, (_, i) => ajouter(debut, i));
  return (
    <div className="ag-semaine">
      {jours.map((j) => {
        const liste = casesDu(j).filter(garde);
        return (
          <section key={j} className="ag-jour">
            <button type="button" className="ag-jour__tete" onClick={() => onJour(j)}>
              <span className="ag-jour__nom">{nomJour(j)}</span>
              <span className="ag-jour__num">{numJour(j)}</span>
              {liste.length > 0 && <span className="ag-jour__h">{heures(heuresDu(j))}</span>}
            </button>
            {liste.length === 0 ? (
              <p className="ag-jour__vide">—</p>
            ) : (
              liste.map((c) => <Carte key={c.client + (c.heure ?? "")} c={c} onDeplacer={onDeplacer} />)
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- vue mois */

function VueMois({ curseur, garde, onJour }: { curseur: string; garde: (c: CaseAgenda) => boolean; onJour: (j: string) => void }) {
  const cases = grilleMois(curseur);
  return (
    <>
      <div className="ag-mois__entete" aria-hidden="true">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="ag-mois">
        {cases.map((j) => {
          const liste = casesDu(j).filter(garde);
          const dehors = !memeMois(j, curseur);
          return (
            <button
              key={j}
              type="button"
              className="ag-case"
              data-dehors={dehors || undefined}
              onClick={() => onJour(j)}
              aria-label={`${jourLong(j)}, ${liste.length} passage${liste.length > 1 ? "s" : ""}`}
            >
              <span className="ag-case__num">{numJour(j)}</span>
              <span className="ag-case__points">
                {liste.slice(0, 4).map((c, i) => (
                  <span key={i} className={`ag-point ag-point--${c.statut}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="os-sub">Touchez un jour pour l&apos;ouvrir.</p>
    </>
  );
}

/* --------------------------------------------------------- une occurrence */

function Carte({ c, onDeplacer, detaille = false }: { c: CaseAgenda; onDeplacer: (c: CaseAgenda) => void; detaille?: boolean }) {
  const lien = c.intervention_id ? "/intendance/apercu/intervention" : null;
  return (
    <article className="ag-carte" data-statut={c.statut}>
      <div className="ag-carte__haut">
        <span className="ag-carte__h os-num">{c.heure ?? "—"}</span>
        <Tag ton={TON_STATUT[c.statut]}>{LABEL_STATUT[c.statut]}</Tag>
      </div>
      <strong className="ag-carte__client">{c.client}</strong>
      <span className="ag-carte__quoi">
        {c.libelle} · {heures(c.duree_h)}
      </span>
      {detaille && (
        <span className="ag-carte__quoi">
          {c.commune} · {c.recurrente ? "récurrente" : "ponctuelle"}
          {c.intervenant ? ` · ${c.intervenant}` : " · personne d'affecté"}
        </span>
      )}
      <div className="ag-carte__actions">
        <Link href="/intendance/apercu/clients/c-delaunay" className="os-btn os-btn--nu">
          Fiche client
        </Link>
        {lien && (
          <Link href={lien} className="os-btn os-btn--nu">
            Checklist
          </Link>
        )}
        {c.statut !== "faite" && c.statut !== "annulee" && (
          <button type="button" className="os-btn os-btn--nu" onClick={() => onDeplacer(c)}>
            Déplacer
          </button>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------- déplacer, avec confirmation */

/**
 * Déplacer demande toujours confirmation.
 *
 * Un passage déplacé par mégarde sur un téléphone, et c'est une cliente qui
 * attend devant sa porte. La boîte dit ce qui va changer avant de le changer,
 * et rappelle qu'un passage déjà réalisé ne se déplace pas — ce que la base
 * refuse de toute façon.
 */
function Deplacement({ c, onFerme }: { c: CaseAgenda; onFerme: () => void }) {
  const [jour, setJour] = useState(ajouter(c.jour, 1));
  const [motif, setMotif] = useState("");
  const [fait, setFait] = useState(false);

  return (
    <div className="ag-voile" role="dialog" aria-modal="true" aria-label="Déplacer le passage">
      <div className="ag-boite">
        {fait ? (
          <>
            <h3 className="ag-boite__titre">Passage déplacé</h3>
            <p>
              {c.client} passe du <strong>{jourLong(c.jour)}</strong> au <strong>{jourLong(jour)}</strong>.
              {c.recurrente && " L'occurrence d'origine ne réapparaîtra pas dans l'agenda."}
            </p>
            <p className="os-sub">Maquette : rien n&apos;est enregistré, et la cliente n&apos;est pas prévenue.</p>
            <div className="ag-boite__actions">
              <button type="button" className="os-btn os-btn--plein" onClick={onFerme}>
                Fermer
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="ag-boite__titre">Déplacer ce passage</h3>
            <p className="os-sub">
              {c.client} · {c.libelle}
              <br />
              Actuellement le {jourLong(c.jour)}.
            </p>
            <label className="ag-champ">
              <span>Nouvelle date</span>
              <input type="date" value={jour} min={c.jour} onChange={(e) => setJour(e.target.value)} />
            </label>
            <label className="ag-champ">
              <span>Motif, qui figurera au dossier</span>
              <input
                type="text"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Jour férié, cliente absente…"
              />
            </label>
            <div className="ag-boite__actions">
              <button type="button" className="os-btn os-btn--contour" onClick={onFerme}>
                Annuler
              </button>
              <button
                type="button"
                className="os-btn os-btn--plein"
                onClick={() => setFait(true)}
                disabled={jour === c.jour}
              >
                Confirmer le déplacement
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const TOTAL_CASES = CASES.length;
