# Business OS — architecture fonctionnelle et technique

État au 22 novembre 2026. Ce document dit ce qui existe, ce qui manque, dans
quel ordre le construire et ce qu'il ne faut surtout pas construire.

## 1. Le principe directeur

Une personne seule gère l'activité. Chaque écran ajouté est une charge
d'entretien, pas seulement une fonctionnalité. La question posée à chaque
brique est donc : **est-ce que cela supprime du travail, ou est-ce que cela en
ajoute ?**

Deux sources de vérité, et deux seulement :

| Domaine | Source de vérité | Pourquoi |
|---|---|---|
| Interventions, clients, biens, abonnements | **Supabase** (base du projet) | C'est le métier. Personne d'autre ne le modélise correctement. |
| Factures et pièces comptables | **Un logiciel de facturation** | Numérotation, archivage légal, conformité : à ne pas réécrire. |

Tout le reste — n8n, e-mails, agenda — est de l'acheminement. Si un de ces
maillons tombe, on doit pouvoir le reconstruire depuis les deux sources.

## 2. Ce qui existe déjà

Le back-office `/intendance` est plus avancé que le brief ne le suppose.

| Brique | État | Où |
|---|---|---|
| Demandes du site, scoring, origine UTM | **Fait** | `src/lib/lead.ts`, `crmModel.ts`, `Desk.tsx` |
| Clients | **Fait** | `api/intendance/clients`, `Fiche.tsx` |
| Biens, calcul de durée, pièces proposées, catalogue | **Fait** | `crmModel.ts` (`dureeMenage`, `piecesProposees`, `CATALOGUE`) |
| Devis : lignes, statuts, envoi par e-mail | **Fait** | `devisModel.ts`, `devisDb.ts`, `devisEmail.ts` |
| Compte rendu de passage | **Fait**, hors parcours | `api/compte-rendu`, `ReportForm` |
| Réglages, tarifs, zones | **Fait** | `api/intendance/reglages` |
| Agenda | **Manque** | — |
| Intervention et checklist | **Manque** | maquette `apercu/intervention` |
| Factures, paiements, relances | **Manque** | maquette `apercu/facture` |
| Abonnements et récurrence | **Manque** | modèle posé, `apercu/modele.ts` |
| Espace client | **Manque** | — |
| Finances et rentabilité | **Manque** | — |
| Pipeline d'acquisition | **Partiel** : les demandes sont là, le suivi non | — |

**Conséquence sur le chiffrage.** Il ne s'agit pas de construire douze espaces
mais d'en compléter cinq et d'en ajouter quatre. Le travail restant est à peu
près la moitié de ce qu'un brief lu au pied de la lettre laisserait croire.

## 3. Le modèle de données

### Ce qui est déjà en base
`demandes`, `clients`, `biens`, `devis`, `reglages`.

### Ce qu'il faut ajouter

```
abonnements      id, client_id, bien_id, libelle, frequence, jour,
                 duree_h, tarif_horaire, actif, debut, fin

interventions    id, client_id, bien_id, abonnement_id,
                 date, debut, fin, duree_prevue_h, statut,
                 checklist jsonb, observations, photos_autorisees,
                 km, compte_rendu_id, facture_id

comptes_rendus   id, intervention_id, client_id, statut,
                 cree_le, valide_le, envoye_le, destinataires,
                 empreinte_envoyee

factures         id, numero, client_id, statut, date_emission,
                 date_echeance, lignes jsonb, tva,
                 envoye_le, ref_externe

paiements        id, facture_id, date, montant, moyen
```

Les types correspondants sont écrits et typés dans `src/lib/apercu/modele.ts`.

### Les deux verrous

Le brief demande d'empêcher les doubles envois et les doubles facturations.
Deux colonnes suffisent, à condition d'y croire vraiment :

- `interventions.facture_id` : une intervention déjà portée sur une facture ne
  peut plus l'être. Contrainte d'unicité en base, pas seulement un test dans
  l'écran.
- `comptes_rendus.envoye_le` + `empreinte_envoyee` : un second envoi est
  refusé, et si le texte change après coup, l'écran dit « modifié depuis
  l'envoi » au lieu de laisser croire que le client a lu ce qui est affiché.

Côté serveur, chaque action d'envoi porte une **clé d'idempotence** : deux
appels identiques produisent un seul effet. C'est ce qui protège du double clic
et du second onglet, ce qu'aucune règle d'affichage ne peut faire.

## 4. Facturation : ne pas réécrire ce qui existe

### Le constat qui change le plan

Un **compte Henrri** est déjà relié à cet environnement de travail. Henrri est
un logiciel de facturation français qui gère clients, devis, factures,
numérotation et paiements. C'est exactement le « moteur comptable » que le
brief demande de ne pas reconstruire.

**Recommandation.** Les factures restent chez Henrri. L'application pousse une
facture à partir d'une intervention close, récupère le numéro et le PDF, et
garde seulement `ref_externe` plus le statut. Deux avantages : aucune
numérotation à garantir nous-mêmes, et la conformité suit l'éditeur.

À vérifier avant de s'engager : la couverture réelle de l'API Henrri pour la
création de facture et la récupération du PDF, et le coût du palier
nécessaire. Tant que ce n'est pas vérifié, le modèle `factures` ci-dessus reste
le plan de repli.

### Facturation électronique 2026–2027

⚠️ **À faire confirmer par le comptable avant toute décision technique.** Les
règles ont bougé plusieurs fois et ce qui suit demande vérification.

