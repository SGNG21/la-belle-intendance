import { CONTACT, LEGAL, SITE } from "@/config/site";
import { Fill } from "@/components/Fill";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/meta";

const path = "/confidentialite";
export const metadata = pageMeta({ title: "Politique de confidentialité", description: `Comment ${SITE.name} traite vos données personnelles : finalités, durée, droits.`, path });

export default function Page() {
  return (
    <>
      <PageHero title="Politique de confidentialité" lede="Les données que vous nous confiez servent uniquement à répondre à votre demande." path={path} crumbLabel="Confidentialité" />
      <section className="section">
        <div className="wrap">
          <div className="prose">
            <h2>Responsable du traitement</h2>
            <p>
              {SITE.name}, représentée par <Fill value={LEGAL.publisherName} label="nom de l'exploitant" />. Contact pour toute question sur vos données : <Fill value={LEGAL.dpoOrContact ?? CONTACT.email} label="e-mail RGPD" />.
            </p>

            <h2>Données collectées par le formulaire de devis</h2>
            <p>Type de client, logement (type, surface, nombre de pièces), fréquence souhaitée, commune, précisions libres, nom, téléphone et e-mail. Nous collectons également la page d'origine et, le cas échéant, les paramètres de campagne publicitaire de l'adresse visitée, pour savoir quel canal vous a conduit à nous.</p>

            <h2>Pourquoi nous les utilisons</h2>
            <ul>
              <li>Vous répondre et établir un devis : mesures précontractuelles prises à votre demande.</li>
              <li>Vous recontacter au sujet de cette demande : votre consentement, donné en cochant la case du formulaire.</li>
              <li>Hiérarchiser nos rappels : un score interne, calculé à partir des informations du formulaire, détermine l'ordre dans lequel nous rappelons. Aucune décision ne vous concernant n'est prise automatiquement : une personne vous répond dans tous les cas.</li>
            </ul>

            <h2>Combien de temps nous les gardons</h2>
            <p>Trois ans après notre dernier échange si vous ne devenez pas client. Pour un client, la durée de la relation contractuelle, puis les délais légaux de conservation comptable.</p>

            <h2>Qui y a accès</h2>
            <p>Nous-mêmes, et nos prestataires techniques strictement nécessaires : hébergement du site, outil de traitement des demandes et envoi de messages. Vos données ne sont pas vendues.</p>

            <h2>Mesure d'audience et cookies</h2>
            <p>Le site ne dépose aucun traceur avant votre choix. Si vous acceptez la mesure d'audience, des outils statistiques sont chargés pour comprendre l'usage du site. Vous pouvez changer d'avis à tout moment depuis le lien « Gérer les cookies » en bas de page.</p>

            <h2>Vos droits</h2>
            <p>Vous pouvez demander l'accès à vos données, leur rectification, leur effacement, la limitation ou l'opposition à leur traitement, et retirer votre consentement à tout moment, en écrivant à l'adresse ci-dessus. Vous pouvez aussi saisir la CNIL (cnil.fr).</p>
          </div>
        </div>
      </section>
    </>
  );
}
