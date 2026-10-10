import { CONTACT, LEGAL, SITE } from "@/config/site";
import { Fill } from "@/components/Fill";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/meta";

const path = "/mentions-legales";
export const metadata = { ...pageMeta({ title: "Mentions légales", description: `Mentions légales de ${SITE.name} : éditeur, identité juridique, assurance, hébergement, crédits visuels et propriété intellectuelle du site.`, path }) };

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

            <h2>Modes d&apos;intervention et fiscalité</h2>
            <p>
              L&apos;entreprise n&apos;est pas déclarée au titre des services à la personne. Les prestations qu&apos;elle facture n&apos;ouvrent droit à aucun crédit ni aucune réduction d&apos;impôt, et aucun avantage fiscal n&apos;est annoncé à ce titre sur ce site.
            </p>
            <p>
              Le client peut, s&apos;il le préfère, recourir à l&apos;emploi direct : il devient alors particulier employeur et déclare les heures auprès de l&apos;Urssaf via le CESU. C&apos;est l&apos;emploi d&apos;un salarié à domicile qui ouvre droit, pour l&apos;employeur, au crédit d&apos;impôt de 50 % prévu à l&apos;article 199 sexdecies du code général des impôts. Ce régime relève de la relation entre le client et l&apos;Urssaf, non d&apos;une prestation de l&apos;entreprise.
            </p>

            <h2>Hébergement</h2>
            <p>{LEGAL.host}.</p>

            <h2>Crédits visuels</h2>
            <p>
              Les photographies d'ambiance du site sont des images de synthèse générées par intelligence artificielle. Elles illustrent le type de
              prestation proposé&nbsp;: elles ne représentent ni un logement de client, ni une intervention réalisée. Aucune comparaison avant/après n'est
              présentée sur ce site.
            </p>

            <h2>Propriété intellectuelle</h2>
            <p>Les textes, le sceau et les éléments graphiques du site sont la propriété de {SITE.name}. Toute reproduction sans autorisation est interdite.</p>
          </div>
        </div>
      </section>
    </>
  );
}
