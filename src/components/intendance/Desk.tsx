"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { STATUTS, STATUT_LABEL, origine, type Client, type Demande, type Statut } from "@/lib/crmModel";
import { FREQUENCY_LABEL, HOUSING_LABEL } from "@/lib/lead";
import { api, shortDate } from "@/lib/intendanceApi";

type ClientRow = Client & { biens: { id: string; libelle: string }[] };
type Onglet = "demandes" | "clients" | "tarifs";

/** Le scoring du formulaire, en mots plutôt qu'en jargon. */
const PRIORITE_LABEL: Record<string, string> = { prioritaire: "Prioritaire", standard: "Standard", "a-qualifier": "À qualifier" };

const label = (m: Record<string, string>, k: string | null | undefined) => (k ? (m[k] ?? k) : null);

/**
 * Le bureau : les demandes reçues par le site d'un côté, les fiches clients de
 * l'autre. Tout passe par les routes /api/intendance, qui vérifient la session
 * à chaque appel — la page elle-même ne porte aucune donnée.
 */
export function Desk() {
  const [onglet, setOnglet] = useState<Onglet>("demandes");
  const [demandes, setDemandes] = useState<Demande[] | null>(null);
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [erreur, setErreur] = useState("");

  const charger = useMemo(
    () => async () => {
      try {
        const [d, c] = await Promise.all([
          api<{ demandes: Demande[] }>("/api/intendance/demandes"),
          api<{ clients: ClientRow[] }>("/api/intendance/clients"),
        ]);
        setDemandes(d.demandes);
        setClients(c.clients);
        setErreur("");
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      }
    },
    [],
  );

  useEffect(() => {
    void charger();
  }, [charger]);

  const nouveaux = demandes?.filter((d) => d.statut === "nouveau").length ?? 0;

  return (
    <>
      <div className="desk-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={onglet === "demandes"} className={onglet === "demandes" ? "is-on" : ""} onClick={() => setOnglet("demandes")}>
          Demandes
          {nouveaux ? <span className="desk-count">{nouveaux}</span> : null}
        </button>
        <button type="button" role="tab" aria-selected={onglet === "clients"} className={onglet === "clients" ? "is-on" : ""} onClick={() => setOnglet("clients")}>
          Clients
          {clients?.length ? <span className="desk-count desk-count--mute">{clients.length}</span> : null}
        </button>
        <button type="button" role="tab" aria-selected={onglet === "tarifs"} className={onglet === "tarifs" ? "is-on" : ""} onClick={() => setOnglet("tarifs")}>
          Tarifs
        </button>
      </div>

      {erreur ? (
        <p className="form-status form-status--err" role="alert">
          {erreur}
        </p>
      ) : null}

      {onglet === "demandes" ? <Demandes rows={demandes} reload={charger} /> : null}
      {onglet === "clients" ? <Clients rows={clients} reload={charger} /> : null}
      {onglet === "tarifs" ? <Tarifs /> : null}
    </>
  );
}

/* ---------------------------------------------------------------- demandes */

function Demandes({ rows, reload }: { rows: Demande[] | null; reload: () => Promise<void> }) {
  const [filtre, setFiltre] = useState<Statut | "tous">("tous");

  if (!rows) return <p className="desk-wait">Chargement…</p>;
  if (!rows.length) {
    return (
      <p className="desk-vide">
        Aucune demande pour l&apos;instant. Celles qui arrivent par le site — référencement, campagne, lien direct — se rangent ici
        automatiquement, avec leur origine.
      </p>
    );
  }

  const visibles = filtre === "tous" ? rows : rows.filter((d) => d.statut === filtre);

  return (
    <>
      <div className="desk-filtres">
        <button type="button" className={filtre === "tous" ? "is-on" : ""} onClick={() => setFiltre("tous")}>
          Toutes ({rows.length})
        </button>
        {STATUTS.map((s) => {
          const n = rows.filter((d) => d.statut === s).length;
          return n ? (
            <button key={s} type="button" className={filtre === s ? "is-on" : ""} onClick={() => setFiltre(s)}>
              {STATUT_LABEL[s]} ({n})
            </button>
          ) : null;
        })}
      </div>
      <ul className="desk-list">
        {visibles.map((d) => (
          <DemandeCard key={d.id} d={d} reload={reload} />
        ))}
      </ul>
    </>
  );
}

