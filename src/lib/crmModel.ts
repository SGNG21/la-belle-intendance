/**
 * Le modèle du back-office : types, catalogue, nettoyage des saisies.
 *
 * Rien ici ne touche au réseau ni aux cookies — ce fichier est importé aussi
 * bien par les routes serveur que par les écrans dans le navigateur. Les accès
 * à la base vivent dans crm.ts, qui ne doit jamais partir côté client.
 */

export interface Client {
  id: string;
  cree_le: string;
  maj_le: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  commune: string | null;
  type: "particulier" | "professionnel";
  mode: "prestation" | "cesu" | null;
  adresse: string | null;
  notes: string | null;
  actif: boolean;
}

export interface Bien {
  id: string;
  client_id: string;
  cree_le: string;
  libelle: string;
  adresse: string | null;
  commune: string | null;
  surface: number | null;
  chambres: number | null;
  salles_de_bains: number | null;
  wc: number | null;
  pieces_vie: number | null;
  lits: number | null;
  cuisine_equipee: boolean;
  usage: UsageBien | null;
  caracteristiques: string[];
  km: number | null;
  acces: string | null;
  particularites: string | null;
  notes: string | null;
  prestations: { label: string; detail: string }[];
  frequence: string | null;
  duree_h: number | null;
}

/* ---------------------------------------------------------------- demandes */

export interface Demande {
  id: string;
  recu_le: string;
  client_id: string | null;
  nom: string;
  email: string;
  telephone: string | null;
  commune: string | null;
  type_client: string | null;
  logement: string | null;
  surface: number | null;
  chambres: number | null;
  salles_de_bains: number | null;
  frequence: string | null;
  besoin: string | null;
  score: number | null;
  priorite: string | null;
  raisons: string[];
  page: string | null;
  utm: Record<string, string>;
  statut: Statut;
  suivi: string | null;
}

export const STATUTS = ["nouveau", "rappele", "devis_envoye", "gagne", "perdu"] as const;
export type Statut = (typeof STATUTS)[number];

export const STATUT_LABEL: Record<Statut, string> = {
  nouveau: "Nouveau",
  rappele: "Rappelé",
  devis_envoye: "Devis envoyé",
  gagne: "Client",
  perdu: "Sans suite",
};

/**
 * D'où vient le prospect.
 *
 * Les campagnes marquent leurs liens (utm_source, utm_medium, gclid) ; une
 * visite venue d'une recherche n'a rien de tout cela. On lit ce qui est là,
 * on ne devine pas le reste : « Origine inconnue » est une réponse honnête.
 */
export function origine(utm: Record<string, string> | null | undefined): { canal: string; detail: string | null } {
  const u = utm ?? {};
  const source = (u.utm_source ?? "").toLowerCase();
  const medium = (u.utm_medium ?? "").toLowerCase();
  const campagne = u.utm_campaign ?? null;

  if (u.gclid || medium === "cpc" || medium === "ppc" || medium === "paid") {
    const regie = source.includes("google") || u.gclid ? "Google Ads" : source.includes("facebook") || source.includes("meta") ? "Meta Ads" : "Publicité";
    return { canal: regie, detail: campagne };
  }
  if (medium === "organic" || source === "google" || source === "bing") return { canal: "Référencement naturel", detail: campagne };
  if (source.includes("facebook") || source.includes("instagram") || medium === "social") return { canal: "Réseaux sociaux", detail: campagne };
  if (source) return { canal: source, detail: campagne };
  return { canal: "Origine inconnue", detail: null };
}

/** Nettoyage commun : chaîne bornée, vide ramené à null. */
export const text = (v: unknown, max: number): string | null => {
  const s = typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "";
  return s || null;
};

export const int = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
};

/** Une décimale : suffisant pour une durée en heures. */
export const dec = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null;
};

/** Deux décimales : un prix ne s'arrondit pas au dixième d'euro. */
export const montant = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 100) / 100 : null;
};

export const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;
export const USAGES = ["principale", "secondaire", "locative"] as const;
export type UsageBien = (typeof USAGES)[number];

export const USAGE_LABEL: Record<UsageBien, string> = {
  principale: "Résidence principale",
  secondaire: "Résidence secondaire",
  locative: "Location courte durée",
};

/**
 * Ce qui allonge un passage sans se lire dans les mètres carrés.
 *
 * Les coefficients viennent du calculateur de Coralie : une piscine ajoute une
 * demi-heure, trois niveaux rallongent tout de 15 %. Ils servent à proposer une
 * durée, jamais à l'imposer — elle reste modifiable partout.
 */
export const CARACTERISTIQUES = [
  { id: "piscine", label: "Piscine", menage: 0.5 },
  { id: "parc", label: "Grand jardin ou parc", menage: 0.4 },
  { id: "niveaux", label: "Trois niveaux ou plus", mult: 1.15 },
  { id: "dependances", label: "Dépendances", menage: 0.4 },
  { id: "animaux", label: "Animaux sur place", menage: 0.3 },
  { id: "chauffage", label: "Cheminée ou poêle", menage: 0.2 },
  { id: "meuble", label: "Très meublé, bibelots", mult: 1.12 },
] as const;

