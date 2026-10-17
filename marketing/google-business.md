# Fiche Google Business — La Belle Intendance

**La fiche existe** : <https://www.google.com/maps?cid=1966875365666046951>
(identifiant de lieu `/g/11zzfp0n4j`, position 47.9889126 / 3.4358869, catégorie
principale *house_cleaning_service*). Elle est reliée au site depuis
`CONTACT.googleBusinessUrl`.

Ce qui reste à faire figure en **⟦crochets⟧** ci-dessous. Le reste du document
sert de liste de contrôle : les champs d'une fiche se remplissent rarement tous
du premier coup, et ce sont les oubliés qui coûtent du classement.

La fiche se gère sur <https://business.google.com>.

---

## 1. Identité

| Champ | Valeur |
| --- | --- |
| Nom de l'établissement | **La Belle Intendance** |
| Téléphone | 07 83 29 15 41 |
| Site web | https://la-belle-intendance.fr |
| Horaires | ⟦à décider — ex. lundi au vendredi 8 h – 18 h⟧ |

Le nom se saisit tel quel. N'y ajoutez jamais de mots-clés (« La Belle Intendance
ménage Joigny ») : c'est le motif de suspension le plus courant, et Google
renomme la fiche d'office quand il le détecte.

## 2. Catégories

- **Catégorie principale** : *Service de nettoyage de maisons* — **déjà en place**,
  l'URL de la fiche porte `house_cleaning_service`. Ne plus y toucher : c'est
  elle qui décide des recherches où la fiche sort.
- Catégories secondaires à ajouter : ⟦*Service de nettoyage*⟧, ⟦*Service de
  nettoyage de bureaux*⟧, ⟦*Service de conciergerie*⟧

Les intitulés exacts dépendent du menu déroulant de Google, qui ne propose
qu'une liste fermée : prendre le plus proche.

## 3. Zone desservie

Pas d'adresse postale affichée : l'activité s'exerce chez le client. Au moment
de la création, répondre **non** à « Les clients peuvent-ils venir chez vous ? »
puis déclarer une zone desservie.

Joigny (89300) et les communes alentour :

Cézy · Villecien · Saint-Aubin-sur-Yonne · Champlay · Looze · Brion ·
Paroy-sur-Tholon · Chamvres · Laroche-Saint-Cydroine · Migennes · Cheny ·
Bonnard · Charmoy · Armeau · Saint-Julien-du-Sault · Villeneuve-sur-Yonne ·
Aillant-sur-Tholon · Senan · Guerchy · Appoigny

Google plafonne à 20 zones. Si la liste est refusée, saisir « Joigny » plus un
rayon de 20 km, qui couvre les mêmes communes.

## 4. Description (750 caractères maximum)

> Ménage à domicile et intendance de maison à Joigny et dans l'Yonne. La Belle
> Intendance assure l'entretien régulier des logements, le grand ménage de
> printemps ou d'avant réception, la remise en état après travaux ou
> déménagement, et l'intendance des grandes demeures et résidences secondaires :
> préparation avant votre arrivée, contrôle après votre départ, compte rendu à
> distance. Les entreprises, cabinets et commerces bénéficient d'un contrat
> d'entretien aux horaires qui leur conviennent. Chaque prestation est définie
> avec vous, puis confiée toujours à la même personne. Devis écrit et gratuit
> avant la première intervention.

À coller tel quel (631 caractères). Pas de majuscules superflues, pas de liste
de mots-clés, pas de numéro de téléphone dans le texte : Google refuse.

## 5. Prestations à déclarer

Reprendre les cinq services du site, chacun avec sa phrase :

1. **Entretien régulier** — un passage hebdomadaire ou tous les quinze jours, par
   la même personne, selon un cahier des charges établi avec vous.
2. **Grand ménage** — remise à neuf d'une maison ou d'un appartement, de fond en
   comble, avant une réception, au printemps ou après une longue absence.
3. **Remise en état** — après travaux, avant ou après un déménagement, ou avant
   une remise des clés.
4. **Grandes demeures et résidences secondaires** — entretien, préparation avant
   votre arrivée, contrôle après votre départ, compte rendu à distance.
5. **Entreprises et cabinets** — bureaux, cabinets, commerces, avec un
   interlocuteur unique.

## 6. Photos

Minimum pour que la fiche soit crédible : un logo, une photo de couverture, et
trois à cinq photos de prestations réelles. Les visuels du logo et de couverture
sont déjà générés dans `marketing/facebook/`. Les photos de prestations doivent
être réelles — pas d'image générée sur une fiche Google.

## 7. Validation

Google envoie un **code par courrier postal** à l'adresse du siège, même quand
l'adresse reste masquée. Comptez 5 à 14 jours. La fiche n'apparaît pas dans les
résultats avant la saisie de ce code. C'est le seul délai incompressible du
projet : à lancer en premier.

## 8. Après validation

- ~~Recopier le lien de la fiche dans `CONTACT.googleBusinessUrl`.~~ Fait.
- ⟦Récupérer le lien court de demande d'avis⟧ (bouton « Demander des avis » dans
  l'interface, de la forme `g.page/r/…`) : c'est celui à envoyer aux clients.
  Il ne se devine pas depuis l'extérieur, il faut le copier depuis le tableau
  de bord.
- Recopier les avis reçus dans le tableau `AVIS` de `src/config/site.ts` pour
  qu'ils s'affichent aussi sur le site. Tant qu'il est vide, la section reste
  masquée.
- Répondre à chaque avis, y compris les bons. Google mesure le taux de réponse.
