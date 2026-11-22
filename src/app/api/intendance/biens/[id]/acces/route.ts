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
  return guarded(async (qui) => {
    if (!UUID.test(id)) throw new CrmError("Bien introuvable.", 404);

    // Une consigne d'entrée ne se sert qu'à quelqu'un de nommé. Un code
    // partagé n'identifie personne : la demande est refusée plutôt que
    // tracée sous « session », qui ne trace rien.
    if (!qui.personne_id) {
      throw new CrmError(
        "Ces consignes exigent un compte nominatif. Connectez-vous avec votre adresse.",
        403,
      );
    }
    const rows = await db<Pick<Bien, "id" | "acces" | "particularites">[]>(
      `biens?id=eq.${encodeURIComponent(id)}&select=id,acces,particularites&limit=1`,
    );
    if (!rows.length) throw new CrmError("Bien introuvable.", 404);

    // La trace est posée AVANT de servir la consigne : si elle échoue, on ne
    // sert rien. Servir un secret sans savoir à qui est précisément ce qu'il
    // faut éviter — et c'est l'inverse de ce que faisait la version
    // précédente, qui notait l'échec et servait quand même.
    await tracerAcces(id, qui.personne_id);

    return { acces: rows[0].acces, particularites: rows[0].particularites };
  }, "voir_consignes");
}
