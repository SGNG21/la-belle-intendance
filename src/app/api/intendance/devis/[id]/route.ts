import { oneOf } from "@/lib/crm";
import { lireDevis, majDevis } from "@/lib/devisDb";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => ({ devis: await lireDevis(id) }));
}

/** Suivi d'un devis : accepté, refusé, expiré. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(async () => {
    const statut = oneOf(b.statut, ["brouillon", "envoye", "accepte", "refuse", "expire"] as const);
    if (statut) await majDevis(id, { statut });
    return {};
  });
}
