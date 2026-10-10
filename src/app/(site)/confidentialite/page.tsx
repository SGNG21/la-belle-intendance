import { CONTACT, LEGAL, SITE } from "@/config/site";
import { Fill } from "@/components/Fill";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/meta";

const path = "/confidentialite";
export const metadata = pageMeta({ title: "Politique de confidentialité", description: `Comment ${SITE.name} traite vos données personnelles : données du formulaire de devis, finalités, durée de conservation et vos droits.`, path });

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
            <p>Votre demande est enregistrée dans notre outil interne de suivi, accessible par mot de passe, afin que rien ne se perde entre votre message et notre réponse.</p>

            <h2>Données conservées si vous devenez client</h2>
            <p>
              Nous tenons une fiche : vos coordonnées, le mode convenu (facturation ou contrat CESU), les caractéristiques du bien (adresse, surface, nombre de pièces), les consignes d&apos;accès que vous nous donnez, les particularités à respecter et les prestations retenues. Nous y ajoutons les devis établis et les comptes rendus de passage, qui peuvent comporter des photos du logement lorsqu&apos;elles éclairent un point signalé.
            </p>
            <p>
              Ces informations servent à exécuter la prestation convenue et à vous en rendre compte. Les consignes d&apos;accès sont conservées parce que vous nous les confiez pour notre intervention ; vous pouvez nous demander de les effacer à tout moment, et nous le faisons à la fin de la relation.
            </p>

            <h2>Pourquoi nous les utilisons</h2>
            <ul>
              <li>Vous répondre et établir un devis : mesures précontractuelles prises à votre demande.</li>
              <li>Vous recontacter au sujet de cette demande : votre consentement, donné en cochant la case du formulaire.</li>
              <li>Hiérarchiser nos rappels : un score interne, calculé à partir des informations du formulaire, détermine l'ordre dans lequel nous rappelons. Aucune décision ne vous concernant n'est prise automatiquement : une personne vous répond dans tous les cas.</li>
            </ul>

            <h2>Combien de temps nous les gardons</h2>
            <p>Trois ans après notre dernier échange si vous ne devenez pas client. Pour un client, la durée de la relation contractuelle, puis les délais légaux de conservation comptable. Les consignes d&apos;accès et les photos jointes aux comptes rendus sont effacées à la fin de la relation.</p>

            <h2>Qui y a accès</h2>
            <p>
              Nous-mêmes, et les prestataires techniques strictement nécessaires au fonctionnement du service :
            </p>
            <ul>
              <li>l&apos;hébergement du site, assuré par {LEGAL.host}&nbsp;;</li>
              <li>la base de données et le stockage des documents, hébergés dans l&apos;Union européenne ;</li>
              <li>l&apos;envoi des e-mails (accusé de réception, devis, compte rendu), depuis des serveurs situés dans l&apos;Union européenne.</li>
            </ul>
            <p>
              L&apos;hébergeur du site est établi aux États-Unis : des transferts hors de l&apos;Union européenne peuvent donc avoir lieu, encadrés par les garanties contractuelles prévues par ce prestataire. Vos données ne sont ni vendues, ni cédées à des tiers à des fins commerciales.
            </p>

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
