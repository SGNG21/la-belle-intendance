/**
 * Ce qui détermine le prix, et ce qui ne le détermine pas.
 *
 * Règle cardinale : **le temps réellement passé ne change jamais le prix
 * convenu.** Il est mesuré, il sert à connaître la marge et à décider s'il
 * faut renégocier, mais il n'entre dans aucune ligne de facture. Une femme de
 * ménage qui va plus vite ne facture pas moins, et une qui traîne ne facture
 * pas plus : c'est le contrat qui dit le prix.
 *
 * Quatre bases possibles, exclusives l'une de l'autre, plus les suppléments.
 */

/* --------------------------------------------------------------- le contrat */

export type BaseTarifaire = "forfait" | "horaire" | "abonnement";

export const LABEL_BASE: Record<BaseTarifaire, string> = {
  forfait: "Forfait contractuel",
  horaire: "Tarif horaire",
  abonnement: "Abonnement",
};

export interface Contrat {
  id: string;
  client_id: string;
  bien_id: string;
  base: BaseTarifaire;
  libelle: string;

  /** base « forfait » : le prix d'un passage, quel qu'en soit la durée. */
  forfait_ht: number | null;

  /**
   * base « horaire » : le taux, et surtout les **heures convenues**.
   * Le prix se calcule sur les heures convenues, jamais sur les heures faites.
   */
  taux_horaire_ht: number | null;
  heures_convenues: number | null;

  /**
   * base « abonnement » : un montant par période couvrant un nombre de
   * passages. Un passage compris dans l'abonnement ne produit aucune ligne.
   */
  abonnement_ht: number | null;
  abonnement_periode: "mois" | "trimestre" | null;
  passages_inclus: number | null;

  tva: number;
  debut: string;
  fin: string | null;
}

/* ----------------------------------------------------------- les suppléments */

/**
 * Un supplément n'est facturable **que s'il a été approuvé**, et l'approbation
 * dit par qui et quand. Sans cela, le travail a peut-être été fait, mais il
 * n'ira pas sur la facture : c'est le seul moyen d'éviter la facture surprise
 * qui fait perdre un client d'abonnement.
 */
export interface Approbation {
  par: string;
  le: string;
  canal: "sms" | "email" | "oral" | "ecrit";
}

export interface Supplement {
  id: string;
  intervention_id: string;
  libelle: string;
  /** Un supplément se chiffre au montant **ou** au temps, jamais aux deux. */
  montant_ht: number | null;
  heures: number | null;
  taux_horaire_ht: number | null;
  approbation: Approbation | null;
}

export const montantSupplement = (s: Supplement): number => {
  if (s.montant_ht != null) return arrondi(s.montant_ht);
  if (s.heures != null && s.taux_horaire_ht != null) return arrondi(s.heures * s.taux_horaire_ht);
  return 0;
};

/* ------------------------------------------------------------ la facturation */

export const arrondi = (n: number): number => Math.round(n * 100) / 100;

export interface LigneCalculee {
  libelle: string;
  detail: string;
  quantite: number | null;
  unite: string | null;
  pu: number | null;
  montant_ht: number;
  origine: "contrat" | "supplement";
}

export interface Exclusion {
  libelle: string;
  raison: string;
}

export interface Calcul {
  lignes: LigneCalculee[];
  exclusions: Exclusion[];
  total_ht: number;
  /** Mot d'explication affiché sous le total : pourquoi ce montant et pas un autre. */
  note: string;
}

/**
 * Les lignes d'un passage, à partir du contrat et des suppléments approuvés.
 *
 * `reelles` est passé pour être affiché à côté, jamais pour entrer dans le
 * calcul. La signature le reflète : le temps réel ne sert qu'à la note.
 */
