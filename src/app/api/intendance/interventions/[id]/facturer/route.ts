import { facturerIntervention } from "@/lib/operations";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Établir la facture d'un passage.
 *
 * Le montant vient du contrat et des suppléments approuvés ; le temps
 * réellement passé n'y entre pas. La base refuse si le passage n'est pas clos,
 * s'il n'a pas de compte rendu, ou s'il figure déjà sur une facture.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => ({ facture: await facturerIntervention(id) }), "facturer");
}
