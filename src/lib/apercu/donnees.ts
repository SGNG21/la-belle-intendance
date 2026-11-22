/**
 * Données fictives de la maquette.
 *
 * Un seul client suivi de bout en bout, parce qu'une démonstration qui raconte
 * une histoire vaut mieux qu'un tableau de lignes aléatoires. Les noms sont
 * inventés ; les montants et les durées sortent du calculateur du projet.
 */

import type { Abonnement, CompteRendu, Facture, Intervention, LigneChecklist } from "./modele";

export interface ClientDemo {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  commune: string;
  type: "particulier" | "professionnel";
  mode: "prestation" | "cesu";
  depuis: string;
  notes: string;
}

export interface BienDemo {
  id: string;
  client_id: string;
  libelle: string;
  adresse: string;
  commune: string;
  surface: number;
  chambres: number;
  salles_de_bains: number;
  wc: number;
  pieces_vie: number;
  usage: "principale" | "secondaire" | "locative";
  caracteristiques: string[];
  km: number;
  acces: string;
  particularites: string;
}

export const CLIENT: ClientDemo = {
  id: "c-delaunay",
  nom: "Hélène Delaunay",
  email: "h.delaunay@exemple.fr",
  telephone: "06 12 34 56 78",
  commune: "Villecien",
  type: "particulier",
  mode: "cesu",
  depuis: "2026-03-14",
  notes: "Joignable le soir après 18 h. Préfère un message plutôt qu'un appel.",
};

export const BIEN: BienDemo = {
  id: "b-pre",
  client_id: "c-delaunay",
  libelle: "La Maison du Pré",
  adresse: "4 chemin du Pré Vert",
  commune: "Villecien",
  surface: 165,
  chambres: 4,
  salles_de_bains: 2,
  wc: 2,
  pieces_vie: 2,
  usage: "secondaire",
  caracteristiques: ["piscine", "parc", "niveaux"],
  km: 9,
  acces: "Clé dans la boîte à code au portail, code 4812. Alarme : désarmer en entrant, badge sur le trousseau.",
  particularites: "Deux chats, ne pas laisser la porte de la buanderie ouverte. Piano dans le séjour : chiffon sec uniquement.",
};

export const ABONNEMENT: Abonnement = {
  id: "ab-pre",
  client_id: "c-delaunay",
  bien_id: "b-pre",
  libelle: "Entretien de la maison, tous les quinze jours",
  frequence: "quinzaine",
  jour: "mardi",
  duree_h: 4.5,
  tarif_horaire: 32,
  actif: true,
  debut: "2026-03-24",
  fin: null,
};

/** La checklist du jour, construite depuis les prestations retenues sur le bien. */
const checklist = (): LigneChecklist[] => [
  { id: "l1", label: "Cuisine et office", fait: true, note: "" },
  { id: "l2", label: "Séjour et piano", fait: true, note: "Chiffon sec, comme convenu." },
  { id: "l3", label: "Chambre des enfants", fait: true, note: "" },
  { id: "l4", label: "Chambre d'amis", fait: true, note: "" },
  { id: "l5", label: "Chambre parentale", fait: true, note: "" },
  { id: "l6", label: "Bureau", fait: false, note: "Porte fermée à clé, pas pu entrer." },
  { id: "l7", label: "Salle de bains du haut", fait: true, note: "" },
  { id: "l8", label: "Salle de bains du bas", fait: true, note: "" },
  { id: "l9", label: "WC", fait: true, note: "" },
  { id: "l10", label: "Entrée et couloirs", fait: true, note: "" },
  { id: "l11", label: "Lits faits, linge changé", fait: true, note: "" },
  { id: "l12", label: "Arrosage des plantes", fait: true, note: "" },
  { id: "l13", label: "Relève du courrier", fait: true, note: "Deux plis déposés sur la console." },
  { id: "l14", label: "Vitres du séjour", fait: null, note: "" },
];

