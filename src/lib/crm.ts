import { cookies } from "next/headers";
import { SESSION_COOKIE, roleDuJeton } from "./intendance";
import type { Role } from "./roles";
import { personneCourante } from "./comptes";
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
  return (await roleCourant()) !== null;
}

/**
 * Qui appelle, et avec quel rôle.
 *
 * Deux chemins pendant la bascule. Les **comptes individuels** d'abord : une
 * session en base, attribuable à une personne, révocable. Les **codes
 * partagés** ensuite, en repli, le temps que tout le monde ait un compte.
 *
 * L'ordre compte : une personne identifiée doit l'emporter sur un code
 * anonyme, sans quoi la traçabilité retomberait sur « session ».
 */
export interface Appelant {
  role: Role;
  /** Null quand la session vient d'un code partagé : personne n'est nommé. */
  personne_id: string | null;
  nom: string | null;
}

export async function appelant(): Promise<Appelant | null> {
  const p = await personneCourante();
  if (p) return { role: p.role, personne_id: p.personne_id, nom: p.nom };

  const jar = await cookies();
  const role = roleDuJeton(jar.get(SESSION_COOKIE)?.value, {
    proprietaire: process.env.INTENDANCE_CODE,
    intervenant: process.env.INTENDANCE_CODE_INTERVENANT,
  });
  // Un code partagé n'identifie personne : personne_id reste nul, et les
  // opérations qui exigent un nom le refuseront.
  return role ? { role, personne_id: null, nom: null } : null;
}

/** Le rôle seul, pour les appels qui n'ont pas besoin de savoir qui. */
export async function roleCourant(): Promise<Role | null> {
  return (await appelant())?.role ?? null;
}

/**
 * Une erreur dont le message est destiné à l'écran.
 *
 * `detail` garde ce qu'il ne faut pas montrer — la réponse brute de la base,
 * utile dans les journaux et nulle part ailleurs.
 */
export interface Conflit {
  attendue: number;
  reelle: number;
  modifie_le: string;
}

export class CrmError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
    /** Rempli sur un conflit de version : l'écran s'en sert pour proposer une issue. */
    readonly conflit?: Conflit,
  ) {
    super(message);
  }
}

/** Appel PostgREST. `path` commence après /rest/v1/. */
export async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cfg = config();
  if (!cfg) throw new CrmError("Base non configurée.", 503);
  let res: Response;
  try {
    res = await fetch(`${cfg.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (e) {
    // Hôte injoignable : projet en pause, URL erronée ou réseau coupé.
    throw new CrmError(
      "Base injoignable (projet peut-être en pause).",
      503,
      `${path} → ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const body = await res.text().catch(() => "");
  if (!res.ok) {
    const conflit = res.status === 409;
    throw new CrmError(
      conflit ? "Cette fiche existe déjà." : "La base n'a pas répondu.",
      conflit ? 409 : 502,
      `${path} → ${res.status} ${body}`.trim(),
    );
  }
  // `Prefer: return=minimal` répond 201 avec un corps vide, et une suppression
  // répond 204 : dans les deux cas il n'y a rien à analyser.
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
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

/**
 * Les colonnes d'un bien, moins les consignes d'entrée.
 *
 * PostgREST ne sait pas dire « tout sauf » : il faut énumérer. La liste est
 * donc à tenir à jour avec la table — le prix à payer pour que le code du
 * portail et l'emplacement des clés ne partent pas avec chaque lecture de
 * fiche. Ils ont leur propre route, qui trace la consultation.
 */
const CHAMPS_BIEN = [
  "id", "client_id", "cree_le", "libelle", "adresse", "commune", "surface",
  "chambres", "salles_de_bains", "wc", "pieces_vie", "lits", "cuisine_equipee",
  "usage", "caracteristiques", "km", "notes", "prestations", "frequence", "duree_h",
].join(",");

export type BienSansConsignes = Omit<Bien, "acces" | "particularites">;

export async function getClient(
  id: string,
): Promise<{ client: Client; biens: BienSansConsignes[]; demandes: Demande[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await db<Client[]>(`clients?id=eq.${id}&select=*&limit=1`);
  if (!rows.length) return null;
  const [biens, demandes] = await Promise.all([
    db<BienSansConsignes[]>(`biens?client_id=eq.${id}&select=${CHAMPS_BIEN}&order=cree_le.asc`),
    db<Demande[]>(`demandes?client_id=eq.${id}&select=*&order=recu_le.desc`),
  ]);
  return { client: rows[0], biens, demandes };
}
