import { MODES } from "@/config/site";

/**
 * Les deux façons de travailler ensemble.
 *
 * `domicile` : chez un particulier, les deux modes sont possibles.
 * `pro` : locaux professionnels et locations de courte durée, prestation
 * facturée uniquement, l'emploi direct n'ayant pas de sens hors du domicile.
 */
export function ModesNotice({ scope = "domicile" }: { scope?: "domicile" | "pro" }) {
  if (scope === "pro") {
    return (
      <div className="notice">
        <strong>Facturation</strong>
        <p>
          Devis puis facture de l&apos;entreprise, au forfait mensuel ou par rotation selon le contrat. Paiement à trente jours.
        </p>
      </div>
    );
  }
  return (
    <div className="notice">
      <strong>Deux façons de travailler ensemble</strong>
      <p>
        <strong>Prestation facturée.</strong> Vous recevez un devis, puis une facture. Vous n&apos;avez rien à déclarer et aucune démarche à faire.
      </p>
      {MODES.cesu ? (
        <p>
          <strong>Emploi direct déclaré au CESU.</strong> Vous m&apos;employez directement et vous déclarez les heures sur cesu.urssaf.fr. C&apos;est l&apos;emploi d&apos;un salarié à domicile qui ouvre droit au crédit d&apos;impôt de 50 % sur le salaire et les cotisations (article 199 sexdecies du CGI). Avec CESU+, l&apos;avance immédiate vous permet de ne régler que la moitié à chaque déclaration.
        </p>
      ) : null}
      <p className="muted">Le mode est choisi avant la première intervention. Les deux ne se cumulent pas sur une même prestation.</p>
    </div>
  );
}
