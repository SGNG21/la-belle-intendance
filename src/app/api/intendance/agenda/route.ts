import { agenda } from "@/lib/operations";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOUR = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Les passages d'une période.
 *
 * Les occurrences récurrentes ne sont pas stockées : elles sont projetées
 * depuis les contrats au moment de la lecture. Changer un contrat change donc
 * l'agenda à venir sans qu'il faille corriger des lignes déjà écrites.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const debut = u.searchParams.get("debut") ?? "";
  const fin = u.searchParams.get("fin") ?? "";
  return guarded(async () => {
    if (!JOUR.test(debut) || !JOUR.test(fin)) return { error: "Indiquez une période (debut et fin, au format AAAA-MM-JJ)." };
    if (debut > fin) return { error: "La période est à l'envers." };
    return { cases: await agenda(debut, fin) };
  }, "voir_agenda");
}
