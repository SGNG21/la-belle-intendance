import { CONTACT, SITE } from "@/config/site";
import { Fill } from "@/components/Fill";
import { LeadForm } from "@/components/LeadForm";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/meta";

const path = "/contact";
const description = "Demandez un devis de ménage ou d'intendance à Joigny et alentour. Décrivez votre besoin, nous vous rappelons et nous vous envoyons un devis écrit.";
export const metadata = pageMeta({ title: "Demander un devis de ménage à Joigny", description, path });

export default function Page() {
  return (
    <>
      <PageHero title="Demander un devis" lede="Décrivez votre besoin. Nous vous rappelons pour le préciser, puis nous vous envoyons un devis écrit." path={path} crumbLabel="Contact" />
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
              {SITE.city} et {SITE.radiusKm} km alentour
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
