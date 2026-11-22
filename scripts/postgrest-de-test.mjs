/**
 * Doublure de PostgREST pour la recette locale.
 *
 * **Ce n'est pas PostgREST.** C'est un serveur de test qui parle juste assez
 * de son dialecte pour que l'application tourne contre une base PostgreSQL
 * locale, sans toucher à Supabase. Il sert à prouver que les écrans sont
 * réellement raccordés aux routes, et à rien d'autre.
 *
 * Ce qu'il sait faire : lecture avec select, filtres, tri et limite ;
 * insertion ; mise à jour ; suppression ; appel de fonction par /rpc/ ; et
 * l'imbrication simple « table(colonnes) » d'une clé étrangère.
 *
 * Ce qu'il ne sait pas faire : la sécurité niveau ligne, les filtres
 * composés, l'imbrication profonde, la pagination par en-tête. Si l'un de ces
 * points devient nécessaire, il faut le vrai PostgREST.
 *
 *   node scripts/postgrest-de-test.mjs 54321 postgres://postgres@127.0.0.1:5433/postgres
 */

import { createServer } from "node:http";
import pg from "pg";

// PostgREST rend une date en « 2026-11-20 » et un numérique en nombre JSON.
// Sans ces deux réglages, la doublure rendrait un horodatage et une chaîne,
// et l'écran serait écrit contre une forme que la vraie base ne produit pas.
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));

const PORT = Number(process.argv[2] ?? 54321);
const POOL = new pg.Pool({
  connectionString: process.argv[3] ?? "postgres://postgres@127.0.0.1:5433/postgres",
});

const OPERATEURS = {
  eq: "=",
  neq: "<>",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "like",
  ilike: "ilike",
};

/** `nom=eq.valeur` devient un fragment SQL et son paramètre. */
function filtre(colonne, brut, params) {
  if (brut.startsWith("is.")) {
    const v = brut.slice(3);
    const litteral = v === "null" ? "null" : v === "true" ? "true" : "false";
    return `"${colonne}" is ${litteral}`;
  }
  const point = brut.indexOf(".");
  const op = OPERATEURS[brut.slice(0, point)];
  if (!op) throw new Error(`opérateur non géré : ${brut}`);
  params.push(brut.slice(point + 1));
  return `"${colonne}" ${op} $${params.length}`;
}

/** Sépare les colonnes simples des imbrications « table(a,b) ». */
function decouperSelect(select) {
  const simples = [];
  const imbriques = [];
  let prof = 0;
  let courant = "";
  for (const c of select) {
    if (c === "(") prof++;
    if (c === ")") prof--;
    if (c === "," && prof === 0) {
      if (courant.includes("(")) imbriques.push(courant);
      else simples.push(courant);
      courant = "";
    } else {
      courant += c;
    }
  }
  if (courant) {
    if (courant.includes("(")) imbriques.push(courant);
    else simples.push(courant);
  }
  return { simples, imbriques };
}

/** Le nom de la colonne de liaison, par convention : « biens » porte « bien_id ». */
function colonneLiaison(table) {
  return table.endsWith("s") ? `${table.slice(0, -1)}_id` : `${table}_id`;
}

