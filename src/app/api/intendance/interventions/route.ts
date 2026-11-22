import { aFacturer, poser } from "@/lib/operations";
import { body, guarded } from "@/lib/crmRoute";
import { dec, text } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const uuid = (v: unknown) => (typeof v === "string" && UUID.test(v) ? v : null);

/** Les passages qui attendent d'être facturés. */
export async function GET() {
  return guarded(async () => ({ interventions: await aFacturer() }), "facturer");
}

/** Poser un passage ponctuel. La base refuse un doublon le même jour sur le même bien. */
export async function POST(req: Request) {
  const b = await body(req);
  return guarded(async () => {
    const client_id = uuid(b.client_id);
    const bien_id = uuid(b.bien_id);
    const jour = typeof b.jour === "string" && JOUR.test(b.jour) ? b.jour : null;
    if (!client_id || !bien_id) return { error: "Client ou bien invalide." };
    if (!jour) return { error: "Indiquez la date du passage." };
    return {
      intervention: await poser({
        client_id,
        bien_id,
        contrat_id: uuid(b.contrat_id),
        jour,
        debut: typeof b.debut === "string" && HEURE.test(b.debut) ? b.debut : null,
        duree: dec(b.duree, 0.25, 24),
        intervenant_id: uuid(b.intervenant_id),
      }),
    };
  }, "relever_passage");
}

export const _unused = text;
