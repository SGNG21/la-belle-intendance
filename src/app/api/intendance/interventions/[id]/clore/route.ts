import { clore } from "@/lib/operations";
import { body, guarded } from "@/lib/crmRoute";
import { int, text } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const heure = (v: unknown): string | null => (typeof v === "string" && HEURE.test(v) ? v : null);

/**
 * Clore un passage.
 *
 * La base refuse de clore deux fois : l'opération ne retient que les passages
 * encore planifiés ou en cours. Un second appel échoue au lieu d'écraser les
 * horaires du premier.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(async () => ({
    intervention: await clore(id, {
      debut: heure(b.debut),
      fin: heure(b.fin),
      // La checklist arrive telle que le téléphone l'a tenue ; la base la stocke en l'état.
      checklist: Array.isArray(b.checklist) ? b.checklist.slice(0, 200) : null,
      observations: text(b.observations, 4000),
      km: int(b.km, 0, 2000),
    }),
  }));
}
