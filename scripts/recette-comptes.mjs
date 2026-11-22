/**
 * Recette des comptes individuels et du cloisonnement.
 *
 * Les recettes précédentes vérifiaient qu'un inconnu est refusé. Celle-ci
 * vérifie ce qui compte vraiment une fois qu'il y a plusieurs comptes :
 * **qu'une personne authentifiée ne peut pas faire ce qui ne la regarde
 * pas**, et que ce qu'elle fait porte son nom.
 *
 *   node scripts/recette-comptes.mjs http://127.0.0.1:3100
 */

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";

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
const titre = (t) => console.log(`\n${t}`);

/** Ouvre une session par lien, et rend une fonction d'appel qui la porte. */
async function connecter(email) {
  const d = await (
    await fetch(`${BASE}/api/intendance/connexion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
  ).json();
  if (!d.lien) return null;

  const jeton = new URL(d.lien).searchParams.get("jeton");
  const r = await fetch(`${BASE}/api/intendance/connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jeton }),
  });
  const ouverte = await r.json();
  if (!ouverte.ok) return null;

  const cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const api = async (chemin, options = {}) => {
    const rep = await fetch(`${BASE}/api${chemin}`, {
      ...options,
      headers: { "Content-Type": "application/json", Cookie: cookie, ...(options.headers ?? {}) },
    });
    return { statut: rep.status, corps: await rep.json().catch(() => null) };
  };
  return { personne: ouverte.personne, api, cookie, jeton };
}

/* ------------------------------------------------- 1. la connexion ------ */

titre("1 — Connexion par lien");

const coralie = await connecter("coralie@exemple.fr");
verifier("la responsable se connecte", coralie?.personne?.role === "proprietaire", coralie?.personne);

const nadia = await connecter("nadia@exemple.fr");
verifier("l'intervenante se connecte", nadia?.personne?.role === "intervenant", nadia?.personne);

{
  const inconnue = await connecter("personne@nulle-part.fr");
  verifier("une adresse inconnue n'ouvre rien", inconnue === null);

  // La réponse doit être la même qu'elle existe ou non.
  const a = await (
    await fetch(`${BASE}/api/intendance/connexion`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "personne@nulle-part.fr" }),
    })
  ).json();
  verifier("et la réponse ne dit pas si l'adresse existe", a.ok === true && a.message?.startsWith("Si cette adresse"), a);
}

{
  // Rejouer le même lien : il ne sert qu'une fois.
  const d = await (
    await fetch(`${BASE}/api/intendance/connexion`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nadia@exemple.fr" }),
    })
  ).json();
  const jeton = new URL(d.lien).searchParams.get("jeton");
  const un = await fetch(`${BASE}/api/intendance/connexion`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jeton }),
  });
  const deux = await fetch(`${BASE}/api/intendance/connexion`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jeton }),
  });
  verifier("un lien s'utilise une fois", un.status === 200 && deux.status === 401, { un: un.status, deux: deux.status });
}

/* ------------------------------ 2. cloisonnement entre utilisateurs ----- */

titre("2 — Cloisonnement entre deux personnes connectées");

const CLIENT = "20000000-0000-0000-0000-000000000001";
const BIEN = "30000000-0000-0000-0000-000000000001";

{
  const a = await nadia.api("/intendance/agenda?debut=2026-11-01&fin=2026-11-30");
  verifier("l'intervenante voit l'agenda", a.statut === 200, a.statut);

  const b = await nadia.api("/intendance/contrats");
  verifier("elle ne voit pas les contrats (403)", b.statut === 403, b.statut);

  const c = await nadia.api(`/intendance/clients/${CLIENT}/dossier`);
  verifier("elle voit le dossier client", c.statut === 200, c.statut);
  // Le dossier est servi, mais l'écran masque l'argent selon les droits.
  // On vérifie ici le droit lui-même, qui est ce qui protège réellement.
  const droits = (await nadia.api("/intendance/session")).corps?.droits ?? [];
  verifier("et elle n'a pas le droit de voir les tarifs", !droits.includes("voir_tarifs"), droits);
  verifier("ni celui de facturer", !droits.includes("facturer"), droits);

  const d = await nadia.api("/intendance/personnes");
  verifier("elle ne voit pas la liste des comptes (403)", d.statut === 403, d.statut);

  const e = await nadia.api("/intendance/personnes/10000000-0000-0000-0000-000000000001", { method: "DELETE" });
  verifier("elle ne peut pas désactiver la responsable (403)", e.statut === 403, e.statut);

  const f = await coralie.api("/intendance/personnes");
  verifier("la responsable voit les comptes", f.statut === 200, f.statut);
  verifier("et ils sont tous là", (f.corps?.personnes ?? []).length >= 3, f.corps?.personnes?.length);
}

