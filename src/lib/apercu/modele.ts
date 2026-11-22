/**
 * Business OS — les entités qui manquent au back-office actuel.
 *
 * Le back-office tient déjà les demandes, les clients, les biens et les devis
 * (voir crmModel.ts et devisModel.ts). Ce fichier ne les redéfinit pas : il
 * ajoute le chaînon qui va du passage effectué à l'argent encaissé.
 *
 * Prototype : aucune écriture en base, aucun envoi. Les types sont néanmoins
 * ceux qu'on veut en production, pour que la maquette ne mente pas sur la forme.
 */

/* --------------------------------------------------------- l'abonnement */

/**
 * Une prestation qui revient. C'est le cœur du modèle économique : une
 * conciergerie vit de la récurrence, pas des coups uniques.
 */
export interface Abonnement {
  id: string;
  client_id: string;
  bien_id: string;
  libelle: string;
  /** Pas de cron ici : une fréquence lisible par un humain, traduite au moment de projeter l'agenda. */
  frequence: "hebdomadaire" | "quinzaine" | "mensuel" | "saisonnier";
  jour: "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi";
  duree_h: number;
  tarif_horaire: number;
  actif: boolean;
  debut: string;
  /** Null = sans terme. Une résidence secondaire s'arrête souvent en octobre. */
  fin: string | null;
}

/* -------------------------------------------------------- l'intervention */

export const STATUTS_INTERVENTION = ["planifiee", "en_cours", "faite", "annulee", "reportee"] as const;
export type StatutIntervention = (typeof STATUTS_INTERVENTION)[number];

export const LABEL_INTERVENTION: Record<StatutIntervention, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  faite: "Faite",
  annulee: "Annulée",
  reportee: "Reportée",
};

/**
 * Une ligne de checklist.
 *
 * `fait` à null signifie « pas encore regardé », ce qui n'est pas la même chose
 * que `false` (« regardé, pas fait »). Un compte rendu honnête distingue les deux.
 */
export interface LigneChecklist {
  id: string;
  label: string;
  fait: boolean | null;
  note: string;
}

export interface Intervention {
  id: string;
  client_id: string;
  bien_id: string;
  /** D'où vient ce passage : d'un abonnement, ou posé à la main. */
  abonnement_id: string | null;
  date: string;
  debut: string | null;
  fin: string | null;
  duree_prevue_h: number;
  statut: StatutIntervention;
  checklist: LigneChecklist[];
  observations: string;
  /** Le client a demandé qu'on ne photographie pas chez lui : la question se pose une fois, à la fiche. */
  photos_autorisees: boolean;
  photos: number;
  km: number | null;
  /**
   * Verrous. Une intervention ne produit qu'un compte rendu et n'entre que
   * dans une facture. Ces deux champs sont la garantie, pas une convention.
   */
  compte_rendu_id: string | null;
  facture_id: string | null;
}

/* ------------------------------------------------------- le compte rendu */

export const STATUTS_CR = ["brouillon", "valide", "envoye"] as const;
export type StatutCR = (typeof STATUTS_CR)[number];

export interface CompteRendu {
  id: string;
  intervention_id: string;
  client_id: string;
  statut: StatutCR;
  cree_le: string;
  valide_le: string | null;
  envoye_le: string | null;
  destinataires: string[];
  /**
   * Empreinte du contenu au moment de l'envoi.
   *
   * Si on retouche un compte rendu déjà envoyé, l'empreinte change et l'écran
   * peut dire « modifié depuis l'envoi » au lieu de laisser croire que le
   * client a lu la version affichée.
   */
  empreinte_envoyee: string | null;
}

/* ------------------------------------------------------------ la facture */

export const STATUTS_FACTURE = ["brouillon", "emise", "envoyee", "payee", "retard", "avoir"] as const;
export type StatutFacture = (typeof STATUTS_FACTURE)[number];

export const LABEL_FACTURE: Record<StatutFacture, string> = {
  brouillon: "Brouillon",
  emise: "Émise",
  envoyee: "Envoyée",
  payee: "Payée",
  retard: "En retard",
  avoir: "Avoir",
};

