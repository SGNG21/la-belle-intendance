import { CrmError, db, getClient, oneOf, text } from "@/lib/crm";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** La fiche complète : le client, ses biens, les demandes qui lui sont rattachées. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    const fiche = await getClient(id);
    if (!fiche) throw new CrmError("Fiche introuvable.", 404);
    return fiche;
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(async () => {
    const patch: Record<string, unknown> = {};
    const nom = text(b.nom, 120);
    if (nom) patch.nom = nom;
    for (const [k, max] of [["email", 160], ["telephone", 30], ["commune", 80], ["adresse", 300], ["notes", 4000]] as const) {
      if (k in b) patch[k] = text(b[k], max);
    }
    const type = oneOf(b.type, ["particulier", "professionnel"] as const);
    if (type) patch.type = type;
    if ("mode" in b) patch.mode = oneOf(b.mode, ["prestation", "cesu"] as const);
    if (typeof b.actif === "boolean") patch.actif = b.actif;
    if (!Object.keys(patch).length) return {};
    await db<void>(`clients?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    return {};
  });
}
