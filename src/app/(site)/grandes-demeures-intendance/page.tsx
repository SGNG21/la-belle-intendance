import Link from "next/link";
import { Check } from "@/components/Icons";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { Band, Figure } from "@/components/Figure";
import { ModesNotice } from "@/components/ModesNotice";
import { pageMeta } from "@/lib/meta";
import { service } from "@/lib/schema";

const path = "/grandes-demeures-intendance";
const description = "Entretien de grandes maisons et intendance de résidences secondaires à Joigny (89) : préparation avant votre arrivée, contrôle après votre départ, compte rendu.";
export const metadata = pageMeta({ title: "Intendance de grandes demeures", description, path });

const faqs = [
  {
    q: "Qu'est-ce que l'intendance de maison ?",
    a: "C'est l'ensemble des tâches qui permettent à une maison d'être prête et en bon état quand vous y arrivez : ménage complet, aération, vérification visuelle, coordination des intervenants, remise en ordre à votre départ. Les lits et le linge de maison sont une option, à convenir ensemble. Le périmètre exact est défini bien par bien.",
  },
  {
    q: "Comment suis-je tenu informé si je suis loin ?",
    a: "Après chaque intervention, nous vous transmettons un compte rendu : ce qui a été fait, ce qui mérite votre attention, et des photos si nécessaire.",
  },
  {
    q: "Faut-il une visite avant de commencer ?",
    a: "Pour une grande maison ou une résidence secondaire, oui : c'est ce qui permet de chiffrer juste et d'écrire un cahier des charges adapté à la maison, à ses matériaux et à vos attentes.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={service({ name: "Grandes demeures et intendance de résidence", description, path, serviceType: "Intendance de résidence" })} />
      <PageHero
        title="Grandes demeures et résidences secondaires"
        lede="Une maison qu'on occupe par intermittence, ou trop grande pour être suivie seul, demande plus qu'un coup de balai : elle demande qu'on s'en occupe."
        path={path}
        crumbLabel="Grandes demeures"
      >
        <div className="btn-row">
          <Link className="btn" href="/contact?type=particulier#formulaire">
            Demander une visite et un devis
          </Link>
        </div>
      </PageHero>

      <Band
        src="/images/preparation-maison-avant-arrivee.webp"
        alt="Chambre préparée avant l'arrivée des propriétaires, fenêtre ouverte sur le jardin"
      />

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Avant, pendant, après : trois temps</h2>
            <p className="muted">Le contenu se règle maison par maison. Voici la trame que nous proposons.</p>
          </div>
          <div className="columns-3" style={{ color: "var(--ink)" }}>
            <div>
              <h3>Avant votre arrivée</h3>
              <ul className="checklist">
                {["Ouverture des volets et aération", "Ménage complet de toutes les pièces", "Salles de bains prêtes", "Vérification visuelle de la maison et des abords", "Lits et linge de maison : en option, à convenir"].map((t) => (
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
                {["Passages de contrôle du bien", "Coordination des intervenants : jardinier, artisan, entreprise de chauffage", "Signalement de ce qui change (humidité, dégât, effraction)"].map((t) => (
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
                {["Ménage de remise en ordre", "Fermeture de la maison", "Compte rendu envoyé, photos à l'appui"].map((t) => (
                  <li key={t}>
                    <Check />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap" style={{ maxWidth: "34rem" }}>
          <Figure
            src="/images/compte-rendu-photo-intendance.webp"
            alt="Compte rendu de passage consulté sur un téléphone, dans un salon"
            caption="Le contenu du compte rendu est fixé avec vous."
            sizes="(max-width: 900px) 100vw, 34rem"
          />
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap split">
          <div className="prose">
            <h2>Des maisons qui ont une histoire</h2>
            <p>Planchers anciens, boiseries, pierre, carreaux de ciment, vitrages à petits bois : chaque matériau s'entretient à sa manière. Nous commençons toujours par une visite pour savoir ce que la maison supporte et ce qu'elle demande.</p>
            <p>Le cahier des charges qui en sort liste les pièces, les produits à éviter, les accès, les contacts utiles en cas de problème. Il reste à jour au fil des passages.</p>
          </div>
          <div className="prose">
            <h2>Locations de courte durée</h2>
            <p>Si vous louez votre maison ou un gîte, nous assurons le ménage entre deux séjours, facturé au forfait par rotation. Les lits et le linge de maison sont une option, à convenir ensemble avant la première rotation.</p>
            <p className="muted">Les locations de courte durée sont toujours facturées par l&apos;entreprise, au forfait par rotation.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <ModesNotice />
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap">
          <div className="section-head">
            <h2>Questions fréquentes</h2>
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      <section className="section section--deep on-dark">
        <div className="wrap split">
          <h2>Commençons par une visite</h2>
          <div className="btn-row" style={{ alignSelf: "center" }}>
            <Link className="btn" href="/contact?type=particulier#formulaire">
              Demander une visite et un devis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
