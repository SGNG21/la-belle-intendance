"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Tag } from "@/components/apercu/Os";
import { AccesMasque } from "./AccesMasque";
import { enfiler, enLigne, garder, lireFile, oublier, reprendre, vider } from "@/lib/horsLigne";

/**
 * Le passage, tel qu'on le tient dans la main.
 *
 * Cet écran se remplit debout, dans une maison, souvent sans réseau. Trois
 * principes en découlent.
 *
 *   1. **Rien ne se perd.** Chaque geste est écrit sur l'appareil, pas à la
 *      validation. Le téléphone peut s'éteindre.
 *   2. **Rien ne part sans le dire.** La clôture passe par la file, avec sa
 *      clé d'idempotence et la version lue. Si un autre appareil est passé
 *      entre-temps, le serveur refuse et l'écran le dit au lieu d'écraser.
 *   3. **Rien de sensible ne descend sur le téléphone.** Les consignes
 *      d'entrée sont demandées à la route qui trace, et ne sont jamais
 *      écrites dans le stockage du navigateur.
 */

interface Ligne {
  id: string;
  label: string;
  fait: boolean | null;
  note: string;
}

interface Passage {
  id: string;
  client_id: string;
  bien_id: string;
  date: string;
  debut: string | null;
  fin: string | null;
  duree_prevue_h: number;
  statut: string;
  version: number;
  checklist: Ligne[];
  observations: string;
  photos_autorisees: boolean;
  km: number | null;
}

interface Bien {
  id: string;
  libelle: string;
  commune: string | null;
  adresse: string | null;
  km: number | null;
  a_des_consignes?: boolean;
}

interface Client {
  id: string;
  nom: string;
  email: string | null;
}

const heures = (h: number) => {
  const m = Math.round(Number(h) * 60);
  return `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`;
};

const maintenant = () => new Date().toTimeString().slice(0, 5);

