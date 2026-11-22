import { annuler } from "@/lib/operations";
import { body, guarded } from "@/lib/crmRoute";
import { int, text } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Annuler un passage. Celui qui est réalisé ne s'annule pas : il se corrige par un avoir. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(
    async () => ({ intervention: await annuler(id, text(b.motif, 300), int(b.version, 1, 1_000_000)) }),
    "relever_passage",
  );
}
