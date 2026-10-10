import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, codeIsValid, cookieOptions, sessionToken, tokenIsValid } from "@/lib/intendance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const expected = () => process.env.INTENDANCE_CODE;

/** La session est-elle encore ouverte ? Interrogé à l'ouverture de la page. */
export async function GET() {
  const code = expected();
  if (!code) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const jar = await cookies();
  return NextResponse.json({ ok: tokenIsValid(jar.get(SESSION_COOKIE)?.value, code), configured: true });
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

  if (!codeIsValid(given, code)) {
    // Un délai fixe décourage l'essai automatisé sans gêner un humain.
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(code), cookieOptions);
  return res;
}

/** Fermeture de session. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
