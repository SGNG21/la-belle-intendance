import Link from "next/link";
import { FOUNDER, SITE } from "@/config/site";
import { Check } from "@/components/Icons";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/meta";

const path = "/a-propos";
const description = "La Belle Intendance est une entreprise de ménage et d'intendance de maison installée à Joigny (Yonne). Notre méthode, nos engagements et la personne qui dirige.";
export const metadata = pageMeta({ title: "À propos de La Belle Intendance", description, path });

export default function Page() {
  return (
    <>
      <PageHero title={`À propos de ${SITE.name}`} lede="Une entreprise locale, installée à Joigny, qui prend soin des maisons de ses clients comme de la sienne." path={path} crumbLabel="À propos" />

      <section className="section">
        <div className="wrap split">
          <div className="prose">
            <h2>Qui nous sommes</h2>
            <p>
              {SITE.name} est une entreprise de ménage et d'intendance de maison basée à {SITE.city}, dans l'{SITE.department}. Elle intervient auprès des particuliers, pour l'entretien régulier, les grands ménages et les grandes demeures, et auprès des professionnels pour l'entretien de leurs locaux.
            </p>
            {FOUNDER.firstName ? (
              <p>
                Elle est dirigée par {FOUNDER.firstName}
                {FOUNDER.role ? `, ${FOUNDER.role.toLowerCase()}` : ""}, qui intervient elle-même sur le terrain et reste votre interlocutrice.
              </p>
            ) : null}
            <h2>Pourquoi « intendance »</h2>
            <p>Le mot désigne ce qui fait qu'une maison fonctionne : qu'elle soit propre, mais aussi prête, surveillée et en bon état. C'est cette approche que nous appliquons, y compris pour un simple entretien hebdomadaire.</p>
          </div>
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Nos engagements</h2>
            <ul className="checklist">
              {[
                "Un devis écrit avant toute intervention",
                "Un cahier des charges établi avec vous, et tenu à jour",
                "La même personne à chaque passage, autant que possible",
                "Un compte rendu pour les grandes demeures et résidences secondaires",
                "La discrétion : votre maison, vos clés et vos informations restent chez nous",
              ].map((t) => (
                <li key={t}>
                  <Check />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="btn-row" style={{ marginTop: "2rem" }}>
              <Link className="btn" href="/contact">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
