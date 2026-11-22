import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, codeIsValid, cookieOptions, roleDuJeton, sessionToken } from "@/lib/intendance";
import { droitsDe } from "@/lib/roles";
import { appelant } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const expected = () => process.env.INTENDANCE_CODE;

/**
 * Les codes reconnus, du plus fort au plus faible.
 *
 * Le rôle n'est pas choisi par l'appelant : il découle du code saisi. On ne
 * peut donc pas se promouvoir en modifiant sa requête.
 */
const codes = () =>
  [process.env.INTENDANCE_CODE, process.env.INTENDANCE_CODE_INTERVENANT].filter(
    (c): c is string => Boolean(c),
  );

/**
 * La session est-elle encore ouverte, et avec quels droits ?
 *
 * L'écran a besoin de savoir ce qu'il peut proposer : afficher un bouton
 * « Facturer » à qui sera refusé est une promesse qu'on ne tient pas. Les
 * droits rendus ici ne sont qu'un confort d'affichage — chaque route les
 * revérifie, parce qu'une réponse d'API se falsifie et pas une vérification
 * faite côté serveur.
 */
export async function GET() {
  const code = expected();
  if (!code) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const jar = await cookies();
  // Un compte individuel l'emporte sur un code partagé : c'est lui qui porte
  // un nom, et les écrans doivent refléter ses droits à lui.
  const qui = await appelant();
  if (qui) {
    return NextResponse.json({
      ok: true,
      configured: true,
      role: qui.role,
      nom: qui.nom,
      nominatif: qui.personne_id !== null,
      droits: droitsDe(qui.role),
    });
  }
  const role = roleDuJeton(jar.get(SESSION_COOKIE)?.value, {
    proprietaire: process.env.INTENDANCE_CODE,
    intervenant: process.env.INTENDANCE_CODE_INTERVENANT,
  });
  return NextResponse.json({
    ok: role !== null,
    configured: true,
    role,
    nom: null,
    nominatif: false,
    droits: role ? droitsDe(role) : [],
  });
}

/** Ouverture de session. Un code faux attend une seconde avant de répondre. */
export async function POST(req: Request) {
  const code = expected();
  if (!code) return NextResponse.json({ ok: false, error: "Accès non configuré." }, { status: 503 });

  let given = "";
  try {
    given = String(((await req.json()) as { code?: unknown }).code ?? "").slice(0, 200);
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  // On compare à tous les codes connus, sans court-circuit : le temps de
  // réponse ne doit pas révéler lequel a été reconnu.
  const reconnu = codes().reduce<string | null>((acc, c) => (codeIsValid(given, c) ? c : acc), null);

  if (!reconnu) {
    // Un délai fixe décourage l'essai automatisé sans gêner un humain.
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(reconnu), cookieOptions);
  return res;
}

/** Fermeture de session. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
