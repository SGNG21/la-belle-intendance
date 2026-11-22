/**
 * Recette de la synchronisation hors ligne.
 *
 * Le module src/lib/horsLigne.ts est écrit pour le navigateur : il parle à
 * localStorage et à fetch. On lui fournit ici les deux, pour l'exercer contre
 * le vrai serveur sans ouvrir de navigateur. Ce que ce banc vérifie n'est pas
 * l'affichage mais la logique de reprise, qui est la partie où l'on perd des
 * données quand elle est fausse.
 *
 *   node scripts/recette-hors-ligne.mjs http://127.0.0.1:3100 <code>
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const CODE = process.argv[3] ?? "recette-local";

let reussis = 0;
let rates = 0;
const verifier = (libelle, ok, vu) => {
  if (ok) {
    console.log(`  ✓ ${libelle}`);
    reussis++;
  } else {
    console.log(`  ✗ ${libelle}${vu === undefined ? "" : ` — vu : ${JSON.stringify(vu)}`}`);
    rates++;
  }
};

/* ------------------------------- le navigateur, en pièces détachées ------ */

/** Un localStorage qui survit, ou non, selon qu'on le remplace. */
function creerStockage(depart = {}) {
  const m = new Map(Object.entries(depart));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    contenu: () => Object.fromEntries(m),
  };
}

let reseau = true;
let cookie = "";

/** fetch qui échoue quand on a « coupé le réseau », comme le ferait un mobile. */
const fetchSimule = async (url, options = {}) => {
  if (!reseau) throw new TypeError("fetch failed");
  const absolue = url.startsWith("http") ? url : BASE + url;
  return fetch(absolue, { ...options, headers: { ...(options.headers ?? {}), Cookie: cookie } });
};

/* ---------------- chargement du module réel, sans transpileur ------------ */

/**
 * On compile le vrai fichier avec TypeScript, puis on l'évalue en lui
 * fournissant un localStorage et un fetch de notre choix.
 *
 * Compiler plutôt que retirer les types à la main : le bricolage finit
 * toujours par casser sur une annotation imprévue, et surtout on veut tester
 * le code qui part en production, pas une copie qui divergerait.
 */
function chargerHorsLigne() {
  const sortie = mkdtempSync(join(tmpdir(), "hl-"));
  execFileSync(
    "npx",
    // --ignoreConfig : nommer un fichier en ligne de commande entre en conflit
    // avec le tsconfig du projet, que l'on n'a pas besoin de charger ici.
    ["tsc", "src/lib/horsLigne.ts", "--ignoreConfig", "--target", "es2022",
     "--module", "es2022", "--outDir", sortie, "--skipLibCheck"],
    { cwd: new URL("..", import.meta.url).pathname, stdio: "pipe" },
  );
  const src = readFileSync(join(sortie, "horsLigne.js"), "utf8").replace(/^export /gm, "");
  const fabrique = new Function(
    "localStorage",
    "fetch",
    "console",
    `${src}\nreturn { garder, reprendre, oublier, lireFile, enfiler, vider, enLigne };`,
  );
  return (stockage) => fabrique(stockage, fetchSimule, console);
}

const monter = chargerHorsLigne();

/* ------------------------------------------------------------- session --- */

