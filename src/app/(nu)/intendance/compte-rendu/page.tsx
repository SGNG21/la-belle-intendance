import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import { ReportForm } from "@/components/ReportForm";

/**
 * Outil interne : le compte rendu que Coralie remplit après un passage.
 *
 * Hors navigation, hors sitemap, en noindex. L'adresse ne se devine pas et
 * l'envoi exige un code vérifié côté serveur — la page elle-même ne garde
 * aucun secret.
 */
export const metadata = {
  title: "Compte rendu de passage",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return (
    <>
      <LandingHeader />
      <section className="lp-sec lp-sec--paper">
        <div className="lp-in lp-in--narrow">
          <div className="kicker-gold">Usage interne</div>
          <h1 className="cr-title">Compte rendu de passage</h1>
          <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
            Le client le reçoit par e-mail dès l&apos;envoi, et une copie arrive dans la boîte de l&apos;entreprise.
          </p>
          <ReportForm />
        </div>
      </section>
      <LandingFooter />
    </>
  );
}
