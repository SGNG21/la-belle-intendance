import { enregistrerPaiement } from "@/lib/operations";
import { body, guarded } from "@/lib/crmRoute";
import { montant, oneOf } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOYENS = ["virement", "cheque", "especes", "cesu"] as const;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Enregistrer un règlement. La facture passe à « payée » une fois le solde atteint. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(async () => {
    const m = montant(b.montant, 0.01, 100000);
    const moyen = oneOf(b.moyen, MOYENS);
    const date = typeof b.date === "string" && JOUR.test(b.date) ? b.date : null;
    if (!m) return { error: "Indiquez un montant." };
    if (!moyen) return { error: "Indiquez le moyen de paiement." };
    if (!date) return { error: "Indiquez la date du règlement." };
    return { facture: await enregistrerPaiement(id, date, m, moyen) };
  });
}
