import { CrmError, db } from "@/lib/crm";
import { guarded } from "@/lib/crmRoute";
import type { Intervention } from "@/lib/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

interface Bien {
  id: string;
  libelle: string;
  commune: string | null;
  adresse: string | null;
  km: number | null;
  acces: string | null;
  particularites: string | null;
}

/**
 * Un passage, avec ce qu'il faut pour le relever : le bien, le client, la
 * checklist et la version.
 *
 * Les consignes d'entrée sont écartées de la réponse. L'écran les demande à
 * la route qui trace la consultation — les joindre ici reviendrait à les
 * transmettre à chaque ouverture, sans que personne l'ait demandé et sans
 * qu'on sache qui les a lues.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return guarded(async () => {
    if (!UUID.test(id)) throw new CrmError("Passage introuvable.", 404);

    const rows = await db<Intervention[]>(`interventions?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (!rows.length) throw new CrmError("Passage introuvable.", 404);
    const intervention = rows[0];

    const [biens, clients] = await Promise.all([
      db<Bien[]>(
        `biens?id=eq.${encodeURIComponent(intervention.bien_id)}` +
          `&select=id,libelle,commune,adresse,km,acces,particularites&limit=1`,
      ),
      db<{ id: string; nom: string; email: string | null }[]>(
        `clients?id=eq.${encodeURIComponent(intervention.client_id)}&select=id,nom,email&limit=1`,
      ),
    ]);

    const b = biens[0];
    const bien = b
      ? {
          id: b.id,
          libelle: b.libelle,
          commune: b.commune,
          adresse: b.adresse,
          km: b.km,
          a_des_consignes: Boolean(b.acces || b.particularites),
        }
      : null;

    return { intervention, bien, client: clients[0] ?? null };
  }, "relever_passage");
}
