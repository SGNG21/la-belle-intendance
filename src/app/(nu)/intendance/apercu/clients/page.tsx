import { Bandeau, Carte, Entete, Tag } from "@/components/apercu/Os";
import Link from "next/link";
import { CLIENT } from "@/lib/apercu/donnees";
import { euros } from "@/lib/apercu/modele";

/** Le répertoire. En cartes sur téléphone, en lignes sur grand écran. */

const AUTRES = [
  { id: "c-marchand", nom: "Cabinet Marchand", commune: "Joigny", type: "Professionnel", rythme: "Hebdomadaire", mois: 520, actif: true },
  { id: "c-bontemps", nom: "Famille Bontemps", commune: "Cézy", type: "Particulier", rythme: "Mensuel", mois: 128, actif: true },
  { id: "c-gite", nom: "Gîte des Tilleuls", commune: "Armeau", type: "Professionnel", rythme: "Entre deux séjours", mois: 340, actif: true },
  { id: "c-perrin", nom: "Mme Perrin", commune: "Migennes", type: "Particulier", rythme: "Ponctuel", mois: 0, actif: false },
];

export default function Page() {
  return (
    <div className="os-wrap">
      <Bandeau>Maquette — données fictives.</Bandeau>
      <Entete kicker="Répertoire" titre="Clients" sous="5 fiches, dont 4 actives." />

      <Carte>
        <table className="os-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Commune</th>
              <th>Rythme</th>
              <th className="os-r">Par mois</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Link href={`/intendance/apercu/clients/${CLIENT.id}`}>
                  <strong>{CLIENT.nom}</strong>
                </Link>
                <br />
                <span className="os-sub">Résidence secondaire</span>
              </td>
              <td>{CLIENT.commune}</td>
              <td>Quinzaine</td>
              <td className="os-r">{euros(288)}</td>
              <td className="os-r">
                <Tag ton="fait">Actif</Tag>
              </td>
            </tr>
            {AUTRES.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.nom}</strong>
                  <br />
                  <span className="os-sub">{c.type}</span>
                </td>
                <td>{c.commune}</td>
                <td>{c.rythme}</td>
                <td className="os-r">{c.mois ? euros(c.mois) : "—"}</td>
                <td className="os-r">{c.actif ? <Tag ton="fait">Actif</Tag> : <Tag ton="attente">Dormant</Tag>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="os-sub" style={{ marginTop: "1rem" }}>
          Seule la fiche d&apos;{CLIENT.nom} est détaillée dans cette maquette.
        </p>
      </Carte>
    </div>
  );
}
