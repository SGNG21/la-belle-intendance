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

export const dec = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null;
};

export const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;
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

const CATALOGUE_LABELS: readonly string[] = CATALOGUE.flatMap((g) => g.items as readonly string[]);

/** Les prestations acceptées : celles du catalogue, avec leur consigne. */
export function prestations(v: unknown): { label: string; detail: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { label: string; detail: string }[] = [];
  for (const raw of v.slice(0, 40)) {
    const label = text((raw as { label?: unknown })?.label, 80);
    if (!label || !CATALOGUE_LABELS.includes(label) || out.some((o) => o.label === label)) continue;
    out.push({ label, detail: text((raw as { detail?: unknown })?.detail, 300) ?? "" });
  }
  return out;
}
