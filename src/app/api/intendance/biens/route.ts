import { type Bien, db, dec, int, prestations, text } from "@/lib/crm";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Nouveau bien rattaché à un client. */
export async function POST(req: Request) {
  const b = await body(req);
  return guarded(async () => {
    const clientId = text(b.clientId, 40);
    const libelle = text(b.libelle, 120);
    if (!clientId || !libelle) return { error: "Un bien a besoin d'un client et d'un libellé." };
    const [bien] = await db<Bien[]>("biens", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        client_id: clientId,
        libelle,
        adresse: text(b.adresse, 300),
        commune: text(b.commune, 80),
        surface: int(b.surface, 5, 5000),
        chambres: int(b.chambres, 0, 40),
        salles_de_bains: int(b.salles_de_bains, 0, 20),
        acces: text(b.acces, 2000),
        particularites: text(b.particularites, 2000),
        notes: text(b.notes, 4000),
        prestations: prestations(b.prestations),
        frequence: text(b.frequence, 60),
        duree_h: dec(b.duree_h, 0.5, 24),
      }),
    });
    return { bienId: bien.id };
  });
}
