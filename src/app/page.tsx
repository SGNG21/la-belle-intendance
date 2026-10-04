import Link from "next/link";
import { COMMUNES, SERVICES, SITE } from "@/config/site";
import { Check, Sprig } from "@/components/Icons";
import { ReportCard } from "@/components/ReportCard";
import Image from "next/image";
import { Figure } from "@/components/Figure";
import { SapNotice } from "@/components/SapNotice";
import { Faq } from "@/components/Faq";
import { getFaqs } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Ménage et intendance de maison à Joigny et alentour",
  description: SITE.description,
  path: "/",
});

const STEPS = [
  { t: "Vous décrivez votre besoin", d: "Quelques questions sur le logement, le rythme et votre commune. Deux minutes suffisent." },
  { t: "Nous échangeons", d: "Nous vous rappelons. Pour une grande maison, nous passons la voir avant de chiffrer." },
  { t: "Vous recevez un devis écrit", d: "Le contenu des passages, la durée et le prix sont écrits avant toute intervention." },
  { t: "Nous commençons", d: "Un premier passage, puis le rythme que vous avez choisi. Vous ajustez quand vous le souhaitez." },
];

export default function HomePage() {
  const faqs = getFaqs();
  return (
    <>
      <section className="hero on-dark">
        <div className="hero-bg">
          <Image
            src="/images/maison-terrasse-vallee.webp"
            alt="Maison de pierre et sa terrasse, ouvertes sur la vallée de l'Yonne au couchant"
            width={1672}
            height={941}
            sizes="100vw"
            priority
          />
        </div>
        <Sprig className="sprig" />
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Ménage soigné et intendance de maison, à Joigny et alentour</h1>
              <p className="lede">
                De l'appartement à la grande demeure, nous entretenons votre maison selon un cahier des charges écrit ensemble, et nous vous en rendons compte.
              </p>
              <div className="btn-row">
                <Link className="btn" href="/contact">
                  Demander un devis
                </Link>
                <Link className="btn btn--ghost" href="/tarifs#simulateur">
                  Estimer mon besoin
                </Link>
              </div>
              <p className="hero-facts">
                <span>Joigny et {SITE.radiusKm} km alentour</span>
                <span>Devis écrit avant toute intervention</span>
                <span>Particuliers et entreprises</span>
              </p>
            </div>
            <ReportCard />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Ce que nous prenons en charge</h2>
            <p className="muted">Cinq prestations, un même soin du détail. Chacune a sa page, avec ce qui est inclus et la façon de la commander.</p>
          </div>
          <ul className="rows">
            {SERVICES.map((s) => (
              <li className="row" key={s.href}>
                <h3>
                  <Link href={s.href}>{s.name}</Link>
                </h3>
                <p className="muted">{s.short}</p>
                <Link className="link-quiet" href={s.href}>
                  Voir le détail
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--navy on-dark">
        <div className="wrap">
          <div className="section-head">
            <h2>Une maison qu'on ne voit pas tout le temps mérite qu'on la suive</h2>
            <p className="lede">Grandes maisons, demeures de caractère, résidences secondaires : nous préparons, contrôlons et remettons en ordre, avant et après votre passage.</p>
          </div>
          <div className="columns-3">
            <div>
              <h3>Avant votre arrivée</h3>
              <ul className="checklist">
                {["Ouverture et aération", "Ménage complet", "Lits faits, linge changé", "Vérification visuelle de la maison"].map((t) => (
                  <li key={t}>
                    <Check />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Pendant votre absence</h3>
              <ul className="checklist">
                {["Passages de contrôle du bien", "Coordination des intervenants (jardin, artisans)", "Signalement de tout ce qui change"].map((t) => (
                  <li key={t}>
                    <Check />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Après votre départ</h3>
              <ul className="checklist">
                {["Ménage de remise en ordre", "Fermeture de la maison", "Compte rendu et photos"].map((t) => (
                  <li key={t}>
                    <Check />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ maxWidth: "34rem", margin: "2.5rem auto 0" }}>
            <Figure
              src="/images/compte-rendu-photo-intendance.webp"
              alt="Compte rendu de passage consulté sur un téléphone, dans un salon"
              caption="Image d'ambiance. Le contenu du compte rendu est fixé avec vous."
              sizes="(max-width: 900px) 100vw, 34rem"
            />
          </div>
          <div className="btn-row" style={{ marginTop: "2.5rem" }}>
            <Link className="btn" href="/grandes-demeures-intendance">
              Découvrir l'intendance de maison
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Comment ça se passe</h2>
          </div>
          <ol className="timeline">
            {STEPS.map((s) => (
              <li key={s.t}>
                <h3>{s.t}</h3>
                <p className="muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap split split--wide-left">
          <div style={{ display: "grid", gap: "1.5rem" }}>
            <h2>Joigny, et vingt-cinq kilomètres autour</h2>
            <p className="communes">
              {COMMUNES.map((c) => (
                <span key={c} className={c === "Joigny" ? "core" : undefined}>
                  {c}
                </span>
              ))}
            </p>
            <p className="muted">Votre commune n'est pas dans la liste ? Demandez-nous, nous répondons selon la distance.</p>
            <div className="btn-row">
              <Link className="btn btn--ghost" href="/joigny">
                Notre zone d'intervention
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gap: "1.25rem", alignContent: "start" }}>
            <h2 style={{ fontSize: "1.5rem" }}>Crédit d'impôt</h2>
            <SapNotice />
            <Link className="link-quiet" href="/tarifs">
              Tarifs et crédit d'impôt
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Questions fréquentes</h2>
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      <section className="section section--deep on-dark">
        <div className="wrap split">
          <div style={{ display: "grid", gap: "1rem" }}>
            <h2>Parlons de votre maison</h2>
            <p className="lede">Décrivez votre besoin, nous vous rappelons et nous vous envoyons un devis écrit.</p>
          </div>
          <div className="btn-row" style={{ alignSelf: "center" }}>
            <Link className="btn" href="/contact">
              Demander un devis
            </Link>
            <Link className="btn btn--ghost" href="/tarifs#simulateur">
              Estimer mon besoin
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
