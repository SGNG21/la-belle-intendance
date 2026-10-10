import { HOUSING_LABEL, type HousingType } from "@/lib/lead";
import { CrmError, type Bien, type Client, type Demande, db } from "@/lib/crm";
import { guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Transforme une demande en fiche client.
 *
 * Tout ce que le visiteur a déjà saisi est repris : ses coordonnées d'un côté,
 * les caractéristiques du logement de l'autre. Rien n'est inventé — ce qui
 * manque reste vide, à compléter au téléphone.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(async () => {
    const rows = await db<Demande[]>(`demandes?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const d = rows[0];
    if (!d) throw new CrmError("Demande introuvable.", 404);
    if (d.client_id) return { clientId: d.client_id, existing: true };

    // Une même personne peut écrire deux fois. Plutôt que de buter sur
    // l'unicité de l'adresse, on rattache la demande à la fiche existante.
    const connus = d.email
      ? await db<Client[]>(`clients?email=ilike.${encodeURIComponent(d.email)}&select=*&limit=1`)
      : [];

    const client =
      connus[0] ??
      (
        await db<Client[]>("clients", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            nom: d.nom,
            email: d.email,
            telephone: d.telephone,
            commune: d.commune,
            type: d.type_client === "professionnel" ? "professionnel" : "particulier",
            notes: d.besoin,
          }),
        })
      )[0];

    // Un bien n'est créé que si la demande dit quelque chose du logement, et
    // seulement si la fiche n'en porte pas déjà un : on ne duplique pas.
    const libelle = d.logement ? (HOUSING_LABEL[d.logement as HousingType] ?? d.logement) : null;
    const dejaUnBien = connus.length
      ? (await db<{ id: string }[]>(`biens?client_id=eq.${client.id}&select=id&limit=1`)).length > 0
      : false;
    if (!dejaUnBien && (libelle || d.surface || d.chambres)) {
      await db<Bien[]>("biens", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          client_id: client.id,
          libelle: libelle ?? "Logement",
          commune: d.commune,
          surface: d.surface,
          chambres: d.chambres,
          salles_de_bains: d.salles_de_bains,
          frequence: d.frequence,
        }),
      });
    }

    await db<void>(`demandes?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ client_id: client.id, statut: "rappele" }),
    });

    return { clientId: client.id, existing: connus.length > 0 };
  });
}
