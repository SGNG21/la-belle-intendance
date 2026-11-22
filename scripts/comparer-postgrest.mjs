/**
 * Compare la doublure et le vrai PostgREST sur les sept points de
 * compatibilité relevés dans docs/app/RECETTE-POSTGREST.md.
 *
 * Le but n'est pas que les deux soient identiques — la doublure ne prétend
 * pas l'être — mais de savoir **où** elles divergent, et si cette divergence
 * touche le code de l'application.
 *
 *   node scripts/comparer-postgrest.mjs <doublure> <reel> [jeton]
 *   node scripts/comparer-postgrest.mjs http://127.0.0.1:54321 http://127.0.0.1:54322 eyJ...
 */

const DOUBLURE = process.argv[2] ?? "http://127.0.0.1:54321";
const REEL = process.argv[3] ?? "http://127.0.0.1:54322";
const JETON = process.argv[4] ?? "";

let identiques = 0;
let divergences = 0;
const notes = [];

/**
 * Un appel, sur l'un ou l'autre serveur.
 *
 * Supabase monte PostgREST sous /rest/v1/ ; lancé seul, il sert à la racine.
 * La doublure imite Supabase, le vrai serveur non : d'où les deux préfixes.
 */
async function appel(base, chemin, options = {}) {
  const entetes = { "Content-Type": "application/json", ...(options.headers ?? {}) };
  // Le vrai PostgREST veut un jeton ; la doublure l'ignore.
  if (base === REEL && JETON) entetes.Authorization = `Bearer ${JETON}`;
  const prefixe = base === REEL ? "/" : "/rest/v1/";
  // Garde-temps : un banc d'essai qui pend ne dit rien. Mieux vaut un échec
  // net, qu'on peut lire, qu'une attente indéfinie.
  let r;
  try {
    r = await fetch(`${base}${prefixe}${chemin}`, {
      ...options,
      headers: entetes,
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    return { statut: 0, corps: { message: `pas de réponse : ${e instanceof Error ? e.name : e}` } };
  }
  const texte = await r.text();
  let corps = null;
  try {
    corps = texte ? JSON.parse(texte) : null;
  } catch {
    corps = texte;
  }
  return { statut: r.status, corps };
}

function comparer(libelle, a, b, extraire = (x) => x) {
  const va = JSON.stringify(extraire(a));
  const vb = JSON.stringify(extraire(b));
  if (va === vb) {
    console.log(`  = ${libelle}`);
    identiques++;
  } else {
    console.log(`  ≠ ${libelle}`);
    console.log(`      doublure : ${va?.slice(0, 160)}`);
    console.log(`      réel     : ${vb?.slice(0, 160)}`);
    divergences++;
    notes.push({ libelle, doublure: va?.slice(0, 200), reel: vb?.slice(0, 200) });
  }
}

const titre = (t) => console.log(`\n${t}`);

/* ------------------------------------------------- 1. appels RPC --------- */

titre("1 — Appels RPC : forme de la réponse");

{
  const c = "p_debut=2026-11-01&p_fin=2026-11-30";
  const [a, b] = await Promise.all([
    appel(DOUBLURE, "rpc/projeter_agenda", { method: "POST", body: JSON.stringify({ p_debut: "2026-11-01", p_fin: "2026-11-30" }) }),
    appel(REEL, "rpc/projeter_agenda", { method: "POST", body: JSON.stringify({ p_debut: "2026-11-01", p_fin: "2026-11-30" }) }),
  ]);
  comparer("fonction qui rend plusieurs lignes : statut", a, b, (x) => x.statut);
  comparer("fonction qui rend plusieurs lignes : tableau", a, b, (x) => Array.isArray(x.corps));
  comparer("fonction qui rend plusieurs lignes : nombre", a, b, (x) => (Array.isArray(x.corps) ? x.corps.length : null));
  comparer("fonction qui rend plusieurs lignes : clés", a, b, (x) =>
    Array.isArray(x.corps) && x.corps[0] ? Object.keys(x.corps[0]).sort() : null);
  void c;
}

{
  const corps = JSON.stringify({ p_cle: `cmp-${Date.now()}`, p_objet: "comparaison", p_objet_id: null });
  const [a, b] = await Promise.all([
    appel(DOUBLURE, "rpc/reserver_envoi", { method: "POST", body: corps }),
    appel(REEL, "rpc/reserver_envoi", { method: "POST", body: JSON.stringify({ ...JSON.parse(corps), p_cle: `cmp-r-${Date.now()}` }) }),
  ]);
  comparer("fonction scalaire : statut", a, b, (x) => x.statut);
  comparer("fonction scalaire : valeur nue", a, b, (x) => x.corps);
}

/* ---------------------------------- 2. sérialisation des paramètres ------ */

titre("2 — Sérialisation : text[] et jsonb");

{
  // On prend un passage non clos pour ne rien abîmer.
  const dispo = await appel(REEL, "interventions?statut=eq.planifiee&select=id&limit=1");
  const id = Array.isArray(dispo.corps) && dispo.corps[0] ? dispo.corps[0].id : null;
  if (!id) {
    console.log("  — aucun passage planifié : essai sauté");
  } else {
    const args = JSON.stringify({ p_intervention_id: id, p_destinataires: ["a@exemple.fr", "b@exemple.fr"] });
    const a = await appel(DOUBLURE, "rpc/etablir_compte_rendu", { method: "POST", body: args });
    const b = await appel(REEL, "rpc/etablir_compte_rendu", { method: "POST", body: args });
    // Le passage n'est pas clos : les deux doivent refuser, et de la même façon.
    comparer("tableau text[] accepté sans erreur de syntaxe", a, b, (x) =>
      typeof x.corps === "object" && x.corps && "message" in x.corps
        ? String(x.corps.message).includes("array")
        : "pas d'erreur de tableau");
  }
}

/* -------------------------------- 3. erreurs : codes et charges ---------- */

titre("3 — Erreurs : code HTTP et charge utile");

{
  const args = JSON.stringify({ p_id: "00000000-0000-0000-0000-000000000000", p_debut: null, p_fin: null, p_checklist: null, p_observations: null, p_km: null, p_version: null });
  const a = await appel(DOUBLURE, "rpc/clore_intervention", { method: "POST", body: args });
  const b = await appel(REEL, "rpc/clore_intervention", { method: "POST", body: args });
  comparer("exception métier : statut HTTP", a, b, (x) => x.statut);
  comparer("exception métier : clés du corps", a, b, (x) => (x.corps && typeof x.corps === "object" ? Object.keys(x.corps).sort() : x.corps));
  comparer("exception métier : message", a, b, (x) => x.corps?.message);
  comparer("exception métier : code SQL", a, b, (x) => x.corps?.code);
}

{
  const [a, b] = await Promise.all([
    appel(DOUBLURE, "rpc/fonction_qui_nexiste_pas", { method: "POST", body: "{}" }),
    appel(REEL, "rpc/fonction_qui_nexiste_pas", { method: "POST", body: "{}" }),
  ]);
  comparer("fonction absente : statut HTTP", a, b, (x) => x.statut);
}

/* ---------------------------------------- 4. conflits de versions -------- */

titre("4 — Conflit de versions : le détail arrive-t-il ?");

{
  const dispo = await appel(REEL, "interventions?statut=eq.planifiee&select=id,version&limit=1");
  const i = Array.isArray(dispo.corps) ? dispo.corps[0] : null;
  if (!i) {
    console.log("  — aucun passage planifié : essai sauté");
  } else {
    const args = JSON.stringify({ p_id: i.id, p_jour: "2026-12-28", p_debut: null, p_motif: "comparaison", p_version: i.version + 99 });
    // En séquence, pas en parallèle : les deux serveurs visent la même base,
    // et deux « select for update » simultanés sur la même ligne s'attendent.
    const a = await appel(DOUBLURE, "rpc/deplacer_intervention", { method: "POST", body: args });
    const b = await appel(REEL, "rpc/deplacer_intervention", { method: "POST", body: args });
    comparer("conflit : statut HTTP", a, b, (x) => x.statut);
    comparer("conflit : message", a, b, (x) => x.corps?.message);
    // C'est le point le plus fragile : le détail doit porter le JSON du conflit.
    const lisible = (x) => {
      const d = x.corps?.details ?? x.corps?.detail;
      if (typeof d !== "string") return `absent (${typeof d})`;
      try {
        return Object.keys(JSON.parse(d)).sort();
      } catch {
        return "présent mais illisible";
      }
    };
    comparer("conflit : le détail porte la version réelle", a, b, lisible);
  }
}

/* ------------------------------- 5. transactions et idempotence ---------- */

titre("5 — Transactions : tout ou rien");

{
  const avant = await appel(REEL, "factures?select=id");
  const n0 = Array.isArray(avant.corps) ? avant.corps.length : -1;
  // Un passage non clos : facturer doit échouer ET ne rien laisser derrière.
  const dispo = await appel(REEL, "interventions?statut=eq.planifiee&select=id&limit=1");
  const id = Array.isArray(dispo.corps) && dispo.corps[0] ? dispo.corps[0].id : null;
  if (!id) {
    console.log("  — aucun passage planifié : essai sauté");
  } else {
    const r = await appel(REEL, "rpc/facturer_intervention", { method: "POST", body: JSON.stringify({ p_intervention_id: id }) });
    const apres = await appel(REEL, "factures?select=id");
    const n1 = Array.isArray(apres.corps) ? apres.corps.length : -1;
    console.log(`  ${r.statut >= 400 ? "✓" : "✗"} la facturation d'un passage non clos échoue (${r.statut})`);
    console.log(`  ${n0 === n1 ? "✓" : "✗"} aucune facture orpheline : ${n0} avant, ${n1} après`);
    if (r.statut >= 400) identiques++; else divergences++;
    if (n0 === n1) identiques++; else divergences++;
  }
}

/* ------------------------------------------- 6 et 7. permissions, RLS ---- */

titre("6 et 7 — Permissions et sécurité niveau ligne, sur le vrai serveur");

{
  // Sans jeton : le rôle anonyme s'applique. RLS active sans politique.
  const sans = async (chemin) => {
    const r = await fetch(`${REEL}/${chemin}`);
    const t = await r.text();
    return { statut: r.status, corps: t.slice(0, 120) };
  };

  for (const table of ["clients", "biens", "interventions", "factures", "contrats", "acces_revelations"]) {
    const r = await sans(`${table}?select=*&limit=1`);
    // Vide ou refusé : les deux conviennent. Une ligne rendue serait une fuite.
    const etanche = r.statut === 401 || r.statut === 403 || r.corps === "[]";
    console.log(`  ${etanche ? "✓" : "✗"} ${table} sans jeton → ${r.statut} ${r.corps.slice(0, 40)}`);
    if (etanche) identiques++; else divergences++;
  }

  const rpc = await fetch(`${REEL}/rpc/projeter_agenda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_debut: "2026-11-01", p_fin: "2026-11-30" }),
  });
  const corpsRpc = (await rpc.text()).slice(0, 80);
  const rpcEtanche = rpc.status >= 400 || corpsRpc === "[]";
  console.log(`  ${rpcEtanche ? "✓" : "✗"} fonction sans jeton → ${rpc.status} ${corpsRpc.slice(0, 40)}`);
  if (rpcEtanche) identiques++; else divergences++;
}

/* ------------------------------------------------------------- bilan ---- */

console.log(`\n${identiques} points conformes · ${divergences} divergence(s)`);
if (notes.length) {
  console.log("\nDivergences à traiter :");
  for (const n of notes) console.log(`  — ${n.libelle}`);
}
process.exit(0);
