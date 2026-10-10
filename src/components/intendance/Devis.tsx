"use client";

import { useEffect, useState } from "react";
import { dureeMenage, heures, type Bien, type Client } from "@/lib/crmModel";
import {
  RYTHMES,
  STATUT_DEVIS,
  UNITES,
  euros,
  parMois,
  simuler,
  totalDevis,
  totalLigne,
  type Devis,
  type Ligne,
} from "@/lib/devisModel";
import { api, shortDate } from "@/lib/intendanceApi";

interface Reglages {
  taux_horaire: number | null;
  deplacement: number | null;
  validite_jours: number;
  mentions: string | null;
}

const nombre = (v: string): number => Number(v.replace(",", ".")) || 0;

/** Les devis d'un client : la liste, le simulateur, l'envoi. */
export function DevisBloc({ client, biens }: { client: Client; biens: Bien[] }) {
  const [devis, setDevis] = useState<Devis[] | null>(null);
  const [reglages, setReglages] = useState<Reglages | null>(null);
  const [nouveau, setNouveau] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    try {
      const [d, r] = await Promise.all([
        api<{ devis: Devis[] }>(`/api/intendance/devis?client=${client.id}`),
        api<{ reglages: Reglages }>("/api/intendance/reglages"),
      ]);
      setDevis(d.devis);
      setReglages(r.reglages);
      setErreur("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    }
  };

  useEffect(() => {
    void charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  return (
    <section className="fiche-bloc">
      <h2>Devis</h2>
      {erreur ? <p className="error">{erreur}</p> : null}

      {devis?.length ? (
        <ul className="devis-liste">
          {devis.map((d) => (
            <DevisLigne key={d.id} d={d} reload={charger} />
          ))}
        </ul>
      ) : devis ? (
        <p className="desk-meta">Aucun devis pour ce client.</p>
      ) : (
        <p className="desk-wait">Chargement…</p>
      )}

      {nouveau && reglages ? (
        <DevisForm
          client={client}
          biens={biens}
          reglages={reglages}
          onDone={async () => {
            setNouveau(false);
            await charger();
          }}
          onCancel={() => setNouveau(false)}
        />
      ) : (
        <div className="btn-row desk-newrow">
          <button type="button" className="btn" onClick={() => setNouveau(true)} disabled={!reglages}>
            Nouveau devis
          </button>
        </div>
      )}
    </section>
  );
}

function DevisLigne({ d, reload }: { d: Devis; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirme, setConfirme] = useState(false);

  async function agir(fn: () => Promise<unknown>) {
    setBusy(true);
    setErreur("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Opération impossible.");
    } finally {
      setBusy(false);
      setConfirme(false);
    }
  }

  return (
    <li className={`devis-item devis-item--${d.statut}`}>
      <div className="desk-card-top">
        <div>
          <h3>
            {d.numero} · {euros(d.total_ttc)}
          </h3>
          <p className="desk-meta">
            {d.prestation}
            {d.bien_libelle ? ` · ${d.bien_libelle}` : ""}
          </p>
          <p className="desk-meta">
            {STATUT_DEVIS[d.statut]}
            {d.envoye_le ? ` le ${shortDate(d.envoye_le)}` : ` · créé le ${shortDate(d.cree_le)}`}
          </p>
        </div>
      </div>
      <details className="devis-detail">
        <summary>Le détail</summary>
        <ul>
          {d.lignes.map((l, i) => (
            <li key={`${l.libelle}-${i}`}>
              {l.libelle} — {String(l.quantite).replace(".", ",")} {l.unite} × {euros(l.pu)} = {euros(totalLigne(l))}
            </li>
          ))}
        </ul>
        {d.notes ? <p className="desk-besoin">{d.notes}</p> : null}
      </details>
      <div className="btn-row">
        {d.statut === "brouillon" ? (
          <button
            type="button"
            className={`btn${confirme ? "" : " btn--ghost"}`}
            disabled={busy}
            onClick={() => (confirme ? void agir(() => api(`/api/intendance/devis/${d.id}/envoyer`, { method: "POST" })) : setConfirme(true))}
          >
            {busy ? "Envoi…" : confirme ? `Confirmer l'envoi à ${d.client_email}` : "Envoyer au client"}
          </button>
        ) : null}
        {d.statut === "envoye" ? (
          <>
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => void agir(() => api(`/api/intendance/devis/${d.id}`, { method: "PATCH", body: JSON.stringify({ statut: "accepte" }) }))}>
              Accepté
            </button>
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => void agir(() => api(`/api/intendance/devis/${d.id}`, { method: "PATCH", body: JSON.stringify({ statut: "refuse" }) }))}>
              Sans suite
            </button>
          </>
        ) : null}
      </div>
      {erreur ? <p className="error">{erreur}</p> : null}
    </li>
  );
}

