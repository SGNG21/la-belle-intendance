# La publicité Facebook

Ce document couvre les campagnes payantes dans le gestionnaire Meta. Les
publications gratuites sont dans `publications.md`.

## Ce qui manque avant de dépenser

**Il n'y a pas de pixel Meta sur le site.** Sans lui, Meta ne peut pas savoir
qui a rempli le formulaire, donc pas optimiser sur les conversions ni refaire
de la publicité aux visiteurs. Ce n'est pas bloquant pour démarrer — les deux
campagnes ci-dessous fonctionnent sans — mais il faut le savoir.

Si vous voulez le poser, créez le pixel dans le gestionnaire d'événements Meta
et donnez-moi son identifiant : je le branche sur la bannière de consentement
existante, comme GA4, en une poignée de minutes. Même réserve que pour Google
Ads : rien ne se charge avant que le visiteur accepte, donc une partie des
conversions échappera à Meta.

## Deux campagnes possibles, et laquelle d'abord

**A — Trafic vers la page de devis.** L'annonce envoie sur `/devis`. La
personne remplit le formulaire du site, la demande arrive dans le bureau avec
son origine, et vous rappelez. C'est **celle par laquelle je commencerais** :
la page est faite pour ça, les demandes sont qualifiées parce qu'il faut un
vrai effort pour les remplir, et tout se retrouve au même endroit que le reste.

**B — Prospects par formulaire instantané.** Le formulaire s'ouvre dans
Facebook, sans quitter l'application. Les demandes coûtent moins cher et sont
plus nombreuses, mais elles sont souvent moins réfléchies, et surtout **elles
restent chez Meta** : il faut aller les chercher dans le gestionnaire, ou
configurer une alerte e-mail. Rien n'arrive dans le bureau.

Gardez B pour plus tard, si le coût par demande de la campagne A vous paraît
trop élevé après deux ou trois semaines. Si vous lancez B, le formulaire doit
pointer vers `https://la-belle-intendance.fr/confidentialite` : Meta l'exige.

## Réglages de la campagne A

| Réglage | Valeur |
|---|---|
| Objectif | Trafic (ou Prospects si le pixel est posé) |
| Lieu | Joigny, rayon **20 km** — « personnes vivant à cet endroit », pas « de passage » |
| Âge | 30 – 65 et plus |
| Genre | tous |
| Centres d'intérêt | **aucun** |
| Placements | automatiques (Advantage+) |
| Budget | **5 € par jour**, au niveau de l'ensemble de publicités |
| Durée du test | 10 à 14 jours sans y toucher |
| Destination | `https://la-belle-intendance.fr/devis?utm_source=facebook&utm_medium=paid&utm_campaign=trafic-joigny` |
| Bouton | En savoir plus |

Deux réglages méritent une explication, parce qu'ils vont à l'encontre de ce
qu'on lit partout.

**Pas de centres d'intérêt.** Autour de Joigny, 20 km représentent une audience
déjà petite. La découper en « intéressés par le ménage » la réduit à presque
rien, et les intérêts de Meta sur ce sujet sont de mauvaise qualité. Mieux vaut
laisser l'algorithme chercher dans toute la zone.

**Ne touchez à rien pendant dix jours.** Chaque modification relance la phase
d'apprentissage. C'est l'erreur la plus courante et la plus coûteuse.

## Les annonces

Trois variantes à lancer **en même temps**, dans le même ensemble de
publicités : Meta répartit le budget vers celle qui marche. Au bout de deux
semaines, gardez la meilleure.

### Annonce 1 — la maison tenue
Visuel : `pub-1-carre.png` (carré) et `pub-1-vertical.png` (fil vertical)

> **Texte principal**
> Votre maison tenue par la même personne, chaque semaine ou tous les quinze
> jours. Entretien régulier, grands ménages, résidences secondaires. Visite sur
> place et devis écrit, gratuits — rien ne commence avant votre accord.
>
> **Titre** — Ménage et intendance à Joigny
> **Description** — Devis gratuit, sans engagement

### Annonce 2 — la question du prix
Visuel : `pub-3-devis.png`

> **Texte principal**
> « Combien ça coûte ? » Cela dépend de votre maison : sa taille, son état, le
> rythme qui vous convient. Nous venons voir, puis nous écrivons un devis
> gratuit. Joigny et ses alentours.
>
> **Titre** — Votre devis d'entretien, gratuit
> **Description** — Visite sur place, devis écrit

### Annonce 3 — résidences secondaires
Visuel : `pub-2-story.png` pour les stories, `pub-1-carre.png` pour le fil

> **Texte principal**
> Vous arrivez vendredi soir après trois heures de route : la maison a été
> aérée, les volets ouverts, les sols faits. Entre deux séjours, quelqu'un
> passe, relève le courrier et vous prévient si quelque chose cloche.
>
> **Titre** — Votre maison prête à votre arrivée
> **Description** — Intendance autour de Joigny

Les premiers mots comptent plus que le reste : Facebook coupe le texte
principal vers 125 caractères, et la plupart des gens ne déplient jamais.

## Ce qu'il faut regarder, et quand

Au bout de dix jours, un seul chiffre compte : **combien avez-vous dépensé par
demande reçue ?** Vous le lisez dans le bureau — les demandes venues de la
publicité y arrivent étiquetées « Google Ads » ou « Réseaux sociaux » selon la
source, avec le nom de la campagne.

Comparez-le à ce que vous rapporte un client. Un client d'entretien régulier
revient chaque mois pendant des années : s'il vous a coûté trente euros de
publicité, la question est vite tranchée. Une demande ponctuelle qui coûte
quarante euros et ne se transforme pas, c'est une autre affaire.

Ne jugez pas sur trois jours ni sur une seule demande.

## Deux mises en garde

**Les images.** Les visuels fournis ne montrent aucun intérieur de client sans
accord, et aucun avant/après. Ne publiez jamais de comparaison avant/après en
publicité : c'est ce qui attire les signalements et les refus de Meta, et pour
une entreprise locale, un client qui reconnaît son salon dans une publicité
sans l'avoir su, c'est un client perdu.

**Les promesses.** Pas de tarif annoncé dans les annonces tant qu'il n'y en a
pas sur le site. Une publicité qui annonce « à partir de 20 € » et un devis qui
en fait 32 détruit la confiance avant le premier passage.
