/**
 * Passerelle devant le vrai PostgREST, pour la recette.
 *
 * Supabase ne sert pas PostgREST tel quel : une passerelle le monte sous
 * /rest/v1/ et traduit la clé de service en jeton. L'application est écrite
 * pour cela. Lancé seul, PostgREST sert à la racine et veut un JWT.
 *
 * Cette passerelle fait les deux choses, et rien d'autre : elle retire le
 * préfixe et pose l'en-tête d'autorisation. Elle n'ajoute aucune logique, de
 * sorte que ce qui est éprouvé derrière est bien le vrai PostgREST.
 *
 *   node scripts/passerelle-rest.mjs <port> <url-postgrest> <jeton>
 */

import { createServer } from "node:http";

const PORT = Number(process.argv[2] ?? 54323);
const AMONT = process.argv[3] ?? "http://127.0.0.1:54322";
const JETON = process.argv[4] ?? "";

createServer(async (req, res) => {
  const chemin = req.url.replace(/^\/rest\/v1/, "");

  let corps = "";
  for await (const c of req) corps += c;

  const entetes = { "Content-Type": "application/json" };
  // Prefer et Range comptent pour PostgREST : on les laisse passer.
  for (const n of ["prefer", "range", "accept"]) {
    if (req.headers[n]) entetes[n] = req.headers[n];
  }
  if (JETON) entetes.Authorization = `Bearer ${JETON}`;

  try {
    const r = await fetch(AMONT + chemin, {
      method: req.method,
      headers: entetes,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : corps,
    });
    const texte = await r.text();
    res.writeHead(r.status, {
      "Content-Type": r.headers.get("content-type") ?? "application/json",
    });
    res.end(texte);
  } catch (e) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: `passerelle : ${e instanceof Error ? e.message : e}` }));
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`passerelle sur 127.0.0.1:${PORT} → ${AMONT}`);
});
