/**
 * Les opérations du métier, côté serveur.
 *
 * Chacune appelle une fonction Postgres, et c'est volontaire : PostgREST
 * exécute une instruction à la fois, alors que « créer la facture ET ses
 * lignes, ou rien » doit être indivisible. Une fonction Postgres est une
 * transaction ; deux appels REST n'en sont pas une.
 *
 * Ce fichier ne contient donc aucune règle métier — elles vivent en base,
 * où aucun écran ne peut les contourner. Il ne fait que traduire les erreurs
 * de la base en messages destinés à l'écran.
 */

import { CrmError, db } from "./crm";

/** Appel d'une fonction Postgres par PostgREST. */
async function rpc<T>(nom: string, args: Record<string, unknown>): Promise<T> {
  return db<T>(`rpc/${nom}`, { method: "POST", body: JSON.stringify(args) });
}

/**
 * Traduit une erreur de la base en message lisible.
 *
 * Les contraintes portent les garanties ; leurs messages, eux, sont écrits
 * pour un développeur. On les retraduit ici, en un seul endroit.
 */
function traduire(e: unknown): never {
  const brut = e instanceof CrmError ? (e.detail ?? e.message) : String(e);

  if (brut.includes("ligne_un_seul_passage")) {
    throw new CrmError("Ce passage figure déjà sur une facture.", 409, brut);
  }
  if (brut.includes("comptes_rendus_intervention_id_key")) {
    throw new CrmError("Ce passage a déjà un compte rendu.", 409, brut);
  }
  if (brut.includes("contrat_actif_unique")) {
    throw new CrmError("Ce bien a déjà un contrat en cours.", 409, brut);
  }
  if (brut.includes("envois_pkey")) {
    throw new CrmError("Cet envoi a déjà eu lieu.", 409, brut);
  }
  // Les messages levés par nos propres fonctions sont déjà en français.
  const m = /ERROR:\s*([^\n"]+)/.exec(brut) ?? /"message":"([^"]+)"/.exec(brut);
  throw new CrmError(m ? m[1].trim() : "L'opération a échoué.", 409, brut);
}

const essayer = async <T>(f: () => Promise<T>): Promise<T> => {
  try {
    return await f();
  } catch (e) {
    // Une base injoignable n'est pas une erreur métier : on la laisse passer.
    if (e instanceof CrmError && (e.status === 503 || e.status === 502)) throw e;
    return traduire(e);
  }
};

/* ------------------------------------------------------------ le parcours */

export interface Intervention {
  id: string;
  client_id: string;
  bien_id: string;
  contrat_id: string | null;
  date: string;
  debut: string | null;
  fin: string | null;
  duree_prevue_h: number;
  statut: "planifiee" | "en_cours" | "faite" | "annulee" | "reportee";
  checklist: { id: string; label: string; fait: boolean | null; note: string }[];
  observations: string;
  photos_autorisees: boolean;
  km: number | null;
}

export const clore = (id: string, p: { debut: string | null; fin: string | null; checklist: unknown; observations: string | null; km: number | null }) =>
  essayer(() =>
    rpc<Intervention>("clore_intervention", {
      p_id: id,
      p_debut: p.debut,
      p_fin: p.fin,
      p_checklist: p.checklist,
      p_observations: p.observations,
      p_km: p.km,
    }),
  );

export const etablirCompteRendu = (interventionId: string, destinataires: string[]) =>
  essayer(() =>
    rpc<{ id: string; statut: string; envoye_le: string | null; destinataires: string[] }>("etablir_compte_rendu", {
      p_intervention_id: interventionId,
      p_destinataires: destinataires,
    }),
  );

/**
 * Réserve le droit d'envoyer, avant d'envoyer.
 *
 * Rend « a_envoyer » une seule fois pour une clé donnée. Le double clic, le
 * second onglet et le rejeu d'un workflow retombent tous sur « deja_fait ».
 * L'appelant n'écrit l'e-mail que sur « a_envoyer ».
 */
export const reserverEnvoi = (cle: string, objet: string, objetId: string | null) =>
  essayer(() => rpc<"a_envoyer" | "deja_fait">("reserver_envoi", { p_cle: cle, p_objet: objet, p_objet_id: objetId }));

export const marquerEnvoye = (crId: string, empreinte: string) =>
  essayer(() => rpc<{ id: string; statut: string; envoye_le: string }>("marquer_cr_envoye", { p_cr_id: crId, p_empreinte: empreinte }));

export interface Facture {
  id: string;
  numero: string | null;
  client_id: string;
  statut: string;
  date_emission: string | null;
  date_echeance: string | null;
  tva: number;
}

export const facturerIntervention = (interventionId: string) =>
  essayer(() => rpc<Facture>("facturer_intervention", { p_intervention_id: interventionId }));

export const emettreFacture = (factureId: string, echeanceJours = 30) =>
  essayer(() => rpc<Facture>("emettre_facture", { p_facture_id: factureId, p_echeance_jours: echeanceJours }));

export const enregistrerPaiement = (factureId: string, date: string, montant: number, moyen: string) =>
  essayer(() => rpc<Facture>("enregistrer_paiement", { p_facture_id: factureId, p_date: date, p_montant: montant, p_moyen: moyen }));

/* -------------------------------------------------------------- lectures */

export interface CaseAgenda {
  jour: string;
  contrat_id: string | null;
  client_id: string;
  bien_id: string;
  libelle: string;
  duree_h: number;
  intervention_id: string | null;
  statut: string;
}

export const agenda = (debut: string, fin: string) =>
  essayer(() => rpc<CaseAgenda[]>("projeter_agenda", { p_debut: debut, p_fin: fin }));

export const aFacturer = () => essayer(() => rpc<Intervention[]>("interventions_a_facturer", {}));

export interface Evenement {
  client_id: string;
  le: string;
  type: string;
  titre: string;
  detail: string;
  objet_id: string;
}

export const historique = (clientId: string) =>
  db<Evenement[]>(`historique_client?client_id=eq.${encodeURIComponent(clientId)}&order=le.desc&limit=200`);

/* ------------------------------------------------- la trace des accès */

/** Enregistre qu'on a consulté les consignes d'entrée d'un logement. */
export const tracerAcces = (bienId: string, par: string) =>
  db<void>("acces_revelations", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ bien_id: bienId, par }),
  });
