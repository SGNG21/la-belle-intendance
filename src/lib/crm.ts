import { cookies } from "next/headers";
import { SESSION_COOKIE, tokenIsValid } from "./intendance";
import { type Bien, type Client, type Demande } from "./crmModel";

/**
 * Accès à la base du back-office. **Serveur uniquement.**
 *
 * Toutes les tables ont RLS activée sans aucune politique : elles ne sont
 * lisibles qu'avec la clé de service, qui ne quitte jamais le serveur. Chaque
 * requête vérifie d'abord la session — il n'y a pas d'autre barrière.
 */

export * from "./crmModel";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export const crmEnabled = () => config() !== null;

/** La session du back-office est-elle ouverte ? */
export async function authorized(): Promise<boolean> {
  const expected = process.env.INTENDANCE_CODE;
  if (!expected) return false;
  const jar = await cookies();
  return tokenIsValid(jar.get(SESSION_COOKIE)?.value, expected);
}

/**
 * Une erreur dont le message est destiné à l'écran.
 *
 * `detail` garde ce qu'il ne faut pas montrer — la réponse brute de la base,
 * utile dans les journaux et nulle part ailleurs.
 */
export class CrmError extends Error {
  constructor(message: string, readonly status: number, readonly detail?: string) {
    super(message);
  }
}

/** Appel PostgREST. `path` commence après /rest/v1/. */
export async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cfg = config();
  if (!cfg) throw new CrmError("Base non configurée.", 503);
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const conflit = res.status === 409;
    throw new CrmError(
      conflit ? "Cette fiche existe déjà." : "La base n'a pas répondu.",
      conflit ? 409 : 502,
      `${path} → ${res.status} ${body}`.trim(),
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}


/** Enregistre une demande reçue par le formulaire du site. */
export async function recordDemande(row: Record<string, unknown>): Promise<void> {
  await db<void>("demandes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(row) });
}

export const listDemandes = (limit = 120) =>
  db<Demande[]>(`demandes?select=*&order=recu_le.desc&limit=${limit}`);

/* ----------------------------------------------------------------- clients */

export const listClients = () =>
  db<(Client & { biens: { id: string; libelle: string }[] })[]>(
    "clients?select=*,biens(id,libelle)&order=actif.desc,nom.asc",
  );

export async function getClient(id: string): Promise<{ client: Client; biens: Bien[]; demandes: Demande[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await db<Client[]>(`clients?id=eq.${id}&select=*&limit=1`);
  if (!rows.length) return null;
  const [biens, demandes] = await Promise.all([
    db<Bien[]>(`biens?client_id=eq.${id}&select=*&order=cree_le.asc`),
    db<Demande[]>(`demandes?client_id=eq.${id}&select=*&order=recu_le.desc`),
  ]);
  return { client: rows[0], biens, demandes };
}
