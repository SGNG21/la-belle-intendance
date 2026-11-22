import { db } from "@/lib/crm";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Qui peut être affecté à un passage. Sert aux filtres de l'agenda. */
export async function GET() {
  return guarded(
    async () => ({ intervenants: await db("intervenants?select=id,nom,couleur&actif=is.true&order=nom") }),
    "voir_agenda",
  );
}