/**
 * Durée estimée d'un ménage complet, en heures.
 *
 * Reprise de la formule du calculateur : un socle, puis le temps par chambre,
 * par salle de bains, par WC, par pièce de vie, la cuisine, et la surface.
 */
export function dureeMenage(b: {
  chambres?: number | null;
  salles_de_bains?: number | null;
  wc?: number | null;
  pieces_vie?: number | null;
  cuisine_equipee?: boolean | null;
  surface?: number | null;
  caracteristiques?: string[] | null;
}): number {
  const n = (v: number | null | undefined) => (typeof v === "number" && isFinite(v) ? v : 0);
  const retenues = b.caracteristiques ?? [];
  let t =
    0.15 +
    0.3 * n(b.chambres) +
    0.35 * n(b.salles_de_bains) +
    0.12 * n(b.wc) +
    0.25 * n(b.pieces_vie) +
    0.35 * (b.cuisine_equipee ? 1 : 0) +
    0.008 * n(b.surface);
  for (const c of CARACTERISTIQUES) if (retenues.includes(c.id) && "menage" in c) t += c.menage;
  for (const c of CARACTERISTIQUES) if (retenues.includes(c.id) && "mult" in c) t *= c.mult;
  return Math.round(t * 4) / 4;
}

/** « 3 h 15 ». */
export const heures = (h: number): string => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`;
};

/**
 * Les pièces proposées à partir du logement décrit.
 *
 * Ce ne sont que des propositions : Coralie renomme « Chambre 2 » en « chambre
 * des enfants » si c'est ainsi qu'on l'appelle dans la maison, et le compte
 * rendu porte ensuite ce nom-là.
 */
export function piecesProposees(b: {
  chambres?: number | null;
  salles_de_bains?: number | null;
  wc?: number | null;
  pieces_vie?: number | null;
  cuisine_equipee?: boolean | null;
}): string[] {
  const n = (v: number | null | undefined, max: number) =>
    Math.max(0, Math.min(max, typeof v === "number" && isFinite(v) ? Math.round(v) : 0));
  const out: string[] = [];
  if (b.cuisine_equipee) out.push("Cuisine");
  const vie = n(b.pieces_vie, 8);
  if (vie === 1) out.push("Séjour");
  else for (let i = 1; i <= vie; i++) out.push(`Pièce de vie ${i}`);
  const ch = n(b.chambres, 20);
  if (ch === 1) out.push("Chambre");
  else for (let i = 1; i <= ch; i++) out.push(`Chambre ${i}`);
  const sdb = n(b.salles_de_bains, 10);
  if (sdb === 1) out.push("Salle de bains");
  else for (let i = 1; i <= sdb; i++) out.push(`Salle de bains ${i}`);
  const wc = n(b.wc, 10);
  if (wc === 1) out.push("WC");
  else for (let i = 1; i <= wc; i++) out.push(`WC ${i}`);
  out.push("Entrée et couloirs");
  return out;
}

/** Catalogue des prestations retenues sur un bien. Pilote le compte rendu. */
export const CATALOGUE = [
  {
    groupe: "Pièces à traiter",
    items: [
      "Cuisine et office",
      "Séjour et salon",
      "Chambres",
      "Salles de bains",
      "Entrée et couloirs",
      "Buanderie",
      "Bureau",
      "Extérieurs et terrasse",
    ],
  },
  {
    groupe: "À convenir avec le client",
    items: [
      "Lits faits et linge de lit changé",
      "Lessive et séchage du linge",
      "Repassage",
      "Vitres et miroirs",
      "Four et électroménager",
      "Réfrigérateur vidé et nettoyé",
      "Rangement et remise en ordre",
    ],
  },
  {
    groupe: "Intendance",
    items: [
      "Arrosage des plantes",
      "Relève du courrier",
      "Sortie et rentrée des poubelles",
      "Préparation avant arrivée",
      "Contrôle après départ",
      "Aération et contrôle du logement",
    ],
  },
] as const;

/**
 * Les lignes retenues sur un bien, dans l'ordre où elles seront relevées.
 *
 * Les libellés sont libres : le catalogue ne sert qu'à proposer, parce qu'une
 * maison a ses propres noms de pièces et qu'un compte rendu qui dit « chambre
 * des enfants » vaut mieux qu'un qui dit « Chambres ».
 */
export function prestations(v: unknown): { label: string; detail: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { label: string; detail: string }[] = [];
  for (const raw of v.slice(0, 60)) {
    const label = text((raw as { label?: unknown })?.label, 80);
    if (!label || out.some((o) => o.label.toLowerCase() === label.toLowerCase())) continue;
    out.push({ label, detail: text((raw as { detail?: unknown })?.detail, 300) ?? "" });
  }
  return out;
}