function DevisForm({
  client,
  biens,
  reglages,
  onDone,
  onCancel,
}: {
  client: Client;
  biens: Bien[];
  reglages: Reglages;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [bienId, setBienId] = useState(biens[0]?.id ?? "");
  const bien = biens.find((b) => b.id === bienId);

  const [prestation, setPrestation] = useState("");
  // Sans durée convenue, on part de ce que le logement laisse prévoir.
  const estime = (b?: Bien) => (b ? dureeMenage(b) : 0);
  const [duree, setDuree] = useState((bien?.duree_h ?? estime(bien) ?? "").toString());
  const [taux, setTaux] = useState(reglages.taux_horaire?.toString() ?? "");
  const [deplacement, setDeplacement] = useState(reglages.deplacement?.toString() ?? "");
  const [frequence, setFrequence] = useState(bien?.frequence ?? "");
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [mode, setMode] = useState<"" | "prestation" | "cesu">(client.mode ?? "");
  const [notes, setNotes] = useState(reglages.mentions ?? "");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");

  // Changer de bien recale le simulateur sur ce bien-là.
  useEffect(() => {
    setDuree((bien?.duree_h ?? estime(bien) ?? "").toString());
    setFrequence(bien?.frequence ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bien?.id]);

  const passage = nombre(duree) * nombre(taux) + nombre(deplacement);
  const mois = parMois(frequence) * passage;
  const simulees = simuler({
    libelle: prestation || (bien ? `Entretien — ${bien.libelle}` : "Prestation d'entretien"),
    duree: nombre(duree),
    taux: nombre(taux),
    deplacement: nombre(deplacement),
  });

  const majLigne = (i: number, patch: Partial<Ligne>) => setLignes((l) => l.map((x, n) => (n === i ? { ...x, ...patch } : x)));

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErreur("");
    try {
      await api("/api/intendance/devis", {
        method: "POST",
        body: JSON.stringify({
          client_id: client.id,
          bien_id: bienId || null,
          client_nom: client.nom,
          client_email: client.email ?? "",
          bien_libelle: bien?.libelle ?? null,
          prestation,
          lignes,
          mode: mode || null,
          notes,
        }),
      });
      await onDone();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Création impossible.");
      setBusy(false);
    }
  }

  if (reglages.taux_horaire == null) {
    return (
      <div className="form-status form-status--err">
        <p>
          Votre taux horaire n&apos;est pas encore renseigné. Le simulateur n&apos;invente pas de prix : indiquez-le dans l&apos;onglet
          <strong> Tarifs</strong> du bureau, puis revenez ici.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="desk-form" onSubmit={enregistrer}>
      {!client.email ? <p className="error">Ce client n&apos;a pas d&apos;adresse e-mail : le devis ne pourra pas être envoyé.</p> : null}

      <div className="desk-grid">
        {biens.length ? (
          <label className="field">
            <span>Bien</span>
            <select className="input" value={bienId} onChange={(e) => setBienId(e.target.value)}>
              <option value="">Aucun bien précis</option>
              {biens.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.libelle}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field desk-grid-large">
          <span>Prestation</span>
          <input
            className="input"
            value={prestation}
            onChange={(e) => setPrestation(e.target.value)}
            placeholder="Entretien régulier, tous les quinze jours"
            required
          />
        </label>
      </div>

      <fieldset className="simu">
        <legend>Simulateur</legend>
        <div className="desk-grid">
          <label className="field">
            <span>Durée du passage (h)</span>
            <input className="input" type="number" inputMode="decimal" step="any" min={0.5} max={24} value={duree} onChange={(e) => setDuree(e.target.value)} />
            {bien && !bien.duree_h && estime(bien) > 0 ? (
              <span className="desk-meta">Estimé à {heures(estime(bien))} d&apos;après le logement.</span>
            ) : null}
          </label>
          <label className="field">
            <span>Taux horaire (€)</span>
            <input className="input" type="number" inputMode="decimal" step="any" min={1} max={500} value={taux} onChange={(e) => setTaux(e.target.value)} />
          </label>
          <label className="field">
            <span>Déplacement (€)</span>
            <input className="input" type="number" inputMode="decimal" step="any" min={0} max={500} value={deplacement} onChange={(e) => setDeplacement(e.target.value)} />
          </label>
          <label className="field">
            <span>Rythme</span>
            <select className="input" value={frequence} onChange={(e) => setFrequence(e.target.value)}>
              <option value="">À définir</option>
              {RYTHMES.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="simu-total">
          <strong>{euros(passage)}</strong> le passage
          {mois > 0 ? (
            <>
              {" "}
              · environ <strong>{euros(mois)}</strong> par mois
            </>
          ) : null}
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn--ghost" onClick={() => setLignes(simulees)} disabled={!simulees.length}>
            Reprendre dans le devis
          </button>
        </div>
      </fieldset>

      <fieldset className="simu">
        <legend>Lignes du devis</legend>
        {lignes.length ? (
          <>
            {lignes.map((l, i) => (
              <div key={i} className="devis-ligne">
                <label className="field">
                  <span>Libellé</span>
                  <input className="input" value={l.libelle} onChange={(e) => majLigne(i, { libelle: e.target.value })} />
                </label>
                <div className="devis-ligne-chiffres">
                  <label className="field">
                    <span>Quantité</span>
                    <input className="input" type="number" inputMode="decimal" step="any" min={0.01} value={l.quantite} onChange={(e) => majLigne(i, { quantite: nombre(e.target.value) })} />
                  </label>
                  <label className="field">
                    <span>Unité</span>
                    <select className="input" value={l.unite} onChange={(e) => majLigne(i, { unite: e.target.value })}>
                      {UNITES.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Prix unitaire (€)</span>
                    <input className="input" type="number" inputMode="decimal" step="any" min={0} value={l.pu} onChange={(e) => majLigne(i, { pu: nombre(e.target.value) })} />
                  </label>
                </div>
                <p className="devis-ligne-total">
                  {euros(totalLigne(l))}
                  <button type="button" onClick={() => setLignes(lignes.filter((_, n) => n !== i))}>
                    Retirer
                  </button>
                </p>
              </div>
            ))}
            <p className="simu-total">
              Total : <strong>{euros(totalDevis(lignes))}</strong>
            </p>
          </>
        ) : (
          <p className="desk-meta">Aucune ligne. Reprenez la simulation ci-dessus, ou ajoutez-en une à la main.</p>
        )}
        <div className="btn-row">
          <button type="button" className="btn btn--ghost" onClick={() => setLignes([...lignes, { libelle: "", quantite: 1, unite: "forfait", pu: 0 }])}>
            Ajouter une ligne
          </button>
        </div>
      </fieldset>

      <div className="desk-grid">
        <label className="field">
          <span>Mode</span>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="">À définir</option>
            <option value="prestation">Facturation entreprise</option>
            <option value="cesu">Contrat CESU</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Note au client</span>
        <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {erreur ? <p className="error">{erreur}</p> : null}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={busy || !lignes.length || !prestation.trim()}>
          {busy ? "Enregistrement…" : "Créer le devis"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
      <p className="desk-meta">Le devis est créé en brouillon. L&apos;envoi au client se fait ensuite, en un bouton.</p>
    </form>
  );
}
