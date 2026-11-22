/**
 * Les données d'agenda de la maquette.
 *
 * Elles reproduisent exactement ce que rend projeter_agenda() : occurrences
 * récurrentes issues des contrats, passages ponctuels, exceptions déjà
 * retirées. L'écran est donc écrit contre la forme réelle, et le jour où il
 * se branche sur l'API, seule la source change.
 */

export type StatutCase = "projete" | "planifiee" | "en_cours" | "faite" | "reportee" | "annulee";

export interface CaseAgenda {
  jour: string;
  contrat_id: string | null;
  client_id: string;
  bien_id: string;
  libelle: string;
  duree_h: number;
  intervention_id: string | null;
  statut: StatutCase;
  intervenant_id: string | null;
  intervenant: string | null;
  client: string;
  commune: string;
  recurrente: boolean;
  heure: string | null;
}

export const LABEL_STATUT: Record<StatutCase, string> = {
  projete: "À poser",
  planifiee: "Prévue",
  en_cours: "En cours",
  faite: "Terminée",
  reportee: "Reportée",
  annulee: "Annulée",
};

/** Le ton de chaque statut. La forme s'y ajoute dans le composant. */
export const TON_STATUT: Record<StatutCase, "attente" | "cours" | "fait" | "sceau" | "alerte"> = {
  projete: "attente",
  planifiee: "attente",
  en_cours: "cours",
  faite: "fait",
  reportee: "sceau",
  annulee: "alerte",
};

export const INTERVENANTS = [
  { id: "iv-coralie", nom: "Coralie", couleur: "navy" },
  { id: "iv-nadia", nom: "Nadia", couleur: "terracotta" },
];

const c = (
  jour: string,
  heure: string | null,
  client: string,
  commune: string,
  libelle: string,
  duree_h: number,
  statut: StatutCase,
  intervenant: string | null,
  recurrente = true,
  intervention_id: string | null = null,
): CaseAgenda => ({
  jour,
  contrat_id: recurrente ? "ct-1" : null,
  client_id: "c-delaunay",
  bien_id: "b-pre",
  libelle,
  duree_h,
  intervention_id,
  statut,
  intervenant_id: intervenant === "Coralie" ? "iv-coralie" : intervenant === "Nadia" ? "iv-nadia" : null,
  intervenant,
  client,
  commune,
  recurrente,
  heure,
});

/** Semaine du 23 au 29 novembre 2026, plus les bords du mois. */
export const CASES: CaseAgenda[] = [
  c("2026-11-10", "09:00", "Hélène Delaunay", "Villecien", "Entretien de La Maison du Pré", 4.5, "faite", "Coralie"),
  c("2026-11-17", "09:00", "Hélène Delaunay", "Villecien", "Entretien de La Maison du Pré", 4.5, "faite", "Coralie"),
  c("2026-11-23", "08:30", "Cabinet Marchand", "Joigny", "Bureaux, hebdomadaire", 2, "faite", "Nadia"),
  c("2026-11-24", "09:00", "Hélène Delaunay", "Villecien", "Entretien de La Maison du Pré", 4.5, "en_cours", "Coralie", true, "i-2026-11-24"),
  c("2026-11-25", "14:00", "Gîte des Tilleuls", "Armeau", "Entre deux séjours", 3, "planifiee", "Nadia", false, "i-gite"),
  c("2026-11-26", "08:30", "Cabinet Marchand", "Joigny", "Bureaux, hebdomadaire", 2, "planifiee", "Nadia"),
  c("2026-11-27", "09:00", "Famille Bontemps", "Cézy", "Entretien mensuel", 3.5, "reportee", "Coralie", false, "i-bontemps"),
  c("2026-11-30", "08:30", "Cabinet Marchand", "Joigny", "Bureaux, hebdomadaire", 2, "projete", null),
  c("2026-12-01", "09:00", "Mme Perrin", "Migennes", "Grand ménage ponctuel", 5, "planifiee", null, false, "i-perrin"),
  c("2026-12-08", "09:00", "Hélène Delaunay", "Villecien", "Entretien de La Maison du Pré", 4.5, "projete", null),
];

/* ------------------------------------------------------------- calendrier */

export const jourISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const ajouter = (iso: string, jours: number): string => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + jours);
  return jourISO(d);
};

/** Le lundi de la semaine qui contient ce jour. */
export const lundi = (iso: string): string => {
  const d = new Date(iso + "T12:00:00");
  // getDay() rend 0 pour dimanche : en France la semaine commence le lundi.
  return ajouter(iso, -((d.getDay() + 6) % 7));
};

export const premierDuMois = (iso: string): string => iso.slice(0, 8) + "01";

/** Les 42 cases d'une grille mensuelle, lundi en tête. */
export function grilleMois(iso: string): string[] {
  const debut = lundi(premierDuMois(iso));
  return Array.from({ length: 42 }, (_, i) => ajouter(debut, i));
}

export const casesDu = (jour: string): CaseAgenda[] =>
  CASES.filter((x) => x.jour === jour).sort((a, b) => (a.heure ?? "").localeCompare(b.heure ?? ""));

export const heuresDu = (jour: string): number =>
  casesDu(jour).reduce((s, x) => (x.statut === "annulee" ? s : s + x.duree_h), 0);

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
export const nomJour = (iso: string): string => JOURS[(new Date(iso + "T12:00:00").getDay() + 6) % 7];
export const numJour = (iso: string): number => Number(iso.slice(8, 10));
export const memeMois = (a: string, b: string): boolean => a.slice(0, 7) === b.slice(0, 7);

export const moisLong = (iso: string): string =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export const jourLong = (iso: string): string =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
