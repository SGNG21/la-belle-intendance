import { NextResponse } from "next/server";
import { CrmError, crmEnabled, roleCourant } from "./crm";
import { peut, type Droit } from "./roles";

/**
 * Enveloppe commune aux routes du back-office.
 *
 * Deux barrières, et non une. La session dit **qui** appelle ; le droit dit
 * **ce qu'il peut faire**. Une intervenante connectée est une session valide
 * et n'a pourtant rien à faire sur une facture : sans la seconde barrière,
 * « connecté » voudrait dire « autorisé », ce qui n'est vrai que tant qu'une
 * seule personne se sert de l'outil.
 *
 * Le droit exigé est déclaré par la route elle-même, au plus près de ce
 * qu'elle fait.
 */
export async function guarded<T>(run: () => Promise<T>, droit?: Droit): Promise<NextResponse> {
  const role = await roleCourant();
  if (!role) return NextResponse.json({ ok: false, error: "Session fermée." }, { status: 401 });

  if (droit && !peut(role, droit)) {
    // 403 et non 401 : la session est valide, c'est le droit qui manque.
    // Le message ne dit pas ce qui existe derrière, seulement que c'est refusé.
    console.warn(`[crm] ${role} a tenté « ${droit} »`);
    return NextResponse.json({ ok: false, error: "Cette action ne vous est pas ouverte." }, { status: 403 });
  }

  if (!crmEnabled()) return NextResponse.json({ ok: false, error: "Base non configurée sur le serveur." }, { status: 503 });

  try {
    return NextResponse.json({ ok: true, ...(await run()) });
  } catch (e) {
    if (e instanceof CrmError) {
      console.error("[crm]", e.detail ?? e.message);
      // Un conflit de version porte de quoi proposer une résolution à l'écran.
      const corps: Record<string, unknown> = { ok: false, error: e.message };
      if (e.conflit) corps.conflit = e.conflit;
      return NextResponse.json(corps, { status: e.status });
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
