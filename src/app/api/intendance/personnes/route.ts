import { db, text } from "@/lib/crm";
import { body, guarded } from "@/lib/crmRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/;
const ROLES = ["proprietaire", "intervenant"] as const;

/** Les comptes. Réservé à la responsable : qui travaille ici ne se divulgue pas. */
export async function GET() {
  return guarded(
    async () => ({
      personnes: await db(
        "intervenants?select=id,nom,email,role,couleur,actif,desactive_le,cree_le&order=nom",
      ),
    }),
    "gerer_comptes",
  );
}

/** Créer un compte. Il n'est utilisable qu'après une première connexion par lien. */
export async function POST(req: Request) {
  const b = await body(req);
  return guarded(async () => {
    const nom = text(b.nom, 120);
    const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
    const role = ROLES.includes(b.role as (typeof ROLES)[number]) ? (b.role as string) : "intervenant";
    if (!nom) return { error: "Indiquez un nom." };
    if (!EMAIL.test(email)) return { error: "Indiquez une adresse valide." };

    const [p] = await db<{ id: string }[]>("intervenants", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ nom, email, role }),
    });
    return { personneId: p.id };
  }, "gerer_comptes");
}
