import { CrmError, type Bien, db } from "@/lib/crm";
import { guarded } from "@/lib/crmRoute";
import { tracerAcces } from "@/lib/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Les consignes d'entrée d'un logement : code du portail, emplacement des
 * clés, alarme.
 *
 * Elles ont leur propre route, séparée de la fiche du bien, pour trois
 * raisons. On peut les refuser à un profil sans refuser la fiche entière.
 * Elles ne traînent pas dans toutes les réponses où le bien apparaît. Et
 * chaque consultation laisse une trace, ce qui n'aurait aucun sens si elles
 * partaient avec chaque lecture de fiche.
 *
 * Qui lit cette réponse peut entrer chez quelqu'un : elle n'est jamais mise
 * en cache, jamais journalisée, jamais reprise dans un document sortant.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    if (!UUID.test(id)) throw new CrmError("Bien introuvable.", 404);
    const rows = await db<Pick<Bien, "id" | "acces" | "particularites">[]>(
      `biens?id=eq.${encodeURIComponent(id)}&select=id,acces,particularites&limit=1`,
    );
    if (!rows.length) throw new CrmError("Bien introuvable.", 404);

    // La trace ne doit pas empêcher d'entrer dans la maison : si elle échoue,
    // on le note et on sert quand même.
    await tracerAcces(id, "session").catch((e) =>
      console.error("[acces] trace non enregistrée :", e instanceof Error ? e.message : e),
    );

    return { acces: rows[0].acces, particularites: rows[0].particularites };
  });
}
