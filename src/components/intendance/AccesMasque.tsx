"use client";

import { useState } from "react";

/**
 * Les consignes d'entrée d'un logement : code du portail, emplacement des
 * clés, alarme.
 *
 * Elles ne sont pas chargées avec la fiche. Le serveur ne les envoie qu'à la
 * demande, par une route qui enregistre la consultation. Deux conséquences :
 * elles ne traînent pas dans la mémoire du navigateur de quiconque ouvre une
 * fiche, et on sait qui les a lues.
 *
 * Le masquage n'arrête pas qui détient déjà la session — il arrête le regard
 * par-dessus l'épaule, la capture d'écran faite à la hâte et le téléphone
 * posé sur une table chez un client.
 */
export function AccesMasque({ bienId }: { bienId: string }) {
  const [etat, setEtat] = useState<"ferme" | "chargement" | "ouvert" | "erreur">("ferme");
  const [acces, setAcces] = useState<{ acces: string | null; particularites: string | null }>({
    acces: null,
    particularites: null,
  });
  const [erreur, setErreur] = useState("");

  async function afficher() {
    setEtat("chargement");
    try {
      const r = await fetch(`/api/intendance/biens/${bienId}/acces`, { method: "POST", cache: "no-store" });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d?.error ?? "Consignes indisponibles.");
      setAcces({ acces: d.acces ?? null, particularites: d.particularites ?? null });
      setEtat("ouvert");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Consignes indisponibles.");
      setEtat("erreur");
    }
  }

  if (etat === "ouvert") {
    return (
      <div className="acces-bloc">
        {acces.acces ? (
          <p className="bien-ligne">
            <span>Accès</span> {acces.acces}
          </p>
        ) : null}
        {acces.particularites ? (
          <p className="bien-ligne">
            <span>Particularités</span> {acces.particularites}
          </p>
        ) : null}
        {!acces.acces && !acces.particularites ? <p className="bien-ligne">Aucune consigne enregistrée.</p> : null}
        <button type="button" className="acces-bascule" onClick={() => setEtat("ferme")}>
          masquer
        </button>
      </div>
    );
  }

  return (
    <p className="bien-ligne">
      <span>Consignes d&apos;entrée</span>{" "}
      <span className="acces-points" aria-hidden="true">
        ••••••••••••••••
      </span>{" "}
      <button type="button" className="acces-bascule" onClick={afficher} disabled={etat === "chargement"}>
        {etat === "chargement" ? "…" : "afficher"}
      </button>
      {etat === "erreur" ? <span className="acces-erreur"> {erreur}</span> : null}
    </p>
  );
}
