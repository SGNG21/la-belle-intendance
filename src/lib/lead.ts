/** Types et règles partagés entre le formulaire (client) et la route /api/lead (serveur). */

export const CLIENT_TYPES = ["particulier", "professionnel"] as const;
export const HOUSING_TYPES = ["appartement", "maison", "grande-propriete", "residence-secondaire"] as const;
export const FREQUENCIES = ["ponctuel", "hebdomadaire", "quinzaine", "autre"] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];
export type HousingType = (typeof HOUSING_TYPES)[number];
export type Frequency = (typeof FREQUENCIES)[number];

export const HOUSING_LABEL: Record<HousingType, string> = {
  appartement: "Appartement",
  maison: "Maison",
  "grande-propriete": "Grande propriété",
  "residence-secondaire": "Résidence secondaire",
};
export const FREQUENCY_LABEL: Record<Frequency, string> = {
  ponctuel: "Ponctuel",
  hebdomadaire: "Chaque semaine",
  quinzaine: "Tous les quinze jours",
  autre: "Autre rythme",
};

export interface LeadInput {
  clientType: ClientType;
  housing?: HousingType;
  surface?: number;
  bedrooms?: number;
  bathrooms?: number;
  frequency: Frequency;
  commune: string;
  needs?: string;
  name: string;
  phone: string;
  email: string;
  consent: boolean;
  /** Anti-spam : champ piège (doit rester vide) et horodatage d'ouverture du formulaire. */
  website?: string;
  startedAt?: number;
  /** Contexte d'acquisition. */
  page?: string;
  utm?: Record<string, string>;
}

const PHONE_RE = /^(?:\+33|0033|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FieldErrors = Partial<Record<keyof LeadInput, string>>;

/** Validation unique, utilisée côté client pour l'aide à la saisie et côté serveur pour la décision. */
export function validateLead(input: Partial<LeadInput>): FieldErrors {
  const e: FieldErrors = {};
  if (!input.clientType || !CLIENT_TYPES.includes(input.clientType)) e.clientType = "Indiquez si vous êtes particulier ou professionnel.";
  if (!input.frequency || !FREQUENCIES.includes(input.frequency)) e.frequency = "Choisissez une fréquence.";
  if (input.clientType === "particulier") {
    if (!input.housing || !HOUSING_TYPES.includes(input.housing)) e.housing = "Choisissez un type de logement.";
  }
  if (input.surface != null && (!Number.isFinite(input.surface) || input.surface < 10 || input.surface > 2000))
    e.surface = "Entrez une surface entre 10 et 2 000 m².";
  if (input.bedrooms != null && (!Number.isInteger(input.bedrooms) || input.bedrooms < 0 || input.bedrooms > 40))
    e.bedrooms = "Nombre de chambres invalide.";
  if (input.bathrooms != null && (!Number.isInteger(input.bathrooms) || input.bathrooms < 0 || input.bathrooms > 20))
    e.bathrooms = "Nombre de salles de bains invalide.";
  if (!input.commune || !input.commune.trim()) e.commune = "Indiquez votre commune.";
  if (!input.name || input.name.trim().length < 2) e.name = "Indiquez votre nom.";
  if (!input.phone || !PHONE_RE.test(input.phone.trim())) e.phone = "Numéro de téléphone français invalide.";
  if (!input.email || !EMAIL_RE.test(input.email.trim())) e.email = "Adresse e-mail invalide.";
  if (input.needs && input.needs.length > 1500) e.needs = "Message trop long (1 500 caractères maximum).";
  if (!input.consent) e.consent = "Votre accord est nécessaire pour traiter votre demande.";
  return e;
}

/**
 * Score de priorité de rappel, 0 à 100. Les pondérations sont des choix commerciaux
 * modifiables ici : valeur potentielle (surface, type de bien, récurrence) et proximité.
 */
export function scoreLead(l: LeadInput): { score: number; tier: "prioritaire" | "standard" | "a-qualifier"; reasons: string[] } {
  let s = 0;
  const reasons: string[] = [];
  const add = (n: number, why: string) => {
    s += n;
    reasons.push(`${n > 0 ? "+" : ""}${n} ${why}`);
  };

  if (l.frequency === "hebdomadaire") add(30, "récurrence hebdomadaire");
  else if (l.frequency === "quinzaine") add(24, "récurrence tous les quinze jours");
  else if (l.frequency === "ponctuel") add(8, "intervention ponctuelle");
  else add(10, "rythme à définir");

  if (l.clientType === "professionnel") add(18, "contrat professionnel potentiel");
  if (l.housing === "grande-propriete") add(22, "grande propriété");
  if (l.housing === "residence-secondaire") add(18, "résidence secondaire");
  if (l.surface && l.surface >= 200) add(14, "surface ≥ 200 m²");
  else if (l.surface && l.surface >= 120) add(8, "surface ≥ 120 m²");
  if ((l.bedrooms ?? 0) >= 4) add(5, "4 chambres ou plus");
  if (l.commune && /^joigny$/i.test(l.commune.trim())) add(8, "cœur de zone");
  if (l.needs && l.needs.trim().length > 40) add(4, "besoin détaillé");

  s = Math.max(0, Math.min(100, s));
  const tier = s >= 55 ? "prioritaire" : s >= 30 ? "standard" : "a-qualifier";
  return { score: s, tier, reasons };
}
