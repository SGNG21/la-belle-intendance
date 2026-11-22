import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSION, demanderLien, fermerSession, optionsCookie, ouvrirSession, personneCourante } from "@/lib/comptes";
import { body } from "@/lib/crmRoute";
import { crmEnabled } from "@/lib/crm";
import { droitsDe } from "@/lib/roles";
import { SITE } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/;

/** Qui est connecté, et ce qu'il peut faire. */
export async function GET() {
  if (!crmEnabled()) return NextResponse.json({ ok: false, configure: false }, { status: 503 });
  const p = await personneCourante();
  return NextResponse.json({
    ok: p !== null,
    configure: true,
    personne: p ? { id: p.personne_id, nom: p.nom, role: p.role } : null,
    droits: p ? droitsDe(p.role) : [],
  });
}

/**
 * Demander un lien de connexion, ou l'échanger contre une session.
 *
 * Deux actions sur la même route parce qu'elles forment une seule
 * conversation : « voici mon adresse », puis « voici le lien reçu ».
 */
export async function POST(req: Request) {
  if (!crmEnabled()) return NextResponse.json({ ok: false, error: "Base non configurée." }, { status: 503 });
  const b = await body(req);

  /* ---- étape 2 : le lien revient, on ouvre la session ---- */
  if (typeof b.jeton === "string" && b.jeton.length > 20) {
    try {
      const { personne, jeton } = await ouvrirSession(b.jeton);
      const res = NextResponse.json({ ok: true, personne });
      res.cookies.set(COOKIE_SESSION, jeton, optionsCookie);
      return res;
    } catch (e) {
      console.warn("[connexion] lien refusé :", e instanceof Error ? e.message : e);
      return NextResponse.json({ ok: false, error: "Lien invalide ou déjà utilisé." }, { status: 401 });
    }
  }

  /* ---- étape 1 : l'adresse, on prépare le lien ---- */
  const email = typeof b.email === "string" ? b.email.trim().slice(0, 160) : "";
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: "Adresse invalide." }, { status: 422 });

  const lien = await demanderLien(email, SITE.url, req.headers.get("user-agent")?.slice(0, 200) ?? null);

  // La réponse est la même, adresse connue ou non : dire « cette adresse
  // n'existe pas » apprendrait à un inconnu quelles adresses existent.
  const reponse: Record<string, unknown> = {
    ok: true,
    message: "Si cette adresse a un compte, un lien vient de partir.",
  };

  if (lien) {
    // En recette, le lien est rendu dans la réponse : aucun courriel ne part.
    // En production il est envoyé, et ne transite jamais par ici.
    if (process.env.INTENDANCE_LIENS_EN_CLAIR === "oui") reponse.lien = lien.url;
    else console.info("[connexion] lien préparé, envoi à brancher");
  }
  return NextResponse.json(reponse);
}

/** Se déconnecter. */
export async function DELETE() {
  const jar = await cookies();
  const jeton = jar.get(COOKIE_SESSION)?.value;
  if (jeton) await fermerSession(jeton).catch(() => undefined);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESSION, "", { ...optionsCookie, maxAge: 0 });
  return res;
}
