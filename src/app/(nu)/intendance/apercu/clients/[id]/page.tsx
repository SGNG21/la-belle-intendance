import { Bandeau, Carte, Champ, Entete, Lien, Stat, Tag } from "@/components/apercu/Os";
import { ABONNEMENT, BIEN, CLIENT, HISTORIQUE, PROCHAINS } from "@/lib/apercu/donnees";
import { euros, heures } from "@/lib/apercu/modele";

/**
 * La fiche client.
 *
 * Elle est tenue comme un dossier papier, pas comme une base de données :
 * d'abord qui c'est et comment entrer chez lui, ensuite ce qu'on y fait,
 * enfin ce qui s'est passé. Les consignes d'accès sont hautes dans la page
 * parce que c'est ce qu'on cherche à 8 h 55 devant un portail fermé.
 */

const CARACTERISTIQUES: Record<string, string> = {
  piscine: "Piscine",
  parc: "Grand jardin ou parc",
  niveaux: "Trois niveaux ou plus",
  dependances: "Dépendances",
  animaux: "Animaux sur place",
  chauffage: "Cheminée ou poêle",
  meuble: "Très meublé, bibelots",
};

export default function Page() {
  const parMois = ABONNEMENT.duree_h * ABONNEMENT.tarif_horaire * 2;

  return (
    <div className="os-wrap">
      <Bandeau>Maquette — données fictives.</Bandeau>

      <Entete
        kicker={`Client depuis mars 2026 · ${CLIENT.mode === "cesu" ? "CESU" : "Prestation"}`}
        titre={CLIENT.nom}
        sous={`${CLIENT.commune} · particulier · résidence secondaire`}
        action={
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Lien href="/intendance/apercu/intervention">Passage en cours</Lien>
            <Lien href="/intendance/apercu/facture" variante="plein">
              Facturer
            </Lien>
          </div>
        }
      />

      <div className="os-grid os-grid--side">
        {/* ----------------------------------------------- colonne gauche */}
        <div className="os-grid">
          <Carte titre="Entrer chez elle">
            <p style={{ marginTop: 0 }}>{BIEN.acces}</p>
            <div className="os-note">
              <strong>À savoir.</strong> {BIEN.particularites}
            </div>
            <dl className="os-dl" style={{ marginTop: "1rem" }}>
              <Champ k="Adresse">
                {BIEN.adresse}
                <br />
                {BIEN.commune}
              </Champ>
              <Champ k="Distance">
                <span className="os-num">{BIEN.km} km</span> depuis Joigny
              </Champ>
            </dl>
          </Carte>

          <Carte
            titre="Le bien"
            action={<span className="os-sub os-num">{BIEN.surface} m²</span>}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.125rem" }}>
              {BIEN.libelle}
            </h3>
            <dl className="os-dl" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(7rem, 1fr))" }}>
              <Champ k="Chambres">
                <span className="os-num">{BIEN.chambres}</span>
              </Champ>
              <Champ k="Salles de bains">
                <span className="os-num">{BIEN.salles_de_bains}</span>
              </Champ>
              <Champ k="WC">
                <span className="os-num">{BIEN.wc}</span>
              </Champ>
              <Champ k="Pièces de vie">
                <span className="os-num">{BIEN.pieces_vie}</span>
              </Champ>
            </dl>
            <div className="os-fil" style={{ marginTop: "1rem" }}>
              {BIEN.caracteristiques.map((c) => (
                <span key={c} className="os-puce">
                  {CARACTERISTIQUES[c] ?? c}
                </span>
              ))}
            </div>
          </Carte>

          <Carte
            titre="Ce qui a été retenu"
            action={<span className="os-sub">{heures(ABONNEMENT.duree_h)} par passage</span>}
          >
            <p className="os-sub" style={{ marginTop: 0 }}>
              Ces lignes composent la checklist de chaque passage et le compte rendu envoyé ensuite.
            </p>
            <div className="os-fil">
              {[
                "Cuisine et office",
                "Séjour et piano",
                "Chambres",
                "Salles de bains",
                "WC",
                "Entrée et couloirs",
                "Lits faits, linge changé",
                "Arrosage des plantes",
                "Relève du courrier",
                "Vitres du séjour",
              ].map((p) => (
                <span key={p} className="os-puce">
                  {p}
                </span>
              ))}
            </div>
          </Carte>

          <Carte titre="Historique">
            <ul className="os-temps">
              {HISTORIQUE.map((e) => (
                <li key={e.id} className="os-temps__li" data-type={e.type}>
                  <div className="os-temps__d">
                    {new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                  <div className="os-temps__t">{e.titre}</div>
                  {e.detail && <div className="os-temps__x">{e.detail}</div>}
                </li>
              ))}
            </ul>
          </Carte>
        </div>

        {/* ------------------------------------------------ colonne droite */}
        <div className="os-grid">
          <Carte titre="Joindre">
            <dl className="os-dl">
              <Champ k="Téléphone">
                <a href={`tel:${CLIENT.telephone.replace(/\s/g, "")}`} className="os-num">
                  {CLIENT.telephone}
                </a>
              </Champ>
              <Champ k="E-mail">
                <a href={`mailto:${CLIENT.email}`}>{CLIENT.email}</a>
              </Champ>
            </dl>
            <div className="os-note" style={{ marginTop: "1rem" }}>
              {CLIENT.notes}
            </div>
          </Carte>

          <Carte titre="Abonnement" action={<Tag ton="fait">Actif</Tag>}>
            <dl className="os-dl">
              <Champ k="Rythme">Tous les quinze jours, le mardi</Champ>
              <Champ k="Durée">{heures(ABONNEMENT.duree_h)}</Champ>
              <Champ k="Tarif">
                <span className="os-num">{euros(ABONNEMENT.tarif_horaire)}</span> de l&apos;heure
              </Champ>
              <Champ k="Depuis">24 mars 2026</Champ>
            </dl>
            <p className="os-sub" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
              Prochain passage le{" "}
              <strong className="os-num">
                {new Date(PROCHAINS[0].date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </strong>
              .
            </p>
          </Carte>

          <Carte titre="Ce que le client rapporte">
            <div className="os-grid" style={{ gap: "1.25rem" }}>
              <Stat k="Par mois" v={euros(parMois)} n="en moyenne" />
              <Stat k="Depuis le début" v={euros(2304)} n="9 passages" />
              <Stat k="Reste dû" v={euros(0)} n="à jour" />
            </div>
            <p className="os-sub" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
              Trajet compté : <span className="os-num">{BIEN.km * 2} km</span> par passage, soit{" "}
              <span className="os-num">{euros(BIEN.km * 2 * 0.43)}</span> de frais réels non refacturés.
            </p>
          </Carte>

          <Carte titre="Documents">
            <div className="os-rang">
              <div>
                <strong>Compte rendu — 24 nov.</strong>
                <br />
                <span className="os-sub">Validé, non envoyé</span>
              </div>
              <Tag ton="cours">À envoyer</Tag>
            </div>
            <div className="os-rang">
              <div>
                <strong>Facture 2026-041</strong>
                <br />
                <span className="os-sub">Envoyée le 10 nov. · {euros(144)}</span>
              </div>
              <Tag ton="fait">Payée</Tag>
            </div>
            <div className="os-rang">
              <div>
                <strong>Devis DEV-2026-012</strong>
                <br />
                <span className="os-sub">Accepté le 18 mars</span>
              </div>
              <Tag ton="sceau">Signé</Tag>
            </div>
          </Carte>
        </div>
      </div>
    </div>
  );
}
