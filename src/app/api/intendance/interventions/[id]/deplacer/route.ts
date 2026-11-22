import { deplacer } from "@/lib/operations";
import { body, guarded } from "@/lib/crmRoute";
import { int, text } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Déplacer un passage. Un passage réalisé est refusé par la base. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(async () => {
    const jour = typeof b.jour === "string" && JOUR.test(b.jour) ? b.jour : null;
    if (!jour) return { error: "Indiquez la nouvelle date." };
    return {
      intervention: await deplacer(
        id,
        jour,
        typeof b.debut === "string" && HEURE.test(b.debut) ? b.debut : null,
        text(b.motif, 300),
        int(b.version, 1, 1_000_000),
      ),
    };
  }, "relever_passage");
}
