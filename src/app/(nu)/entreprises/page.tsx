import Image from "next/image";
import { CONTACT, SITE } from "@/config/site";
import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import { LeadForm } from "@/components/LeadForm";
import { Check } from "@/components/Icons";

/**
 * Page de destination des campagnes de prospection auprès des professionnels.
 *
 * Même parti pris que /devis : aucune navigation, un seul but — recevoir une
 * demande. Elle n'est pas indexée, car elle doublerait /professionnels aux
 * yeux de Google, et renvoie vers /merci pour que la conversion se mesure au
 * même endroit que les autres campagnes.
 *
 * Les arguments de /devis ne sont pas réutilisés : ils parlent de confier ses
 * clés et de sa maison. Un gérant de cabinet n'a pas ces préoccupations-là.
 */
export const metadata = {
  title: "Entretien de locaux professionnels à Joigny",
  description:
    "Bureaux, cabinets et commerces à Joigny et dans un rayon de 15 km : une intervenante attitrée, un cahier des charges écrit, un compte rendu après chaque passage.",
  robots: { index: false, follow: false },
};

/** Les reproches que les professionnels adressent le plus souvent à leur prestataire. */
const REPROCHES = [
  "Une personne différente à chaque passage, qu'il faut reformer à chaque fois.",
  "Des absences non remplacées, découvertes le matin en ouvrant.",
  "Un prestataire injoignable dès qu'il y a un imprévu.",
  "Aucune trace de ce qui a été fait — ni de ce qui ne l'a pas été.",
] as const;

const REPONSES = [
  ["Une seule intervenante", "Coralie intervient elle-même. Elle connaît vos locaux, vos horaires et vos priorités : vous ne réexpliquez jamais."],
  ["Un cahier des charges écrit", "Établi ensemble lors d'une visite sur place, poste par poste. Ce qui est inclus est noté, et ce qui ne l'est pas aussi."],
  ["Un compte rendu", "Après chaque passage, vous savez ce qui a été fait, même si vous n'étiez pas là. Et vous avez un numéro qui répond."],
] as const;

const LOCAUX = [
  ["Bureaux et espaces de travail", "Postes, salles de réunion, cuisine, sols et corbeilles — avant l'ouverture ou après la fermeture."],
  ["Cabinets et professions libérales", "Cabinets médicaux et paramédicaux, études, agences : salles d'attente, sanitaires, surfaces de contact."],
  ["Commerces et vitrines", "Surface de vente, réserve, sanitaires, et vitrerie intérieure comme extérieure."],
  ["Parties communes", "Halls, escaliers, paliers et mains courantes, pour copropriétés et immeubles de bureaux."],
  ["Remises en état", "Après travaux, avant emménagement ou à la reprise d'un local. Devis au forfait après visite."],
] as const;

const ETAPES = [
  ["Vous décrivez vos locaux", "Le formulaire prend deux minutes."],
  ["Nous venons les voir", "Une visite gratuite pour relever les contraintes d'accès et d'horaires."],
  ["Vous recevez un devis écrit", "Le contenu de chaque passage, la fréquence, le prix. Vous décidez ensuite."],
] as const;

export default function Page() {
  return (
    <>
      <LandingHeader />

      <section className="lp-hero">
        <Image
          src="/images/commerce-avant-ouverture.webp"
          alt=""
          width={1536}
          height={1024}
          priority
          sizes="100vw"
        />
        <div className="lp-hero-in">
          <h1>Vos locaux impeccables, sans avoir à y penser</h1>
          <p className="lede">
            Bureaux, cabinets et commerces à {SITE.city} et dans un rayon de 15 km. Une intervenante
            attitrée, un cahier des charges écrit avec vous, un compte rendu après chaque passage.
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
          <h2>Le ménage des locaux, ce n&apos;est pas le nettoyage qui coince</h2>
          <p style={{ maxWidth: "40rem" }}>
            Ce que nous entendons le plus souvent, ce n&apos;est pas « c&apos;est mal fait ». C&apos;est :
          </p>
          <ul className="lp-points">
            {REPROCHES.map((r) => (
              <li key={r}>
                <Check />
                <div>
                  <span>{r}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-sec lp-sec--cream">
        <div className="lp-in">
          <h2>Ce que nous faisons différemment</h2>
          <ul className="lp-points">
            {REPONSES.map(([t, d]) => (
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

      <section className="lp-sec lp-sec--paper">
        <div className="lp-in">
          <h2>Ce que nous entretenons</h2>
          <ul className="lp-points">
            {LOCAUX.map(([t, d]) => (
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
        <div className="lp-in">
          <h2 style={{ textAlign: "center" }}>Ce qui se passe ensuite</h2>
          <ol className="lp-steps">
            {ETAPES.map(([t, d]) => (
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
            Gratuit et sans engagement. Nous vous rappelons pour convenir d&apos;une visite des locaux.
          </p>
          <LeadForm defaultClientType="professionnel" redirectTo="/merci" />
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
