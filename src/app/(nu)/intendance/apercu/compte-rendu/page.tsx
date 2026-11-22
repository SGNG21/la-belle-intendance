import { Bandeau, Carte, Entete, Tag } from "@/components/apercu/Os";
import { EnvoiCR } from "@/components/apercu/EnvoiCR";
import { BIEN, CLIENT, COMPTE_RENDU, INTERVENTION } from "@/lib/apercu/donnees";
import { dateLongue, heures } from "@/lib/apercu/modele";
import { SITE } from "@/config/site";

/**
 * Le compte rendu, tel que le client le recevra.
 *
 * L'écran montre le document lui-même, pas un formulaire : ce qui est à
 * l'écran est ce qui part. Les écarts sont dits, pas masqués — c'est ce qui
 * fait la valeur du document.
 */
export default function Page() {
  const faits = INTERVENTION.checklist.filter((l) => l.fait === true);
  const ecartes = INTERVENTION.checklist.filter((l) => l.fait === false);
  const duree = 4.25;

  return (
    <div className="os-wrap os-wrap--doc">
      <Bandeau>Maquette — aucun e-mail ne partira.</Bandeau>

      <Entete
        kicker="Compte rendu"
        titre={`Passage du ${new Date(INTERVENTION.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
        sous={`${CLIENT.nom} · ${BIEN.libelle}`}
        action={<Tag ton="cours">Validé, à envoyer</Tag>}
      />

      <article className="os-doc">
        <header className="os-doc__head">
          <div className="os-doc__marque">
            {SITE.name}
            <br />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)" }}>
              Compte rendu de passage
            </span>
          </div>
          <div className="os-doc__meta">
            {dateLongue(INTERVENTION.date)}
            <br />
            {INTERVENTION.debut} – {INTERVENTION.fin} · {heures(duree)}
          </div>
        </header>

        <div className="os-doc__corps">
          <h2>Le logement</h2>
          <p style={{ margin: 0 }}>
            {BIEN.libelle}, {BIEN.adresse}, {BIEN.commune}.
          </p>

          <h2>Ce qui a été fait</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {faits.map((l) => (
              <li key={l.id}>
                {l.label}
                {l.note && <span style={{ color: "var(--muted)" }}> — {l.note}</span>}
              </li>
            ))}
          </ul>

          {ecartes.length > 0 && (
            <>
              <h2>Ce qui n&apos;a pas pu être fait</h2>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {ecartes.map((l) => (
                  <li key={l.id}>
                    {l.label}
                    {l.note && <span style={{ color: "var(--muted)" }}> — {l.note}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2>Observations</h2>
          <p style={{ margin: 0 }}>{INTERVENTION.observations}</p>

          <h2>Durée</h2>
          <p style={{ margin: 0 }}>
            {heures(duree)} sur place, pour {heures(INTERVENTION.duree_prevue_h)} prévues.
          </p>
        </div>
      </article>

      <Carte className="os-card--sous-barre" titre="Avant d'envoyer">
        <div className="os-rang">
          <div>Destinataire</div>
          <strong>{COMPTE_RENDU.destinataires[0]}</strong>
        </div>
        <div className="os-rang">
          <div>Copie à l&apos;entreprise</div>
          <strong>Oui</strong>
        </div>
        <div className="os-rang">
          <div>Photos jointes</div>
          <strong className="os-num">{INTERVENTION.photos}</strong>
        </div>
      </Carte>

      <EnvoiCR destinataire={COMPTE_RENDU.destinataires[0]} />
    </div>
  );
}
