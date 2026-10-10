"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATALOGUE, STATUT_LABEL, origine, type Bien, type Client, type Demande } from "@/lib/crmModel";
import { api, shortDate } from "@/lib/intendanceApi";

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

  const chiffres = [
    bien.surface ? `${bien.surface} m²` : null,
    bien.chambres != null ? `${bien.chambres} chambre${bien.chambres > 1 ? "s" : ""}` : null,
    bien.salles_de_bains != null ? `${bien.salles_de_bains} salle${bien.salles_de_bains > 1 ? "s" : ""} de bains` : null,
    bien.frequence,
    bien.duree_h ? `${String(bien.duree_h).replace(".", ",")} h par passage` : null,
  ].filter(Boolean);

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
        <p className="desk-meta">Aucune prestation retenue : le compte rendu n&apos;aura rien à proposer.</p>
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
    surface: bien?.surface?.toString() ?? "",
    chambres: bien?.chambres?.toString() ?? "",
    salles_de_bains: bien?.salles_de_bains?.toString() ?? "",
    acces: bien?.acces ?? "",
    particularites: bien?.particularites ?? "",
    frequence: bien?.frequence ?? "",
    duree_h: bien?.duree_h?.toString() ?? "",
    notes: bien?.notes ?? "",
  });
  const [retenues, setRetenues] = useState<Presta[]>(bien?.prestations ?? []);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirme, setConfirme] = useState(false);

  const estRetenue = (label: string) => retenues.some((r) => r.label === label);
  const basculer = (label: string) =>
    setRetenues((r) => (r.some((x) => x.label === label) ? r.filter((x) => x.label !== label) : [...r, { label, detail: "" }]));
  const consigne = (label: string, detail: string) => setRetenues((r) => r.map((x) => (x.label === label ? { ...x, detail } : x)));

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErreur("");
    const payload = { ...f, prestations: retenues, ...(clientId ? { clientId } : {}) };
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

  const champ = (k: keyof typeof f) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value }) });

  return (
    <form className="desk-form" onSubmit={enregistrer}>
      <div className="desk-grid">
        <label className="field">
          <span>Libellé</span>
          <input className="input" {...champ("libelle")} placeholder="Maison de caractère, 6 pièces" required />
        </label>
        <label className="field">
          <span>Commune</span>
          <input className="input" {...champ("commune")} />
        </label>
        <label className="field desk-grid-large">
          <span>Adresse</span>
          <input className="input" {...champ("adresse")} />
        </label>
        <label className="field">
          <span>Surface (m²)</span>
          <input className="input" type="number" inputMode="numeric" min={5} max={5000} {...champ("surface")} />
        </label>
        <label className="field">
          <span>Chambres</span>
          <input className="input" type="number" inputMode="numeric" min={0} max={40} {...champ("chambres")} />
        </label>
        <label className="field">
          <span>Salles de bains</span>
          <input className="input" type="number" inputMode="numeric" min={0} max={20} {...champ("salles_de_bains")} />
        </label>
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
          <input className="input" type="number" inputMode="decimal" step="0.5" min={0.5} max={24} {...champ("duree_h")} />
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
        <legend>Prestations retenues</legend>
        <p className="desk-meta">Ce qui est coché ici se retrouve dans le compte rendu de passage, dans cet ordre.</p>
        {CATALOGUE.map((g) => (
          <div key={g.groupe} className="presta-groupe">
            <h4>{g.groupe}</h4>
            {g.items.map((item) => (
              <div key={item} className={`presta-item${estRetenue(item) ? " is-on" : ""}`}>
                <label>
                  <input type="checkbox" checked={estRetenue(item)} onChange={() => basculer(item)} />
                  <span>{item}</span>
                </label>
                {estRetenue(item) ? (
                  <input
                    className="input presta-detail"
                    value={retenues.find((r) => r.label === item)?.detail ?? ""}
                    onChange={(e) => consigne(item, e.target.value)}
                    placeholder="Consigne particulière (facultatif)"
                  />
                ) : null}
              </div>
            ))}
          </div>
        ))}
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
