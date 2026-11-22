"use client";

import { useState } from "react";

/**
 * Les consignes d'entrée d'un logement, masquées par défaut.
 *
 * C'est la donnée la plus sensible du back-office : qui la lit peut entrer
 * chez quelqu'un. Le masquage ne protège pas de qui détient déjà la session —
 * il protège du regard par-dessus l'épaule, de la capture d'écran faite à la
 * hâte et du téléphone posé sur une table chez un client.
 */
export function AccesMasque({ libelle, texte }: { libelle: string; texte: string }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <p className="bien-ligne">
      <span>{libelle}</span>{" "}
      {ouvert ? (
        <>
          {texte}{" "}
          <button type="button" className="acces-bascule" onClick={() => setOuvert(false)}>
            masquer
          </button>
        </>
      ) : (
        <>
          <span className="acces-points" aria-hidden="true">
            {"•".repeat(Math.min(texte.replace(/\s/g, "").length, 40))}
          </span>{" "}
          <button type="button" className="acces-bascule" onClick={() => setOuvert(true)}>
            afficher
          </button>
        </>
      )}
    </p>
  );
}
