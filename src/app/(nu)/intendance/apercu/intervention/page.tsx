import { Bandeau, Carte, Champ, Entete, Tag } from "@/components/apercu/Os";
import { Checklist } from "@/components/apercu/Checklist";
import { Acces } from "@/components/apercu/Acces";
import { BIEN, CLIENT, INTERVENTION } from "@/lib/apercu/donnees";
import type { Role } from "@/lib/apercu/permissions";
import { dateLongue, heures } from "@/lib/apercu/modele";

/**
 * Un passage, du téléphone.
 *
 * L'écran s'ouvre sur ce qu'il faut savoir avant d'entrer, puis déroule le
 * relevé. L'action principale reste accrochée en bas : on ne cherche jamais
 * le bouton « clore ».
 */
export default function Page() {
  // Une intervenante voit les consignes de ses propres passages, pas les tarifs.
  const role: Role = "intervenant";
  return (
    <div className="os-wrap os-wrap--doc">
      <Bandeau>Maquette — rien n&apos;est enregistré.</Bandeau>

      <Entete
        kicker={dateLongue(INTERVENTION.date)}
        titre={BIEN.libelle}
        sous={`${CLIENT.nom} · ${BIEN.commune} · ${BIEN.km} km`}
        action={<Tag ton="cours">En cours</Tag>}
      />

      <div className="os-grid">
        <Carte titre="Avant d'entrer">
          <Acces texte={BIEN.acces} role={role} bienId={BIEN.id} />
          <div className="os-note" style={{ marginTop: "1rem" }}>
            <strong>À savoir.</strong> {BIEN.particularites}
          </div>
          <dl className="os-dl" style={{ marginTop: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))" }}>
            <Champ k="Arrivée">
              <span className="os-num">{INTERVENTION.debut}</span>
            </Champ>
            <Champ k="Prévu">{heures(INTERVENTION.duree_prevue_h)}</Champ>
            <Champ k="Photos">{INTERVENTION.photos_autorisees ? "Autorisées" : "Refusées par le client"}</Champ>
          </dl>
        </Carte>

        <Checklist initial={INTERVENTION.checklist} prevue={INTERVENTION.duree_prevue_h} interventionId={INTERVENTION.id} />

        <Carte titre="Observations">
          <p style={{ marginTop: 0 }}>{INTERVENTION.observations}</p>
          <p className="os-sub">
            Ce texte est repris tel quel dans le compte rendu. {INTERVENTION.photos} photos jointes.
          </p>
        </Carte>
      </div>
    </div>
  );
}
