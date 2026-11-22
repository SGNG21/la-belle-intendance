import { CrmError, db } from "@/lib/crm";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Qui a consulté les consignes d'entrée de ce logement, et quand.
 *
 * C'est la contrepartie de la route qui les sert : une trace qu'on ne peut
 * pas lire ne sert à rien. Réservée à la responsable — savoir qui est entré
 * chez qui n'est pas une information d'équipe.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    if (!UUID.test(id)) throw new CrmError("Bien introuvable.", 404);
    const lignes = await db<{ le: string; par: string; personne_id: string | null }[]>(
      `acces_revelations?bien_id=eq.${encodeURIComponent(id)}&select=le,par,personne_id&order=le.desc&limit=100`,
    );
    return {
      consultations: lignes.map((l) => ({
        le: l.le,
        nom: l.par,
        // Une consultation d'avant les comptes individuels ne nomme personne :
        // on le dit plutôt que de laisser croire qu'elle est attribuée.
        attribuee: l.personne_id !== null,
      })),
    };
  }, "gerer_comptes");
}
