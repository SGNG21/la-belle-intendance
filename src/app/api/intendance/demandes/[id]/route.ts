import { STATUTS, db, oneOf, text } from "@/lib/crm";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Suivi d'une demande : son statut et la note de rappel. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(async () => {
    const patch: Record<string, unknown> = {};
    const statut = oneOf(b.statut, STATUTS);
    if (statut) patch.statut = statut;
    if ("suivi" in b) patch.suivi = text(b.suivi, 2000);
    if (!Object.keys(patch).length) return {};
    await db<void>(`demandes?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    return {};
  });
}
