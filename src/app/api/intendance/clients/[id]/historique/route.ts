import { historique } from "@/lib/operations";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Tout ce qui est arrivé à un client, dans l'ordre.
 *
 * C'est une vue sur les tables existantes, pas une table de plus : un
 * historique recopié serait un historique à tenir à jour, donc faux un jour.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    if (!UUID.test(id)) return { error: "Référence client invalide." };
    return { evenements: await historique(id) };
  }, "voir_clients");
}
