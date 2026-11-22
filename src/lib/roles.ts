/**
 * Qui a le droit de faire quoi, côté serveur.
 *
 * Jusqu'ici l'outil n'avait qu'une barrière : « session ouverte ou non ».
 * Cela suffisait tant qu'une seule personne s'en servait. Dès qu'une
 * intervenante entre dans le système, « connectée » ne veut plus dire
 * « autorisée » : elle doit pouvoir relever un passage et lire les consignes
 * d'entrée de ses chantiers, mais pas voir les marges ni émettre une facture.
 *
 * Deux codes d'accès distincts, donc deux rôles. C'est rudimentaire — il n'y a
 * pas d'identité par personne — mais c'est honnête : le jour où il faudra
 * tracer qui a fait quoi nominativement, il faudra de vrais comptes, et ce
 * fichier est l'endroit où cela se branchera.
 */

export const ROLES = ["proprietaire", "intervenant"] as const;
export type Role = (typeof ROLES)[number];

/** Les droits, nommés par ce qu'ils permettent et non par un écran. */
export const DROITS = [
  "voir_agenda",
  "relever_passage",
  "voir_consignes",
  "modifier_consignes",
  "voir_clients",
  "modifier_clients",
  "voir_tarifs",
  "voir_marges",
  "facturer",
  "encaisser",
  "envoyer_documents",
] as const;
export type Droit = (typeof DROITS)[number];

const TABLE: Record<Role, readonly Droit[]> = {
  proprietaire: DROITS,
  // L'intervenante entre dans la maison : les consignes lui sont ouvertes, et
  // sa consultation est tracée. L'argent ne la regarde pas.
  intervenant: ["voir_agenda", "relever_passage", "voir_consignes", "voir_clients"],
};

export const peut = (role: Role, droit: Droit): boolean => TABLE[role].includes(droit);

export const droitsDe = (role: Role): readonly Droit[] => TABLE[role];
