import { CONTACT, SITE } from "@/config/site";
import { ApercuCompteRendu, Citation, Etapes, PointsCles } from "@/components/Arguments";
import { Fill } from "@/components/Fill";
import { LeadForm } from "@/components/LeadForm";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/meta";

const path = "/contact";
const description = "Demandez un devis de ménage ou d'intendance à Joigny et ses alentours. Décrivez votre besoin, nous vous rappelons et nous vous envoyons un devis écrit.";
export const metadata = pageMeta({ title: "Demander un devis de ménage à Joigny", description, path });

/**
 * La page de contact du site.
 *
 * Même propos et même mise en page que la page de destination des campagnes :
 * les blocs sont partagés. Elle garde l'en-tête, le pied de page et les
 * autres moyens de joindre l'entreprise — un visiteur venu du menu doit
 * pouvoir appeler, ou continuer sa visite. C'est la seule différence, et elle
 * est voulue : /devis est un cul-de-sac exprès, pas celle-ci.
 */
export default function Page() {
  return (
    <>
      <PageHero
        title="Demander un devis"
        lede="Décrivez votre besoin. Nous vous rappelons pour le préciser, puis nous vous envoyons un devis écrit."
        path={path}
        crumbLabel="Contact"
      />

      <PointsCles />
      <Citation />
      <ApercuCompteRendu />
      <Etapes />

      <section className="section" id="formulaire">
        <div className="wrap split split--wide-left">
          <LeadForm />
          <aside className="prose" aria-label="Autres moyens de nous joindre">
            <h2 style={{ fontSize: "1.5rem" }}>Autres moyens</h2>
            <p>
              <strong>Téléphone</strong>
              <br />
              {CONTACT.phone ? <a href={`tel:${CONTACT.phoneE164 ?? ""}`}>{CONTACT.phone}</a> : <Fill value={CONTACT.phone} label="téléphone" />}
            </p>
            <p>
              <strong>E-mail</strong>
              <br />
              {CONTACT.email ? <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> : <Fill value={CONTACT.email} label="e-mail" />}
            </p>
            <p>
              <strong>Zone</strong>
              <br />
              {SITE.city} et ses alentours
            </p>
            {CONTACT.hours ? (
              <p>
                <strong>Horaires</strong>
                <br />
                {CONTACT.hours}
              </p>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
