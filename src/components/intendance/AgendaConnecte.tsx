"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Entete, Tag } from "@/components/apercu/Os";

/**
 * L'agenda, branché sur l'API.
 *
 * Les occurrences viennent de projeter_agenda() : les récurrences sont
 * calculées depuis les contrats au moment de la lecture, les exceptions en
 * sont déjà retirées, et les passages ponctuels s'y ajoutent. Rien n'est
 * fictif et rien n'est deviné côté navigateur.
 *
 * Chaque action — déplacer, annuler — renvoie la version sur laquelle on a
 * travaillé. Si elle a changé entre-temps, le serveur refuse et l'écran
 * propose de recharger plutôt que d'écraser le travail d'un autre appareil.
 */

type Vue = "jour" | "semaine" | "mois";

interface Case {
  jour: string;
  contrat_id: string | null;
  client_id: string;
  bien_id: string;
  libelle: string;
  duree_h: number;
  intervention_id: string | null;
  statut: string;
  intervenant_id: string | null;
  intervenant: string | null;
  client: string;
  commune: string | null;
  recurrente: boolean;
  version: number | null;
}

interface Intervenant {
  id: string;
  nom: string;
  couleur: string;
}

const LABEL: Record<string, string> = {
  projete: "À poser",
  planifiee: "Prévue",
  en_cours: "En cours",
  faite: "Terminée",
  reportee: "Reportée",
  annulee: "Annulée",
};

const TON: Record<string, "attente" | "cours" | "fait" | "sceau" | "alerte"> = {
  projete: "attente",
  planifiee: "attente",
  en_cours: "cours",
  faite: "fait",
  reportee: "sceau",
  annulee: "alerte",
};

