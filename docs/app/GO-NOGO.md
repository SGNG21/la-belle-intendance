# Lot 1 — GO / NO-GO

Au 22 novembre 2026, sur la branche `claude/business-os-v1`.

## Verdict

**NO-GO pour la production. GO pour une Preview privée de validation.**

Le logiciel fait ce qu'on lui demande et le prouve. Trois choses manquent, dont
deux tiennent à la sécurité et une à la facturation. Aucune n'est un chantier,
toutes sont des décisions à prendre.

## Les niveaux de preuve

Chaque ligne dit où elle a été vérifiée. Les colonnes ne sont pas
interchangeables : la doublure a masqué un défaut grave que seul le vrai
PostgREST a révélé.

| | Doublure | PostgreSQL réel | PostgREST réel | Preview | Production |
|---|---|---|---|---|---|
| Contraintes et verrous (35 refus) | — | **oui** | — | non | non |
| Parcours complet (35 contrôles) | oui | — | **oui** | non | non |
| Hors ligne (22 contrôles) | oui | — | **oui** | non | non |
| Routes sans session (31 refus) | oui | — | **oui** | non | non |
| Sept points de compatibilité (24) | oui | — | **oui** | non | non |
| Sécurité niveau ligne | **non applicable** | — | **oui** | non | non |
| Agenda, fiche client, passage | oui | — | **oui** | non | non |

« Preview » et « Production » sont vides, et c'est exact : rien n'y a été
déployé depuis ces changements.

## Ce qui marche, et comment on le sait

**Le parcours.** Agenda → passage → relevé → clôture → compte rendu → facture
→ émission → acompte → solde → historique. 35 contrôles par HTTP sur le vrai
PostgREST.

**Les verrous tiennent en base.** Pas de second compte rendu, pas de double
facturation, pas de réémission, pas de rejeu d'envoi, pas de modification
d'une facture émise. 35 refus attendus, levés par `psql`, donc indépendamment
de la couche de transport.

**Le passé ne bouge plus.** Les conditions tarifaires sont figées à la
clôture : un tarif changé en mars ne réécrit pas une facture de janvier.

**La concurrence est traitée.** Versions sur les interventions, conflit détecté
et remonté avec la version réelle et l'heure. Aucune écriture silencieuse.

**Le hors-ligne tient.** Coupure en cours de relevé, fermeture du navigateur,
retour du réseau, rejeu, deux appareils, conflit, échec partiel : 22 contrôles.
Aucune consigne d'accès ne descend dans le stockage du navigateur.

**La sécurité niveau ligne est étanche.** Sans jeton, les six tables et les
fonctions répondent 401. Vérifié pour la première fois sur le vrai PostgREST —
la doublure ne l'appliquait pas du tout.

## Ce que la recette réelle a trouvé

Le plus grave défaut du lot n'a été vu qu'avec le vrai PostgREST.

J'avais choisi le code SQL `40001` pour signaler un conflit de version. Il
s'appelle `serialization_failure` et le nom allait bien. Or PostgreSQL lui
donne un sens précis : « échec transitoire, recommence ». PostgREST applique
donc sa politique de reprise, et **la requête ne revient jamais** — quinze
secondes sans réponse, et pas même une ligne dans son journal.

En production, chaque conflit entre deux appareils aurait figé l'écran de
l'intervenante. La doublure, elle, répondait proprement.

Corrigé par la convention `PTxyz`, que PostgREST traduit en statut HTTP : le
conflit répond maintenant 409 en quinze millisecondes. La doublure a été
alignée sur le vrai serveur, sinon elle aurait continué à donner une confiance
démentie.

## Les trois blocages

### 1. La traçabilité ne nomme personne — **bloquant**
`acces_revelations.par` vaut `'session'`. On sait qu'une consigne d'entrée a
été consultée, pas par qui. Pour une donnée qui permet d'entrer chez un client,
une traçabilité anonyme ne trace rien. Les codes partagés doivent céder la
place à des comptes individuels : voir `COMPTES-INDIVIDUELS.md`, deux à trois
jours.

### 2. La facturation n'a pas de propriétaire désigné — **bloquant**
Le code sait émettre des factures numérotées. Reste à décider si c'est lui ou
Henrri qui porte la pièce légale. Tant que ce n'est pas tranché, le risque de
double numérotation existe. Le point à vérifier avec des clés de bac à sable
est l'attestation fiscale annuelle CESU : une demi-journée. Voir
`FACTURATION-RESPONSABILITES.md`.

### 3. Rien n'a été vérifié en Preview — **bloquant avant toute démonstration**
Les migrations ne sont appliquées nulle part ailleurs qu'en local. La Preview
n'a pas été reconstruite depuis ces changements.

## Les réserves, qui ne bloquent pas

- **Les photos ne sont pas implémentées.** L'écran dit si le client les
  autorise ; rien ne les téléverse. L'architecture n'a pas de stockage de
  fichiers, et en ajouter un est une décision, pas un oubli.
- **La doublure reste dans le dépôt.** Elle sert aux essais rapides, et elle
  est maintenant alignée. Elle ne doit jamais servir de preuve seule.
- **`pg` est en dépendance de développement.** Elle ne part pas en production.
- **PostgREST 14.16** a servi à la recette ; Supabase peut en servir une autre.
  Les sept points sont à rejouer après toute montée de version de leur côté.

## Pour lever le NO-GO

1. Comptes individuels — 2 à 3 jours.
2. Décider du propriétaire de la facturation, après le test Henrri — 1 jour.
3. Appliquer les migrations sur une branche Supabase, déployer en Preview,
   rejouer les quatre recettes contre elle — 1 jour.

Soit **quatre à cinq jours** avant un GO de production. D'ici là, une Preview
privée pour montrer le logiciel est sans risque, à condition que son
environnement ne porte aucune clé de production.
