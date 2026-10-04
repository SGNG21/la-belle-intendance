import { SAP, sapActive } from "@/config/site";

/**
 * Bloc crédit d'impôt. Deux versions, jamais mélangées :
 * - avant déclaration SAP effective : texte pédagogique, aucune promesse ;
 * - après : mention de déclaration avec son numéro.
 */
export function SapNotice({ scope = "menage" }: { scope?: "menage" | "autre" }) {
  if (scope === "autre") {
    return (
      <div className="notice">
        <strong>Crédit d'impôt</strong>
        <p>L'éligibilité d'une prestation au crédit d'impôt dépend de sa nature. Nous vous l'indiquons précisément dans votre devis, prestation par prestation.</p>
      </div>
    );
  }
  if (!sapActive()) {
    return (
      <div className="notice">
        <strong>Crédit d'impôt pour services à la personne</strong>
        <p>
          Le ménage à domicile peut ouvrir droit à un crédit d'impôt, à condition que l'entreprise soit déclarée au titre des services à la personne. Nous publierons ici les conditions et le montant dès que notre déclaration sera effective.
        </p>
      </div>
    );
  }
  return (
    <div className="notice">
      <strong>Entreprise déclarée services à la personne</strong>
      <p>
        Déclaration n° {SAP.declarationNumber}
        {SAP.declarationDate ? `, effective depuis le ${SAP.declarationDate}` : ""}. Pour le ménage et l'entretien courant du domicile, les sommes versées ouvrent droit à un crédit d'impôt de 50 % (article 199 sexdecies du CGI), dans la limite du plafond annuel de dépenses.
        {SAP.avanceImmediate ? " Vous pouvez activer l'avance immédiate auprès de l'Urssaf pour ne payer que la moitié à chaque facture." : ""}
      </p>
    </div>
  );
}
