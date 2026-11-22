import { Bandeau, Carte, Entete, Lien, Tag } from "@/components/apercu/Os";
import { heures } from "@/lib/apercu/modele";

/** La semaine. Les passages projetés depuis les abonnements, plus les ponctuels. */

const SEMAINE = [
  { jour: "Lundi 24", items: [] as { h: string; qui: string; quoi: string; d: number; etat: "fait" | "prevu" }[] },
  { jour: "Mardi 25", items: [{ h: "09:00", qui: "Hélène Delaunay", quoi: "Entretien · La Maison du Pré", d: 4.5, etat: "fait" as const }] },
  { jour: "Mercredi 26", items: [{ h: "08:30", qui: "Cabinet Marchand", quoi: "Bureaux · hebdomadaire", d: 2, etat: "prevu" as const }] },
  { jour: "Jeudi 27", items: [{ h: "10:00", qui: "Gîte des Tilleuls", quoi: "Entre deux séjours", d: 3, etat: "prevu" as const }] },
  { jour: "Vendredi 28", items: [{ h: "09:00", qui: "Famille Bontemps", quoi: "Entretien mensuel", d: 3.5, etat: "prevu" as const }] },
  { jour: "Samedi 29", items: [] },
];

export default function Page() {
  const total = SEMAINE.flatMap((j) => j.items).reduce((s, i) => s + i.d, 0);

  return (
    <div className="os-wrap">
      <Bandeau>Maquette — données fictives.</Bandeau>
      <Entete
        kicker="Semaine du 24 novembre"
        titre="Agenda"
        sous={`${heures(total)} planifiées sur 4 jours.`}
        action={<Lien href="/intendance/apercu/intervention">Passage en cours</Lien>}
      />

      <div className="os-grid">
        {SEMAINE.map((j) => (
          <Carte key={j.jour} titre={j.jour}>
            {j.items.length === 0 ? (
              <p className="os-vide">Aucun passage. Une journée libre pour les devis et les visites.</p>
            ) : (
              j.items.map((i) => (
                <div key={i.h + i.qui} className="os-rang">
                  <div>
                    <strong className="os-num">{i.h}</strong> · <strong>{i.qui}</strong>
                    <br />
                    <span className="os-sub">
                      {i.quoi} · {heures(i.d)}
                    </span>
                  </div>
                  {i.etat === "fait" ? <Tag ton="fait">Faite</Tag> : <Tag ton="attente">Prévue</Tag>}
                </div>
              ))
            )}
          </Carte>
        ))}
      </div>
    </div>
  );
}
