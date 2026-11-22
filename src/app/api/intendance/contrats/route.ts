import { CrmError, db, dec, montant, oneOf, text } from "@/lib/crm";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASES = ["forfait", "horaire", "abonnement"] as const;
const PERIODES = ["mois", "trimestre"] as const;
const UUID = /^[0-9a-f-]{36}$/i;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("client");
  return guarded(async () => {
    const filtre = clientId && UUID.test(clientId) ? `&client_id=eq.${encodeURIComponent(clientId)}` : "";
    return { contrats: await db(`contrats?select=*${filtre}&order=debut.desc`) };
  }, "voir_tarifs");
}

/**
 * Le contrat qui fixe le prix.
 *
 * La base refuse les mélanges — un forfait qui porterait un taux horaire
 * serait une ambiguïté sur le prix — et refuse un second contrat en cours sur
 * le même bien. On n'en revérifie donc rien ici : une règle vérifiée à deux
 * endroits finit par diverger.
 */
export async function POST(req: Request) {
  const b = await body(req);
  return guarded(async () => {
    const base = oneOf(b.base, BASES);
    const libelle = text(b.libelle, 160);
    const debut = typeof b.debut === "string" && JOUR.test(b.debut) ? b.debut : null;
    if (!base) return { error: "Choisissez une base de prix : forfait, horaire ou abonnement." };
    if (!libelle) return { error: "Donnez un intitulé au contrat." };
    if (!debut) return { error: "Indiquez la date de début." };
    if (typeof b.client_id !== "string" || !UUID.test(b.client_id)) return { error: "Client invalide." };
    if (typeof b.bien_id !== "string" || !UUID.test(b.bien_id)) return { error: "Bien invalide." };

    const [contrat] = await db<{ id: string }[]>("contrats", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        client_id: b.client_id,
        bien_id: b.bien_id,
        base,
        libelle,
        debut,
        fin: typeof b.fin === "string" && JOUR.test(b.fin) ? b.fin : null,
        forfait_ht: base === "forfait" ? montant(b.forfait_ht, 0, 100000) : null,
        taux_horaire_ht: base === "horaire" ? montant(b.taux_horaire_ht, 0, 1000) : null,
        heures_convenues: base === "horaire" ? dec(b.heures_convenues, 0.25, 24) : null,
        abonnement_ht: base === "abonnement" ? montant(b.abonnement_ht, 0, 100000) : null,
        abonnement_periode: base === "abonnement" ? (oneOf(b.abonnement_periode, PERIODES) ?? "mois") : null,
        tva: dec(b.tva, 0, 1) ?? 0,
      }),
    }).catch((e) => {
      const d = e instanceof CrmError ? (e.detail ?? "") : "";
      if (d.includes("contrat_actif_unique")) throw new CrmError("Ce bien a déjà un contrat en cours.", 409, d);
      if (d.includes("contrat_coherent")) throw new CrmError("Les champs ne correspondent pas à la base choisie.", 422, d);
      throw e;
    });
    return { contratId: contrat.id };
  }, "voir_tarifs");
}