Ce qui structure le calendrier, en l'état de ce que nous savons :

- L'obligation porte sur les échanges **entre entreprises** (B2B domestique).
- **La clientèle de La Belle Intendance est très majoritairement constituée de
  particuliers.** Ces factures-là ne sont pas concernées par la facturation
  électronique au sens de la réforme.
- Les clients **professionnels** (cabinet, gîte) le sont, eux.
- S'ajoute un volet de **transmission de données** sur les opérations avec des
  particuliers, dont les modalités sont à confirmer.
- La **réception** de factures fournisseurs au format électronique s'impose à
  toutes les entreprises avant l'émission, qui est échelonnée selon la taille.

**Ce que cela implique concrètement.** Le sujet est réel mais secondaire pour
cette activité, et il est pris en charge par l'éditeur de facturation si l'on
en passe par un. C'est un argument de plus pour ne pas écrire nos propres
factures. Il ne doit pas retarder les lots 1 à 3.

## 5. Architecture technique

### Ce qu'on garde
Next.js 16 (App Router), React 19, Supabase avec clé de service côté serveur
seulement, RLS active sans politique, Resend pour les e-mails, Vercel.
Zéro dépendance ajoutée jusqu'ici, et c'est à préserver.

### Authentification
Le verrou actuel — un code unique, un cookie `httpOnly` — suffit pour une
utilisatrice unique. Il ne suffira plus dès qu'il y aura un **espace client**
(lot 5) : il faudra alors une vraie identité par client, avec un lien de
connexion par e-mail plutôt qu'un mot de passe à retenir.

### Hors ligne
L'écran d'intervention doit fonctionner **sans réseau** : une maison de
campagne n'a pas toujours de couverture. La checklist se tient en mémoire
locale et se synchronise au retour du réseau. C'est la seule contrainte
technique réellement structurante du projet, et elle doit être prise en compte
dès le lot 2, pas après.

### n8n
Instance partagée avec un autre projet, dont un workflow actif. Les projets
d'équipe n'y sont pas activés : l'isolement passe donc par un **dossier dédié**,
un **préfixe de nom `LBI —`** et des **tags**. Aucun workflow existant ne doit
être touché. Tous les workflows démarrent inactifs.

## 6. Plan incrémental

Chaque lot est livrable et utile seul. Les estimations sont en jours de
développement, hors allers-retours.

| Lot | Contenu | Jours | Dépend de |
|---|---|---|---|
| **0** | Maquette et design system | **fait** | — |
| **1** | Tables `abonnements`, `interventions` ; agenda ; génération des passages | 4–6 | — |
| **2** | Écran d'intervention, checklist, mode hors ligne | 5–7 | 1 |
| **3** | Compte rendu rattaché au passage, verrou d'envoi | 3–4 | 2 |
| **4** | Facturation : liaison Henrri ou tables internes, paiements, relances | 5–8 | 3 |
| **5** | Espace client : prochains passages, documents, demandes | 5–7 | 3, 4 |
| **6** | Finances : rentabilité par client, par trajet, par prestation | 3–4 | 4 |
| **7** | Acquisition : pipeline, relances, suivi local | 3–4 | — |
| **8** | Automatisations n8n branchées sur le réel | 2–3 | 1–4 |

**Total : 30 à 43 jours**, soit six à neuf semaines à temps plein, sans compter
la recette. Le lot 4 est le plus incertain tant que l'API Henrri n'est pas
vérifiée ; cette vérification est à faire en premier, elle prend une demi-journée.

### Dépendances extérieures
Compte Henrri et son API · Resend (en place) · Supabase (en place, attention à
la mise en veille des projets inactifs) · n8n sur le VPS · une plateforme
agréée de facturation électronique, le jour venu et seulement pour les clients
professionnels.

## 7. Critères d'acceptation

Un lot n'est accepté que si **tous** les points sont vérifiés en conditions
réelles, pas en démonstration.

**Parcours**
- Une intervention close produit un compte rendu, et un seul.
- Un compte rendu envoyé deux fois ne part qu'une fois, même sur double clic ou
  second onglet.
- Une intervention déjà facturée n'apparaît plus comme facturable.
- Tout événement du parcours s'inscrit dans l'historique du client, daté.

**Terrain**
- L'écran d'intervention se remplit entièrement sans réseau, puis se synchronise.
- Chaque cible tactile fait au moins 48 px.
- Tout écran traite les cinq états : vide, chargement, erreur, une ligne, cent lignes.

**Sécurité**
- Aucune clé de service ne quitte le serveur.
- Les consignes d'accès à un logement — codes de portail, emplacement des clés —
  sont la donnée la plus sensible du système. Accès réservé à la session
  ouverte, jamais dans un e-mail, jamais dans un journal.
- Un espace client ne donne accès qu'aux documents de ce client : à vérifier par
  un test automatisé, pas à l'œil.
- Aucun envoi réel depuis un environnement de démonstration.

## 8. Ce qu'il ne faut pas construire

- **Un moteur comptable.** Numérotation légale, archivage, conformité : chez l'éditeur.
- **Un agenda complet.** Projeter les passages depuis les abonnements suffit ;
  les rendez-vous personnels restent dans l'agenda du téléphone.
- **Une messagerie interne.** Une seule personne travaille ici.
- **Des tableaux de bord analytiques.** Quatre chiffres justes valent mieux que
  douze graphiques que personne ne regarde.
- **Une application mobile native.** Le web suffit, et il se met à jour sans
  passer par une boutique.
