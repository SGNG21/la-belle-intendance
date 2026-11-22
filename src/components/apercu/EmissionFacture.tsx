"use client";

import { useState } from "react";
import { Tag } from "./Os";

/**
 * L'émission de la facture, et son verrou.
 *
 * Le numéro n'existe qu'à l'émission, et une fois attribué il ne bouge plus :
 * une série de factures ne doit ni sauter un numéro ni en réutiliser un. Le
 * passage facturé porte ensuite l'identifiant de la facture, ce qui interdit
 * de le facturer une seconde fois.
 */
export function EmissionFacture({ numeroPrevu }: { numeroPrevu: string }) {
  const [emise, setEmise] = useState(false);

  if (emise) {
    return (
      <>
        <div className="os-note">
          <strong>Facture {numeroPrevu} émise.</strong> Le passage du 24 novembre y est rattaché : il
          n&apos;apparaîtra plus dans « à facturer », et une seconde facture sur ce passage sera refusée.
        </div>
        <div className="os-sticky">
          <span className="os-btn os-btn--contour" aria-disabled="true">
            Envoyer au client
          </span>
          <span className="os-why">La maquette s&apos;arrête ici : aucun document officiel n&apos;est produit.</span>
        </div>
      </>
    );
  }

  return (
    <div className="os-sticky">
      <button type="button" className="os-btn os-btn--plein" onClick={() => setEmise(true)}>
        Émettre la facture
      </button>
      <span className="os-why">Le numéro {numeroPrevu} sera attribué définitivement.</span>
    </div>
  );
}

export function EtatFacture({ emise }: { emise: boolean }) {
  return emise ? <Tag ton="sceau">Émise</Tag> : <Tag ton="attente">Brouillon</Tag>;
}
