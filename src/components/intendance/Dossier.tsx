"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Le dossier d'un client : contrats, passages à venir, comptes rendus,
 * factures, règlements, historique.
 *
 * Un seul appel au serveur — sur un téléphone en bord de réseau, six
 * allers-retours donnent six occasions d'échouer et une page qui se remplit
 * par morceaux.
 *
 * Les actions proposées dépendent des droits de la session. Afficher un
 * bouton « Facturer » à qui sera refusé est une promesse qu'on ne tient pas.
 * Le serveur revérifie de son côté : ce qui est caché ici n'est pas protégé
 * par le fait d'être caché.
 */

interface Contrat {
  id: string;
  base: "forfait" | "horaire" | "abonnement";
  libelle: string;
  forfait_ht: number | null;
  taux_horaire_ht: number | null;
  heures_convenues: number | null;
  abonnement_ht: number | null;
  abonnement_periode: string | null;
  tva: number;
  debut: string;
  fin: string | null;
}

interface Prochaine {
  id: string;
  date: string;
  debut: string | null;
  duree_prevue_h: number;
  statut: string;
  version: number;
  bien_id: string;
}

interface CompteRendu {
  id: string;
  intervention_id: string;
  statut: string;
  cree_le: string;
  valide_le: string | null;
  envoye_le: string | null;
  destinataires: string[];
}

interface Facture {
  id: string;
  numero: string | null;
  statut: string;
  date_emission: string | null;
  date_echeance: string | null;
  total_ht: number;
  total_ttc: number;
  paye: number;
  reste: number;
}

interface Paiement {
  id: string;
  facture_id: string;
  date: string;
  montant: number;
  moyen: string;
}

interface Evenement {
  le: string;
  type: string;
  titre: string;
  detail: string;
  objet_id: string;
}

interface DossierRecu {
  contrats: Contrat[];
  prochaines: Prochaine[];
  comptesRendus: CompteRendu[];
  factures: Facture[];
  paiements: Paiement[];
  evenements: Evenement[];
  resume: { du: number; encaisse: number };
}

const EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euros = (n: number) => EUROS.format(n);
const heures = (h: number) => {
  const m = Math.round(Number(h) * 60);
  return `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`;
};
const jour = (d: string) =>
  new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const jourCourt = (d: string) =>
  new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });

const BASE: Record<Contrat["base"], string> = {
  forfait: "Forfait contractuel",
  horaire: "Tarif horaire",
  abonnement: "Abonnement",
};

const STATUT_FACTURE: Record<string, string> = {
  brouillon: "Brouillon",
  emise: "Émise",
  envoyee: "Envoyée",
  payee: "Payée",
  retard: "En retard",
  avoir: "Avoir",
};

const STATUT_PASSAGE: Record<string, string> = {
  planifiee: "Prévue",
  en_cours: "En cours",
  reportee: "Reportée",
  faite: "Terminée",
  annulee: "Annulée",
};

