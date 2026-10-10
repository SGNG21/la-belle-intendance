import type { ReportInput } from "./report";

/**
 * Archive des comptes rendus dans Supabase.
 *
 * Appels directs à l'API REST et à l'API de stockage : pas de client à
 * installer pour deux requêtes. La clé de service ne quitte jamais le serveur,
 * et la table n'a aucune politique RLS — elle est donc inaccessible autrement.
 *
 * Tout est optionnel : sans variables d'environnement, l'archivage ne fait
 * rien et l'envoi du compte rendu se déroule normalement.
 */

const BUCKET = "comptes-rendus";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export const archiveEnabled = () => config() !== null;

const headers = (key: string, extra: Record<string, string> = {}) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  ...extra,
});

/** `AAAA/MM/horodatage-1.jpg` : l'ordre des fichiers suit celui des passages. */
function photoPath(date: string, index: number): string {
  const [y, m] = date.split("-");
  return `${y}/${m}/${Date.now()}-${index + 1}.jpg`;
}

async function uploadPhoto(cfg: { url: string; key: string }, path: string, dataUrl: string): Promise<void> {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers(cfg.key, { "Content-Type": "image/jpeg", "cache-control": "31536000" }),
    body: Buffer.from(base64, "base64"),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`stockage ${res.status} ${await res.text().catch(() => "")}`.trim());
}

export interface ArchiveRow {
  id: string;
  cree_le: string;
  client_nom: string;
  client_email: string;
  bien: string;
  date_passage: string;
  pieces: { label: string; detail: string }[];
  a_signaler: string | null;
  photos: string[];
  destinataires: string[];
}

/** Enregistre un compte rendu. Les photos partent d'abord, la ligne ensuite. */
export async function archiveReport(
  report: ReportInput,
  destinataires: string[],
  fiche: { clientId?: string | null; bienId?: string | null } = {},
): Promise<void> {
  const cfg = config();
  if (!cfg) return;

  const paths: string[] = [];
  for (const [i, p] of (report.photos ?? []).entries()) {
    const path = photoPath(report.date, i);
    await uploadPhoto(cfg, path, p.dataUrl);
    paths.push(path);
  }

  const res = await fetch(`${cfg.url}/rest/v1/comptes_rendus`, {
    method: "POST",
    headers: headers(cfg.key, { "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify({
      client_nom: report.clientName,
      client_email: report.clientEmail,
      bien: report.property,
      date_passage: report.date,
      pieces: report.rooms,
      a_signaler: report.alert?.trim() || null,
      photos: paths,
      destinataires,
      client_id: fiche.clientId ?? null,
      bien_id: fiche.bienId ?? null,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`archive ${res.status} ${await res.text().catch(() => "")}`.trim());
}

/** Les derniers passages, du plus récent au plus ancien. */
export async function listReports(limit = 60): Promise<ArchiveRow[]> {
  const cfg = config();
  if (!cfg) return [];
  const res = await fetch(
    `${cfg.url}/rest/v1/comptes_rendus?select=*&order=date_passage.desc,cree_le.desc&limit=${limit}`,
    { headers: headers(cfg.key), cache: "no-store" },
  );
  if (!res.ok) throw new Error(`lecture ${res.status}`);
  return (await res.json()) as ArchiveRow[];
}

/**
 * URL signée pour une photo. Le bucket est privé : sans signature, rien n'est
 * lisible, et le lien expire au bout d'une heure.
 */
export async function signPhoto(path: string, seconds = 3600): Promise<string | null> {
  const cfg = config();
  if (!cfg) return null;
  const res = await fetch(`${cfg.url}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers(cfg.key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresIn: seconds }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const { signedURL } = (await res.json()) as { signedURL?: string };
  return signedURL ? `${cfg.url}/storage/v1${signedURL}` : null;
}