const jourLong = (d: string) =>
  new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export function PassageEcran({ id }: { id: string }) {
  const [p, setP] = useState<Passage | null>(null);
  const [bien, setBien] = useState<Bien | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [observations, setObservations] = useState("");
  const [debut, setDebut] = useState<string | null>(null);
  const [etat, setEtat] = useState<"charge" | "pret" | "erreur">("charge");
  const [erreur, setErreur] = useState("");
  const [ligne, setLigne] = useState(true);
  const [enAttente, setEnAttente] = useState(0);
  const [conflit, setConflit] = useState<{ reelle: number; modifie_le: string } | null>(null);
  const [confirme, setConfirme] = useState(false);
  const [clos, setClos] = useState(false);

  const cle = `releve:${id}`;

  /* ------------------------------------------------------- chargement */

  const charger = useCallback(async () => {
    setEtat("charge");
    try {
      const r = await fetch(`/api/intendance/interventions/${id}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error ?? "Passage introuvable.");

      setP(d.intervention);
      setBien(d.bien ?? null);
      setClient(d.client ?? null);
      setDebut(d.intervention.debut ? d.intervention.debut.slice(0, 5) : null);
      setClos(d.intervention.statut === "faite");

      // Le brouillon local prime sur le serveur : il est forcément plus récent,
      // puisqu'il n'a pas encore pu partir.
      const b = reprendre<{ lignes: Ligne[]; observations: string }>(cle);
      setLignes(b?.valeur?.lignes?.length ? b.valeur.lignes : (d.intervention.checklist ?? []));
      setObservations(b?.valeur?.observations ?? d.intervention.observations ?? "");
      setEtat("pret");
    } catch (e) {
      // Hors réseau, on repart du brouillon plutôt que d'afficher une erreur.
      const b = reprendre<{ lignes: Ligne[]; observations: string }>(cle);
      if (b?.valeur?.lignes?.length) {
        setLignes(b.valeur.lignes);
        setObservations(b.valeur.observations ?? "");
        setEtat("pret");
        return;
      }
      setErreur(e instanceof Error ? e.message : "Passage introuvable.");
      setEtat("erreur");
    }
  }, [id, cle]);

  useEffect(() => {
    void charger();
  }, [charger]);

  /* ------------------------------------------------- réseau et file */

  useEffect(() => {
    const relire = () => {
      setLigne(enLigne());
      setEnAttente(lireFile().length);
    };
    relire();
    const retour = async () => {
      setLigne(true);
      const bilan = await vider();
      setEnAttente(bilan.restantes);
      if (bilan.conflits.length) {
        const c = bilan.conflits[0].conflit;
        if (c) setConflit({ reelle: c.reelle, modifie_le: c.modifie_le });
      } else if (bilan.parties > 0) {
        oublier(cle);
        await charger();
      }
    };
    window.addEventListener("online", retour);
    window.addEventListener("offline", relire);
    const t = window.setInterval(relire, 4000);
    return () => {
      window.removeEventListener("online", retour);
      window.removeEventListener("offline", relire);
      window.clearInterval(t);
    };
  }, [cle, charger]);

  /* ----------------------------------------------------- les gestes */

  const ecrire = (ls: Ligne[], obs: string) => garder(cle, { lignes: ls, observations: obs });

  const tourner = (ligneId: string) =>
    setLignes((ls) => {
      const suite = ls.map((l) =>
        l.id === ligneId ? { ...l, fait: l.fait === null ? true : l.fait === true ? false : null } : l,
      );
      ecrire(suite, observations);
      return suite;
    });

  const noter = (ligneId: string, note: string) =>
    setLignes((ls) => {
      const suite = ls.map((l) => (l.id === ligneId ? { ...l, note } : l));
      ecrire(suite, observations);
      return suite;
    });

  const demarrer = () => {
    const h = maintenant();
    setDebut(h);
    ecrire(lignes, observations);
  };

  async function clore() {
    if (!p) return;
    const action = {
      cle: `clore:${p.id}:v${p.version}`,
      url: `/api/intendance/interventions/${p.id}/clore`,
      methode: "POST" as const,
      corps: {
        debut: debut ?? p.debut?.slice(0, 5) ?? null,
        fin: maintenant(),
        checklist: lignes,
        observations,
        km: bien?.km ?? null,
        version: p.version,
      },
      cree_le: Date.now(),
    };
    enfiler(action);
    setConfirme(false);

    const bilan = await vider();
    setEnAttente(bilan.restantes);
    if (bilan.conflits.length) {
      const c = bilan.conflits[0].conflit;
      if (c) setConflit({ reelle: c.reelle, modifie_le: c.modifie_le });
      return;
    }
    if (bilan.refusees.length) {
      setErreur(bilan.refusees[0].message ?? "La clôture a été refusée.");
      return;
    }
    if (bilan.parties > 0) {
      oublier(cle);
      setClos(true);
      await charger();
    }
    // Reste en file : hors réseau. Le bandeau le dit déjà.
  }

  /* ------------------------------------------------------- affichage */

  if (etat === "charge") return <p className="desk-meta">Chargement du passage…</p>;
  if (etat === "erreur") return <p className="desk-erreur">{erreur}</p>;

  const faits = lignes.filter((l) => l.fait === true).length;
  const ecartes = lignes.filter((l) => l.fait === false).length;
  const restants = lignes.filter((l) => l.fait === null).length;
  const part = lignes.length ? (faits + ecartes) / lignes.length : 0;

  return (
    <div className="os-wrap os-wrap--doc">
      {/* ------------------------------------------- état du réseau */}
      {(!ligne || enAttente > 0) && (
        <p className={`os-reseau ${ligne ? "" : "os-reseau--coupe"}`} role="status">
          {ligne
            ? `${enAttente} enregistrement${enAttente > 1 ? "s" : ""} en cours d'envoi.`
            : "Hors réseau. Le relevé est gardé sur ce téléphone et partira tout seul."}
        </p>
      )}

      {conflit && (
        <div className="os-note os-note--alerte">
          <strong>Ce passage a été modifié ailleurs</strong> le{" "}
          {new Date(conflit.modifie_le).toLocaleString("fr-FR")}. Votre relevé est gardé sur ce téléphone et rien
          n&apos;a été écrasé.{" "}
          <button
            type="button"
            className="os-btn os-btn--nu"
            onClick={() => {
              setConflit(null);
              void charger();
            }}
          >
            Voir l&apos;état réel
          </button>
        </div>
      )}

      <header className="os-head">
        <div>
          <p className="os-kicker">{p ? jourLong(p.date) : ""}</p>
          <h1 className="os-h1">{bien?.libelle ?? "Passage"}</h1>
          <p className="os-sub">
            {client?.nom ?? ""}
            {bien?.commune ? ` · ${bien.commune}` : ""}
            {bien?.km ? ` · ${bien.km} km` : ""}
          </p>
        </div>
        <Tag ton={clos ? "fait" : debut ? "cours" : "attente"}>
          {clos ? "Terminée" : debut ? "En cours" : "À démarrer"}
        </Tag>
      </header>

      {/* ------------------------------------------- avant d'entrer */}
      <section className="os-card">
        <h2 className="os-card__title">Avant d&apos;entrer</h2>
        {bien && <AccesMasque bienId={bien.id} />}
        <dl className="os-dl" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(7rem, 1fr))" }}>
          <div>
            <dt>Arrivée</dt>
            <dd className="os-num">{debut ?? "—"}</dd>
          </div>
          <div>
            <dt>Prévu</dt>
            <dd>{p ? heures(p.duree_prevue_h) : "—"}</dd>
          </div>
          <div>
            <dt>Photos</dt>
            <dd>{p?.photos_autorisees ? "Autorisées" : "Refusées par le client"}</dd>
          </div>
        </dl>
        {!debut && !clos && (
          <button type="button" className="os-btn os-btn--plein" onClick={demarrer}>
            Démarrer le passage
          </button>
        )}
      </section>

      {/* ---------------------------------------------- la checklist */}
      <section className="os-card">
        <div className="os-card__head">
          <h2 className="os-card__title">Relevé du passage</h2>
          {restants === 0 ? <Tag ton="fait">Complet</Tag> : <Tag ton="cours">{restants} à voir</Tag>}
        </div>
        <div className="os-jauge" aria-hidden="true">
          <div className="os-jauge__in" style={{ width: `${Math.round(part * 100)}%` }} />
        </div>
        <p className="os-sub" style={{ margin: "0.5rem 0 1rem" }}>
          {faits} faits · {ecartes} écartés · {restants} non relevés
        </p>

        {lignes.length === 0 ? (
          <p className="os-vide">
            Aucune prestation retenue sur ce bien. La fiche du bien permet de les définir ; sans elles, le compte
            rendu n&apos;aura rien à dire.
          </p>
        ) : (
          <ul className="os-check">
            {lignes.map((l) => {
              const e = l.fait === true ? "fait" : l.fait === false ? "ecarte" : "vierge";
              return (
                <li key={l.id} className="os-check__li">
                  <button
                    type="button"
                    className="os-check__btn"
                    data-etat={e}
                    onClick={() => tourner(l.id)}
                    aria-pressed={l.fait === true}
                    disabled={clos}
                  >
                    <span className="os-check__box" aria-hidden="true">
                      {l.fait === true ? "✓" : l.fait === false ? "–" : ""}
                    </span>
                    <span className="os-check__label">{l.label}</span>
                  </button>
                  {/* Un écart sans explication se lira comme un oubli. */}
                  {l.fait === false && !clos && (
                    <input
                      className="passage-note"
                      type="text"
                      value={l.note}
                      onChange={(ev) => noter(l.id, ev.target.value)}
                      placeholder="Pourquoi ? Le client le lira."
                    />
                  )}
                  {l.fait === false && clos && l.note && <p className="os-check__note">{l.note}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* -------------------------------------------- observations */}
      <section className="os-card">
        <h2 className="os-card__title">Observations</h2>
        <textarea
          className="passage-obs"
          rows={4}
          value={observations}
          disabled={clos}
          onChange={(e) => {
            setObservations(e.target.value);
            ecrire(lignes, e.target.value);
          }}
          placeholder="Une fuite, une ampoule grillée, un mot laissé par le client…"
        />
        <p className="os-sub">Ce texte est repris tel quel dans le compte rendu.</p>
      </section>

      {/* ------------------------------------------------ la clôture */}
      {clos ? (
        <div className="os-sticky">
          <Link href={`/intendance/clients/${p?.client_id ?? ""}`} className="os-btn os-btn--plein">
            Voir la fiche client
          </Link>
          <span className="os-why">Passage clos. Le compte rendu s&apos;établit depuis la fiche.</span>
        </div>
      ) : (
        <div className="os-sticky">
          {restants > 0 ? (
            <>
              <span className="os-btn os-btn--plein" aria-disabled="true">
                Clore le passage
              </span>
              <span className="os-why">
                {restants} poste{restants > 1 ? "s" : ""} non relevé{restants > 1 ? "s" : ""}. Marquez-les faits ou
                écartés.
              </span>
            </>
          ) : (
            <>
              <button type="button" className="os-btn os-btn--plein" onClick={() => setConfirme(true)}>
                Clore le passage
              </button>
              <span className="os-why">
                {ligne ? "Le relevé partira aussitôt." : "Hors réseau : il partira au retour du signal."}
              </span>
            </>
          )}
        </div>
      )}

      {/* ---------------------------------------------- confirmation */}
      {confirme && (
        <div className="ag-voile" role="dialog" aria-modal="true" aria-label="Clore le passage">
          <div className="ag-boite">
            <h3 className="ag-boite__titre">Clore ce passage</h3>
            <p>
              {faits} postes faits, {ecartes} écartés. Arrivée à {debut ?? "—"}, départ à {maintenant()}.
            </p>
            <p className="os-sub">
              Une fois clos, le passage ne se rouvre pas : ses conditions tarifaires sont figées et il devient
              facturable.
            </p>
            <div className="ag-boite__actions">
              <button type="button" className="os-btn os-btn--contour" onClick={() => setConfirme(false)}>
                Annuler
              </button>
              <button type="button" className="os-btn os-btn--plein" onClick={() => void clore()}>
                Confirmer la clôture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
