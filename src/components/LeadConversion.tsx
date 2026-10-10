"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/**
 * Conversion mesurée à l'arrivée sur /merci, pas au clic sur le bouton :
 * seule une demande réellement enregistrée par le serveur amène ici.
 *
 * `track` reste silencieux tant que le visiteur n'a pas accepté la mesure
 * d'audience — gtag n'existe qu'après consentement.
 */
export function LeadConversion() {
  useEffect(() => {
    track("generate_lead", { currency: "EUR", value: 1 });
  }, []);
  return null;
}
