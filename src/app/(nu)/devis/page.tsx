import Image from "next/image";
import { CONTACT, SITE } from "@/config/site";
import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import { LeadForm } from "@/components/LeadForm";
import { ApercuCompteRendu, Citation, Etapes, PointsCles } from "@/components/Arguments";

/**
 * Page de destination pour les campagnes.
 *
 * Volontairement sans navigation : un seul but, recevoir une demande. Elle
 * n'est pas indexée — elle doublerait /contact aux yeux de Google — et elle
 * renvoie vers /merci après envoi, pour que la conversion soit mesurable.
 */
export const metadata = {
  title: "Demander un devis de ménage à Joigny",
  description: "Ménage régulier, grands nettoyages et intendance de maison à Joigny et ses alentours. Devis écrit avant toute intervention.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <LandingHeader />

      <section className="lp-hero">
        <Image src="/images/hero-maison-bourguignonne.webp" alt="" width={1536} height={1024} priority sizes="100vw" />
        <div className="lp-hero-in">
          <h1>Un intérieur impeccable, sans avoir à vous en occuper</h1>
          <p className="lede">
            Ménage régulier, grands nettoyages et intendance de maison à {SITE.city} et dans ses alentours.
          </p>
          <div className="lp-cta">
            <a className="btn" href="#formulaire">
              Demander un devis
            </a>
            {CONTACT.phone ? (
              <a className="btn btn--ghost" href={`tel:${CONTACT.phoneE164 ?? ""}`}>
                {CONTACT.phone}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <PointsCles />
      <Citation />
      <ApercuCompteRendu />
      <Etapes />

      <section className="lp-sec lp-sec--paper" id="formulaire">
        <div className="lp-in lp-in--narrow">
          <h2 style={{ textAlign: "center" }}>Demander un devis</h2>
          <p style={{ textAlign: "center", marginBottom: "2rem" }}>
            Gratuit et sans engagement. Nous vous rappelons pour préciser votre besoin.
          </p>
          <LeadForm redirectTo="/merci" />
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
