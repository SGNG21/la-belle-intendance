import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./crm";
import type { Role } from "./roles";

/**
 * Comptes individuels.
 *
 * Deux codes partagés tenaient lieu d'identité jusqu'ici. On savait qu'une
 * consigne d'entrée avait été consultée, jamais par qui — pour une donnée qui
 * permet d'entrer chez quelqu'un, c'est insuffisant.
 *
 * Trois partis pris.
 *
 *   **Pas de mot de passe.** Un lien à usage unique envoyé par courriel,
 *   valable quinze minutes. Rien à mémoriser, rien à noter sur un carnet, et
 *   l'envoi existe déjà — c'est celui des comptes rendus.
 *
 *   **Une session en base, pas un jeton autoporteur.** Un jeton signé ne se
 *   révoque pas : il reste valable jusqu'à son expiration, même après le
 *   départ de la personne. Une ligne supprimée, elle, ferme la session à la
 *   requête suivante.
 *
 *   **Seule l'empreinte est stockée.** Ni le lien ni le jeton de session ne
 *   figurent en base : la base volée ne donne aucun accès.
 */

export const COOKIE_SESSION = "lbi_session";
const JOURS = 30;

/** Durée de vie d'un lien de connexion. Court : il ne sert qu'à entrer. */
const MINUTES_LIEN = 15;

const empreinte = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
const jetonNeuf = () => randomBytes(32).toString("base64url");

export interface Personne {
  personne_id: string;
  nom: string;
  email: string | null;
  role: Role;
}

/* ----------------------------------------------------- la session en cours */

/**
 * Qui appelle, ou null.
 *
 * Expirée, révoquée, ou personne désactivée : la réponse est la même. C'est
 * la base qui tranche, en une seule fonction, pour qu'aucune route ne refasse
 * le raisonnement à sa façon.
 */
export async function personneCourante(): Promise<Personne | null> {
  const jar = await cookies();
  const jeton = jar.get(COOKIE_SESSION)?.value;
  if (!jeton) return null;
  try {
    const rows = await db<Personne[]>("rpc/session_personne", {
      method: "POST",
      body: JSON.stringify({ p_jeton_hash: empreinte(jeton) }),
    });
    const p = Array.isArray(rows) ? rows[0] : (rows as Personne | null);
    return p?.personne_id ? p : null;
  } catch {
    // Base injoignable : on refuse plutôt que de laisser passer.
    return null;
  }
}

/* ------------------------------------------------------- se connecter */

export interface LienDemande {
  /** Le lien à envoyer. Il ne repasse jamais par la base en clair. */
  url: string;
  expire_le: string;
}

/**
 * Prépare un lien de connexion pour une adresse.
 *
 * Rend `null` si l'adresse est inconnue ou le compte fermé — **et l'appelant
 * répond la même chose dans tous les cas**. Dire « cette adresse n'existe
 * pas » apprendrait à un inconnu quelles adresses existent.
 */
export async function demanderLien(email: string, base: string, origine: string | null): Promise<LienDemande | null> {
  const propre = email.trim().toLowerCase();
  const gens = await db<{ id: string }[]>(
    `intervenants?email=ilike.${encodeURIComponent(propre)}&desactive_le=is.null&select=id&limit=1`,
  );
  if (!gens.length) return null;

  const jeton = jetonNeuf();
  const expire = new Date(Date.now() + MINUTES_LIEN * 60_000).toISOString();
  await db<void>("connexions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      jeton_hash: empreinte(jeton),
      personne_id: gens[0].id,
      expire_le: expire,
      demande_de: origine,
    }),
  });
  return { url: `${base}/intendance/entrer?jeton=${jeton}`, expire_le: expire };
}

/** Échange un lien contre une session. Le lien ne sert qu'une fois. */
export async function ouvrirSession(lien: string): Promise<{ personne: { id: string; nom: string; role: Role }; jeton: string }> {
  const jeton = jetonNeuf();
  const rows = await db<{ personne_id: string; nom: string; role: Role }[]>("rpc/ouvrir_session", {
    method: "POST",
    body: JSON.stringify({ p_lien_hash: empreinte(lien), p_session_hash: empreinte(jeton), p_jours: JOURS }),
  });
  const p = Array.isArray(rows) ? rows[0] : (rows as { personne_id: string; nom: string; role: Role });
  return { personne: { id: p.personne_id, nom: p.nom, role: p.role }, jeton };
}

/** Ferme la session en cours. */
export async function fermerSession(jeton: string): Promise<void> {
  await db<void>(`sessions?jeton_hash=eq.${encodeURIComponent(empreinte(jeton))}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ revoque_le: new Date().toISOString() }),
  });
}

export const optionsCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * JOURS,
};

/* ------------------------------------------------------------- utilitaire */

/** Comparaison à durée constante, pour ne rien révéler au chronomètre. */
export function memeJeton(a: string, b: string): boolean {
  const x = Buffer.from(empreinte(a), "hex");
  const y = Buffer.from(empreinte(b), "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}
