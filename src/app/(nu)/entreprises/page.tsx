import Image from "next/image";
import { CONTACT, LEGAL, SITE } from "@/config/site";
import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import { LeadForm } from "@/components/LeadForm";
import { Check } from "@/components/Icons";

/**
 * Page de destination des campagnes de prospection auprès des professionnels.
 *
 * Même parti pris que /devis : aucune navigation, un seul but — recevoir une
 * demande. Elle n'est pas indexée, car elle doublerait /professionnels aux
 * yeux de Google.
 *
 * Deux écarts volontaires avec /devis :
 *  - les blocs d'arguments partagés ne sont pas réutilisés : ils parlent de
 *    confier ses clés et de sa maison, ce qui ne correspond pas à un gérant
 *    de cabinet ;
 *  - le formulaire ne redirige PAS vers /merci. Cette page-là déclenche la
 *    conversion mesurée pour les campagnes publicitaires ; y envoyer le
 *    trafic d'une prospection par e-mail fausserait ce chiffre. La
 *    confirmation s'affiche donc sur place.
 */
export const metadata = {
  title: "Entretien de locaux professionnels à Joigny",
  description:
    "Bureaux, cabinets et commerces à Joigny et dans un rayon de 15 km : une intervenante attitrée, un cahier des charges écrit, un compte rendu après chaque passage.",
  robots: { index: false, follow: false },
};

/** Ce que les professionnels reprochent le plus souvent à leur prestataire. */
const GRIEFS = [
  "Une personne différente à chaque passage, qu'il faut reformer à chaque fois.",
  "Des absences non remplacées, découvertes le matin en ouvrant.",
  "Un prestataire injoignable dès qu'il y a un imprévu ou une demande en plus.",
  "Aucune trace de ce qui a été fait — ni de ce qui ne l'a pas été.",
  "Des locaux propres en surface, mais les vitres, les sanitaires et les poignées oubliés.",
] as const;

const LOCAUX = [
  ["Bureaux et espaces de travail", "Postes, salles de réunion, cuisine et espace détente, sols et corbeilles. Avant l'ouverture ou après la fermeture, selon votre rythme."],
  ["Cabinets et professions libérales", "Cabinets médicaux et paramédicaux, études, agences : salles d'attente, sanitaires et désinfection des surfaces de contact."],
  ["Commerces et vitrines", "Surface de vente, réserve, sanitaires, et vitrerie intérieure comme extérieure — la vitrine est votre première impression."],
  ["Parties communes", "Halls, escaliers, paliers, rampes et mains courantes, pour copropriétés, résidences et immeubles de bureaux."],
  ["Remises en état", "Après travaux, avant emménagement ou à la reprise d'un local. Prestation ponctuelle, devis au forfait après visite."],
  ["Hors des heures d'accueil", "Tôt le matin, en soirée ou le week-end lorsque c'est possible. Les horaires sont fixés au contrat."],
] as const;

const ENGAGEMENTS = [
  ["La discrétion", "Vos dossiers, vos écrans, vos conversations ne nous regardent pas. Rien n'est déplacé, rien n'est ouvert, rien n'est raconté."],
  ["La continuité", "La même personne d'un passage à l'autre. En cas d'absence, vous êtes prévenu avant, et un passage de remplacement est proposé."],
  ["La clarté", "Un tarif annoncé à l'avance. Pas de supplément découvert sur la facture, pas de reconduction tacite imposée."],
] as const;

const ETAPES = [
  ["Vous décrivez vos locaux", "Le formulaire prend deux minutes."],
  ["Nous venons les voir", "Une visite gratuite et sans engagement, pour relever les contraintes d'accès et d'horaires."],
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
          <p className="hero-facts">
            <span>Devis gratuit, sans engagement</span>
            <span>Intervention à {SITE.city} + 15 km</span>
            <span>Toujours la même intervenante</span>
            {LEGAL.siret ? <span>SIRET {LEGAL.siret}</span> : null}
          </p>
        </div>
      </section>

      <section className="lp-sec lp-sec--cream">
        <div className="lp-in">
          <div className="split">
            <div>
              <h2>Le ménage des locaux, ce n&apos;est pas le nettoyage qui coince</h2>
              <p style={{ color: "var(--muted)" }}>
                Ce que nous entendons le plus souvent, ce n&apos;est pas « c&apos;est mal fait ». C&apos;est :
              </p>
              <ul className="pro-griefs">
                {GRIEFS.map((g) => (
                  <li key={g}>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pro-card">
              <h3>Ce que nous faisons différemment</h3>
              <p>
                <strong>Une seule intervenante, la vôtre.</strong> Elle connaît vos locaux, vos horaires et
                vos priorités. Vous ne réexpliquez jamais.
              </p>
              <p>
                <strong>Un cahier des charges écrit.</strong> Établi ensemble lors d&apos;une visite sur place,
                poste par poste. Ce qui est inclus est noté, et ce qui ne l&apos;est pas aussi.
              </p>
              <p>
                <strong>Un compte rendu à chaque passage.</strong> Vous savez ce qui a été fait, même si vous
                n&apos;étiez pas là. Et vous avez un numéro qui répond.
              </p>
            </div>
          </div>
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

      <section className="lp-sec pro-eng">
        <div className="lp-in">
          <h2>Trois choses sur lesquelles nous ne transigeons pas</h2>
          <div className="pro-eng-grid">
            {ENGAGEMENTS.map(([t, d]) => (
              <div key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
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
          <LeadForm defaultClientType="professionnel" />
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
