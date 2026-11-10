# Backlinks — La Belle Intendance

Objectif : quelques liens **réels et locaux** vers https://la-belle-intendance.fr, sans schéma artificiel.
Deux à quatre liens bien placés valent mieux que vingt liens de pied de page.

## Règles

- Sites réels, avec un vrai contenu, de préférence de la zone (Joigny, Yonne) ou du secteur (maison, immobilier, artisanat).
- **Un seul lien par site**, dans un contexte naturel : page « Partenaires » ou « Nos recommandés », mention dans un article, témoignage.
- **Texte du lien varié** (voir ci-dessous) : pas toujours le même mot-clé.
- Pas d'échange systématique (A vers B, B vers A) ni de lien contre de l'argent. Si un lien est rémunéré : `rel="sponsored"`.
- Ne pas copier les textes du site : chaque page qui parle de l'entreprise écrit son propre paragraphe.

## Textes du lien (à alterner)

| Type | Texte | Quand |
|---|---|---|
| Marque | La Belle Intendance | par défaut |
| Service + lieu | femme de ménage à Joigny | site local ou artisan |
| Service | intendance de maison dans l'Yonne | site maison ou immobilier |
| Adresse nue | la-belle-intendance.fr | témoignage, article |

## Paragraphes prêts à publier (adapter, ne pas copier mot pour mot sur plusieurs sites)

**Court (page partenaires)**
> La Belle Intendance, à Joigny : ménage à domicile, entretien de grandes maisons et intendance de résidences secondaires dans l'Yonne. Devis écrit avant toute intervention. <a href="https://la-belle-intendance.fr">la-belle-intendance.fr</a>

**Témoignage (client)**
> Nous faisons appel à La Belle Intendance pour l'entretien de notre maison. Le devis est écrit avant l'intervention et le compte rendu est clair. <a href="https://la-belle-intendance.fr">La Belle Intendance</a>, Joigny.

(À ne publier que si le témoignage est réel et validé par le client.)

**Recommandation (artisan, agent immobilier, gîte)**
> Pour le ménage avant ou après un séjour, une remise en état ou l'entretien d'une résidence secondaire, nous recommandons <a href="https://la-belle-intendance.fr">une femme de ménage à Joigny</a>, qui intervient aussi autour de Joigny, Migennes et Saint-Julien-du-Sault.

## Sources à viser, par ordre de rendement

1. **Fiche Google Business** : déjà reliée au site (`googleBusinessUrl` dans `src/config/site.ts`). Vérifier que le site web, les horaires et la zone y sont renseignés.
2. **Page Facebook de l'entreprise** : reliée au site (`facebook` dans `src/config/site.ts`, repris dans les données structurées `sameAs`). Penser à mettre l'adresse du site dans la rubrique « Coordonnées » de la Page.
3. **Clients et amis** : un lien sur leur site (page partenaires ou témoignage), selon les règles ci-dessus.
4. **Annuaires locaux sérieux** : office de tourisme, mairie ou communauté de communes si une rubrique « services » existe, CCI, annuaire CESU/Urssaf des services à la personne.
5. **Partenaires métier** : agents immobiliers, gîtes et chambres d'hôtes, artisans (peintres, plombiers) qui ont besoin d'un ménage de fin de chantier.

## Suivi

- Paramètre à ajouter au lien pour mesurer les visites : `?utm_source=<nom-du-site>&utm_medium=lien`.
- Noter chaque lien obtenu : site, date, page, texte du lien. Vérifier après un mois qu'il est toujours en ligne.
- Search Console (propriété la-belle-intendance.fr), rubrique « Liens » : confirme au bout de quelques semaines que Google voit les liens.
