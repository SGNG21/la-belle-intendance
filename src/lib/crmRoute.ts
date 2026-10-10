import { NextResponse } from "next/server";
import { CrmError, authorized, crmEnabled } from "./crm";

/**
 * Enveloppe commune aux routes du back-office.
 *
 * Une seule barrière, vérifiée côté serveur à chaque appel : la session. Sans
 * elle, rien ne sort de la base — le cookie du navigateur ne suffit pas, il
 * est comparé à l'empreinte du code à chaque requête.
 */
export async function guarded<T>(run: () => Promise<T>): Promise<NextResponse> {
  if (!(await authorized())) return NextResponse.json({ ok: false, error: "Session fermée." }, { status: 401 });
  if (!crmEnabled()) return NextResponse.json({ ok: false, error: "Base non configurée sur le serveur." }, { status: 503 });
  try {
    return NextResponse.json({ ok: true, ...(await run()) });
  } catch (e) {
    if (e instanceof CrmError) {
      console.error("[crm]", e.message);
      return NextResponse.json({ ok: false, error: e.status === 409 ? "Cette fiche existe déjà." : "La base n'a pas répondu." }, { status: e.status });
    }
    console.error("[crm] erreur inattendue :", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Erreur inattendue." }, { status: 500 });
  }
}

/** Corps JSON, ou objet vide si la requête n'en porte pas. */
export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const v = await req.json();
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