{
  const r = await fetch(`${BASE}/api/intendance/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: CODE }),
  });
  cookie = (r.headers.getSetCookie?.() ?? [])[0]?.split(";")[0] ?? "";
  if (!cookie) throw new Error("session refusée");
}

const api = async (chemin, options = {}) => {
  const r = await fetch(BASE + "/api" + chemin, {
    ...options,
    headers: { "Content-Type": "application/json", Cookie: cookie, ...(options.headers ?? {}) },
  });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};

/** Un passage encore ouvert, avec sa version du moment. */
async function passageOuvert() {
  const a = await api("/intendance/agenda?debut=2026-11-01&fin=2026-12-31");
  return a.corps.cases.find((c) => c.intervention_id && c.statut !== "faite" && c.statut !== "annulee");
}

const titre = (t) => console.log(`\n${t}`);

/* ========================================================== scénarios ==== */

titre("1 — Perte de connexion pendant une intervention");

let stockage = creerStockage();
let hl = monter(stockage);
const passage = await passageOuvert();

{
  reseau = false;
  // On relève la checklist morceau par morceau, réseau coupé.
  for (let i = 1; i <= 5; i++) {
    hl.garder(`releve:${passage.intervention_id}`, [
      ...Array.from({ length: i }, (_, k) => ({ id: `l${k}`, label: `Poste ${k}`, fait: true, note: "" })),
    ]);
  }
  const repris = hl.reprendre(`releve:${passage.intervention_id}`);
  verifier("le relevé est gardé sur l'appareil, hors réseau", repris?.valeur?.length === 5, repris?.valeur?.length);

  hl.enfiler({
    cle: `clore:${passage.intervention_id}`,
    url: `/api/intendance/interventions/${passage.intervention_id}/clore`,
    methode: "POST",
    corps: { debut: "09:00", fin: "12:30", km: 9, version: passage.version, checklist: repris.valeur },
    cree_le: Date.now(),
  });
  verifier("la clôture part en file", hl.lireFile().length === 1, hl.lireFile().length);

  const bilan = await hl.vider();
  verifier("vider sans réseau ne perd rien", bilan.restantes === 1 && bilan.parties === 0, bilan);
}

titre("2 — Reprise après fermeture du navigateur");

{
  // Fermer le navigateur : on jette l'instance, on garde le stockage.
  const survivant = stockage.contenu();
  stockage = creerStockage(survivant);
  hl = monter(stockage);
  verifier("la file a survécu", hl.lireFile().length === 1, hl.lireFile().length);
  const repris = hl.reprendre(`releve:${passage.intervention_id}`);
  verifier("le relevé a survécu", repris?.valeur?.length === 5, repris?.valeur?.length);
}

titre("3 — Synchronisation au retour du réseau");

{
  reseau = true;
  const bilan = await hl.vider();
  verifier("la file part", bilan.parties === 1 && bilan.restantes === 0, bilan);
  const i = await api(`/intendance/agenda?debut=${passage.jour}&fin=${passage.jour}`);
  const apres = i.corps.cases.find((c) => c.intervention_id === passage.intervention_id);
  verifier("le passage est clos côté serveur", apres?.statut === "faite", apres?.statut);
}

titre("4 — Rejeu de la même opération");

{
  // Le téléphone repart d'une sauvegarde plus ancienne : la file revient.
  hl.enfiler({
    cle: `clore:${passage.intervention_id}`,
    url: `/api/intendance/interventions/${passage.intervention_id}/clore`,
    methode: "POST",
    corps: { debut: "09:00", fin: "12:30", km: 9, version: passage.version },
    cree_le: Date.now(),
  });
  const bilan = await hl.vider();
  verifier("le rejeu est refusé, pas accepté en double", bilan.parties === 0, bilan.parties);
  verifier("il quitte la file au lieu de la bloquer", bilan.restantes === 0, bilan.restantes);
  verifier("le refus remonte à l'écran", bilan.conflits.length + bilan.refusees.length === 1, bilan);
}

titre("5 — Deux appareils sur le même passage");

let cible;
{
  cible = await passageOuvert();
  const stockageA = creerStockage();
  const a = monter(stockageA);

  // L'appareil A prépare son déplacement, hors réseau.
  reseau = false;
  a.enfiler({
    cle: `deplacer:${cible.intervention_id}:A`,
    url: `/api/intendance/interventions/${cible.intervention_id}/deplacer`,
    methode: "POST",
    corps: { jour: "2026-12-20", motif: "Depuis le téléphone", version: cible.version },
    cree_le: Date.now(),
  });

  // Pendant ce temps, l'appareil B passe, lui, par le réseau.
  reseau = true;
  const b = await api(`/intendance/interventions/${cible.intervention_id}/deplacer`, {
    method: "POST",
    body: JSON.stringify({ jour: "2026-12-21", motif: "Depuis l'ordinateur", version: cible.version }),
  });
  verifier("l'appareil B passe", b.statut === 200, b.statut);

  titre("6 — Conflit de versions");
  const bilan = await a.vider();
  verifier("l'appareil A est refusé en conflit", bilan.conflits.length === 1, bilan);
  verifier("le conflit dit la version réelle", bilan.conflits[0]?.conflit?.reelle === cible.version + 1, bilan.conflits[0]?.conflit);
  verifier("rien n'est écrasé en silence", bilan.parties === 0, bilan.parties);

  const etat = await api("/intendance/agenda?debut=2026-12-15&fin=2026-12-31");
  const ou = etat.corps.cases.find((c) => c.intervention_id === cible.intervention_id);
  verifier("la date retenue est celle de B", ou?.jour === "2026-12-21", ou?.jour);
}

titre("7 — Échec partiel de synchronisation");

{
  const s = creerStockage();
  const q = monter(s);
  const bon = await passageOuvert();

  // Trois actions : une valide, une invalide, une valide.
  q.enfiler({
    cle: "partiel-1",
    url: `/api/intendance/interventions/${bon.intervention_id}/deplacer`,
    methode: "POST",
    corps: { jour: "2026-12-22", motif: "Première", version: bon.version },
    cree_le: 1,
  });
  q.enfiler({
    cle: "partiel-2",
    url: "/api/intendance/interventions/00000000-0000-0000-0000-000000000000/deplacer",
    methode: "POST",
    corps: { jour: "2026-12-23", motif: "Passage inexistant" },
    cree_le: 2,
  });
  q.enfiler({
    cle: "partiel-3",
    url: `/api/intendance/interventions/${bon.intervention_id}/annuler`,
    methode: "POST",
    corps: { motif: "Troisième" },
    cree_le: 3,
  });

  const bilan = await q.vider();
  verifier("les actions valides passent", bilan.parties === 2, bilan.parties);
  verifier("l'action impossible est écartée et signalée", bilan.conflits.length + bilan.refusees.length === 1, bilan);
  verifier("la file est vidée, pas bloquée par la mauvaise", bilan.restantes === 0, bilan.restantes);
}

titre("8 — Aucune consigne d'accès dans le stockage");

{
  const s = creerStockage();
  const q = monter(s);
  q.garder("bien", { libelle: "Maison", acces: "code 4812" });
  verifier("une consigne au premier niveau est refusée", s.getItem("lbi:bien") === null);

  q.garder("imbrique", { bien: { libelle: "Maison", particularites: "chien" } });
  verifier("une consigne imbriquée est refusée", s.getItem("lbi:imbrique") === null);

  q.garder("ok", [{ id: "l1", label: "Cuisine", fait: true, note: "" }]);
  verifier("un relevé ordinaire passe", s.getItem("lbi:ok") !== null);

  const tout = JSON.stringify(s.contenu());
  verifier("rien dans le stockage ne ressemble à un code", !/4812|digicode|alarme/i.test(tout));
}

console.log(`\n${reussis} vérifications passées · ${rates} échec(s)`);
process.exit(rates ? 1 : 0);
