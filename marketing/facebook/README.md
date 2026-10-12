# La page Facebook — tout ce qu'il faut

> Trois documents : ce mémo pour créer la Page, `publications.md` pour six
> semaines de publications gratuites, `publicite.md` pour les campagnes payantes.

Visuels fabriqués par `node scripts/facebook.mjs`, avec le logo et les polices
du site. Rien ici n'est inventé : les champs que La Belle Intendance n'a pas
encore arrêtés sont marqués **à renseigner**.

## Les visuels

| Fichier | Où | Taille |
|---|---|---|
| `profil.png` | Photo de profil | 1080 × 1080, recadrée en cercle par Facebook |
| `couverture.png` | Photo de couverture | 1640 × 720 |
| `couverture-reperes.png` | Contrôle seulement, **ne pas téléverser** | montre les deux recadrages |
| `post-1-presentation.png` | Publication de lancement | 1080 × 1080 |
| `post-2-prestations.png` | Publication « ce que nous faisons » | 1080 × 1080 |
| `post-3-devis.png` | Publication « devis gratuit » | 1080 × 1080 |

La couverture est dessinée large exprès : Facebook en montre 820 × 312 sur
ordinateur et 640 × 360 sur téléphone, deux recadrages différents. Tout ce qui
compte tient dans la zone commune — `couverture-reperes.png` le montre.

## Les champs de la page

**Nom** — La Belle Intendance

**Nom d'utilisateur** — `@labelleintendance` (à vérifier, il peut être pris)

**Catégories** — Service de nettoyage · Entreprise locale

**Description courte** (255 caractères au maximum)

> Ménage à domicile, entretien de grandes maisons et intendance de résidences
> secondaires à Joigny (89) et ses alentours. La même personne à chaque
> passage, un cahier des charges établi avec vous, un devis écrit avant de
> commencer.

**Zone desservie** — Joigny et ses alentours (zone d'intervention, pas
d'adresse publique : cochez « Je propose un service à domicile » plutôt que de
donner une adresse d'établissement).

**Téléphone** — 07 83 29 15 41
**E-mail** — contact@la-belle-intendance.fr
**Site** — https://la-belle-intendance.fr

**Horaires** — **à renseigner.** Elles ne figurent nulle part sur le site :
mettez celles que vous tenez réellement, pas celles que vous aimeriez tenir.

**Bouton d'action** — « Demander un devis », vers :

```
https://la-belle-intendance.fr/devis?utm_source=facebook&utm_medium=social&utm_campaign=page
```

Ces paramètres ne servent pas à décorer : le bureau lit l'origine de chaque
demande, et celle-ci arrivera étiquetée « Réseaux sociaux ».

## La toute première publication — « se présenter »

À publier une fois la photo de profil et la couverture en place, et à épingler
en haut de la Page. Illustration : `salon-prepare-fleurs.webp` (la vraie photo,
plus chaleureuse) ou, à défaut, `post-1-presentation.png`.

Tout ce qui est écrit ici vient du site : rien sur un parcours, une ancienneté
ou un nombre de clients, qui ne serait pas vérifiable. Si Coralie veut ajouter
une phrase sur son histoire, c'est à elle de l'écrire.

> Bonjour, je suis Coralie.
>
> J'ai créé La Belle Intendance à Joigny pour faire un métier que j'aime, et le
> faire correctement : m'occuper des maisons.
>
> L'intendance, ce n'est pas seulement le ménage. C'est qu'une maison soit
> propre, bien sûr, mais aussi prête, surveillée, en bon état. Les volets
> ouverts et la maison aérée avant votre arrivée. Le courrier relevé et les
> plantes arrosées pendant votre absence. Ce qu'on ne remarque que lorsque ce
> n'est pas fait.
>
> Ce que je propose :
>
> • l'entretien régulier d'une maison ou d'un appartement, chaque semaine ou
> tous les quinze jours
> • les grands ménages — avant une réception, au printemps, après des travaux
> ou une longue absence
> • l'intendance des grandes demeures et des résidences secondaires, avec un
> compte rendu de passage si vous êtes loin
> • les bureaux, cabinets et commerces
>
> Une chose à laquelle je tiens : la même personne à chaque passage, et c'est
> moi qui interviens. À force, on finit par connaître une maison — ses
> habitudes, ses matériaux, ce qu'elle supporte et ce qu'elle demande.
>
> Nous commençons toujours par une visite et un devis écrit. Rien ne démarre
> avant votre accord.
>
> Joigny (89) et ses alentours.
> 07 83 29 15 41
> https://la-belle-intendance.fr/devis?utm_source=facebook&utm_medium=social&utm_campaign=presentation

Sans émoji, volontairement : la marque est sobre, et une publication de
présentation qui en est couverte fait moins sérieux qu'elle ne le voudrait. Si
Coralie préfère en mettre, un seul en tête de publication suffit.

## Les trois publications de lancement

### 1. Présentation — avec `post-1-presentation.png`

> La Belle Intendance ouvre ses portes à Joigny.
>
> Le ménage régulier d'une maison, le grand ménage de printemps, l'intendance
> d'une résidence secondaire entre deux séjours : la même personne à chaque
> passage, qui finit par connaître la maison mieux que personne.
>
> Un premier échange, une visite sur place, un devis écrit. Rien ne commence
> avant votre accord.
>
> 07 83 29 15 41
> https://la-belle-intendance.fr/devis?utm_source=facebook&utm_medium=social&utm_campaign=lancement

### 2. Les prestations — avec `post-2-prestations.png`

> Trois façons de nous confier une maison.
>
> **L'entretien régulier** — un passage par semaine ou tous les quinze jours,
> selon un cahier des charges établi avec vous.
>
> **Le grand ménage** — avant une réception, au printemps, après des travaux
> ou une longue absence. De fond en comble, une fois.
>
> **Les grandes demeures et résidences secondaires** — préparation avant votre
> arrivée, contrôle après votre départ, compte rendu avec photos si vous êtes
> loin.
>
> Dites-nous ce dont vous avez besoin : https://la-belle-intendance.fr/devis?utm_source=facebook&utm_medium=social&utm_campaign=prestations

### 3. Le devis — avec `post-3-devis.png`

> Combien ça coûte ? La seule réponse honnête, c'est : cela dépend de votre
> maison.
>
> Une maison de deux cents mètres carrés avec quatre chambres ne se tient pas
> comme un appartement. Plutôt qu'un tarif affiché qui ne voudrait rien dire,
> nous venons voir, nous écoutons, et nous vous remettons un devis écrit —
> gratuit, sans engagement.
>
> 07 83 29 15 41
> https://la-belle-intendance.fr/devis?utm_source=facebook&utm_medium=social&utm_campaign=devis

## Deux précautions

**Les photos.** Les images d'ambiance du site sont des images de synthèse, et
elles sont annoncées comme telles dans les mentions légales. Sur Facebook,
publier une image de synthèse en la faisant passer pour un chantier réel se
retourne vite contre une entreprise locale. Les trois visuels fournis ici ne
montrent aucun intérieur : ils ne promettent rien de faux. Dès que Coralie
aura de vraies photos de passages — avec l'accord écrit des clients — elles
vaudront mieux que n'importe quel visuel fabriqué.

**Pas de faux avis.** Un avis Facebook ou Google doit venir d'un vrai client.