function DemandeCard({ d, reload }: { d: Demande; reload: () => Promise<void> }) {
  const [statut, setStatut] = useState<Statut>(d.statut);
  const [suivi, setSuivi] = useState(d.suivi ?? "");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const o = origine(d.utm);

  async function patch(patchBody: Record<string, unknown>) {
    setBusy(true);
    setErreur("");
    try {
      await api(`/api/intendance/demandes/${d.id}`, { method: "PATCH", body: JSON.stringify(patchBody) });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function creerFiche() {
    setBusy(true);
    setErreur("");
    try {
      const { clientId } = await api<{ clientId: string }>(`/api/intendance/demandes/${d.id}/fiche`, { method: "POST" });
      await reload();
      window.location.href = `/intendance/clients/${clientId}`;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible.");
      setBusy(false);
    }
  }

  const detail = [
    label(HOUSING_LABEL as Record<string, string>, d.logement),
    d.surface ? `${d.surface} m²` : null,
    d.chambres != null ? `${d.chambres} chambre${d.chambres > 1 ? "s" : ""}` : null,
    d.salles_de_bains != null ? `${d.salles_de_bains} salle${d.salles_de_bains > 1 ? "s" : ""} de bains` : null,
    label(FREQUENCY_LABEL as Record<string, string>, d.frequence),
  ].filter(Boolean);

  return (
    <li className={`desk-card desk-card--${d.statut}`}>
      <div className="desk-card-top">
        <div>
          <h3>{d.nom}</h3>
          <p className="desk-meta">
            {shortDate(d.recu_le)}
            {d.commune ? ` · ${d.commune}` : ""}
            {d.type_client === "professionnel" ? " · Professionnel" : ""}
          </p>
        </div>
        {d.priorite ? <span className={`desk-tier desk-tier--${d.priorite}`}>{PRIORITE_LABEL[d.priorite] ?? d.priorite}</span> : null}
      </div>

      <p className="desk-origine">
        <strong>{o.canal}</strong>
        {o.detail ? ` · ${o.detail}` : ""}
        {d.page && d.page !== "/" ? ` · page ${d.page}` : ""}
      </p>

      {detail.length ? <p className="desk-detail">{detail.join(" · ")}</p> : null}
      {d.besoin ? <p className="desk-besoin">« {d.besoin} »</p> : null}

      <p className="desk-contact">
        {d.telephone ? <a href={`tel:${d.telephone}`}>{d.telephone}</a> : <span>Pas de téléphone</span>}
        <a href={`mailto:${d.email}`}>{d.email}</a>
      </p>

      <div className="desk-actions">
        <label className="desk-select">
          <span>Suivi</span>
          <select
            className="input"
            value={statut}
            disabled={busy}
            onChange={(e) => {
              const v = e.target.value as Statut;
              setStatut(v);
              void patch({ statut: v });
            }}
          >
            {STATUTS.map((s) => (
              <option key={s} value={s}>
                {STATUT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        {d.client_id ? (
          <Link className="btn btn--ghost" href={`/intendance/clients/${d.client_id}`}>
            Voir la fiche
          </Link>
        ) : (
          <button type="button" className="btn" onClick={creerFiche} disabled={busy}>
            {busy ? "…" : "Créer la fiche client"}
          </button>
        )}
      </div>

      <label className="field">
        <span className="desk-label">Notes d&apos;appel</span>
        <textarea
          className="textarea"
          rows={2}
          value={suivi}
          onChange={(e) => setSuivi(e.target.value)}
          onBlur={() => suivi !== (d.suivi ?? "") && void patch({ suivi })}
          placeholder="Rappelée le…, à revoir en novembre…"
        />
      </label>

      {erreur ? <p className="error">{erreur}</p> : null}
    </li>
  );
}

/* ----------------------------------------------------------------- clients */

function Clients({ rows, reload }: { rows: ClientRow[] | null; reload: () => Promise<void> }) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [commune, setCommune] = useState("");
  const [adresse, setAdresse] = useState("");
  const [type, setType] = useState<"particulier" | "professionnel">("particulier");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErreur("");
    try {
      const { clientId } = await api<{ clientId: string }>("/api/intendance/clients", {
        method: "POST",
        body: JSON.stringify({ nom, email, telephone, commune, adresse, type }),
      });
      await reload();
      window.location.href = `/intendance/clients/${clientId}`;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Création impossible.");
      setBusy(false);
    }
  }

  if (!rows) return <p className="desk-wait">Chargement…</p>;

  return (
    <>
      {ouvert ? (
        <form className="desk-form" onSubmit={creer}>
          <div className="desk-grid">
            <label className="field">
              <span>Nom</span>
              <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus />
            </label>
            <label className="field">
              <span>Commune</span>
              <input className="input" value={commune} onChange={(e) => setCommune(e.target.value)} />
            </label>
            <label className="field desk-grid-large">
              <span>Adresse</span>
              <input className="input" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
            </label>
            <label className="field">
              <span>Téléphone</span>
              <input className="input" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field">
              <span>Type</span>
              <select className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="particulier">Particulier</option>
                <option value="professionnel">Professionnel</option>
              </select>
            </label>
          </div>
          {erreur ? <p className="error">{erreur}</p> : null}
          <div className="btn-row">
            <button type="submit" className="btn" disabled={busy || !nom.trim()}>
              {busy ? "Création…" : "Créer la fiche"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setOuvert(false)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <div className="btn-row desk-newrow">
          <button type="button" className="btn" onClick={() => setOuvert(true)}>
            Nouveau client
          </button>
        </div>
      )}

      {rows.length ? (
        <ul className="desk-rows">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/intendance/clients/${c.id}`}>
                <span className="desk-rows-nom">
                  {c.nom}
                  {c.actif ? "" : " · archivé"}
                </span>
                <span className="desk-rows-meta">
                  {[c.commune, c.type === "professionnel" ? "Professionnel" : null, c.biens.length ? `${c.biens.length} bien${c.biens.length > 1 ? "s" : ""}` : "aucun bien"]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="desk-vide">Aucune fiche pour l&apos;instant.</p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ tarifs */

interface Reglages {
  taux_horaire: number | null;
  deplacement: number | null;
  validite_jours: number;
  mentions: string | null;
}

/**
 * Les tarifs de l'entreprise.
 *
 * Aucun prix n'est proposé par défaut : le site n'affiche pas de tarif et le
 * simulateur ne doit pas en inventer un. Ce que Coralie saisit ici est la
 * seule source du calcul.
 */
function Tarifs() {
  const [r, setR] = useState<Reglages | null>(null);
  const [etat, setEtat] = useState<"" | "ok" | "busy">("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api<{ reglages: Reglages }>("/api/intendance/reglages")
      .then((d) => setR(d.reglages))
      .catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
  }, []);

  if (erreur) return <p className="error">{erreur}</p>;
  if (!r) return <p className="desk-wait">Chargement…</p>;

  const nombre = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEtat("busy");
    setErreur("");
    try {
      const d = await api<{ reglages: Reglages }>("/api/intendance/reglages", { method: "PATCH", body: JSON.stringify(r) });
      setR(d.reglages);
      setEtat("ok");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible.");
      setEtat("");
    }
  }

  return (
    <form className="desk-form" onSubmit={enregistrer}>
      <p className="desk-meta">
        Ces valeurs servent au simulateur de devis. Elles ne sont jamais affichées sur le site public.
      </p>
      <div className="desk-grid">
        <label className="field">
          <span>Taux horaire (€)</span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="any"
            min={1}
            max={500}
            value={r.taux_horaire ?? ""}
            onChange={(e) => setR({ ...r, taux_horaire: nombre(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Déplacement par passage (€)</span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            max={500}
            value={r.deplacement ?? ""}
            onChange={(e) => setR({ ...r, deplacement: nombre(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Validité d&apos;un devis (jours)</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            value={r.validite_jours}
            onChange={(e) => setR({ ...r, validite_jours: Number(e.target.value) || 30 })}
          />
        </label>
      </div>
      <label className="field">
        <span>Note reprise sur chaque devis</span>
        <textarea
          className="textarea"
          rows={3}
          value={r.mentions ?? ""}
          onChange={(e) => setR({ ...r, mentions: e.target.value })}
          placeholder="Produits et matériel fournis. Première visite sur place avant le premier passage."
        />
      </label>
      {erreur ? <p className="error">{erreur}</p> : null}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={etat === "busy"}>
          {etat === "busy" ? "Enregistrement…" : "Enregistrer"}
        </button>
        {etat === "ok" ? <span className="desk-meta">Enregistré.</span> : null}
      </div>
    </form>
  );
}
