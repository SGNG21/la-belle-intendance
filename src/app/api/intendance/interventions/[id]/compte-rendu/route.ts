import { etablirCompteRendu } from "@/lib/operations";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/;

/**
 * Établir le compte rendu d'un passage.
 *
 * Idempotente : rappelée sur le même passage, elle rend celui qui existe déjà
 * plutôt que d'échouer. Un rafraîchissement de page ne doit pas ressembler à
 * une erreur.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  const destinataires = Array.isArray(b.destinataires)
    ? b.destinataires.filter((d): d is string => typeof d === "string" && EMAIL.test(d)).slice(0, 5)
    : [];
  return guarded(async () => ({ compteRendu: await etablirCompteRendu(id, destinataires) }), "relever_passage");
}
