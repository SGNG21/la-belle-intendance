import { listDemandes } from "@/lib/crm";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Les demandes reçues par le site, la plus récente d'abord. */
export async function GET() {
  return guarded(async () => ({ demandes: await listDemandes() }));
}
