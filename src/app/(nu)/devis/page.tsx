import Image from "next/image";
import { CONTACT, SITE } from "@/config/site";
import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import { LeadForm } from "@/components/LeadForm";
import { ReportCard } from "@/components/ReportCard";
import { Check, Seal } from "@/components/Icons";

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

const POINTS = [
  ["La même personne", "Coralie intervient elle-même. Pas de rotation d'équipe, pas d'inconnu chez vous."],
  ["Un compte rendu", "Après chaque passage : ce qui a été fait, et ce qui mérite votre attention."],
  ["Un devis écrit", "Le prix est fixé avant de commencer. Rien ne démarre sans votre accord."],
] as const;

const STEPS = [
  ["Vous décrivez votre besoin", "Le formulaire ci-dessous prend deux minutes."],
  ["Nous en parlons", "Un appel pour préciser, et une visite si la taille du logement le justifie."],
  ["Vous recevez un devis écrit", "Le contenu des passages, la durée, le prix. Vous décidez ensuite."],
] as const;

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

      <section className="lp-sec lp-sec--paper">
        <div className="lp-in">
          <h2>Confier ses clés, ce n&apos;est pas un détail</h2>
          <p style={{ maxWidth: "40rem" }}>
            On ne cherche pas seulement quelqu&apos;un qui nettoie. On cherche quelqu&apos;un à qui on peut ouvrir sa porte,
            qui connaît la maison, et qui dit ce qu&apos;il a vu.
          </p>
          <ul className="lp-points">
            {POINTS.map(([t, d]) => (
              <li key={t}>
                <Check />
                <div>
                  <strong>{t}</strong>
                  <span>{d}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-sec lp-sec--cream">
        <div className="lp-in lp-in--narrow lp-quote">
          <span className="seal-wrap">
            <Seal />
          </span>
          <q>Je suis vos yeux.</q>
          <div>
            <div className="who">Coralie</div>
            <div className="role">Votre intervenante</div>
          </div>
          <p style={{ maxWidth: "32rem" }}>
            Une maison qu&apos;on ne voit pas tout le temps mérite qu&apos;on la suive. Une fuite qui commence, une trace
            d&apos;humidité, un volet qui coince : vous le saurez le jour même.
          </p>
        </div>
      </section>

      <section className="lp-sec lp-sec--paper">
        <div className="lp-in lp-in--narrow">
          <h2 style={{ textAlign: "center" }}>Ce que vous recevez après un passage</h2>
          <div style={{ marginTop: "1.8rem" }}>
            <ReportCard />
          </div>
        </div>
      </section>

      <section className="lp-sec lp-sec--cream">
        <div className="lp-in">
          <h2 style={{ textAlign: "center" }}>Ce qui se passe ensuite</h2>
          <ol className="lp-steps">
            {STEPS.map(([t, d]) => (
              <li key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

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
