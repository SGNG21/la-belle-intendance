"use client";

import { useEffect, useState } from "react";
import { enLigne, lireFile, vider } from "@/lib/horsLigne";

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
  const [soucis, setSoucis] = useState(0);

  useEffect(() => {
    const relire = () => {
      setLigne(enLigne());
      setAttente(lireFile().length);
    };
    relire();
    const retour = async () => {
      setLigne(true);
      const bilan = await vider();
      setAttente(bilan.restantes);
      // Un conflit ou un refus ne doit pas disparaître en silence : il remonte
      // à l'écran, qui décidera quoi en dire.
      if (bilan.conflits.length || bilan.refusees.length) {
        setSoucis(bilan.conflits.length + bilan.refusees.length);
      }
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

  if (ligne && attente === 0 && soucis === 0) return null;

  if (soucis > 0) {
    return (
      <p className="os-reseau os-reseau--coupe" role="status">
        {soucis} enregistrement{soucis > 1 ? "s" : ""} n&apos;{soucis > 1 ? "ont" : "a"} pas pu être repris :
        le passage a été modifié ailleurs, ou refusé. Rouvrez-le pour voir où il en est.
      </p>
    );
  }

  return (
    <p className={`os-reseau ${ligne ? "" : "os-reseau--coupe"}`} role="status">
      {ligne
        ? `${attente} enregistrement${attente > 1 ? "s" : ""} en cours d'envoi.`
        : "Hors réseau. Le relevé est gardé sur ce téléphone et partira tout seul."}
    </p>
  );
}
