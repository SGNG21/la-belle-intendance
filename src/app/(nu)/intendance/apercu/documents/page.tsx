import { Bandeau, Carte, Entete, Stat, Tag } from "@/components/apercu/Os";
import { euros } from "@/lib/apercu/modele";

/**
 * Tout ce qui est parti, ou devrait partir.
 *
 * Un journal des transmissions plutôt qu'une bibliothèque : ce qu'on vient
 * vérifier ici, c'est « est-ce que le client l'a bien reçu ».
 */

const DOCS = [
  { id: "d1", type: "Compte rendu", ref: "24 nov. · H. Delaunay", date: "24 nov.", etat: "cours" as const, mot: "À envoyer", montant: null },
  { id: "d2", type: "Facture", ref: "2026-041 · H. Delaunay", date: "10 nov.", etat: "fait" as const, mot: "Payée", montant: 144 },
  { id: "d3", type: "Compte rendu", ref: "10 nov. · H. Delaunay", date: "10 nov.", etat: "sceau" as const, mot: "Envoyé", montant: null },
  { id: "d4", type: "Facture", ref: "2026-040 · Cabinet Marchand", date: "5 nov.", etat: "alerte" as const, mot: "En retard", montant: 520 },
  { id: "d5", type: "Devis", ref: "DEV-2026-031 · Gîte des Tilleuls", date: "2 nov.", etat: "attente" as const, mot: "Sans réponse", montant: 340 },
];

export default function Page() {
  return (
    <div className="os-wrap">
      <Bandeau>Maquette — données fictives.</Bandeau>
      <Entete kicker="Journal des transmissions" titre="Documents" sous="Ce qui est parti, et ce qui attend." />

      <div className="os-grid os-grid--2" style={{ marginBottom: "1rem" }}>
        <Carte>
          <div className="os-grid" style={{ gap: "1.25rem" }}>
            <Stat k="En attente d'encaissement" v={euros(520)} n="1 facture, 19 jours de retard" />
            <Stat k="Devis sans réponse" v={euros(340)} n="1 devis, à relancer" />
          </div>
        </Carte>
        <Carte titre="Ce qui demande une main">
          <div className="os-rang">
            <div>Compte rendu du 24 novembre</div>
            <Tag ton="cours">À envoyer</Tag>
          </div>
          <div className="os-rang">
            <div>Facture 2026-040</div>
            <Tag ton="alerte">Relancer</Tag>
          </div>
        </Carte>
      </div>

      <Carte>
        <table className="os-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Date</th>
              <th className="os-r">Montant</th>
              <th className="os-r">État</th>
            </tr>
          </thead>
          <tbody>
            {DOCS.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.type}</strong>
                  <br />
                  <span className="os-sub">{d.ref}</span>
                </td>
                <td className="os-num">{d.date}</td>
                <td className="os-r">{d.montant ? euros(d.montant) : "—"}</td>
                <td className="os-r">
                  <Tag ton={d.etat}>{d.mot}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Carte>
    </div>
  );
}