/* ----------------------------- 3. consignes : attribuables ou refusées -- */

titre("3 — Consignes d'accès : nommées, ou refusées");

{
  const a = await nadia.api(`/intendance/biens/${BIEN}/acces`, { method: "POST" });
  verifier("une personne nommée obtient les consignes", a.statut === 200 && typeof a.corps?.acces === "string", a.statut);

  // Le code partagé, lui, n'identifie personne.
  const r = await fetch(`${BASE}/api/intendance/session`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "recette-intervenant" }),
  });
  const cookieCode = (r.headers.getSetCookie?.() ?? [])[0]?.split(";")[0] ?? "";
  const b = await fetch(`${BASE}/api/intendance/biens/${BIEN}/acces`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookieCode },
  });
  verifier("un code partagé est refusé pour les consignes (403)", b.status === 403, b.status);

  // Et la trace porte un nom.
  const t = await coralie.api(`/intendance/biens/${BIEN}/consultations`);
  verifier("la responsable lit le journal des consultations", t.statut === 200, t.statut);
  const nommees = (t.corps?.consultations ?? []).filter((c) => c.attribuee);
  verifier("la consultation est attribuée à une personne", nommees.length >= 1, t.corps?.consultations);
  verifier("et elle porte son nom", nommees.some((c) => c.nom === "Nadia"), nommees);

  const u = await nadia.api(`/intendance/biens/${BIEN}/consultations`);
  verifier("une intervenante ne lit pas ce journal (403)", u.statut === 403, u.statut);
}

/* ------------------------------------- 4. révocation et désactivation --- */

titre("4 — Révocation");

{
  const sabine = await connecter("sabine@exemple.fr");
  verifier("Sabine se connecte", sabine?.personne?.nom === "Sabine", sabine?.personne);

  const avant = await sabine.api("/intendance/agenda?debut=2026-11-01&fin=2026-11-30");
  verifier("elle travaille normalement", avant.statut === 200, avant.statut);

  const off = await coralie.api(`/intendance/personnes/${sabine.personne.id}`, { method: "DELETE" });
  verifier("la responsable ferme son compte", off.statut === 200, off.corps ?? off.statut);

  // Sa session doit tomber immédiatement, sans attendre l'expiration.
  const apres = await sabine.api("/intendance/agenda?debut=2026-11-01&fin=2026-11-30");
  verifier("sa session tombe aussitôt (401)", apres.statut === 401, apres.statut);

  const relog = await connecter("sabine@exemple.fr");
  verifier("elle ne peut plus se reconnecter", relog === null);

  const soi = await coralie.api(`/intendance/personnes/${coralie.personne.id}`, { method: "DELETE" });
  verifier("on ne ferme pas son propre compte (409)", soi.statut === 409, soi.statut);
}

/* --------------------------------------------- 5. déconnexion --------- */

titre("5 — Déconnexion");

{
  const jeanne = await connecter("nadia@exemple.fr");
  const avant = await jeanne.api("/intendance/agenda?debut=2026-11-01&fin=2026-11-30");
  verifier("session active", avant.statut === 200, avant.statut);

  await fetch(`${BASE}/api/intendance/connexion`, { method: "DELETE", headers: { Cookie: jeanne.cookie } });
  const apres = await jeanne.api("/intendance/agenda?debut=2026-11-01&fin=2026-11-30");
  verifier("après déconnexion, la session est fermée (401)", apres.statut === 401, apres.statut);
}

console.log(`\n${reussis} vérifications passées · ${rates} échec(s)`);
process.exit(rates ? 1 : 0);
