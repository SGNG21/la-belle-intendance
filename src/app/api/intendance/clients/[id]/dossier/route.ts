import { db } from "@/lib/crm";
import { guarded } from "@/lib/crmRoute";
import { historique } from "@/lib/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

interface Facture {
  id: string;
  numero: string | null;
  statut: string;
  date_emission: string | null;
  date_echeance: string | null;
  tva: number;
}

interface Ligne {
  facture_id: string;
  montant_ht: number;
}

interface Paiement {
  facture_id: string;
  montant: number;
}

/**
 * Tout le dossier d'un client, en un seul appel.
 *
 * Six appels séparés seraient plus propres à lire dans le code et nettement
 * moins bons à l'usage : sur un téléphone en bord de réseau, six allers-retours
 * donnent six occasions d'échouer et une page qui se remplit par morceaux.
 * Ici la fiche arrive d'un coup, ou pas du tout.
 *
 * Les consignes d'entrée n'y sont pas : elles ont leur route, qui enregistre
 * chaque consultation. Les mêler au dossier reviendrait à les transmettre à
 * chaque ouverture de fiche sans que personne l'ait demandé.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return guarded(async () => {
    if (!UUID.test(id)) return { error: "Référence client invalide." };
    const c = encodeURIComponent(id);
    const aujourdhui = new Date().toISOString().slice(0, 10);

    const [contrats, prochaines, comptesRendus, factures, evenements] = await Promise.all([
      db(`contrats?client_id=eq.${c}&select=*&order=debut.desc`),
      db(
        `interventions?client_id=eq.${c}&date=gte.${aujourdhui}&statut=in.(planifiee,en_cours,reportee)` +
          `&select=id,date,debut,duree_prevue_h,statut,version,bien_id,intervenant_id&order=date.asc&limit=10`,
      ),
      db(
        `comptes_rendus?client_id=eq.${c}&select=id,intervention_id,statut,cree_le,valide_le,envoye_le,destinataires` +
          `&order=cree_le.desc&limit=20`,
      ),
      db<Facture[]>(`factures?client_id=eq.${c}&select=*&order=cree_le.desc&limit=30`),
      historique(id),
    ]);

    // Les montants et les règlements se lisent après, en partant des factures
    // de CE client. Interroger paiements sans ce filtre ramènerait ceux de
    // tout le monde — une fuite d'un client vers un autre.
    const ids = factures.map((f) => f.id);
    const dans = `(${ids.map((i) => `"${i}"`).join(",")})`;
    const [lignes, paiements] =
      ids.length === 0
        ? [[] as Ligne[], [] as Paiement[]]
        : await Promise.all([
            db<Ligne[]>(`facture_lignes?facture_id=in.${dans}&select=facture_id,montant_ht`),
            db<Paiement[]>(`paiements?facture_id=in.${dans}&select=id,facture_id,date,montant,moyen&order=date.desc`),
          ]);

    const somme = (xs: { montant_ht?: number; montant?: number }[]) =>
      Math.round(xs.reduce((s, x) => s + Number(x.montant_ht ?? x.montant ?? 0), 0) * 100) / 100;

    // Chaque facture porte son total et son reste dû : l'écran n'a pas à les
    // recalculer, et deux calculs finiraient par diverger.
    const chiffrees = factures.map((f) => {
      const ht = somme(lignes.filter((l) => l.facture_id === f.id));
      const ttc = Math.round(ht * (1 + Number(f.tva)) * 100) / 100;
      const paye = somme(paiements.filter((p) => p.facture_id === f.id));
      return { ...f, total_ht: ht, total_ttc: ttc, paye, reste: Math.round(Math.max(0, ttc - paye) * 100) / 100 };
    });

    return {
      contrats,
      prochaines,
      comptesRendus,
      factures: chiffrees,
      paiements,
      evenements,
      resume: {
        du: chiffrees.reduce((s, f) => s + (f.statut === "payee" ? 0 : f.reste), 0),
        encaisse: somme(paiements),
      },
    };
  }, "voir_clients");
}
