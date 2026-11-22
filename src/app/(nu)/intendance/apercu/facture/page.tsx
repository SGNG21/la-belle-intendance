import { Bandeau, Carte, Entete, Stat, Tag } from "@/components/apercu/Os";
import { EmissionFacture } from "@/components/apercu/EmissionFacture";
import { CLIENT, CONTRAT, COUT, ECARTS_RECENTS, INTERVENTION, SUPPLEMENTS } from "@/lib/apercu/donnees";
import { facturable } from "@/lib/apercu/modele";
import { alerteEcart, calculer, euros, heures, LABEL_BASE, rentabilite } from "@/lib/apercu/facturation";
import { droits, type Role } from "@/lib/apercu/permissions";
import { SITE } from "@/config/site";

/**
 * La facture en préparation.
 *
 * Le prix vient du contrat et des suppléments approuvés. **Le temps réellement
 * passé n'y entre pas** : il est affiché à côté, dans la rentabilité, pour que
 * Coralie sache ce que le passage rapporte et décide s'il faut renégocier.
 * Facturer le temps réel reviendrait à punir le client d'un retard et à
 * récompenser la lenteur.
 */
export default function Page() {
  // En production, le rôle vient de la session. Ici, celui de la responsable.
  const role: Role = "proprietaire";
  const peut = droits(role);

  const reelles = 4.25;
  const calcul = calculer(CONTRAT, SUPPLEMENTS, reelles);
  const verrou = facturable(INTERVENTION);
  const numeroPrevu = "2026-042";
  const marge = rentabilite(calcul.total_ht, reelles, INTERVENTION.km, CONTRAT.heures_convenues, COUT);
  const alerte = alerteEcart(ECARTS_RECENTS, CONTRAT.heures_convenues ?? 0);

  return (
    <div className="os-wrap os-wrap--doc">
      <Bandeau>Maquette — aucune facture officielle n&apos;est créée.</Bandeau>

      <Entete
        kicker={`Facture en préparation · ${LABEL_BASE[CONTRAT.base]}`}
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
            <span className="os-doc__type">Facture</span>
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
            {calcul.lignes.map((l, i) => (
              <tr key={i}>
                <td>
                  {l.libelle}
                  <br />
                  <span className="os-sub">{l.detail}</span>
                </td>
                <td className="os-r">
                  {l.quantite != null ? `${l.quantite.toLocaleString("fr-FR")} ${l.unite ?? ""}` : "—"}
                </td>
                <td className="os-r">{l.pu != null ? euros(l.pu) : "—"}</td>
                <td className="os-r">{euros(l.montant_ht)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="os-r">
                Total
              </td>
              <td className="os-r">
                <span className="os-total">{euros(calcul.total_ht)}</span>
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="os-sub" style={{ marginTop: "1.5rem" }}>
          TVA non applicable, article 293 B du code général des impôts. Prestation éligible au crédit d&apos;impôt
          services à la personne.
        </p>
      </article>

      <Carte titre="Pourquoi ce montant">
        <div className="os-note">{calcul.note}</div>

        {calcul.exclusions.length > 0 && (
          <>
            <p className="os-card__title" style={{ marginTop: "1.25rem" }}>
              Écarté de la facture
            </p>
            {calcul.exclusions.map((e) => (
              <div key={e.libelle} className="os-rang">
                <div>
                  <strong>{e.libelle}</strong>
                  <br />
                  <span className="os-sub">{e.raison}</span>
                </div>
                <Tag ton="attente">Non facturé</Tag>
              </div>
            ))}
            <p className="os-sub" style={{ marginTop: "0.75rem" }}>
              Un supplément non approuvé par le client n&apos;est jamais ajouté d&apos;office : la facture surprise
              est ce qui fait perdre un client d&apos;abonnement.
            </p>
          </>
        )}
      </Carte>

      {peut.voirRentabilite && (
        <Carte
         
          titre="Rentabilité du passage"
          action={<span className="os-sub">Interne, jamais sur la facture</span>}
        >
          <div className="os-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))", gap: "1.25rem" }}>
            <Stat k="Facturé" v={euros(marge.produit_ht)} />
            <Stat k="Temps passé" v={heures(reelles)} n={`${euros(marge.cout_temps)} de coût`} />
            <Stat k="Trajet" v={`${(INTERVENTION.km ?? 0) * 2} km`} n={`${euros(marge.cout_trajet)} de coût`} />
            <Stat
              k="Marge"
              v={euros(marge.marge)}
              n={marge.rendement_horaire != null ? `${euros(marge.rendement_horaire)} de l'heure` : undefined}
            />
          </div>
          <p className="os-sub" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
            Le temps réel sert ici, et nulle part ailleurs. Il ne modifie jamais le prix convenu : un forfait tenu en
            trois heures reste facturé {euros(CONTRAT.forfait_ht ?? 0)}, et le même tenu en six aussi.
          </p>
          {alerte && <div className="os-note os-note--alerte" style={{ marginTop: "1rem" }}>{alerte}</div>}
        </Carte>
      )}

      <EmissionFacture numeroPrevu={numeroPrevu} />
    </div>
  );
}
