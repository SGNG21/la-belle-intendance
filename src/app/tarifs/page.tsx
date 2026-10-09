import Link from "next/link";
import { Faq } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { ModesNotice } from "@/components/ModesNotice";
import { Simulator } from "@/components/Simulator";
import { PRICING } from "@/config/site";
import { getFaqs } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

const path = "/tarifs";
const description = "Comment sont établis nos tarifs de ménage à Joigny et ses alentours, simulateur de durée, et les deux modes d'intervention : prestation facturée ou emploi direct déclaré au CESU.";
export const metadata = pageMeta({ title: "Tarifs et modes d'intervention", description, path });

export default function Page() {
  const faqs = getFaqs();
  return (
    <>
      <PageHero title="Tarifs et modes d'intervention" lede="Un prix annoncé avant de commencer, calculé selon ce que votre logement demande." path={path} crumbLabel="Tarifs" />

      <section className="section">
        <div className="wrap split split--wide-left">
          <div className="prose">
            <h2>Comment nous établissons un prix</h2>
            <p>Trois éléments entrent dans le devis : la durée nécessaire, la prestation choisie et la distance depuis Joigny.</p>
            <ul>
              <li>
                <strong>Entretien régulier :</strong> facturé à l'heure ou au forfait, selon la durée d'un passage définie avec vous.
              </li>
              <li>
                <strong>Grand ménage, remise en état :</strong> un forfait, après échange et visite si nécessaire.
              </li>
              <li>
                <strong>Intendance et locations courte durée :</strong> un forfait mensuel ou par rotation, selon la maison.
              </li>
              <li>
                <strong>Entreprises :</strong> un contrat mensuel selon surface et fréquence.
              </li>
            </ul>
            <h3>Déplacement</h3>
            <p>
              Le déplacement est inclus jusqu'à {PRICING.travel.zoneAKm} km de Joigny. Au-delà, un supplément dépend de la distance : il est indiqué dans le devis, jamais ajouté après coup.
            </p>
            <h3>Devis écrit</h3>
            <p>Vous recevez un devis avant toute intervention. Il précise le contenu des passages, la durée, le prix et le mode d&apos;intervention retenu.</p>
            <h3>Emploi direct au CESU</h3>
            <p>
              Si vous préférez m&apos;employer directement plutôt que de faire appel à l&apos;entreprise, vous devenez particulier employeur : vous déclarez les heures sur cesu.urssaf.fr, l&apos;Urssaf calcule les cotisations et vous récupérez 50 % en crédit d&apos;impôt, immédiatement avec CESU+. Nous convenons alors d&apos;un taux horaire net et d&apos;un contrat de travail, au lieu d&apos;un devis et d&apos;une facture.
            </p>
          </div>
          <div style={{ display: "grid", gap: "1.25rem", alignContent: "start" }}>
            <h2 style={{ fontSize: "1.5rem" }}>Prestation ou emploi direct</h2>
            <ModesNotice />
          </div>
        </div>
      </section>

      <section className="section section--cream" id="simulateur">
        <div className="wrap">
          <div className="section-head">
            <h2>Estimer la durée pour votre logement</h2>
            <p className="muted">Quelques informations suffisent pour obtenir un ordre de grandeur.</p>
          </div>
          <Simulator hourlyKnown={PRICING.hourlyTTC != null} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Questions fréquentes</h2>
          </div>
          <Faq items={faqs} />
          <div className="btn-row" style={{ marginTop: "2.5rem" }}>
            <Link className="btn" href="/contact">
              Demander un devis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
