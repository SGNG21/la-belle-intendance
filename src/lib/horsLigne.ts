/**
 * Travailler sans réseau.
 *
 * Une maison de campagne n'a pas toujours de couverture, et la checklist se
 * remplit debout, dans la maison. Perdre une heure de relevé parce que le
 * réseau a sauté serait la faute la plus coûteuse du produit : il faudrait
 * tout recommencer de mémoire.
 *
 * Le principe tient en trois points.
 *   1. Le relevé est écrit dans le navigateur à chaque geste, pas à la fin.
 *   2. Une action qui doit partir au serveur est mise en file si le réseau
 *      manque, avec sa clé d'idempotence.
 *   3. La file est vidée au retour du réseau. Comme chaque action porte sa
 *      clé, un rejeu ne produit rien : c'est le même verrou que côté serveur.
 */

const PREFIXE = "lbi:";

/* ------------------------------------------- ce qui ne descend jamais ici */

/**
 * Le stockage du navigateur n'est pas chiffré, survit à la fermeture et se lit
 * depuis la console. Les consignes d'entrée d'un logement — code du portail,
 * emplacement des clés, alarme — n'y descendent donc jamais : elles ne sont
 * lues qu'à la demande, gardées en mémoire vive, et oubliées à la fermeture
 * de l'écran.
 *
 * Ce garde-fou est une ceinture par-dessus les bretelles. Le serveur ne les
 * envoie déjà qu'à la demande, par une route séparée ; cette fonction attrape
 * le jour où un développeur pressé voudrait tout de même les mettre en cache.
 */
const CLES_INTERDITES = ["acces", "particularites", "code", "alarme", "cle", "cles", "digicode", "badge"];

function contientUnSecret(v: unknown, profondeur = 0): boolean {
  if (profondeur > 6 || v === null || typeof v !== "object") return false;
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (CLES_INTERDITES.includes(k.toLowerCase()) && val) return true;
    if (contientUnSecret(val, profondeur + 1)) return true;
  }
  return false;
}

/* ------------------------------------------------------ le relevé en cours */

export interface Brouillon<T> {
  valeur: T;
  modifie_le: number;
}

/**
 * Écrit le relevé localement. Appelé à chaque geste, pas à la validation.
 *
 * Refuse d'écrire ce qui porte une consigne d'accès : mieux vaut perdre un
 * brouillon que laisser le code d'un portail dans un stockage en clair.
 */
export function garder<T>(cle: string, valeur: T): void {
  if (contientUnSecret(valeur)) {
    console.error("[horsLigne] écriture refusée : la valeur porte une consigne d'accès.");
    return;
  }
  try {
    const b: Brouillon<T> = { valeur, modifie_le: Date.now() };
    localStorage.setItem(PREFIXE + cle, JSON.stringify(b));
  } catch {
    // Mode privé, quota plein : on ne casse pas la saisie pour autant.
  }
}

export function reprendre<T>(cle: string): Brouillon<T> | null {
  try {
    const brut = localStorage.getItem(PREFIXE + cle);
    return brut ? (JSON.parse(brut) as Brouillon<T>) : null;
  } catch {
    return null;
  }
}

export function oublier(cle: string): void {
  try {
    localStorage.removeItem(PREFIXE + cle);
  } catch {
    /* sans conséquence */
  }
}

/* ------------------------------------------------------------- la file */

export interface Action {
  /** La clé d'idempotence. Le serveur refusera un second passage avec la même. */
  cle: string;
  url: string;
  methode: "POST" | "PATCH";
  corps: unknown;
  cree_le: number;
}

const FILE = PREFIXE + "file";

export function lireFile(): Action[] {
  try {
    return JSON.parse(localStorage.getItem(FILE) ?? "[]") as Action[];
  } catch {
    return [];
  }
}

function ecrireFile(a: Action[]): void {
  try {
    localStorage.setItem(FILE, JSON.stringify(a.slice(-50)));
  } catch {
    /* sans conséquence */
  }
}

/** Met une action en file. Une clé déjà présente n'est pas ajoutée deux fois. */
export function enfiler(a: Action): void {
  const f = lireFile();
  if (f.some((x) => x.cle === a.cle)) return;
  ecrireFile([...f, a]);
}

/** Ce qu'il est advenu d'une action sortie de la file. */
export type Issue = "acceptee" | "deja_faite" | "refusee" | "conflit" | "reseau";

export interface Resultat {
  cle: string;
  issue: Issue;
  message?: string;
  /** Rempli sur un conflit : de quoi expliquer, pas de quoi forcer. */
  conflit?: { attendue: number; reelle: number; modifie_le: string };
}

export interface Bilan {
  parties: number;
  restantes: number;
  conflits: Resultat[];
  refusees: Resultat[];
}

/**
 * Tente d'envoyer ce qui attend.
 *
 * Quatre issues, et c'est le cœur du sujet.
 *
 *   — **Acceptée** : elle quitte la file.
 *   — **Déjà faite** : elle quitte la file aussi. Le serveur a reconnu la clé
 *     d'idempotence, donc le travail est enregistré ; insister ne changerait
 *     rien et ferait croire à un échec.
 *   — **Conflit** (409) : elle quitte la file et **remonte à l'utilisatrice**.
 *     On ne rejoue pas, on ne force pas : un autre appareil est passé après,
 *     et écraser son travail sans le dire est précisément ce qu'il faut
 *     éviter. La file ne doit pas non plus la garder indéfiniment, sinon elle
 *     bloquerait tout ce qui suit.
 *   — **Refusée** (autre 4xx) : elle quitte la file et remonte aussi. Une
 *     saisie invalide ne deviendra pas valide en étant rejouée mille fois.
 *
 * Une panne réseau, elle, **arrête la vidange** sans rien retirer : l'ordre
 * des actions est conservé, on reprendra au même point.
 */
export async function vider(): Promise<Bilan> {
  const conflits: Resultat[] = [];
  const refusees: Resultat[] = [];
  let parties = 0;

  for (const a of lireFile()) {
    let r: Response;
    try {
      r = await fetch(a.url, {
        method: a.methode,
        headers: { "Content-Type": "application/json", "Idempotency-Key": a.cle },
        body: JSON.stringify(a.corps),
      });
    } catch {
      // Réseau absent : on s'arrête là, la file garde son ordre.
      break;
    }

    let corps: { error?: string; conflit?: Resultat["conflit"] } = {};
    try {
      corps = await r.json();
    } catch {
      /* corps vide ou illisible */
    }

    const retirer = () => ecrireFile(lireFile().filter((x) => x.cle !== a.cle));

    if (r.ok) {
      retirer();
      parties++;
    } else if (r.status === 409) {
      retirer();
      conflits.push({ cle: a.cle, issue: "conflit", message: corps.error, conflit: corps.conflit });
    } else if (r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429) {
      retirer();
      refusees.push({ cle: a.cle, issue: "refusee", message: corps.error });
    } else {
      // 5xx, 408, 429 : la faute n'est pas à la saisie. On réessaiera.
      break;
    }
  }

  return { parties, restantes: lireFile().length, conflits, refusees };
}

/** Y a-t-il du réseau ? `navigator.onLine` ment parfois, mais il ment peu. */
export const enLigne = (): boolean => (typeof navigator === "undefined" ? true : navigator.onLine);
