/**
 * Le devis : lignes, calculs, mise en forme. Partagé par le serveur et les
 * écrans — aucun accès réseau ici.
 *
 * Aucun tarif n'est écrit en dur. Le taux horaire vient des réglages, que
 * Coralie saisit elle-même : c'est son prix, pas une estimation du site.
 */

export interface Ligne {
  libelle: string;
  quantite: number;
  unite: string;
  pu: number;
}

export interface Devis {
  id: string;
  cree_le: string;
  numero: string;
  client_id: string | null;
  bien_id: string | null;
  demande_id: string | null;
  client_nom: string;
  client_email: string;
  bien_libelle: string | null;
  prestation: string;
  lignes: Ligne[];
  total_ttc: number;
  mode: "prestation" | "cesu" | null;
  valide_jusqu_au: string | null;
  statut: "brouillon" | "envoye" | "accepte" | "refuse" | "expire";
  envoye_le: string | null;
  notes: string | null;
}

export const STATUT_DEVIS: Record<Devis["statut"], string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export const UNITES = ["h", "passage", "forfait", "m²", "pièce"] as const;

/** Nombre de passages par mois, pour l'estimation mensuelle. */
export const RYTHMES: { label: string; parMois: number }[] = [
  { label: "Chaque semaine", parMois: 52 / 12 },
  { label: "Tous les quinze jours", parMois: 26 / 12 },
  { label: "Une fois par mois", parMois: 1 },
  { label: "Ponctuel", parMois: 0 },
  { label: "Sur demande", parMois: 0 },
];

export const parMois = (frequence: string | null | undefined): number =>
  RYTHMES.find((r) => r.label === frequence)?.parMois ?? 0;

/** Deux décimales, pas plus : un centime d'écart se voit sur une facture. */
export const arrondi = (n: number): number => Math.round(n * 100) / 100;

export const totalLigne = (l: Ligne): number => arrondi(l.quantite * l.pu);

export const totalDevis = (lignes: Ligne[]): number => arrondi(lignes.reduce((s, l) => s + totalLigne(l), 0));

const EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const euros = (n: number): string => EUROS.format(n);

/** « 10 octobre 2026 » — la date telle qu'on la lit sur un devis. */
export function dateLongue(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/** Date d'échéance : aujourd'hui + n jours, au format AAAA-MM-JJ. */
export function echeance(jours: number): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

/**
 * Les lignes proposées par le simulateur.
 *
 * Un passage = sa durée au taux horaire, plus le déplacement s'il y en a un.
 * Le reste se corrige à la main : le simulateur propose, il ne décide pas.
 */
export function simuler(opts: { libelle: string; duree: number; taux: number; deplacement: number }): Ligne[] {
  const lignes: Ligne[] = [];
  if (opts.duree > 0 && opts.taux > 0) {
    lignes.push({ libelle: opts.libelle || "Prestation d'entretien", quantite: arrondi(opts.duree), unite: "h", pu: arrondi(opts.taux) });
  }
  if (opts.deplacement > 0) lignes.push({ libelle: "Déplacement", quantite: 1, unite: "forfait", pu: arrondi(opts.deplacement) });
  return lignes;
}

export type DevisErreurs = Partial<Record<"client_nom" | "client_email" | "prestation" | "lignes", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validerDevis(d: Partial<Devis>): DevisErreurs {
  const e: DevisErreurs = {};
  if (!d.client_nom?.trim()) e.client_nom = "Indiquez le nom du client.";
  if (!d.client_email || !EMAIL_RE.test(d.client_email)) e.client_email = "Indiquez une adresse e-mail valide.";
  if (!d.prestation?.trim()) e.prestation = "Nommez la prestation.";
  const lignes = (d.lignes ?? []).filter((l) => l.libelle.trim());
  if (!lignes.length) e.lignes = "Ajoutez au moins une ligne.";
  else if (lignes.some((l) => !(l.quantite > 0) || !(l.pu >= 0))) e.lignes = "Chaque ligne a besoin d'une quantité et d'un prix.";
  return e;
}