export function calculer(
  contrat: Contrat,
  supplements: Supplement[],
  reelles: number | null,
): Calcul {
  const lignes: LigneCalculee[] = [];
  const exclusions: Exclusion[] = [];
  let note = "";

  if (contrat.base === "forfait") {
    const m = contrat.forfait_ht ?? 0;
    lignes.push({
      libelle: contrat.libelle,
      detail: "Forfait contractuel, indépendant de la durée du passage.",
      quantite: 1,
      unite: "passage",
      pu: m,
      montant_ht: arrondi(m),
      origine: "contrat",
    });
    note =
      reelles != null
        ? `Forfait convenu. Le passage a duré ${heures(reelles)} ; cela ne change pas le prix.`
        : "Forfait convenu.";
  }

  if (contrat.base === "horaire") {
    const h = contrat.heures_convenues ?? 0;
    const t = contrat.taux_horaire_ht ?? 0;
    lignes.push({
      libelle: contrat.libelle,
      detail: "Heures convenues au contrat, et non heures relevées.",
      quantite: h,
      unite: "h",
      pu: t,
      montant_ht: arrondi(h * t),
      origine: "contrat",
    });
    note =
      reelles != null && reelles !== h
        ? `${heures(h)} convenues facturées. Le passage a duré ${heures(reelles)} : l'écart se règle en renégociant le contrat, pas sur cette facture.`
        : `${heures(h)} convenues facturées.`;
  }

  if (contrat.base === "abonnement") {
    note = `Passage compris dans l'abonnement${
      contrat.abonnement_ht != null
        ? ` de ${euros(contrat.abonnement_ht)} par ${contrat.abonnement_periode ?? "mois"}`
        : ""
    }. Il n'est pas facturé à l'unité.`;
    if (reelles != null) note += ` Durée relevée : ${heures(reelles)}, pour mémoire.`;
  }

  for (const s of supplements) {
    const m = montantSupplement(s);
    if (!s.approbation) {
      // Non approuvé : il n'entre pas sur la facture, et on dit pourquoi.
      exclusions.push({ libelle: s.libelle, raison: "Supplément non approuvé par le client." });
      continue;
    }
    if (m <= 0) {
      exclusions.push({ libelle: s.libelle, raison: "Supplément approuvé mais non chiffré." });
      continue;
    }
    lignes.push({
      libelle: s.libelle,
      detail: `Approuvé par ${s.approbation.par} le ${dateCourte(s.approbation.le)} (${s.approbation.canal}).`,
      quantite: s.heures ?? 1,
      unite: s.heures != null ? "h" : "forfait",
      pu: s.heures != null ? s.taux_horaire_ht : s.montant_ht,
      montant_ht: m,
      origine: "supplement",
    });
  }

  return { lignes, exclusions, total_ht: arrondi(lignes.reduce((s, l) => s + l.montant_ht, 0)), note };
}

/* ------------------------------------------------------------ la rentabilité */

export interface Cout {
  /** Ce que coûte une heure de travail, charges comprises. */
  horaire: number;
  /** Coût réel du kilomètre : carburant, usure, assurance. */
  kilometrique: number;
}

export interface Rentabilite {
  produit_ht: number;
  cout_temps: number;
  cout_trajet: number;
  marge: number;
  /** Ce que le passage rapporte réellement par heure passée. Le chiffre qui compte. */
  rendement_horaire: number | null;
  ecart_heures: number | null;
}

/**
 * Ce que le passage rapporte vraiment.
 *
 * C'est ici, et seulement ici, que le temps réel sert. Un forfait tenu en
 * trois heures est excellent ; le même tenu en six est une perte qu'aucune
 * facture ne montrera jamais.
 */
export function rentabilite(
  produit_ht: number,
  reelles: number | null,
  km: number | null,
  convenues: number | null,
  cout: Cout,
): Rentabilite {
  const h = reelles ?? 0;
  const cout_temps = arrondi(h * cout.horaire);
  const cout_trajet = arrondi((km ?? 0) * 2 * cout.kilometrique);
  const marge = arrondi(produit_ht - cout_temps - cout_trajet);
  return {
    produit_ht,
    cout_temps,
    cout_trajet,
    marge,
    rendement_horaire: h > 0 ? arrondi(produit_ht / h) : null,
    ecart_heures: reelles != null && convenues != null ? arrondi(reelles - convenues) : null,
  };
}

/**
 * Faut-il renégocier ?
 *
 * Un dépassement isolé n'est rien ; un dépassement qui s'installe mange la
 * marge en silence. Le seuil est volontairement haut pour ne pas crier au loup.
 */
export function alerteEcart(ecarts: number[], convenues: number): string | null {
  if (ecarts.length < 3) return null;
  const moyen = ecarts.reduce((a, b) => a + b, 0) / ecarts.length;
  if (convenues <= 0 || moyen / convenues < 0.15) return null;
  return `Les ${ecarts.length} derniers passages dépassent en moyenne de ${heures(moyen)}. Le contrat mérite d'être revu.`;
}

/* ------------------------------------------------------------------ formats */

const EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const euros = (n: number): string => EUROS.format(n);

export const heures = (h: number): string => {
  const signe = h < 0 ? "−" : "";
  const m = Math.round(Math.abs(h) * 60);
  return `${signe}${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`;
};

export const dateCourte = (iso: string): string =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
