"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag } from "./Os";

/**
 * L'envoi du compte rendu, et son verrou.
 *
 * Le brief demande d'empêcher les doubles envois. La garantie ne peut pas être
 * « le bouton disparaît » : un rechargement, un second onglet ou un double
 * appui suffiraient. En production, c'est la clé d'idempotence côté serveur qui
 * tranche. Ici, la maquette montre l'effet attendu côté écran.
 */
export function EnvoiCR({ destinataire }: { destinataire: string }) {
  const [etat, setEtat] = useState<"pret" | "envoi" | "envoye">("pret");

  if (etat === "envoye") {
    return (
      <div className="os-sticky">
        <Link href="/intendance/apercu/facture" className="os-btn os-btn--plein">
          Établir la facture
        </Link>
        <span className="os-why">
          Compte rendu envoyé à {destinataire}. Un second envoi est refusé — rouvrez la fiche pour le renvoyer
          volontairement.
        </span>
      </div>
    );
  }

  return (
    <div className="os-sticky">
      <button
        type="button"
        className="os-btn os-btn--plein"
        onClick={() => {
          setEtat("envoi");
          window.setTimeout(() => setEtat("envoye"), 700);
        }}
        aria-disabled={etat === "envoi"}
      >
        {etat === "envoi" ? "Envoi…" : `Envoyer à ${destinataire}`}
      </button>
      <span className="os-why">Le client reçoit le compte rendu ; une copie part dans la boîte de l&apos;entreprise.</span>
    </div>
  );
}

export function SceauEnvoi({ envoye }: { envoye: boolean }) {
  return envoye ? <Tag ton="sceau">Envoyé</Tag> : <Tag ton="cours">À envoyer</Tag>;
}