export const INTERVENTION: Intervention = {
  id: "i-2026-11-24",
  client_id: "c-delaunay",
  bien_id: "b-pre",
  abonnement_id: "ab-pre",
  date: "2026-11-24",
  debut: "09:05",
  fin: "13:20",
  duree_prevue_h: 4.5,
  statut: "faite",
  checklist: checklist(),
  observations:
    "Fuite légère sous le siphon de la salle de bains du bas, une serpillière posée dessous. À faire voir à un plombier.",
  photos_autorisees: true,
  photos: 2,
  km: 9,
  compte_rendu_id: "cr-2026-11-24",
  facture_id: null,
};

export const COMPTE_RENDU: CompteRendu = {
  id: "cr-2026-11-24",
  intervention_id: "i-2026-11-24",
  client_id: "c-delaunay",
  statut: "valide",
  cree_le: "2026-11-24T13:25:00Z",
  valide_le: "2026-11-24T13:40:00Z",
  envoye_le: null,
  destinataires: ["h.delaunay@exemple.fr"],
  empreinte_envoyee: null,
};

export const FACTURE: Facture = {
  id: "f-brouillon",
  numero: null,
  client_id: "c-delaunay",
  statut: "brouillon",
  date_emission: null,
  date_echeance: null,
  tva: 0, // CESU : pas de TVA facturée au particulier.
  lignes: [
    {
      id: "fl1",
      libelle: "Entretien de la maison — passage du 24 novembre",
      quantite: 4.25,
      unite: "h",
      pu: 32,
      intervention_id: "i-2026-11-24",
    },
  ],
  paiements: [],
  envoye_le: null,
};

/** L'historique du client : ce qui alimente la ligne de temps de la fiche. */
export interface Evenement {
  id: string;
  date: string;
  type: "demande" | "devis" | "intervention" | "compte_rendu" | "facture" | "paiement" | "mot";
  titre: string;
  detail: string | null;
}

export const HISTORIQUE: Evenement[] = [
  { id: "e12", date: "2026-11-24", type: "compte_rendu", titre: "Compte rendu validé", detail: "En attente d'envoi" },
  { id: "e11", date: "2026-11-24", type: "intervention", titre: "Passage effectué", detail: "4 h 15 · 13 postes sur 14" },
  { id: "e10", date: "2026-11-12", type: "paiement", titre: "Paiement reçu", detail: "144,00 € · virement" },
  { id: "e9", date: "2026-11-10", type: "facture", titre: "Facture 2026-041 envoyée", detail: "144,00 €" },
  { id: "e8", date: "2026-11-10", type: "compte_rendu", titre: "Compte rendu envoyé", detail: "Passage du 10 novembre" },
  { id: "e7", date: "2026-11-10", type: "intervention", titre: "Passage effectué", detail: "4 h 30 · 14 postes sur 14" },
  { id: "e6", date: "2026-10-27", type: "intervention", titre: "Passage effectué", detail: "4 h 30 · 14 postes sur 14" },
  { id: "e5", date: "2026-10-14", type: "mot", titre: "Appel d'Hélène", detail: "Demande d'ajouter les vitres du séjour une fois par mois" },
  { id: "e4", date: "2026-03-24", type: "intervention", titre: "Premier passage", detail: "5 h 00 · remise en état avant reprise" },
  { id: "e3", date: "2026-03-18", type: "devis", titre: "Devis accepté", detail: "Entretien quinzaine, 4 h 30" },
  { id: "e2", date: "2026-03-15", type: "devis", titre: "Devis envoyé", detail: "DEV-2026-012" },
  { id: "e1", date: "2026-03-14", type: "demande", titre: "Demande reçue", detail: "Formulaire du site · Réseaux sociaux" },
];

/** Les passages à venir, projetés depuis l'abonnement. */
export const PROCHAINS = [
  { id: "p1", date: "2026-12-08", heure: "09:00", duree_h: 4.5, libelle: "Entretien de la maison" },
  { id: "p2", date: "2026-12-22", heure: "09:00", duree_h: 4.5, libelle: "Entretien de la maison" },
  { id: "p3", date: "2027-01-05", heure: "09:00", duree_h: 4.5, libelle: "Entretien de la maison" },
];
