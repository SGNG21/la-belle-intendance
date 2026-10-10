import { CrmError, type Bien, type Client, db, dec, int, prestations, text } from "@/lib/crm";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Un bien et le client auquel il appartient. Sert à préremplir le compte rendu. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    const rows = await db<(Bien & { clients: Pick<Client, "id" | "nom" | "email"> | null })[]>(
      `biens?id=eq.${encodeURIComponent(id)}&select=*,clients(id,nom,email)&limit=1`,
    );
    if (!rows.length) throw new CrmError("Bien introuvable.", 404);
    const { clients, ...bien } = rows[0];
    return { bien, client: clients };
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body(req);
  return guarded(async () => {
    const patch: Record<string, unknown> = {};
    const libelle = text(b.libelle, 120);
    if (libelle) patch.libelle = libelle;
    for (const [k, max] of [["adresse", 300], ["commune", 80], ["acces", 2000], ["particularites", 2000], ["notes", 4000], ["frequence", 60]] as const) {
      if (k in b) patch[k] = text(b[k], max);
    }
    if ("surface" in b) patch.surface = int(b.surface, 5, 5000);
    if ("chambres" in b) patch.chambres = int(b.chambres, 0, 40);
    if ("salles_de_bains" in b) patch.salles_de_bains = int(b.salles_de_bains, 0, 20);
    if ("duree_h" in b) patch.duree_h = dec(b.duree_h, 0.5, 24);
    if ("prestations" in b) patch.prestations = prestations(b.prestations);
    if (!Object.keys(patch).length) return {};
    await db<void>(`biens?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    return {};
  });
}

/** Suppression d'un bien. Les comptes rendus déjà envoyés restent, détachés. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    await db<void>(`biens?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return {};
  });
}
