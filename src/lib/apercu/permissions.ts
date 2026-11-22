/**
 * Qui a le droit de voir quoi.
 *
 * La donnée la plus sensible de cette application n'est ni un mot de passe ni
 * un numéro de carte : c'est « clé dans la boîte à code au portail, code 4812,
 * alarme à désarmer en entrant ». Qui la détient peut entrer chez quelqu'un.
 * Elle est traitée en conséquence.
 */

export type Role = "proprietaire" | "intervenant" | "client";

export const LABEL_ROLE: Record<Role, string> = {
  proprietaire: "Responsable",
  intervenant: "Intervenante",
  client: "Client",
};

/* ------------------------------------------------------------- les droits */

export interface Droits {
  /** Peut demander à voir les consignes d'accès (code, clés, alarme). */
  voirAcces: boolean;
  /** Peut modifier les consignes d'accès. */
  modifierAcces: boolean;
  voirTarifs: boolean;
  voirRentabilite: boolean;
  facturer: boolean;
  voirTousClients: boolean;
}

export function droits(role: Role): Droits {
  switch (role) {
    case "proprietaire":
      return { voirAcces: true, modifierAcces: true, voirTarifs: true, voirRentabilite: true, facturer: true, voirTousClients: true };
    case "intervenant":
      // Elle doit entrer dans la maison : l'accès lui est ouvert, mais sur
      // demande explicite, tracée, et seulement pour ses propres passages.
      return { voirAcces: true, modifierAcces: false, voirTarifs: false, voirRentabilite: false, facturer: false, voirTousClients: false };
    case "client":
      // Le client connaît son propre code. Le lui réafficher dans un espace en
      // ligne ne lui apprend rien et multiplie les endroits où il peut fuir.
      return { voirAcces: false, modifierAcces: false, voirTarifs: true, voirRentabilite: false, facturer: false, voirTousClients: false };
  }
}

/* --------------------------------------------------------- le masquage */

/**
 * Masque une consigne d'accès pour l'affichage par défaut.
 *
 * On garde la forme du texte — sa longueur, ses retours à la ligne — pour que
 * la mise en page ne saute pas à la révélation, mais aucun caractère utile.
 */
export function masquer(texte: string | null): string {
  if (!texte) return "";
  return texte.replace(/\S/g, "•").slice(0, 120);
}

/**
 * Les règles que le code doit tenir, écrites une fois pour qu'on puisse les
 * vérifier en revue plutôt que de les redécouvrir à chaque écran.
 *
 * 1. Une consigne d'accès ne part **jamais** dans un e-mail, un compte rendu,
 *    un devis ou une facture. Ces documents sortent du système.
 * 2. Elle n'est **jamais** écrite dans un journal, même en cas d'erreur.
 * 3. Elle n'est **jamais** rendue à un rôle `client`, même si le client est le
 *    propriétaire du logement.
 * 4. Elle est masquée à l'affichage et révélée sur action explicite.
 * 5. Chaque révélation est tracée : qui, quand, quel bien.
 */
export interface RevelationAcces {
  bien_id: string;
  par: string;
  le: string;
}

/**
 * Nettoie un objet avant de l'écrire dans un journal.
 *
 * À utiliser partout où l'on journalise une entité qui peut porter des
 * consignes : une erreur serveur qui recrache l'objet complet est une fuite.
 */
const CHAMPS_SENSIBLES = ["acces", "particularites", "code", "alarme", "cle", "cles"];

export function sansSecrets<T extends Record<string, unknown>>(o: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    out[k] = CHAMPS_SENSIBLES.includes(k.toLowerCase()) && v ? "[masqué]" : v;
  }
  return out;
}
