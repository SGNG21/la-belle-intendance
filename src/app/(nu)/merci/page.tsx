import Link from "next/link";
import { CONTACT, SITE } from "@/config/site";
import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import { Seal } from "@/components/Icons";
import { LeadConversion } from "@/components/LeadConversion";

/**
 * Confirmation après envoi du formulaire.
 *
 * Page distincte plutôt que message en place : elle donne une URL propre à
 * mesurer comme conversion, et laisse le temps de dire ce qui va suivre.
 * Jamais indexée : elle n'a aucun sens pour quelqu'un qui arrive de Google.
 */
export const metadata = {
  title: "Votre demande est bien reçue",
  description: "Votre demande de devis a bien été enregistrée.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <LandingHeader />
      <LeadConversion />

      <section className="ty">
        <span className="seal-wrap">
          <Seal />
        </span>
        <h1>Votre demande est bien arrivée</h1>
        <p className="lede">
          Un e-mail de confirmation vient de partir vers votre boîte. S&apos;il n&apos;y est pas dans quelques minutes,
          pensez à regarder dans les indésirables.
        </p>

        <div className="ty-next">
          <h2>Ce qui se passe maintenant</h2>
          <ol>
            <li>Nous vous rappelons pour préciser votre besoin.</li>
            <li>Nous passons voir le logement si sa taille le justifie.</li>
            <li>Vous recevez un devis écrit. Rien ne commence avant que vous l&apos;ayez accepté.</li>
          </ol>
        </div>

        {CONTACT.phone ? (
          <div className="ty-call">
            <span className="lbl">C&apos;est urgent ?</span>
            <a href={`tel:${CONTACT.phoneE164 ?? ""}`}>{CONTACT.phone}</a>
          </div>
        ) : null}

        <div className="btn-row" style={{ marginTop: "2.4rem", justifyContent: "center" }}>
          <Link className="btn btn--ghost" href="/">
            Découvrir {SITE.name}
          </Link>
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
