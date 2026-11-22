"use client";

import { useEffect, useState } from "react";
import { enLigne, lireFile, vider } from "@/lib/apercu/horsLigne";

/**
 * L'état du réseau, dit franchement.
 *
 * Quand le réseau manque, l'écran ne doit ni bloquer ni faire semblant. Il dit
 * que le relevé est gardé sur le téléphone et partira tout seul — c'est la
 * seule phrase qui évite de recommencer la saisie par méfiance.
 */
export function EtatReseau() {
  const [ligne, setLigne] = useState(true);
  const [attente, setAttente] = useState(0);

  useEffect(() => {
    const relire = () => {
      setLigne(enLigne());
      setAttente(lireFile().length);
    };
    relire();
    const retour = async () => {
      setLigne(true);
      await vider();
      setAttente(lireFile().length);
    };
    window.addEventListener("online", retour);
    window.addEventListener("offline", relire);
    const t = window.setInterval(relire, 4000);
    return () => {
      window.removeEventListener("online", retour);
      window.removeEventListener("offline", relire);
      window.clearInterval(t);
    };
  }, []);

  if (ligne && attente === 0) return null;

  return (
    <p className={`os-reseau ${ligne ? "" : "os-reseau--coupe"}`} role="status">
      {ligne
        ? `${attente} enregistrement${attente > 1 ? "s" : ""} en cours d'envoi.`
        : "Hors réseau. Le relevé est gardé sur ce téléphone et partira tout seul."}
    </p>
  );
}
