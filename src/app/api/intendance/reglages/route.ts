import { int, montant, text } from "@/lib/crm";
import { ecrireReglages, lireReglages } from "@/lib/devisDb";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return guarded(async () => ({ reglages: await lireReglages() }));
}

/** Le taux horaire et le forfait déplacement, saisis par l'entreprise. */
export async function PATCH(req: Request) {
  const b = await body(req);
  return guarded(async () => {
    const patch: Record<string, unknown> = {};
    if ("taux_horaire" in b) patch.taux_horaire = montant(b.taux_horaire, 1, 500);
    if ("deplacement" in b) patch.deplacement = montant(b.deplacement, 0, 500);
    if ("validite_jours" in b) patch.validite_jours = int(b.validite_jours, 1, 365) ?? 30;
    if ("mentions" in b) patch.mentions = text(b.mentions, 1000);
    return { reglages: await ecrireReglages(patch) };
  });
}
