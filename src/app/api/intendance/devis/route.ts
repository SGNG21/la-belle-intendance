import { montant, oneOf, text } from "@/lib/crm";
import { creerDevis, lireReglages, listerDevis } from "@/lib/devisDb";
import { UNITES, echeance, validerDevis, type Ligne } from "@/lib/devisModel";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const client = new URL(req.url).searchParams.get("client") ?? undefined;
  return guarded(async () => ({ devis: await listerDevis(client ?? undefined) }));
}

/** Les lignes acceptées : libellé, quantité, unité connue, prix unitaire. */
function lignes(v: unknown): Ligne[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 30)
    .map((raw) => {
      const l = raw as Record<string, unknown>;
      return {
        libelle: text(l.libelle, 160) ?? "",
        quantite: montant(l.quantite, 0.01, 10000) ?? 0,
        unite: oneOf(l.unite, UNITES) ?? "forfait",
        pu: montant(l.pu, 0, 100000) ?? 0,
      };
    })
    .filter((l) => l.libelle && l.quantite > 0);
}

export async function POST(req: Request) {
  const b = await body(req);
  return guarded(async () => {
    const { validite_jours } = await lireReglages();
    const brouillon = {
      client_id: text(b.client_id, 40),
      bien_id: text(b.bien_id, 40),
      demande_id: text(b.demande_id, 40),
      client_nom: text(b.client_nom, 120) ?? "",
      client_email: text(b.client_email, 160) ?? "",
      bien_libelle: text(b.bien_libelle, 160),
      prestation: text(b.prestation, 200) ?? "",
      lignes: lignes(b.lignes),
      mode: oneOf(b.mode, ["prestation", "cesu"] as const),
      valide_jusqu_au: text(b.valide_jusqu_au, 10) ?? echeance(validite_jours),
      notes: text(b.notes, 2000),
    };

    const erreurs = validerDevis(brouillon);
    if (Object.keys(erreurs).length) return { erreurs, error: "Vérifiez les champs signalés." };

    return { devis: await creerDevis(brouillon) };
  });
}
