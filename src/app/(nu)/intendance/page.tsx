import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import { IntendanceGate } from "@/components/IntendanceGate";
import { Desk } from "@/components/intendance/Desk";

/**
 * Le bureau de La Belle Intendance.
 *
 * Hors navigation, hors sitemap, en noindex, derrière le mot de passe. Les
 * données arrivent par les routes /api/intendance, qui revérifient la session
 * à chaque appel : rien n'est rendu côté serveur avant l'ouverture.
 */
export const metadata = {
  title: "Bureau",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return (
    <>
      <LandingHeader />
      <IntendanceGate>
        <section className="lp-sec lp-sec--paper">
          <div className="lp-in">
            <div className="kicker-gold">Usage interne</div>
            <h1 className="cr-title">Le bureau</h1>
            <p className="desk-intro">
              Les demandes reçues par le site arrivent ici d&apos;elles-mêmes, avec leur origine. Un bouton suffit pour en faire une
              fiche client, puis décrire le bien et ce qui a été retenu.
            </p>
            <Desk />
          </div>
        </section>
      </IntendanceGate>
      <LandingFooter />
    </>
  );
}
