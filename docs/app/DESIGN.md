# Business OS — design system

Outil de travail quotidien pour **une** personne qui gère seule son activité.
Ce n'est pas un tableau de bord d'analyste : c'est un établi. Il est tenu d'une
main, souvent debout dans une maison, parfois avec des gants.

## Le principe qui tranche les arbitrages

> À chaque écran, une seule chose à faire. Tout le reste est du contexte.

Quand un écran hésite entre deux actions principales, c'est qu'il faut le couper
en deux. Cette règle prime sur la densité : mieux vaut faire défiler que chercher.

## Couleurs

Reprises de `src/app/globals.css`, sans invention. La marque est déjà sur le
site, dans les e-mails et sur les cartes imprimées : l'outil ne s'en écarte pas.

| Rôle | Jeton | Valeur | Emploi |
|---|---|---|---|
| Fond d'application | `--paper` | `#fbf8f1` | Fond de toutes les pages |
| Fond de carte | `#fff` | — | Cartes, champs, tableaux |
| Fond sourd | `--cream` | `#f4eee2` | En-têtes de tableau, zones inactives |
| Texte | `--ink` | `#1b2a40` | Tout le texte courant |
| Texte secondaire | `--muted` | `#4d5f74` | Légendes, unités, dates |
| Structure | `--navy` / `--navy-deep` | `#22395a` / `#182a45` | Barre latérale, boutons pleins, titres |
| Filets | `--line` | `rgba(34,57,90,.18)` | Séparations. Jamais d'ombre à leur place |
| Accent chaud | `--terracotta` | `#be7a54` | Soulignés de liens, onglet actif |
| Sceau | `--gold` | `#ae8130` | Le validé, l'envoyé, le signé |
| Alerte | `--danger` | `#a33a2c` | Retards, échecs, suppressions |
| Fait | `--sage-deep` | `#5f7658` | Terminé, encaissé, réglé |

**Règle de couleur de statut.** Un statut n'est jamais porté par la couleur
seule : toujours couleur + mot. Un daltonien et une capture en noir et blanc
doivent rester lisibles.

| Statut | Couleur | Forme |
|---|---|---|
| À faire, à venir | `--slate` | Pastille creuse |
| En cours | `--terracotta` | Pastille pleine |
| Fait, encaissé | `--sage-deep` | Coche |
| Envoyé, signé | `--gold` | Sceau |
| En retard, échoué | `--danger` | Triangle |

## Typographie

Trois familles déjà chargées, aucune de plus.

- **Marcellus** (`--font-display`) : titres d'écran et de document. Rien d'autre.
- **Cormorant Garamond** (`--font-serif`) : corps des documents destinés au
  client — devis, compte rendu, facture. C'est ce qui leur donne l'air d'un
  document et non d'un écran.
- **Jost** (`--font-body`) : toute l'interface. Libellés, champs, boutons, données.

Échelle, en `rem`, fondée sur un corps de base de 17 px :

| Usage | Taille | Graisse | Interligne |
|---|---|---|---|
| Titre d'écran | 1.75 | 400 Marcellus | 1.2 |
| Titre de section | 1.125 | 500 Jost | 1.3 |
| Sur-titre | 0.75 | 600 Jost, `letter-spacing: .12em`, capitales | 1 |
| Corps | 1 | 400 | 1.6 |
| Donnée chiffrée | 1 | 500, `font-variant-numeric: tabular-nums` | 1.4 |
| Légende | 0.8125 | 400, `--muted` | 1.45 |

**Les chiffres alignent.** Tout montant, toute durée, toute date en colonne
porte `tabular-nums`. Une colonne d'euros qui ne s'aligne pas est une erreur.

## Espacement, rayons, ombres

Échelle de 4 px : `4 8 12 16 24 32 48 64`. Rien entre.

- Rayon : `--radius: 3px`. Partout. Pas d'arrondi décoratif, pas de pilule.
- **Pas d'ombre portée**, sauf sur un élément réellement flottant (menu, feuille
  modale). La hiérarchie passe par le filet et le fond, comme sur du papier.
- Largeur de lecture d'un document : `--measure: 38rem`.

## Cibles tactiles

L'écran d'intervention se remplit debout, parfois avec des gants.

- Hauteur minimale d'une cible : **48 px**. Les cases à cocher de la checklist : **56 px**, ligne entière cliquable.
- Espacement vertical minimal entre deux cibles : 8 px.
- Action principale d'un écran mobile : barre basse fixe, pleine largeur, au-dessus de la zone sûre.

## Composants

### Carte
Fond blanc, filet `--line`, rayon 3 px, padding 16 (mobile) / 24 (bureau).
Un titre en sur-titre, le contenu en dessous. Pas de pied de carte : l'action
vit dans l'en-tête, à droite du titre.

### Champ
Étiquette au-dessus, jamais en remplacement du texte d'invite. Bordure
`--line`, bordure `--navy` au focus plus l'anneau `--gold` du site. Message
d'erreur sous le champ, en `--danger`, qui dit quoi faire et pas ce qui a raté.

### Bouton
- **Plein** `--navy-deep`, texte crème : une seule action principale par écran.
- **Contour** filet `--line`, texte `--ink` : actions secondaires.
- **Nu** texte souligné terracotta : actions tertiaires et retours.
- **Danger** contour `--danger` : jamais plein, pour qu'il ne se clique pas par réflexe.

### Pastille de statut
Hauteur 24 px, texte 0.75 rem en capitales espacées, fond à 12 % de la couleur
du statut, texte à la couleur pleine, plus la forme du tableau ci-dessus.

### Ligne de temps
Les événements d'un client. Filet vertical `--line`, pastille à gauche,
date en légende, libellé en corps. C'est l'épine dorsale de la fiche client :
tout ce qui arrive au client s'y inscrit, dans l'ordre.

## Mise en page

- **Mobile d'abord.** Une colonne. Navigation en barre basse à cinq entrées :
  Aujourd'hui, Clients, Agenda, Documents, Réglages.
- **Bureau** à partir de 1024 px : barre latérale de 15 rem à gauche, contenu
  centré sur 72 rem. Jamais pleine largeur : une ligne de tableau de 2 000 px
  ne se lit pas.
- **Document** (devis, compte rendu, facture) : toujours sur `--measure`,
  centré, fond blanc sur `--paper`, pour qu'il ait l'air de la feuille qu'il
  deviendra.

## Mouvement

Transitions de 120 ms sur la couleur et l'opacité seulement. Aucune animation
d'entrée, aucun glissement de page. `prefers-reduced-motion: reduce` supprime
tout, y compris les 120 ms.

## États à ne jamais oublier

Un écran n'est livré que s'il traite les cinq : **vide**, **chargement**,
**erreur**, **une ligne**, **beaucoup de lignes**. L'état vide porte une phrase
qui dit quoi faire, jamais « Aucune donnée ».