/* ---------------------------------------------------------- calendrier */

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ajouter = (j: string, n: number) => {
  const d = new Date(`${j}T12:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** Le lundi de la semaine : en France elle ne commence pas le dimanche. */
const lundi = (j: string) => ajouter(j, -((new Date(`${j}T12:00:00`).getDay() + 6) % 7));
const premierDuMois = (j: string) => `${j.slice(0, 8)}01`;
const numJour = (j: string) => Number(j.slice(8, 10));
const memeMois = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);
const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const nomJour = (j: string) => JOURS[(new Date(`${j}T12:00:00`).getDay() + 6) % 7];
const jourLong = (j: string) =>
  new Date(`${j}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const moisLong = (j: string) =>
  new Date(`${j}T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
const heures = (h: number) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`;
};

/* ------------------------------------------------------------- l'écran */

export function AgendaConnecte() {
  const [vue, setVue] = useState<Vue>("semaine");
  const [curseur, setCurseur] = useState(iso(new Date()));
  const [cases, setCases] = useState<Case[]>([]);
  const [gens, setGens] = useState<Intervenant[]>([]);
  const [filtre, setFiltre] = useState<string | null>(null);
  const [etat, setEtat] = useState<"charge" | "pret" | "erreur">("charge");
  const [erreur, setErreur] = useState("");
  const [action, setAction] = useState<{ c: Case; quoi: "deplacer" | "annuler" } | null>(null);

  // La fenêtre demandée au serveur : toujours un mois entier, pour que
  // changer de vue ne relance pas un appel.
  const debut = lundi(premierDuMois(curseur));
  const fin = ajouter(debut, 41);

  const charger = useCallback(async () => {
    setEtat("charge");
    try {
      const [a, i] = await Promise.all([
        fetch(`/api/intendance/agenda?debut=${debut}&fin=${fin}`, { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/intendance/intervenants", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (!a.ok) throw new Error(a.error ?? "Agenda indisponible.");
      setCases(a.cases ?? []);
      setGens(i.ok ? (i.intervenants ?? []) : []);
      setEtat("pret");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Agenda indisponible.");
      setEtat("erreur");
    }
  }, [debut, fin]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const visibles = cases.filter((c) => !filtre || c.intervenant_id === filtre);
  const du = (j: string) => visibles.filter((c) => c.jour === j);
  const heuresDu = (j: string) =>
    du(j).reduce((s, c) => (c.statut === "annulee" ? s : s + Number(c.duree_h)), 0);

  const pas = vue === "jour" ? 1 : vue === "semaine" ? 7 : 30;
  const titre =
    vue === "jour" ? jourLong(curseur) : vue === "semaine" ? `semaine du ${numJour(lundi(curseur))} ${moisLong(curseur)}` : moisLong(curseur);

  return (
    <>
      <Entete
        kicker="Passages"
        titre="Agenda"
        sous="Les récurrences viennent des contrats ; les ponctuels s'y ajoutent."
      />

      <div className="ag-barre">
        <div className="ag-vues" role="tablist" aria-label="Vue de l'agenda">
          {(["jour", "semaine", "mois"] as Vue[]).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={vue === v} className="ag-vue" onClick={() => setVue(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="ag-nav">
          <button type="button" className="ag-fleche" onClick={() => setCurseur(ajouter(curseur, -pas))} aria-label="Période précédente">‹</button>
          <button type="button" className="os-btn os-btn--nu" onClick={() => setCurseur(iso(new Date()))}>Aujourd&apos;hui</button>
          <button type="button" className="ag-fleche" onClick={() => setCurseur(ajouter(curseur, pas))} aria-label="Période suivante">›</button>
        </div>
      </div>

      <h2 className="ag-titre">{titre}</h2>

      {gens.length > 0 && (
        <div className="ag-filtres">
          <button type="button" className="ag-puce" aria-pressed={filtre === null} onClick={() => setFiltre(null)}>
            Tout le monde
          </button>
          {gens.map((g) => (
            <button
              key={g.id}
              type="button"
              className="ag-puce"
              aria-pressed={filtre === g.id}
              onClick={() => setFiltre(filtre === g.id ? null : g.id)}
            >
              <span className={`ag-pastille ag-pastille--${g.couleur}`} aria-hidden="true" />
              {g.nom}
            </button>
          ))}
        </div>
      )}

      {etat === "charge" && <p className="os-vide">Chargement de l&apos;agenda…</p>}
      {etat === "erreur" && (
        <div className="os-note os-note--alerte">
          {erreur}{" "}
          <button type="button" className="os-btn os-btn--nu" onClick={() => void charger()}>
            Réessayer
          </button>
        </div>
      )}

      {etat === "pret" && vue === "jour" && (
        <Jour liste={du(curseur)} total={heuresDu(curseur)} onAction={setAction} />
      )}
      {etat === "pret" && vue === "semaine" && (
        <div className="ag-semaine">
          {Array.from({ length: 7 }, (_, i) => ajouter(lundi(curseur), i)).map((j) => (
            <section key={j} className="ag-jour">
              <button type="button" className="ag-jour__tete" onClick={() => { setCurseur(j); setVue("jour"); }}>
                <span className="ag-jour__nom">{nomJour(j)}</span>
                <span className="ag-jour__num">{numJour(j)}</span>
                {du(j).length > 0 && <span className="ag-jour__h">{heures(heuresDu(j))}</span>}
              </button>
              {du(j).length === 0 ? (
                <p className="ag-jour__vide">—</p>
              ) : (
                du(j).map((c, k) => <CarteCase key={k} c={c} onAction={setAction} />)
              )}
            </section>
          ))}
        </div>
      )}
      {etat === "pret" && vue === "mois" && (
        <>
          <div className="ag-mois__entete" aria-hidden="true">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="ag-mois">
            {Array.from({ length: 42 }, (_, i) => ajouter(debut, i)).map((j) => (
              <button
                key={j}
                type="button"
                className="ag-case"
                data-dehors={!memeMois(j, curseur) || undefined}
                onClick={() => { setCurseur(j); setVue("jour"); }}
                aria-label={`${jourLong(j)}, ${du(j).length} passage${du(j).length > 1 ? "s" : ""}`}
              >
                <span className="ag-case__num">{numJour(j)}</span>
                <span className="ag-case__points">
                  {du(j).slice(0, 4).map((c, i) => <span key={i} className={`ag-point ag-point--${c.statut}`} />)}
                </span>
              </button>
            ))}
          </div>
          <p className="os-sub">Touchez un jour pour l&apos;ouvrir.</p>
        </>
      )}

      {action && (
        <Confirmation
          c={action.c}
          quoi={action.quoi}
          onFerme={() => setAction(null)}
          onFait={async () => {
            setAction(null);
            await charger();
          }}
        />
      )}
    </>
  );
}

function Jour({ liste, total, onAction }: { liste: Case[]; total: number; onAction: (a: { c: Case; quoi: "deplacer" | "annuler" }) => void }) {
  if (!liste.length) {
    return <p className="os-vide">Aucun passage ce jour-là. Une journée libre pour les devis et les visites.</p>;
  }
  return (
    <>
      <p className="os-sub ag-bilan">{heures(total)} au total</p>
      <div className="ag-liste">
        {liste.map((c, i) => <CarteCase key={i} c={c} onAction={onAction} detaille />)}
      </div>
    </>
  );
}

function CarteCase({ c, onAction, detaille = false }: { c: Case; onAction: (a: { c: Case; quoi: "deplacer" | "annuler" }) => void; detaille?: boolean }) {
  const modifiable = c.intervention_id && c.statut !== "faite" && c.statut !== "annulee";
  return (
    <article className="ag-carte" data-statut={c.statut}>
      <div className="ag-carte__haut">
        <span className="ag-carte__h os-num">{heures(Number(c.duree_h))}</span>
        <Tag ton={TON[c.statut] ?? "attente"}>{LABEL[c.statut] ?? c.statut}</Tag>
      </div>
      <strong className="ag-carte__client">{c.client}</strong>
      <span className="ag-carte__quoi">{c.libelle}</span>
      {detaille && (
        <span className="ag-carte__quoi">
          {c.commune ?? "—"} · {c.recurrente ? "récurrente" : "ponctuelle"}
          {c.intervenant ? ` · ${c.intervenant}` : " · personne d'affecté"}
        </span>
      )}
      <div className="ag-carte__actions">
        <Link href={`/intendance/clients/${c.client_id}`} className="os-btn os-btn--nu">Fiche client</Link>
        {c.intervention_id && (
          <Link href={`/intendance/passage/${c.intervention_id}`} className="os-btn os-btn--nu">Ouvrir</Link>
        )}
        {modifiable && (
          <>
            <button type="button" className="os-btn os-btn--nu" onClick={() => onAction({ c, quoi: "deplacer" })}>Déplacer</button>
            <button type="button" className="os-btn os-btn--nu" onClick={() => onAction({ c, quoi: "annuler" })}>Annuler</button>
          </>
        )}
      </div>
    </article>
  );
}

/**
 * Confirmation, et traitement du conflit.
 *
 * Si le serveur répond qu'un autre appareil est passé avant, on ne réessaie
 * pas en forçant : on le dit, et on propose de recharger. Forcer reviendrait
 * à effacer sans le savoir le travail de quelqu'un d'autre.
 */
function Confirmation({
  c, quoi, onFerme, onFait,
}: { c: Case; quoi: "deplacer" | "annuler"; onFerme: () => void; onFait: () => Promise<void> }) {
  const [jour, setJour] = useState(ajouter(c.jour, 1));
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const [conflit, setConflit] = useState<{ reelle: number; modifie_le: string } | null>(null);

  async function envoyer() {
    if (!c.intervention_id) return;
    setBusy(true);
    setErreur("");
    try {
      const url =
        quoi === "deplacer"
          ? `/api/intendance/interventions/${c.intervention_id}/deplacer`
          : `/api/intendance/interventions/${c.intervention_id}/annuler`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // La version lue à l'affichage : le serveur refuse si elle a changé depuis.
        body: JSON.stringify(quoi === "deplacer" ? { jour, motif, version: c.version } : { motif, version: c.version }),
      });
      const d = await r.json();
      if (r.status === 409 && d.conflit) {
        setConflit(d.conflit);
        return;
      }
      if (!r.ok || !d.ok) throw new Error(d.error ?? "L'opération a échoué.");
      await onFait();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'opération a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ag-voile" role="dialog" aria-modal="true" aria-label={quoi === "deplacer" ? "Déplacer le passage" : "Annuler le passage"}>
      <div className="ag-boite">
        <h3 className="ag-boite__titre">{quoi === "deplacer" ? "Déplacer ce passage" : "Annuler ce passage"}</h3>
        <p className="os-sub">
          {c.client} · {c.libelle}
          <br />
          Actuellement le {jourLong(c.jour)}.
        </p>

        {conflit ? (
          <div className="os-note os-note--alerte">
            <strong>Ce passage a été modifié ailleurs</strong> le{" "}
            {new Date(conflit.modifie_le).toLocaleString("fr-FR")}. Rien n&apos;a été changé ici : rechargez pour voir
            l&apos;état réel avant de décider.
          </div>
        ) : (
          <>
            {quoi === "deplacer" && (
              <label className="ag-champ">
                <span>Nouvelle date</span>
                <input type="date" value={jour} onChange={(e) => setJour(e.target.value)} />
              </label>
            )}
            <label className="ag-champ">
              <span>Motif, qui figurera au dossier</span>
              <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Jour férié, cliente absente…" />
            </label>
          </>
        )}

        {erreur && <p className="os-why" style={{ color: "var(--danger)" }}>{erreur}</p>}

        <div className="ag-boite__actions">
          <button type="button" className="os-btn os-btn--contour" onClick={onFerme}>Fermer</button>
          {conflit ? (
            <button type="button" className="os-btn os-btn--plein" onClick={() => void onFait()}>Recharger</button>
          ) : (
            <button
              type="button"
              className="os-btn os-btn--plein"
              onClick={() => void envoyer()}
              disabled={busy || (quoi === "deplacer" && jour === c.jour)}
            >
              {busy ? "…" : quoi === "deplacer" ? "Confirmer le déplacement" : "Confirmer l'annulation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
