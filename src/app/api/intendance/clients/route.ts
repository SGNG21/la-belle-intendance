import { type Client, db, listClients, oneOf, text } from "@/lib/crm";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return guarded(async () => ({ clients: await listClients() }));
}

/** Nouvelle fiche client. Seul le nom est exigé ; le reste se complète ensuite. */
export async function POST(req: Request) {
  const b = await body(req);
  return guarded(async () => {
    const nom = text(b.nom, 120);
    if (!nom) return { error: "Indiquez un nom." };
    const [client] = await db<Client[]>("clients", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        nom,
        email: text(b.email, 160),
        telephone: text(b.telephone, 30),
        commune: text(b.commune, 80),
        type: oneOf(b.type, ["particulier", "professionnel"] as const) ?? "particulier",
        mode: oneOf(b.mode, ["prestation", "cesu"] as const),
        notes: text(b.notes, 4000),
      }),
    });
    return { clientId: client.id };
  });
}
