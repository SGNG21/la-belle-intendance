import { emettreFacture } from "@/lib/operations";
import { body, guarded } from "@/lib/crmRoute";
import { int } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Émettre la facture : lui attribuer son numéro.
 *
 * Le numéro est pris sous verrou, donc la série reste unique et sans trou même
 * si deux émissions partent en même temps. Une fois émise, la facture ne se
 * modifie plus — une correction passe par un avoir.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(async () => ({ facture: await emettreFacture(id, int(b.echeance_jours, 0, 180) ?? 30) }));
}
