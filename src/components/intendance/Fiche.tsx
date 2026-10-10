"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CARACTERISTIQUES,
  CATALOGUE,
  STATUT_LABEL,
  USAGES,
  USAGE_LABEL,
  dureeMenage,
  heures,
  origine,
  piecesProposees,
  type Bien,
  type Client,
  type Demande,
  type UsageBien,
} from "@/lib/crmModel";
import { api, shortDate } from "@/lib/intendanceApi";
import { DevisBloc } from "./Devis";

type Fiche = { client: Client; biens: Bien[]; demandes: Demande[] };
type Presta = { label: string; detail: string };

const FREQUENCES = ["Chaque semaine", "Tous les quinze jours", "Une fois par mois", "Ponctuel", "Sur demande"];

/** La fiche d'un client : ses coordonnées, ses biens, ce qui a été retenu sur chacun. */
export function FicheClient({ id }: { id: string }) {
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    try {
      setFiche(await api<Fiche>(`/api/intendance/clients/${id}`));
      setErreur("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Fiche introuvable.");
    }
  };

  useEffect(() => {
    void charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (erreur) {
    return (
      <>
        <p className="form-status form-status--err" role="alert">
          {erreur}
        </p>
        <Link className="btn btn--ghost" href="/intendance">
          Retour au bureau
        </Link>
      </>
    );
  }
  if (!fiche) return <p className="desk-wait">Chargement…</p>;

  return (
    <>
      <p className="desk-retour">
        <Link href="/intendance">← Bureau</Link>
      </p>
      <Coordonnees client={fiche.client} reload={charger} />
      {fiche.demandes.length ? <Origines demandes={fiche.demandes} /> : null}
      <Biens clientId={fiche.client.id} biens={fiche.biens} reload={charger} />
      <DevisBloc client={fiche.client} biens={fiche.biens} />
    </>
  );
}

/* ------------------------------------------------------------ coordonnées */

function Coordonnees({ client, reload }: { client: Client; reload: () => Promise<void> }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(client);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErreur("");
    try {
      await api(`/api/intendance/clients/${client.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nom: f.nom,
          email: f.email ?? "",
          telephone: f.telephone ?? "",
          commune: f.commune ?? "",
          adresse: f.adresse ?? "",
          type: f.type,
          mode: f.mode ?? "",
          notes: f.notes ?? "",
          actif: f.actif,
        }),
      });
      await reload();
      setEdit(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (!edit) {
    return (
      <header className="fiche-tete">
        <div>
          <h1>{client.nom}</h1>
          <p className="desk-meta">
            {[
              client.adresse,
              client.commune,
              client.type === "professionnel" ? "Professionnel" : "Particulier",
              client.mode === "cesu" ? "Contrat CESU" : client.mode === "prestation" ? "Facturation entreprise" : null,
              client.actif ? null : "Archivé",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="desk-contact">
            {client.telephone ? <a href={`tel:${client.telephone}`}>{client.telephone}</a> : null}
            {client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : null}
          </p>
          {client.notes ? <p className="desk-besoin">{client.notes}</p> : null}
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => setEdit(true)}>
          Modifier
        </button>
      </header>
    );
  }

  return (
    <form className="desk-form" onSubmit={enregistrer}>
      <div className="desk-grid">
        <label className="field">
          <span>Nom</span>
          <input className="input" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required />
        </label>
        <label className="field">
          <span>Commune</span>
          <input className="input" value={f.commune ?? ""} onChange={(e) => setF({ ...f, commune: e.target.value })} />
        </label>
        <label className="field desk-grid-large">
          <span>Adresse</span>
          <input className="input" value={f.adresse ?? ""} onChange={(e) => setF({ ...f, adresse: e.target.value })} />
        </label>
        <label className="field">
          <span>Téléphone</span>
          <input className="input" type="tel" value={f.telephone ?? ""} onChange={(e) => setF({ ...f, telephone: e.target.value })} />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input className="input" type="email" value={f.email ?? ""} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        <label className="field">
          <span>Type</span>
          <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Client["type"] })}>
            <option value="particulier">Particulier</option>
            <option value="professionnel">Professionnel</option>
          </select>
        </label>
        <label className="field">
          <span>Mode</span>
          <select className="input" value={f.mode ?? ""} onChange={(e) => setF({ ...f, mode: (e.target.value || null) as Client["mode"] })}>
            <option value="">À définir</option>
            <option value="prestation">Facturation entreprise</option>
            <option value="cesu">Contrat CESU</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Notes</span>
        <textarea className="textarea" rows={3} value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </label>
      <label className="desk-check">
        <input type="checkbox" checked={f.actif} onChange={(e) => setF({ ...f, actif: e.target.checked })} />
        <span>Client actif</span>
      </label>
      {erreur ? <p className="error">{erreur}</p> : null}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setF(client);
            setEdit(false);
          }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------- origines */

function Origines({ demandes }: { demandes: Demande[] }) {
  return (
    <section className="fiche-bloc">
      <h2>Comment il nous a trouvés</h2>
      <ul className="fiche-origines">
        {demandes.map((d) => {
          const o = origine(d.utm);
          return (
            <li key={d.id}>
              <strong>{o.canal}</strong>
              {o.detail ? ` · ${o.detail}` : ""} · {shortDate(d.recu_le)} · {STATUT_LABEL[d.statut] ?? d.statut}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ biens */

function Biens({ clientId, biens, reload }: { clientId: string; biens: Bien[]; reload: () => Promise<void> }) {
  const [nouveau, setNouveau] = useState(false);

  return (
    <section className="fiche-bloc">
      <h2>Biens</h2>
      {biens.map((b) => (
        <BienCard key={b.id} bien={b} reload={reload} />
      ))}
      {nouveau ? (
        <BienForm
          clientId={clientId}
          onDone={async () => {
            setNouveau(false);
            await reload();
          }}
          onCancel={() => setNouveau(false)}
        />
      ) : (
        <div className="btn-row desk-newrow">
          <button type="button" className="btn" onClick={() => setNouveau(true)}>
            {biens.length ? "Ajouter un bien" : "Ajouter le premier bien"}
          </button>
        </div>
      )}
    </section>
  );
}

function BienCard({ bien, reload }: { bien: Bien; reload: () => Promise<void> }) {
  const [edit, setEdit] = useState(false);

  if (edit) {
    return (
      <BienForm
        bien={bien}
        onDone={async () => {
          setEdit(false);
          await reload();
        }}
        onCancel={() => setEdit(false)}
      />
    );
  }

  const pluriel = (n: number | null, un: string, plusieurs = `${un}s`) => (n == null ? null : `${n} ${n > 1 ? plusieurs : un}`);
  const chiffres = [
    bien.usage ? USAGE_LABEL[bien.usage] : null,
    bien.surface ? `${bien.surface} m²` : null,
    pluriel(bien.chambres, "chambre"),
    pluriel(bien.salles_de_bains, "salle de bains", "salles de bains"),
    pluriel(bien.wc, "WC", "WC"),
    pluriel(bien.pieces_vie, "pièce de vie", "pièces de vie"),
    pluriel(bien.lits, "lit"),
    bien.cuisine_equipee ? "cuisine équipée" : null,
    bien.frequence,
    bien.duree_h ? `${String(bien.duree_h).replace(".", ",")} h par passage` : null,
    bien.km != null ? `${String(bien.km).replace(".", ",")} km` : null,
  ].filter(Boolean);

  const traits = CARACTERISTIQUES.filter((c) => bien.caracteristiques?.includes(c.id)).map((c) => c.label);

  return (
    <article className="bien">
      <div className="desk-card-top">
        <div>
          <h3>{bien.libelle}</h3>
          <p className="desk-meta">{[bien.adresse, bien.commune].filter(Boolean).join(", ") || "Adresse à compléter"}</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => setEdit(true)}>
          Modifier
        </button>
      </div>
      {chiffres.length ? <p className="desk-detail">{chiffres.join(" · ")}</p> : null}
      {traits.length ? (
        <p className="bien-ligne">
          <span>Particularités du lieu</span> {traits.join(" · ")}
        </p>
      ) : null}
      {bien.acces ? (
        <p className="bien-ligne">
          <span>Accès</span> {bien.acces}
        </p>
      ) : null}
      {bien.particularites ? (
        <p className="bien-ligne">
          <span>Particularités</span> {bien.particularites}
        </p>
      ) : null}
      {bien.prestations.length ? (
        <ul className="bien-prestations">
          {bien.prestations.map((p) => (
            <li key={p.label}>
              <strong>{p.label}</strong>
              {p.detail ? <span> — {p.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="desk-meta">Aucune pièce ni option enregistrée : le compte rendu n&apos;aura rien à proposer.</p>
      )}
      <div className="btn-row">
        <Link className="btn btn--ghost" href={`/intendance/compte-rendu?bien=${bien.id}`}>
          Compte rendu de passage
        </Link>
      </div>
    </article>
  );
}

function BienForm({ bien, clientId, onDone, onCancel }: { bien?: Bien; clientId?: string; onDone: () => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState({
    libelle: bien?.libelle ?? "",
    adresse: bien?.adresse ?? "",
    commune: bien?.commune ?? "",
    km: bien?.km?.toString() ?? "",
    usage: (bien?.usage ?? "") as UsageBien | "",
    surface: bien?.surface?.toString() ?? "",
    chambres: bien?.chambres?.toString() ?? "",
    salles_de_bains: bien?.salles_de_bains?.toString() ?? "",
    wc: bien?.wc?.toString() ?? "",
    pieces_vie: bien?.pieces_vie?.toString() ?? "",
    lits: bien?.lits?.toString() ?? "",
    acces: bien?.acces ?? "",
    particularites: bien?.particularites ?? "",
    frequence: bien?.frequence ?? "",
    duree_h: bien?.duree_h?.toString() ?? "",
    notes: bien?.notes ?? "",
  });
  const [cuisine, setCuisine] = useState(bien?.cuisine_equipee ?? false);
  const [caracs, setCaracs] = useState<string[]>(bien?.caracteristiques ?? []);
  const [lignes, setLignes] = useState<Presta[]>(bien?.prestations ?? []);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirme, setConfirme] = useState(false);

  const nb = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
  const logement = {
    chambres: nb(f.chambres),
    salles_de_bains: nb(f.salles_de_bains),
    wc: nb(f.wc),
    pieces_vie: nb(f.pieces_vie),
    surface: nb(f.surface),
    cuisine_equipee: cuisine,
    caracteristiques: caracs,
  };
  const estimation = dureeMenage(logement);

  const existe = (label: string) => lignes.some((l) => l.label.toLowerCase() === label.trim().toLowerCase());
  const ajouter = (label: string) => !existe(label) && setLignes((l) => [...l, { label, detail: "" }]);
  const majLigne = (i: number, patch: Partial<Presta>) => setLignes((l) => l.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const deplacer = (i: number, d: -1 | 1) =>
    setLignes((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const copie = [...l];
      [copie[i], copie[j]] = [copie[j], copie[i]];
      return copie;
    });

  /** Les pièces déduites du logement, ajoutées sans écraser ce qui est déjà là. */
  const proposer = () => {
    const proposees = piecesProposees(logement).filter((x) => !existe(x));
    setLignes((l) => [...proposees.map((label) => ({ label, detail: "" })), ...l]);
  };

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErreur("");
    const payload = {
      ...f,
      usage: f.usage || null,
      cuisine_equipee: cuisine,
      caracteristiques: caracs,
      prestations: lignes.filter((l) => l.label.trim()),
      ...(clientId ? { clientId } : {}),
    };
    try {
      await api(bien ? `/api/intendance/biens/${bien.id}` : "/api/intendance/biens", {
        method: bien ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      await onDone();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible.");
      setBusy(false);
    }
  }

  async function supprimer() {
    if (!bien) return;
    setBusy(true);
    try {
      await api(`/api/intendance/biens/${bien.id}`, { method: "DELETE" });
      await onDone();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Suppression impossible.");
      setBusy(false);
    }
  }

  const champ = (k: keyof typeof f) => ({
    value: f[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value }),
  });
  const compte = (k: keyof typeof f, label: string, max: number) => (
    <label className="field">
      <span>{label}</span>
      <input className="input" type="number" inputMode="numeric" min={0} max={max} {...champ(k)} />
    </label>
  );

  return (
    <form className="desk-form" onSubmit={enregistrer}>
      <div className="desk-grid">
        <label className="field">
          <span>Libellé</span>
          <input className="input" {...champ("libelle")} placeholder="Longère des Prés" required />
        </label>
        <label className="field">
          <span>Usage</span>
          <select className="input" {...champ("usage")}>
            <option value="">À définir</option>
            {USAGES.map((u) => (
              <option key={u} value={u}>
                {USAGE_LABEL[u]}
              </option>
            ))}
          </select>
        </label>
        <label className="field desk-grid-large">
          <span>Adresse</span>
          <input className="input" {...champ("adresse")} />
        </label>
        <label className="field">
          <span>Commune</span>
          <input className="input" {...champ("commune")} />
        </label>
        <label className="field">
          <span>Distance depuis Joigny (km)</span>
          <input className="input" type="number" inputMode="decimal" step="any" min={0} max={300} {...champ("km")} />
        </label>
      </div>

      <fieldset className="simu">
        <legend>Le logement</legend>
        <div className="desk-grid">
          <label className="field">
            <span>Surface (m²)</span>
            <input className="input" type="number" inputMode="numeric" min={5} max={5000} {...champ("surface")} />
          </label>
          {compte("chambres", "Chambres", 40)}
          {compte("salles_de_bains", "Salles de bains", 20)}
          {compte("wc", "WC séparés", 20)}
          {compte("pieces_vie", "Pièces de vie", 20)}
          {compte("lits", "Lits", 40)}
        </div>
        <label className="desk-check">
          <input type="checkbox" checked={cuisine} onChange={(e) => setCuisine(e.target.checked)} />
          <span>Cuisine équipée à nettoyer</span>
        </label>

        <div>
          <span className="desk-label">Ce qui allonge le passage</span>
          <div className="carac-liste">
            {CARACTERISTIQUES.map((c) => (
              <label key={c.id} className={caracs.includes(c.id) ? "is-on" : ""}>
                <input
                  type="checkbox"
                  checked={caracs.includes(c.id)}
                  onChange={(e) => setCaracs(e.target.checked ? [...caracs, c.id] : caracs.filter((x) => x !== c.id))}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <p className="simu-total">
          Ménage complet estimé à <strong>{heures(estimation)}</strong>
          <button type="button" className="lien-bouton" onClick={() => setF({ ...f, duree_h: String(estimation) })}>
            En faire la durée du passage
          </button>
        </p>
      </fieldset>

      <div className="desk-grid">
        <label className="field">
          <span>Fréquence</span>
          <select className="input" {...champ("frequence")}>
            <option value="">À définir</option>
            {FREQUENCES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Durée par passage (h)</span>
          <input className="input" type="number" inputMode="decimal" step="any" min={0.5} max={24} {...champ("duree_h")} />
        </label>
      </div>

      <label className="field">
        <span>Accès</span>
        <textarea className="textarea" rows={2} {...champ("acces")} placeholder="Clé sous le pot, code portail, chien dans le jardin…" />
      </label>
      <label className="field">
        <span>Particularités</span>
        <textarea className="textarea" rows={2} {...champ("particularites")} placeholder="Parquet ciré, pas de produit sur la pierre, chat à ne pas laisser sortir…" />
      </label>

      <fieldset className="presta-set">
        <legend>Ce qui est relevé à chaque passage</legend>
        <p className="desk-meta">
          Cette liste devient le compte rendu, dans cet ordre. Renommez les pièces comme on les appelle dans la maison : « chambre des
          enfants » vaut mieux que « Chambre 2 ».
        </p>

        <div className="btn-row desk-newrow">
          <button type="button" className="btn btn--ghost" onClick={proposer}>
            Proposer les pièces du logement
          </button>
        </div>

        {lignes.length ? (
          <ol className="pieces">
            {lignes.map((l, i) => (
              <li key={i}>
                <div className="pieces-tete">
                  <input
                    className="input"
                    value={l.label}
                    onChange={(e) => majLigne(i, { label: e.target.value })}
                    aria-label={`Intitulé de la ligne ${i + 1}`}
                    placeholder="Chambre des enfants"
                  />
                  <div className="pieces-ordre">
                    <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter">
                      ↑
                    </button>
                    <button type="button" onClick={() => deplacer(i, 1)} disabled={i === lignes.length - 1} aria-label="Descendre">
                      ↓
                    </button>
                    <button type="button" onClick={() => setLignes(lignes.filter((_, n) => n !== i))} aria-label="Retirer">
                      ×
                    </button>
                  </div>
                </div>
                <input
                  className="input presta-detail"
                  value={l.detail}
                  onChange={(e) => majLigne(i, { detail: e.target.value })}
                  placeholder="Consigne particulière (facultatif)"
                  aria-label={`Consigne pour ${l.label || `la ligne ${i + 1}`}`}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="desk-meta">Rien pour l&apos;instant : partez des pièces du logement, puis ajoutez les options convenues.</p>
        )}

        <div className="btn-row desk-newrow">
          <button type="button" className="btn btn--ghost" onClick={() => setLignes([...lignes, { label: "", detail: "" }])}>
            Ajouter une ligne
          </button>
        </div>

        {CATALOGUE.map((g) => {
          const restantes = (g.items as readonly string[]).filter((x) => !existe(x));
          return restantes.length ? (
            <div key={g.groupe} className="presta-groupe">
              <h4>{g.groupe}</h4>
              <div className="puces">
                {restantes.map((item) => (
                  <button type="button" key={item} onClick={() => ajouter(item)}>
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null;
        })}
      </fieldset>

      <label className="field">
        <span>Notes internes</span>
        <textarea className="textarea" rows={2} {...champ("notes")} />
      </label>

      {erreur ? <p className="error">{erreur}</p> : null}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={busy || !f.libelle.trim()}>
          {busy ? "Enregistrement…" : "Enregistrer le bien"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Annuler
        </button>
        {bien ? (
          <button
            type="button"
            className={`desk-supprimer${confirme ? " is-armed" : ""}`}
            onClick={() => (confirme ? void supprimer() : setConfirme(true))}
            disabled={busy}
          >
            {confirme ? "Confirmer la suppression" : "Supprimer ce bien"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