async function lire(table, url) {
  const params = [];
  const select = url.searchParams.get("select") ?? "*";
  const { simples, imbriques } = decouperSelect(select);

  const colonnes =
    simples.length && simples[0].trim() !== "*"
      ? simples.map((c) => `"${c.trim()}"`).join(", ")
      : `"${table}".*`;

  // Une imbrication « clients(id,nom) » devient un sous-select JSON.
  const extras = imbriques
    .map((x) => {
      const trouve = /^(\w+)\((.+)\)$/.exec(x.trim());
      if (!trouve) return null;
      const [, liee, cols] = trouve;
      const paires = cols
        .split(",")
        .map((c) => `'${c.trim()}', e."${c.trim()}"`)
        .join(", ");
      // Deux sens possibles : la table liée pointe vers nous, ou l'inverse.
      return `(select json_agg(json_build_object(${paires}))
                 from "${liee}" e
                where e."${colonneLiaison(table)}" = "${table}".id
                   or e.id = "${table}"."${colonneLiaison(liee)}") as "${liee}"`;
    })
    .filter(Boolean);

  const ou = [];
  for (const [k, v] of url.searchParams) {
    if (["select", "order", "limit", "offset"].includes(k)) continue;
    ou.push(filtre(k, v, params));
  }

  let sql = `select ${[colonnes, ...extras].join(", ")} from "${table}"`;
  if (ou.length) sql += ` where ${ou.join(" and ")}`;

  const order = url.searchParams.get("order");
  if (order) {
    const clauses = order.split(",").map((o) => {
      const [c, sens] = o.split(".");
      return `"${c}" ${sens === "desc" ? "desc" : "asc"}`;
    });
    sql += ` order by ${clauses.join(", ")}`;
  }

  const limit = url.searchParams.get("limit");
  if (limit) sql += ` limit ${Number(limit) || 100}`;

  const { rows } = await POOL.query(sql, params);

  // PostgREST rend un objet, et non un tableau d'un élément, quand la
  // relation est de type « plusieurs vers un ».
  for (const r of rows) {
    for (const x of imbriques) {
      const liee = /^(\w+)\(/.exec(x.trim())?.[1];
      if (!liee) continue;
      const valeur = r[liee];
      if (valeur === null || valeur === undefined) {
        r[liee] = [];
      } else if (Array.isArray(valeur) && valeur.length === 1 && table === "biens") {
        r[liee] = valeur[0];
      }
    }
  }
  return rows;
}

async function ecrire(table, url, corps, methode, prefer) {
  const params = [];
  let sql;

  if (methode === "POST") {
    const lignes = Array.isArray(corps) ? corps : [corps];
    const cols = Object.keys(lignes[0]);
    const tuples = lignes.map((l) => {
      const places = cols.map((c) => {
        params.push(l[c]);
        return `$${params.length}`;
      });
      return `(${places.join(", ")})`;
    });
    sql = `insert into "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) values ${tuples.join(", ")}`;
  } else if (methode === "PATCH") {
    const sets = Object.keys(corps).map((c) => {
      params.push(corps[c]);
      return `"${c}" = $${params.length}`;
    });
    sql = `update "${table}" set ${sets.join(", ")}`;
  } else {
    sql = `delete from "${table}"`;
  }

  const ou = [];
  for (const [k, v] of url.searchParams) {
    if (["select", "order", "limit"].includes(k)) continue;
    ou.push(filtre(k, v, params));
  }
  if (ou.length) sql += ` where ${ou.join(" and ")}`;
  if (prefer.includes("return=representation")) sql += " returning *";

  const r = await POOL.query(sql, params);
  return prefer.includes("return=representation") ? r.rows : null;
}

/** Les fonctions qui rendent plusieurs lignes, et non une seule. */
const ENSEMBLES = ["projeter_agenda", "interventions_a_facturer"];

/**
 * Les types des paramètres, lus dans le catalogue.
 *
 * Sans cela il faudrait deviner : un tableau JavaScript devient un tableau
 * PostgreSQL pour un paramètre « text[] », mais doit être sérialisé pour un
 * « jsonb ». Deviner d'après le nom marcherait jusqu'au jour où il cesserait.
 */
const SIGNATURES = new Map();

async function typesDe(fn) {
  if (SIGNATURES.has(fn)) return SIGNATURES.get(fn);
  const { rows } = await POOL.query(
    `select unnest(coalesce(p.proargnames, '{}')) as nom,
            unnest(string_to_array(oidvectortypes(p.proargtypes), ', ')) as type
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where p.proname = $1 and n.nspname = 'public'`,
    [fn],
  );
  const m = Object.fromEntries(rows.map((r) => [r.nom, r.type]));
  SIGNATURES.set(fn, m);
  return m;
}

async function appeler(fn, args) {
  const types = await typesDe(fn);
  const noms = Object.keys(args);
  const valeurs = noms.map((n) => {
    const v = args[n];
    const t = types[n] ?? "";
    // jsonb et json : la valeur part en texte. Les tableaux PostgreSQL, eux,
    // sont rendus tels quels — node-pg sait les écrire.
    if (v !== null && typeof v === "object" && (t.includes("json") || !Array.isArray(v))) {
      return JSON.stringify(v);
    }
    return v;
  });
  const appel = noms.length
    ? `select * from "${fn}"(${noms.map((n, i) => `"${n}" => $${i + 1}`).join(", ")})`
    : `select * from "${fn}"()`;

  const { rows, fields } = await POOL.query(appel, valeurs);
  // Une fonction scalaire : PostgREST rend la valeur nue.
  if (fields.length === 1 && rows.length === 1 && fields[0].name === fn) {
    return rows[0][fn];
  }
  if (ENSEMBLES.includes(fn)) return rows;
  return rows.length === 1 ? rows[0] : rows;
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const chemin = url.pathname.replace(/^\/rest\/v1\//, "");
  const prefer = req.headers.prefer ?? "";

  let brut = "";
  for await (const c of req) brut += c;

  const repondre = (code, corps) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(corps === null || corps === undefined ? "" : JSON.stringify(corps));
  };

  try {
    if (chemin.startsWith("rpc/")) {
      return repondre(200, await appeler(chemin.slice(4), brut ? JSON.parse(brut) : {}));
    }
    const table = chemin.split("?")[0];
    if (req.method === "GET") return repondre(200, await lire(table, url));
    const r = await ecrire(table, url, brut ? JSON.parse(brut) : {}, req.method, prefer);
    return repondre(r ? 200 : 204, r);
  } catch (e) {
    // Le format d'erreur de PostgREST : l'application sait déjà le lire.
    repondre(400, { message: e.message, details: e.detail ?? null, code: e.code ?? null });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`doublure PostgREST sur 127.0.0.1:${PORT}`);
});