export function Dossier({ clientId }: { clientId: string }) {
  const [d, setD] = useState<DossierRecu | null>(null);
  const [droits, setDroits] = useState<string[]>([]);
  const [etat, setEtat] = useState<"charge" | "pret" | "erreur">("charge");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let annule = false;
    (async () => {
      setEtat("charge");
      try {
        const [dossier, session] = await Promise.all([
          fetch(`/api/intendance/clients/${clientId}/dossier`, { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/intendance/session", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (annule) return;
        if (!dossier.ok) throw new Error(dossier.error ?? "Dossier indisponible.");
        setD(dossier);
        setDroits(session.droits ?? []);
        setEtat("pret");
      } catch (e) {
        if (annule) return;
        setErreur(e instanceof Error ? e.message : "Dossier indisponible.");
        setEtat("erreur");
      }
    })();
    return () => {
      annule = true;
    };
  }, [clientId]);

  const peut = (droit: string) => droits.includes(droit);

  if (etat === "charge") return <p className="desk-meta">Chargement du dossier…</p>;
  if (etat === "erreur") return <p className="desk-erreur">{erreur}</p>;
  if (!d) return null;

  return (
    <>
      {/* ------------------------------------------------ passages à venir */}
      <section className="dossier-bloc">
        <h2>Prochains passages</h2>
        {d.prochaines.length === 0 ? (
          <p className="desk-meta">Aucun passage prévu. L&apos;agenda en proposera dès qu&apos;un contrat en projette un.</p>
        ) : (
          <ul className="dossier-liste">
            {d.prochaines.map((p) => (
              <li key={p.id}>
                <strong className="os-num">{jourCourt(p.date)}</strong>
                {p.debut ? <span className="os-num"> · {p.debut.slice(0, 5)}</span> : null}
                <span> · {heures(p.duree_prevue_h)}</span>
                <span className="desk-meta"> — {STATUT_PASSAGE[p.statut] ?? p.statut}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/intendance/agenda" className="desk-lien">
          Ouvrir l&apos;agenda
        </Link>
      </section>

      {/* ------------------------------------------------------- contrats */}
      {peut("voir_tarifs") && (
        <section className="dossier-bloc">
          <h2>Contrats</h2>
          {d.contrats.length === 0 ? (
            <p className="desk-meta">Aucun contrat. Sans contrat, un passage ne peut être ni clos ni facturé.</p>
          ) : (
            <ul className="dossier-liste">
              {d.contrats.map((c) => (
                <li key={c.id}>
                  <strong>{c.libelle}</strong>
                  <br />
                  <span className="desk-meta">
                    {BASE[c.base]}
                    {c.base === "forfait" && c.forfait_ht != null ? ` · ${euros(Number(c.forfait_ht))} le passage` : null}
                    {c.base === "horaire" && c.taux_horaire_ht != null
                      ? ` · ${euros(Number(c.taux_horaire_ht))} de l'heure, ${heures(Number(c.heures_convenues ?? 0))} convenues`
                      : null}
                    {c.base === "abonnement" && c.abonnement_ht != null
                      ? ` · ${euros(Number(c.abonnement_ht))} par ${c.abonnement_periode ?? "mois"}`
                      : null}
                    {" · depuis le "}
                    {jour(c.debut)}
                    {c.fin ? `, jusqu'au ${jour(c.fin)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* -------------------------------------------------- comptes rendus */}
      <section className="dossier-bloc">
        <h2>Comptes rendus</h2>
        {d.comptesRendus.length === 0 ? (
          <p className="desk-meta">Aucun compte rendu pour l&apos;instant.</p>
        ) : (
          <ul className="dossier-liste">
            {d.comptesRendus.map((c) => (
              <li key={c.id}>
                <strong>{jour(c.cree_le)}</strong>
                <span className="desk-meta">
                  {" — "}
                  {c.envoye_le
                    ? `envoyé le ${jour(c.envoye_le)} à ${c.destinataires.join(", ") || "personne"}`
                    : c.valide_le
                      ? "validé, en attente d'envoi"
                      : "brouillon"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ----------------------------------------- factures et règlements */}
      {peut("voir_tarifs") && (
        <section className="dossier-bloc">
          <h2>Factures et règlements</h2>
          {d.factures.length === 0 ? (
            <p className="desk-meta">Aucune facture.</p>
          ) : (
            <>
              <table className="dossier-table">
                <thead>
                  <tr>
                    <th>Facture</th>
                    <th className="os-r">Total</th>
                    <th className="os-r">Réglé</th>
                    <th className="os-r">Reste</th>
                  </tr>
                </thead>
                <tbody>
                  {d.factures.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.numero ?? "Brouillon"}</strong>
                        <br />
                        <span className="desk-meta">
                          {STATUT_FACTURE[f.statut] ?? f.statut}
                          {f.date_emission ? ` · ${jour(f.date_emission)}` : ""}
                        </span>
                        {d.paiements.filter((p) => p.facture_id === f.id).map((p) => (
                          <span key={p.id} className="desk-meta dossier-reglement">
                            {jour(p.date)} · {euros(Number(p.montant))} · {p.moyen}
                          </span>
                        ))}
                      </td>
                      <td className="os-r os-num">{euros(f.total_ttc)}</td>
                      <td className="os-r os-num">{f.paye ? euros(f.paye) : "—"}</td>
                      <td className="os-r os-num">{f.reste ? euros(f.reste) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="desk-meta">
                Encaissé : <strong className="os-num">{euros(d.resume.encaisse)}</strong> · Reste dû :{" "}
                <strong className="os-num">{euros(d.resume.du)}</strong>
              </p>
            </>
          )}
        </section>
      )}

      {/* ------------------------------------------------------ historique */}
      <section className="dossier-bloc">
        <h2>Historique</h2>
        {d.evenements.length === 0 ? (
          <p className="desk-meta">Rien encore.</p>
        ) : (
          <ul className="os-temps dossier-temps">
            {d.evenements.map((e) => (
              <li key={`${e.type}-${e.objet_id}-${e.le}`} className="os-temps__li" data-type={e.type}>
                <div className="os-temps__d">{jour(e.le)}</div>
                <div className="os-temps__t">{e.titre}</div>
                {e.detail ? <div className="os-temps__x">{e.detail}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
