import { CONTACT, LEGAL, SAP, SITE, sapActive } from "@/config/site";
import { Fill } from "@/components/Fill";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/meta";

const path = "/mentions-legales";
export const metadata = { ...pageMeta({ title: "Mentions légales", description: `Mentions légales du site ${SITE.name}.`, path }) };

export default function Page() {
  return (
    <>
      <PageHero title="Mentions légales" path={path} />
      <section className="section">
        <div className="wrap">
          <div className="prose">
            <h2>Éditeur du site</h2>
            <p>
              {SITE.name}, exploitée par <Fill value={LEGAL.publisherName} label="nom de l'exploitant" /> ({LEGAL.legalForm}).
              <br />
              SIRET : <Fill value={LEGAL.siret} label="SIRET" />
              <br />
              {LEGAL.vatMention ? LEGAL.vatMention : <Fill value={LEGAL.vatMention} label="mention TVA" />}
              <br />
              {SITE.postalCode} {SITE.city}, {SITE.department}, France
              <br />
              Contact : <Fill value={CONTACT.email} label="e-mail" /> · <Fill value={CONTACT.phone} label="téléphone" />
            </p>
            <p>
              Directrice de la publication : <Fill value={LEGAL.publisherName} label="nom de l'exploitant" />.
            </p>

            <h2>Services à la personne</h2>
            {sapActive() ? (
              <p>
                Entreprise déclarée au titre des services à la personne, déclaration n° {SAP.declarationNumber}
                {SAP.declarationDate ? ` du ${SAP.declarationDate}` : ""}.
              </p>
            ) : (
              <p>Aucune mention d'avantage fiscal n'est faite sur ce site tant que la déclaration au titre des services à la personne n'est pas effective.</p>
            )}

            <h2>Assurance</h2>
            <p>
              Responsabilité civile professionnelle souscrite auprès de <Fill value={LEGAL.insurer} label="assureur" />.
            </p>

            <h2>Hébergement</h2>
            <p>{LEGAL.host}.</p>

            <h2>Propriété intellectuelle</h2>
            <p>Les textes, le sceau et les éléments graphiques du site sont la propriété de {SITE.name}. Toute reproduction sans autorisation est interdite.</p>
          </div>
        </div>
      </section>
    </>
  );
}
