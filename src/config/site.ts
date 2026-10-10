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
  tagline: "Ménage et intendance de maison à Joigny et ses alentours",
  description:
    "Ménage à domicile, entretien de grandes maisons et intendance de résidences secondaires à Joigny (89) et ses alentours. Devis sur mesure.",
  city: "Joigny",
  postalCode: "89300",
  department: "Yonne",
  region: "Bourgogne-Franche-Comté",
  country: "FR",
  geo: { lat: 47.9833, lng: 3.4 },
  indexable: process.env.SITE_INDEXABLE === "true",
} as const;

/** Coordonnées. `null` = à renseigner avant la mise en ligne. */
export const CONTACT = {
  phone: "07 83 29 15 41" as string | null, // format affiché
  phoneE164: "+33783291541" as string | null, // format international
  email: "contact@labelleintendance.fr" as string | null,
  /** Adresse postale : laisser null si l'activité est exercée à domicile et masquée sur Google. */
  streetAddress: null as string | null,
  hours: null as string | null, // ex. "Du lundi au vendredi, 8 h – 18 h"
  facebook: null as string | null,
  instagram: null as string | null,
  googleBusinessUrl: null as string | null,
};

/** Identité juridique, pour les mentions légales. */
export const LEGAL = {
  publisherName: "Coralie Renault" as string | null, // nom de l'exploitante (entreprise individuelle)
  legalForm: "Micro-entreprise" as string | null,
  siret: "830 242 764 00025" as string | null,
  vatMention: "TVA non applicable, art. 293 B du CGI" as string | null, // franchise en base (micro-entreprise)
  host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  dpoOrContact: null as string | null, // contact RGPD, par défaut l'e-mail
};

export const FOUNDER = {
  /** Prénom affiché sur la page À propos. À confirmer avec l'intéressée. */
  firstName: "Coralie" as string | null,
  role: "Fondatrice" as string | null,
};

/**
 * Modes d'intervention.
 *
 * Une prestation facturée par l'entreprise n'ouvre droit à AUCUN crédit ni
 * réduction d'impôt, et le site ne doit jamais le laisser entendre. Le seul
 * avantage fiscal évoqué sur le site l'est au titre de l'emploi direct.
 *
 * Deux modes sont proposés au client, choisis avant la première intervention
 * et jamais cumulés sur une même prestation :
 *  - `prestation` : devis puis facture de la micro-entreprise ;
 *  - `cesu` : emploi direct, le client devient particulier employeur et
 *    déclare les heures sur cesu.urssaf.fr. C'est l'emploi d'un salarié à
 *    domicile qui ouvre droit au crédit d'impôt de 50 % (art. 199 sexdecies
 *    du CGI), dans la relation entre le client et l'Urssaf.
 */
export const MODES = {
  prestation: true,
  cesu: true,
  /** Taux horaire net salarial en emploi direct. `null` tant qu'il n'est pas arrêté. */
  cesuNetHourly: null as number | null,
};

/**
 * Tarification. Aucun prix n'est inventé : tant que `hourlyTTC` est null,
 * le site n'affiche aucun montant et renvoie au devis écrit.
 */
export const PRICING = {
  hourlyTTC: null as number | null, // tarif horaire TTC
  /** Supplément de déplacement (communiqué au devis). Montants de la grille tarifaire. */
  travel: {
    zoneAKm: 10, // inclus jusqu'à 10 km
    zoneB: 12, // € — les bornes de distance B et C sont à renseigner
    zoneC: 34,
    zoneBLimitKm: null as number | null,
    zoneCLimitKm: null as number | null,
  },
};

/** Communes des alentours desservies (cœur de zone, pas de pages dédiées). */
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
