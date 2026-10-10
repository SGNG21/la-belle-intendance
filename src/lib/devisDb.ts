import { CrmError, db } from "./crm";
import { arrondi, totalDevis, type Devis, type Ligne } from "./devisModel";

/** Lecture et écriture des devis et des réglages. **Serveur uniquement.** */

export interface Reglages {
  /** Taux horaire TTC. Aucune valeur par défaut : c'est le prix de Coralie. */
  taux_horaire: number | null;
  /** Forfait déplacement par passage, s'il y en a un. */
  deplacement: number | null;
  /** Durée de validité d'un devis, en jours. */
  validite_jours: number;
  /** Phrase ajoutée au bas de chaque devis. */
  mentions: string | null;
}

export const REGLAGES_PAR_DEFAUT: Reglages = {
  taux_horaire: null,
  deplacement: null,
  validite_jours: 30,
  mentions: null,
};

export async function lireReglages(): Promise<Reglages> {
  const rows = await db<{ valeur: Partial<Reglages> }[]>("reglages?cle=eq.devis&select=valeur&limit=1");
  return { ...REGLAGES_PAR_DEFAUT, ...(rows[0]?.valeur ?? {}) };
}

export async function ecrireReglages(patch: Partial<Reglages>): Promise<Reglages> {
  const valeur = { ...(await lireReglages()), ...patch };
  await db<void>("reglages?on_conflict=cle", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ cle: "devis", valeur, maj_le: new Date().toISOString() }),
  });
  return valeur;
}

/**
 * Le numéro suivant, « D-2026-007 ».
 *
 * Une seule personne édite les devis : lire le dernier numéro de l'année et
 * ajouter un suffit. La contrainte d'unicité de la base reste le garde-fou si
 * deux onglets s'en mêlent — l'appelant retente alors une fois.
 */
export async function prochainNumero(): Promise<string> {
  const annee = new Date().getFullYear();
  const rows = await db<{ numero: string }[]>(
    `devis?numero=like.D-${annee}-*&select=numero&order=numero.desc&limit=1`,
  );
  const dernier = rows[0]?.numero?.split("-")[2];
  const n = (Number(dernier) || 0) + 1;
  return `D-${annee}-${String(n).padStart(3, "0")}`;
}

export type NouveauDevis = Omit<Devis, "id" | "cree_le" | "numero" | "total_ttc" | "statut" | "envoye_le">;

/** Crée le devis. Le total est recalculé côté serveur, jamais repris du client. */
export async function creerDevis(input: NouveauDevis): Promise<Devis> {
  const lignes: Ligne[] = input.lignes.map((l) => ({ ...l, quantite: arrondi(l.quantite), pu: arrondi(l.pu) }));
  for (let essai = 0; essai < 2; essai++) {
    try {
      const [row] = await db<Devis[]>("devis", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ ...input, lignes, numero: await prochainNumero(), total_ttc: totalDevis(lignes) }),
      });
      return row;
    } catch (e) {
      if (e instanceof CrmError && e.status === 409 && essai === 0) continue;
      throw e;
    }
  }
  throw new CrmError("Numéro de devis déjà pris.", 409);
}

export const listerDevis = (clientId?: string) =>
  db<Devis[]>(`devis?select=*${clientId ? `&client_id=eq.${encodeURIComponent(clientId)}` : ""}&order=cree_le.desc&limit=100`);

export async function lireDevis(id: string): Promise<Devis> {
  const rows = await db<Devis[]>(`devis?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  if (!rows.length) throw new CrmError("Devis introuvable.", 404);
  return rows[0];
}

export const majDevis = (id: string, patch: Record<string, unknown>) =>
  db<void>(`devis?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
