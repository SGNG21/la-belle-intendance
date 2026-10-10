import { CONTACT } from "@/config/site";
import { CrmError } from "@/lib/crm";
import { lireDevis, majDevis } from "@/lib/devisDb";
import { devisHtml, devisSubject, devisText } from "@/lib/devisEmail";
import { envoiPret, envoyer } from "@/lib/mail";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Envoie le devis au client, avec copie à l'entreprise.
 *
 * Le statut ne passe à « envoyé » qu'après l'acceptation de Resend : un devis
 * marqué envoyé alors qu'il ne l'est pas serait pire que pas de suivi du tout.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    if (!envoiPret()) throw new CrmError("L'envoi d'e-mail n'est pas configuré.", 503);

    const devis = await lireDevis(id);
    try {
      await envoyer({
        to: [devis.client_email, ...(CONTACT.email ? [CONTACT.email] : [])],
        subject: devisSubject(devis),
        text: devisText(devis),
        html: devisHtml(devis),
      });
    } catch (e) {
      console.error("[devis] envoi refusé :", e instanceof Error ? e.message : e);
      throw new CrmError("Le devis n'a pas pu être envoyé. Réessayez.", 502);
    }

    const envoye_le = new Date().toISOString();
    await majDevis(id, { statut: "envoye", envoye_le });
    return { devis: { ...devis, statut: "envoye" as const, envoye_le } };
  });
}
