/**
 * Vérifie que toute route sensible refuse un appel sans session.
 *
 * Le portail de l'écran est une commodité d'affichage ; la vraie barrière est
 * ici, dans les routes. Ce script l'éprouve : il appelle chaque route de
 * /api/intendance sans cookie et exige un refus. Il vérifie aussi qu'aucune
 * réponse ne laisse filtrer de donnée personnelle.
 *
 * Usage : node scripts/audit-routes.mjs http://127.0.0.1:3100
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const RACINE = "src/app/api";

/** Parcourt l'arborescence des routes et rend leur chemin d'appel. */
async function routes(dir, prefixe = "") {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      // [id] devient un identifiant de forme valide mais qui n'existe pas.
      const seg = e.name.startsWith("[") ? "00000000-0000-0000-0000-000000000000" : e.name;
      out.push(...(await routes(join(dir, e.name), `${prefixe}/${seg}`)));
    } else if (e.name === "route.ts") {
      out.push(prefixe || "/");
    }
  }
  return out;
}

/**
 * Les routes qui doivent refuser sans session.
 *
 * Une seule exception, assumée : la sonde d'état du portail. Elle répond
 * « session ouverte : oui ou non », ce que l'écran doit pouvoir demander
 * avant d'avoir une session. Elle ne rend aucune donnée. Toute autre route
 * de /intendance qui répondrait 200 sans cookie serait un trou.
 */
const EXCEPTIONS = new Set(["/intendance/session"]);
const SENSIBLE = (p) => (p.startsWith("/intendance") || p.startsWith("/compte-rendu")) && !EXCEPTIONS.has(p);

// Une réponse ne doit jamais contenir ceci sans session.
const INDICES_FUITE = [
  [/[\w.+-]+@(?!exemple\.|example\.)[\w-]+\.[a-z]{2,}/i, "adresse e-mail"],
  [/\b0[1-9](?:[ .-]?\d{2}){4}\b/, "numéro de téléphone"],
  [/eyJ[A-Za-z0-9_-]{20,}/, "jeton"],
  [/supabase\.co/i, "adresse de la base"],
  [/\bcode\s+\d{4}\b/i, "code de portail"],
];

const chemins = (await routes(RACINE)).sort();
let refus = 0, fautes = 0, fuites = 0;

console.log(`Audit de ${chemins.length} routes sur ${BASE}\n`);

for (const p of chemins) {
  const url = `${BASE}/api${p}`;
  for (const methode of ["GET", "POST"]) {
    const r = await fetch(url, {
      method: methode,
      headers: { "Content-Type": "application/json" },
      ...(methode === "POST" ? { body: "{}" } : {}),
    }).catch(() => null);
    if (!r) continue;
    if (r.status === 405) continue; // méthode non exposée : normal

    const texte = (await r.text()).slice(0, 4000);

    if (SENSIBLE(p)) {
      const refuse = r.status === 401 || r.status === 503;
      if (refuse) refus++;
      else {
        fautes++;
        console.log(`  ✗ ${methode} ${p} → ${r.status} — devrait refuser`);
      }
    }
    for (const [re, quoi] of INDICES_FUITE) {
      if (re.test(texte)) {
        fuites++;
        console.log(`  ✗ ${methode} ${p} → ${quoi} dans la réponse`);
      }
    }
  }
}

console.log(`\n${refus} refus corrects · ${fautes} route(s) non protégée(s) · ${fuites} fuite(s)`);
process.exit(fautes + fuites === 0 ? 0 : 1);
