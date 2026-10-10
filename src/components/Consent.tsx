"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ANALYTICS } from "@/config/site";

const { ga4: GA_ID, clarity: CLARITY_ID } = ANALYTICS;
const KEY = "lbi-consent";
const hasTracking = Boolean(GA_ID || CLARITY_ID);

type Choice = "granted" | "denied" | null;

function readChoice(): Choice {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Mesure d'audience soumise au consentement (RGPD / CNIL).
 * Sans identifiant GA4 ni Clarity configuré, rien ne s'affiche et aucun traceur n'est déposé.
 * « Accepter » et « Refuser » ont le même poids visuel.
 */
export function Consent() {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    setChoice(readChoice());
    setReady(true);
    const open = () => setForceOpen(true);
    window.addEventListener("lbi-consent-open", open);
    return () => window.removeEventListener("lbi-consent-open", open);
  }, []);

  const save = useCallback((c: Exclude<Choice, null>) => {
    try {
      window.localStorage.setItem(KEY, c);
    } catch {
      /* stockage indisponible : le choix vaut pour cette page seulement */
    }
    setChoice(c);
    setForceOpen(false);
  }, []);

  if (!hasTracking || !ready) return null;

  return (
    <>
      {choice === "granted" && GA_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          `}</Script>
        </>
      ) : null}
      {choice === "granted" && CLARITY_ID ? (
        <Script id="clarity-init" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${CLARITY_ID}");
        `}</Script>
      ) : null}

      {choice === null || forceOpen ? (
        <div className="consent-bar" role="dialog" aria-label="Mesure d'audience" aria-live="polite">
          <div className="inner">
            <p>
              Nous mesurons la fréquentation du site pour l'améliorer, uniquement si vous l'acceptez. Aucun traceur n'est déposé avant votre choix.{" "}
              <Link href="/confidentialite">En savoir plus</Link>
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn--ghost" onClick={() => save("denied")}>
                Refuser
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => save("granted")}>
                Accepter
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Bouton du pied de page pour rouvrir le choix. */
export function CookieSettings() {
  if (!hasTracking) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("lbi-consent-open"))}
      style={{ background: "none", border: 0, color: "inherit", font: "inherit", textDecoration: "underline", textDecorationColor: "var(--terracotta)", cursor: "pointer", padding: 0 }}
    >
      Gérer les cookies
    </button>
  );
}
