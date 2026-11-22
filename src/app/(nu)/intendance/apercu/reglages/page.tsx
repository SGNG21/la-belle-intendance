import { Bandeau, Carte, Champ, Entete, Tag } from "@/components/apercu/Os";
import { euros } from "@/lib/apercu/modele";

/**
 * Les réglages.
 *
 * Tout ce qui est écrit ici se retrouve sur un document envoyé au client :
 * c'est pourquoi la page dit, pour chaque réglage, où il apparaît.
 */
export default function Page() {
  return (
    <div className="os-wrap">
      <Bandeau>Maquette — rien n&apos;est enregistré.</Bandeau>
      <Entete kicker="Paramètres" titre="Réglages" sous="Ce qui alimente les devis, les comptes rendus et les factures." />

      <div className="os-grid os-grid--2">
        <Carte titre="Tarifs">
          <dl className="os-dl">
            <Champ k="Heure, particulier">
              <span className="os-num">{euros(32)}</span>
            </Champ>
            <Champ k="Heure, professionnel">
              <span className="os-num">{euros(38)}</span>
            </Champ>
            <Champ k="Zone incluse">10 km autour de Joigny</Champ>
            <Champ k="Au-delà">
              <span className="os-num">{euros(12)}</span> puis <span className="os-num">{euros(34)}</span>
            </Champ>
          </dl>
          <p className="os-sub" style={{ marginTop: "1rem" }}>Apparaît sur les devis et les factures.</p>
        </Carte>

        <Carte titre="Automatisations" action={<Tag ton="attente">n8n</Tag>}>
          <div className="os-rang">
            <div>Rappel au client la veille d&apos;un passage</div>
            <Tag ton="fait">Active</Tag>
          </div>
          <div className="os-rang">
            <div>Brouillon de compte rendu après un passage</div>
            <Tag ton="fait">Active</Tag>
          </div>
          <div className="os-rang">
            <div>Relance d&apos;une facture à 15 jours</div>
            <Tag ton="fait">Active</Tag>
          </div>
          <div className="os-rang">
            <div>Demande d&apos;avis après le troisième passage</div>
            <Tag ton="attente">En pause</Tag>
          </div>
          <p className="os-sub" style={{ marginTop: "1rem" }}>
            Aucune n&apos;envoie réellement en phase de maquette.
          </p>
        </Carte>

        <Carte titre="Modèles">
          <div className="os-rang">
            <div>Compte rendu de passage</div>
            <Tag ton="fait">Par défaut</Tag>
          </div>
          <div className="os-rang">
            <div>Compte rendu de résidence secondaire</div>
            <Tag ton="attente">Variante</Tag>
          </div>
          <div className="os-rang">
            <div>Devis d&apos;entretien régulier</div>
            <Tag ton="fait">Par défaut</Tag>
          </div>
        </Carte>

        <Carte titre="Facturation">
          <dl className="os-dl">
            <Champ k="Régime">Franchise en base de TVA</Champ>
            <Champ k="Mention">Article 293 B du CGI</Champ>
            <Champ k="Numérotation">
              <span className="os-num">2026-041</span>, continue, sans trou
            </Champ>
            <Champ k="Échéance">30 jours</Champ>
          </dl>
          <div className="os-note" style={{ marginTop: "1rem" }}>
            <strong>Facturation électronique.</strong> Obligatoire en réception dès septembre 2026, en émission selon
            la taille de l&apos;entreprise. Passage par une plateforme agréée prévu — voir l&apos;architecture.
          </div>
        </Carte>
      </div>
    </div>
  );
}
