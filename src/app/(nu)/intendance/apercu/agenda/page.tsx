import { Bandeau, Entete } from "@/components/apercu/Os";
import { Agenda } from "@/components/apercu/Agenda";

/**
 * L'agenda.
 *
 * La date du jour est figée dans la maquette : la démonstration doit montrer
 * la même semaine quel que soit le jour où on l'ouvre.
 */
const AUJOURDHUI = "2026-11-24";

export default function Page() {
  return (
    <div className="os-wrap">
      <Bandeau>Maquette — données fictives, rien n&apos;est enregistré.</Bandeau>
      <Entete
        kicker="Passages"
        titre="Agenda"
        sous="Les récurrences viennent des contrats ; les ponctuels s'y ajoutent."
      />
      <Agenda aujourdhui={AUJOURDHUI} />
    </div>
  );
}
