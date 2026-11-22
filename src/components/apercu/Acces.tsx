"use client";

import { useState } from "react";
import { masquer, type Role, droits } from "@/lib/apercu/permissions";

/**
 * Les consignes d'entrée dans un logement.
 *
 * Masquées à l'ouverture de la page, révélées sur demande. Ce n'est pas un
 * obstacle sérieux pour qui a déjà la session — c'en est un pour le regard
 * par-dessus l'épaule, pour la capture d'écran envoyée à la hâte, et pour le
 * téléphone posé sur une table. Chaque révélation est tracée.
 */
export function Acces({ texte, role, bienId }: { texte: string; role: Role; bienId: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [trace, setTrace] = useState<string | null>(null);
  const peut = droits(role).voirAcces;

  if (!peut) {
    return (
      <p className="os-masque">
        Les consignes d&apos;accès ne sont pas visibles depuis ce profil.
      </p>
    );
  }

  if (!ouvert) {
    return (
      <div>
        <p className="os-masque" aria-hidden="true">
          {masquer(texte)}
        </p>
        <button
          type="button"
          className="os-btn os-btn--contour"
          onClick={() => {
            setOuvert(true);
            // En production : POST vers le serveur, qui écrit la trace.
            setTrace(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
          }}
        >
          Afficher les consignes d&apos;accès
        </button>
        <p className="os-sub" style={{ marginTop: "0.5rem" }}>
          L&apos;affichage est enregistré. Ces consignes ne figurent dans aucun e-mail ni document.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ marginTop: 0 }}>{texte}</p>
      <div className="os-rang" style={{ borderBottom: 0, paddingBottom: 0 }}>
        <span className="os-sub">
          Affiché à {trace}
          {bienId ? " · consultation enregistrée" : ""}
        </span>
        <button type="button" className="os-btn os-btn--nu" onClick={() => setOuvert(false)}>
          Masquer
        </button>
      </div>
    </div>
  );
}