export interface LigneFacture {
  id: string;
  libelle: string;
  quantite: number;
  unite: string;
  pu: number;
  /** L'intervention facturée par cette ligne, quand il y en a une. Sert au verrou anti-double facturation. */
  intervention_id: string | null;
}

export interface Paiement {
  id: string;
  date: string;
  montant: number;
  moyen: "virement" | "cheque" | "especes" | "cesu";
}

export interface Facture {
  id: string;
  /** Null tant que la facture est un brouillon : un numéro n'est attribué qu'à l'émission, et ne se réutilise jamais. */
  numero: string | null;
  client_id: string;
  statut: StatutFacture;
  date_emission: string | null;
  date_echeance: string | null;
  lignes: LigneFacture[];
  /** Taux unique par facture : une conciergerie de cette taille n'en mélange pas deux. */
  tva: number;
  paiements: Paiement[];
  envoye_le: string | null;
}

/* ----------------------------------------------------------- les calculs */

export const arrondi = (n: number): number => Math.round(n * 100) / 100;

export const totalLigneFacture = (l: LigneFacture): number => arrondi(l.quantite * l.pu);

export const totalHT = (f: Facture): number => arrondi(f.lignes.reduce((s, l) => s + totalLigneFacture(l), 0));

export const totalTVA = (f: Facture): number => arrondi(totalHT(f) * f.tva);

export const totalTTC = (f: Facture): number => arrondi(totalHT(f) + totalTVA(f));

export const totalPaye = (f: Facture): number => arrondi(f.paiements.reduce((s, p) => s + p.montant, 0));

export const resteDu = (f: Facture): number => arrondi(Math.max(0, totalTTC(f) - totalPaye(f)));

const EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const NOMBRE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** « 4,25 » et non « 4.25 » : le point décimal anglais n'a rien à faire sur une facture. */
export const nombre = (n: number): string => NOMBRE.format(n);
export const euros = (n: number): string => EUROS.format(n);

/** « 3 h 15 », comme ailleurs dans le projet. */
export const heures = (h: number): string => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`;
};

export const dateCourte = (iso: string): string =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

export const dateLongue = (iso: string): string =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/* ------------------------------------------------------------- l'avancée */

/** Ce qui est relevé sur une checklist : fait, écarté, pas encore vu. */
export function avancement(c: LigneChecklist[]): { faits: number; ecartes: number; restants: number; part: number } {
  const faits = c.filter((l) => l.fait === true).length;
  const ecartes = c.filter((l) => l.fait === false).length;
  const restants = c.filter((l) => l.fait === null).length;
  // Une ligne écartée volontairement compte comme traitée : elle n'est plus à faire.
  return { faits, ecartes, restants, part: c.length ? (faits + ecartes) / c.length : 0 };
}

/**
 * Peut-on facturer cette intervention ?
 *
 * Le brief demande d'empêcher les doubles facturations. La réponse est donnée
 * ici, en un seul endroit, et l'écran se contente de l'afficher.
 */
export function facturable(i: Intervention): { ok: boolean; raison: string | null } {
  if (i.facture_id) return { ok: false, raison: "Déjà portée sur une facture." };
  if (i.statut !== "faite") return { ok: false, raison: "Le passage n'est pas terminé." };
  if (!i.compte_rendu_id) return { ok: false, raison: "Le compte rendu n'est pas établi." };
  return { ok: true, raison: null };
}

/** Même logique pour l'envoi d'un compte rendu : une seule porte, un seul verrou. */
export function envoyable(cr: CompteRendu): { ok: boolean; raison: string | null } {
  if (cr.statut === "brouillon") return { ok: false, raison: "À valider avant envoi." };
  if (cr.envoye_le) return { ok: false, raison: `Envoyé le ${dateCourte(cr.envoye_le)}.` };
  if (!cr.destinataires.length) return { ok: false, raison: "Aucun destinataire." };
  return { ok: true, raison: null };
}
