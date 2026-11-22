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

/* ------------------------------------------------------ le relevé en cours */

export interface Brouillon<T> {
  valeur: T;
  modifie_le: number;
}

/** Écrit le relevé localement. Appelé à chaque geste, pas à la validation. */
export function garder<T>(cle: string, valeur: T): void {
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

/**
 * Tente d'envoyer ce qui attend.
 *
 * Une action est retirée de la file si le serveur l'a acceptée **ou** s'il
 * répond qu'elle avait déjà été faite : dans les deux cas le travail est
 * enregistré. Une panne réseau la laisse en file ; une erreur de validation
 * la retire, parce que la rejouer indéfiniment ne la fera jamais passer.
 */
export async function vider(): Promise<{ parties: number; restantes: number }> {
  let parties = 0;
  for (const a of lireFile()) {
    try {
      const r = await fetch(a.url, {
        method: a.methode,
        headers: { "Content-Type": "application/json", "Idempotency-Key": a.cle },
        body: JSON.stringify(a.corps),
      });
      if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 429)) {
        ecrireFile(lireFile().filter((x) => x.cle !== a.cle));
        parties++;
      }
    } catch {
      // Réseau absent : on s'arrête, la file garde l'ordre.
      break;
    }
  }
  return { parties, restantes: lireFile().length };
}

/** Y a-t-il du réseau ? `navigator.onLine` ment parfois, mais il ment peu. */
export const enLigne = (): boolean => (typeof navigator === "undefined" ? true : navigator.onLine);
