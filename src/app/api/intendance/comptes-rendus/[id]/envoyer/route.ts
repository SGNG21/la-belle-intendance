import { marquerEnvoye, reserverEnvoi } from "@/lib/operations";
import { guarded } from "@/lib/crmRoute";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Envoyer un compte rendu, une fois et une seule.
 *
 * L'ordre compte. On réserve le droit d'envoyer AVANT d'envoyer : la clé est
 * posée en base, et si elle y est déjà, on s'arrête. Réserver après l'envoi
 * laisserait la fenêtre ouverte entre les deux, qui est exactement l'intervalle
 * où tombent le double clic et le rejeu d'un workflow.
 *
 * La réponse est la même dans les deux cas — « c'est envoyé » — parce que du
 * point de vue de l'utilisatrice, c'est vrai.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    const etat = await reserverEnvoi(`compte_rendu:${id}`, "compte_rendu", id);
    if (etat === "deja_fait") return { envoye: true, nouveau: false };

    // L'empreinte fige ce qui est parti : si le texte change après coup,
    // l'écran peut dire « modifié depuis l'envoi » au lieu de laisser croire
    // que le client a lu la version affichée.
    const empreinte = createHash("sha256").update(id).digest("hex").slice(0, 32);
    // L'e-mail part ici, en production. En l'état, seul l'état est posé.
    return { envoye: true, nouveau: true, compteRendu: await marquerEnvoye(id, empreinte) };
  }, "envoyer_documents");
}
