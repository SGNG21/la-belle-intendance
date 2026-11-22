import { Bandeau, Carte, Entete, Tag } from "@/components/apercu/Os";
import { EmissionFacture } from "@/components/apercu/EmissionFacture";
import { CLIENT, FACTURE, INTERVENTION } from "@/lib/apercu/donnees";
import { euros, facturable, nombre, totalHT, totalLigneFacture, totalTTC } from "@/lib/apercu/modele";
import { SITE } from "@/config/site";

/**
 * La facture en préparation.
 *
 * Elle naît du passage, pas d'une saisie : la ligne est pré-remplie avec la
 * durée réellement passée, pas la durée prévue. Coralie corrige si elle veut
 * arrondir en faveur du client, ce qui arrive plus souvent que l'inverse.
 */
export default function Page() {
  const verrou = facturable(INTERVENTION);
  const numeroPrevu = "2026-042";

  return (
    <div className="os-wrap os-wrap--doc">
      <Bandeau>Maquette — aucune facture officielle n&apos;est créée.</Bandeau>

      <Entete
        kicker="Facture en préparation"
        titre={`Brouillon · ${numeroPrevu}`}
        sous={`${CLIENT.nom} · CESU, sans TVA`}
        action={<Tag ton="attente">Brouillon</Tag>}
      />

      {verrou.ok ? (
        <div className="os-note">
          <strong>Prêt à facturer.</strong> Le passage est terminé et son compte rendu est établi.
        </div>
      ) : (
        <div className="os-note os-note--alerte">
          <strong>Facturation bloquée.</strong> {verrou.raison}
        </div>
      )}

      <article className="os-doc" style={{ marginTop: "1rem" }}>
        <header className="os-doc__head">
          <div className="os-doc__marque">
            {SITE.name}
            <br />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)" }}>
              Facture
            </span>
          </div>
          <div className="os-doc__meta">
            N° {numeroPrevu}
            <br />
            Émise le —
            <br />
            Échéance à 30 jours
          </div>
        </header>

        <div style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--line)" }}>
          <div className="os-card__title">Facturé à</div>
          <p style={{ margin: "0.5rem 0 0", fontFamily: "var(--font-serif)", fontSize: "1.0625rem" }}>
            {CLIENT.nom}
            <br />
            {CLIENT.commune}
          </p>
        </div>

        <table className="os-table" style={{ marginTop: "1.5rem" }}>
          <thead>
            <tr>
              <th>Prestation</th>
              <th className="os-r">Quantité</th>
              <th className="os-r">Prix unitaire</th>
              <th className="os-r">Total</th>
            </tr>
          </thead>
          <tbody>
            {FACTURE.lignes.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.libelle}
                  {l.intervention_id && (
                    <>
                      <br />
                      <span className="os-sub">Rattachée au passage du 24 novembre</span>
                    </>
                  )}
                </td>
                <td className="os-r">
                  {nombre(l.quantite)} {l.unite}
                </td>
                <td className="os-r">{euros(l.pu)}</td>
                <td className="os-r">{euros(totalLigneFacture(l))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="os-r">
                Total
              </td>
              <td className="os-r">
                <span className="os-total">{euros(totalTTC(FACTURE))}</span>
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="os-sub" style={{ marginTop: "1.5rem" }}>
          TVA non applicable, article 293 B du code général des impôts. Prestation éligible au crédit d&apos;impôt
          services à la personne. Total HT {euros(totalHT(FACTURE))}.
        </p>
      </article>

      <Carte className="os-card--sous-barre" titre="Comment la ligne a été calculée">
        <div className="os-rang">
          <div>Durée prévue à l&apos;abonnement</div>
          <span className="os-num">4 h 30</span>
        </div>
        <div className="os-rang">
          <div>Durée réellement passée</div>
          <span className="os-num">4 h 15</span>
        </div>
        <div className="os-rang">
          <div>Retenu pour la facture</div>
          <strong className="os-num">4 h 15</strong>
        </div>
        <p className="os-sub" style={{ marginTop: "0.75rem" }}>
          C&apos;est le temps réel qui est facturé, jamais le temps prévu. Le montant reste modifiable tant que la
          facture est un brouillon.
        </p>
      </Carte>

      <EmissionFacture numeroPrevu={numeroPrevu} />
    </div>
  );
}
