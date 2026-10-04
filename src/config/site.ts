/**
 * Source unique des informations de l'entreprise.
 *
 * Règle : une valeur inconnue reste `null`. Le site affiche alors ⟦un repère visible⟧
 * (voir `fill()`), les données structurées l'omettent, et `npm run launch-check`
 * bloque la mise en ligne tant qu'il en reste. Aucune coordonnée n'est inventée.
 */

export const SITE = {
  name: "La Belle Intendance",
  shortName: "LBI",
  url: (process.env.SITE_URL ?? "https://labelleintendance.fr").replace(/\/$/, ""),
  locale: "fr-FR",
  tagline: "Ménage et intendance de maison à Joigny et alentour",
  description:
    "Ménage à domicile, entretien de grandes maisons et intendance de résidences secondaires à Joigny (89) et dans un rayon d'environ 25 km. Devis sur mesure.",
  city: "Joigny",
  postalCode: "89300",
  department: "Yonne",
  region: "Bourgogne-Franche-Comté",
  country: "FR",
  geo: { lat: 47.9833, lng: 3.4 },
  radiusKm: 25,
  indexable: process.env.SITE_INDEXABLE === "true",
} as const;

/** Coordonnées. `null` = à renseigner avant la mise en ligne. */
export const CONTACT = {
  phone: null as string | null, // format affiché, ex. "03 86 00 00 00"
  phoneE164: null as string | null, // ex. "+33386000000"
  email: null as string | null,
  /** Adresse postale : laisser null si l'activité est exercée à domicile et masquée sur Google. */
  streetAddress: null as string | null,
  hours: null as string | null, // ex. "Du lundi au vendredi, 8 h – 18 h"
  facebook: null as string | null,
  instagram: null as string | null,
  googleBusinessUrl: null as string | null,
};

/** Identité juridique, pour les mentions légales. */
export const LEGAL = {
  publisherName: null as string | null, // nom de l'exploitant (entreprise individuelle)
  legalForm: "Micro-entreprise" as string | null,
  siret: null as string | null,
  vatMention: null as string | null, // ex. "TVA non applicable, art. 293 B du CGI" ou n° de TVA
  insurer: null as string | null, // assureur RC professionnelle
  host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  dpoOrContact: null as string | null, // contact RGPD, par défaut l'e-mail
};

export const FOUNDER = {
  /** Prénom affiché sur la page À propos. À confirmer avec l'intéressée. */
  firstName: "Coralie" as string | null,
  role: "Fondatrice" as string | null,
};

/**
 * Services à la personne (SAP).
 * Tant que `declarationNumber` est null, AUCUNE mention d'avantage fiscal
 * n'est présentée comme acquise : le site affiche la version pédagogique.
 * Dès que le numéro de déclaration (récépissé NOVA) est saisi, la version
 * "déclarée" s'active partout.
 */
export const SAP = {
  declarationNumber: null as string | null, // ex. "SAP123456789"
  declarationDate: null as string | null, // ex. "12 octobre 2026"
  avanceImmediate: false, // passer à true seulement une fois l'avance immédiate URSSAF activée
};
export const sapActive = () => Boolean(SAP.declarationNumber);

/**
 * Tarification. Aucun prix n'est inventé : tant que `hourlyTTC` est null,
 * le simulateur affiche une durée estimée et renvoie le tarif au devis.
 */
export const PRICING = {
  hourlyTTC: null as number | null, // tarif horaire TTC avant crédit d'impôt
  /** Supplément de déplacement (communiqué au devis). Montants de la grille tarifaire. */
  travel: {
    zoneAKm: 10, // inclus jusqu'à 10 km
    zoneB: 12, // € — les bornes de distance B et C sont à renseigner
    zoneC: 34,
    zoneBLimitKm: null as number | null,
    zoneCLimitKm: null as number | null,
  },
  /**
   * Heuristique de durée du simulateur. À VALIDER par l'opératrice terrain avant mise en ligne.
   * Les durées affichées sont des ordres de grandeur, jamais un engagement.
   */
  estimate: {
    m2PerHour: 40,
    perBathroomH: 0.25,
    perBedroomH: 0.15,
    grandePropriete: 1.1,
    ponctuel: 1.6, // un premier grand ménage dure plus qu'un passage d'entretien
    spreadPct: 0.2,
  },
  estimateValidated: false,
};

/** Communes du rayon d'intervention (cœur de zone, pas de pages dédiées). */
export const COMMUNES = [
  "Joigny",
  "Cézy",
  "Villecien",
  "Saint-Aubin-sur-Yonne",
  "Champlay",
  "Looze",
  "Brion",
  "Paroy-sur-Tholon",
  "Chamvres",
  "Laroche-Saint-Cydroine",
  "Migennes",
  "Cheny",
  "Bonnard",
  "Charmoy",
  "Armeau",
  "Saint-Julien-du-Sault",
  "Villeneuve-sur-Yonne",
  "Aillant-sur-Tholon",
  "Senan",
  "Guerchy",
  "Appoigny",
] as const;

export const NAV = [
  { href: "/entretien-regulier", label: "Entretien régulier" },
  { href: "/grandes-demeures-intendance", label: "Grandes demeures" },
  { href: "/professionnels", label: "Entreprises" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
] as const;

export const SERVICES = [
  {
    href: "/entretien-regulier",
    name: "Entretien régulier",
    short: "Un passage hebdomadaire ou tous les quinze jours, par la même personne, selon un cahier des charges établi avec vous.",
    serviceType: "Ménage à domicile",
  },
  {
    href: "/grand-menage",
    name: "Grand ménage",
    short: "Remise à neuf d'une maison ou d'un appartement : de fond en comble, avant une réception, au printemps ou après une longue absence.",
    serviceType: "Grand ménage",
  },
  {
    href: "/remise-en-etat",
    name: "Remise en état",
    short: "Après travaux, avant ou après un déménagement, ou avant une remise des clés : le logement rendu propre et net.",
    serviceType: "Nettoyage de remise en état",
  },
  {
    href: "/grandes-demeures-intendance",
    name: "Grandes demeures et résidences secondaires",
    short: "Entretien de grandes maisons, préparation avant votre arrivée, contrôle après votre départ, compte rendu à distance.",
    serviceType: "Intendance de résidence",
  },
  {
    href: "/professionnels",
    name: "Entreprises et cabinets",
    short: "Bureaux, cabinets, commerces : un contrat d'entretien aux horaires qui vous conviennent, avec un interlocuteur unique.",
    serviceType: "Nettoyage de locaux professionnels",
  },
] as const;

/** Repère visible pour une valeur manquante. Détecté par scripts/launch-check.mjs. */
export const fill = (value: string | null | undefined, label: string): string =>
  value && value.trim() ? value : `⟦${label}⟧`;

export const missing = (value: string | null | undefined): boolean => !value || !value.trim();
