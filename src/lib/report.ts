/** Types et validation du compte rendu de passage, partagés client et serveur. */

export const PIECES = [
  "Cuisine et office",
  "Séjour et salon",
  "Chambres",
  "Salles de bains",
  "Entrée et couloirs",
  "Buanderie",
  "Bureau",
  "Extérieurs et terrasse",
] as const;

export interface ReportInput {
  /** Code d'accès, vérifié côté serveur à chaque envoi. */
  code: string;
  clientName: string;
  clientEmail: string;
  /** Ce qui identifie le bien, ex. « Maison de caractère, 6 pièces ». */
  property: string;
  /** Date du passage au format AAAA-MM-JJ. */
  date: string;
  /** Pièces traitées : un libellé, et le détail de ce qui a été fait. */
  rooms: { label: string; detail: string }[];
  /** Ce qui mérite l'attention du propriétaire. Vide la plupart du temps. */
  alert?: string;
  /** Photos, déjà réduites par le navigateur. */
  photos?: { name: string; dataUrl: string }[];
}

export type ReportErrors = Partial<Record<keyof ReportInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateReport(i: Partial<ReportInput>): ReportErrors {
  const e: ReportErrors = {};
  if (!i.clientName?.trim()) e.clientName = "Indiquez le nom du client.";
  if (!i.clientEmail || !EMAIL_RE.test(i.clientEmail)) e.clientEmail = "Indiquez une adresse e-mail valide.";
  if (!i.property?.trim()) e.property = "Décrivez le bien, par exemple « Maison de caractère, 6 pièces ».";
  if (!i.date || !DATE_RE.test(i.date)) e.date = "Indiquez la date du passage.";
  const rooms = (i.rooms ?? []).filter((r) => r.label.trim());
  if (!rooms.length) e.rooms = "Cochez au moins une pièce.";
  if (i.alert && i.alert.length > 600) e.alert = "600 caractères au maximum.";
  if ((i.photos?.length ?? 0) > 4) e.photos = "Quatre photos au maximum.";
  return e;
}

/** Date lisible : « vendredi 10 octobre 2026 ». */
export function frenchDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
