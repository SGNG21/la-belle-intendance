import { CrmError, db } from "@/lib/crm";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Désactiver un compte.
 *
 * La base ferme aussi toutes ses sessions : sans cela, la personne partie
 * garderait un accès valable trente jours. On ne supprime pas la ligne —
 * elle porte les affectations de passages passés, qui ne doivent pas
 * disparaître de l'historique.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async (qui) => {
    if (!UUID.test(id)) throw new CrmError("Personne introuvable.", 404);
    // Se désactiver soi-même enfermerait dehors la seule responsable.
    if (qui.personne_id === id) throw new CrmError("On ne ferme pas son propre compte.", 409);

    const r = await db<{ nom: string }[]>("rpc/desactiver_personne", {
      method: "POST",
      body: JSON.stringify({ p_personne_id: id }),
    });
    const p = Array.isArray(r) ? r[0] : (r as { nom: string });
    return { desactive: p?.nom ?? null };
  }, "gerer_comptes");
}
