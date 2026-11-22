import { Bandeau, Carte, Entete, Lien, Stat, Tag } from "@/components/apercu/Os";
import { ABONNEMENT, CLIENT, BIEN, INTERVENTION, PROCHAINS } from "@/lib/apercu/donnees";
import { avancement, euros, heures } from "@/lib/apercu/modele";

/**
 * Aujourd'hui — l'écran qu'on ouvre le matin.
 *
 * Il répond à trois questions dans cet ordre : où je vais, qu'est-ce qui
 * bloque, où en est l'argent. Rien d'autre. Les graphiques vivent dans
 * Finances : ici on agit.
 */
export default function Page() {
  const av = avancement(INTERVENTION.checklist);

  return (
    <div className="os-wrap">
      <Bandeau>Maquette — données fictives, aucun envoi réel.</Bandeau>

      <Entete
        kicker="Mardi 24 novembre"
        titre="Bonjour Coralie"
        sous="Un passage aujourd'hui, et deux choses qui attendent votre main."
      />

      <div className="os-grid os-grid--side">
        <div className="os-grid">
          <Carte titre="À traiter maintenant">
            <div className="os-rang">
              <div>
                <strong>Compte rendu du 24 novembre</strong>
                <br />
                <span className="os-sub">
                  {CLIENT.nom} · validé, pas encore envoyé
                </span>
              </div>
              <Lien href="/intendance/apercu/compte-rendu" variante="plein">
                Relire et envoyer
              </Lien>
            </div>
            <div className="os-rang">
              <div>
                <strong>Facture à établir</strong>
                <br />
                <span className="os-sub">1 passage non facturé · {euros(136)}</span>
              </div>
              <Lien href="/intendance/apercu/facture">Préparer</Lien>
            </div>
          </Carte>

          <Carte titre="Le passage du jour">
            <div className="os-rang">
              <div>
                <strong>{BIEN.libelle}</strong>
                <br />
                <span className="os-sub">
                  {CLIENT.nom} · {BIEN.commune} · {BIEN.km} km
                </span>
              </div>
              <Tag ton="fait">Faite</Tag>
            </div>
            <div style={{ padding: "0.75rem 0" }}>
              <div className="os-jauge" aria-hidden="true">
                <div className="os-jauge__in" style={{ width: `${Math.round(av.part * 100)}%` }} />
              </div>
              <p className="os-sub" style={{ marginTop: "0.5rem" }}>
                {av.faits} postes faits, {av.ecartes} écarté, {av.restants} non relevé ·{" "}
                {INTERVENTION.debut}–{INTERVENTION.fin} au lieu de {heures(INTERVENTION.duree_prevue_h)} prévues
              </p>
            </div>
            <Lien href="/intendance/apercu/intervention">Ouvrir le passage</Lien>
          </Carte>

          <Carte titre="Ensuite">
            {PROCHAINS.map((p) => (
              <div key={p.id} className="os-rang">
                <div>
                  <strong className="os-num">
                    {new Date(p.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                  </strong>
                  <br />
                  <span className="os-sub">
                    {p.libelle} · {CLIENT.nom}
                  </span>
                </div>
                <span className="os-num os-sub">
                  {p.heure} · {heures(p.duree_h)}
                </span>
              </div>
            ))}
          </Carte>
        </div>

        <div className="os-grid">
          <Carte titre="Le mois">
            <div className="os-grid" style={{ gap: "1.25rem" }}>
              <Stat k="Encaissé" v={euros(1288)} n="novembre" />
              <Stat k="Facturé, en attente" v={euros(144)} n="1 facture" />
              <Stat k="À facturer" v={euros(136)} n="1 passage" />
              <Stat k="Heures travaillées" v="38 h 45" n="sur 9 passages" />
            </div>
          </Carte>

          <Carte titre="Abonnements">
            <div className="os-rang">
              <div>
                <strong>{CLIENT.nom}</strong>
                <br />
                <span className="os-sub">Quinzaine, mardi · {heures(ABONNEMENT.duree_h)}</span>
              </div>
              <Tag ton="fait">Actif</Tag>
            </div>
            <p className="os-sub" style={{ marginTop: "0.75rem" }}>
              {euros(ABONNEMENT.duree_h * ABONNEMENT.tarif_horaire * 2)} par mois en moyenne.
            </p>
          </Carte>

          <Carte titre="Acquisition">
            <div className="os-rang">
              <div>2 demandes cette semaine</div>
              <Tag ton="cours">À rappeler</Tag>
            </div>
            <div className="os-rang">
              <div>1 devis sans réponse depuis 9 jours</div>
              <Tag ton="alerte">Relancer</Tag>
            </div>
          </Carte>
        </div>
      </div>
    </div>
  );
}
