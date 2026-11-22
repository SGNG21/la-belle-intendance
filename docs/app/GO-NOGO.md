# Lot 1 — GO / NO-GO

Au 22 novembre 2026, sur la branche `claude/business-os-v1`.

## Verdict — mis à jour le 22 novembre 2026, seconde passe

**NO-GO pour la production. GO pour une Preview privée de validation.**

Le verdict ne change pas, mais sa composition si : le blocage de sécurité est
levé. Il en reste deux, et aucun ne dépend plus de moi.

## Les niveaux de preuve

Chaque ligne dit où elle a été vérifiée. Les colonnes ne sont pas
interchangeables : la doublure a masqué un défaut grave que seul le vrai
PostgREST a révélé.

| | Doublure | PostgreSQL réel | PostgREST réel | Preview | Production |
|---|---|---|---|---|---|
| Contraintes et verrous (41 refus) | — | **oui** | — | non | non |
| Parcours complet (35 contrôles) | oui | — | **oui** | non | non |
| Hors ligne (22 contrôles) | oui | — | **oui** | non | non |
| Comptes et cloisonnement (28) | oui | — | **oui** | non | non |
| Routes sans session (34 refus) | oui | — | **oui** | non | non |
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

### 1. ~~La traçabilité ne nomme personne~~ — **levé**
Les comptes individuels sont en place : connexion par lien à usage unique,
session en base donc révocable, rôle porté par la personne. Une consigne
d'entrée n'est servie qu'à quelqu'un de nommé — un code partagé est refusé en
403 — et la trace est posée **avant** que la consigne ne parte.

28 vérifications de cloisonnement entre personnes authentifiées, et non plus
seulement contre un inconnu. Fermer un compte ferme ses sessions à la requête
suivante.

Reste une transition à finir : les deux codes partagés fonctionnent encore, en
repli. Ils devront être retirés une fois chacun pourvu d'un compte, et c'est
une ligne de configuration, pas un chantier.

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

1. ~~Comptes individuels~~ — **fait**.
2. Décider du propriétaire de la facturation, après le test Henrri en bac à
   sable — **une demi-journée de votre côté**, il me faut des clés de bac à
   sable. Voir `scripts/recette-henrri.md`.
3. Appliquer les migrations sur un projet Supabase de test, déployer en
   Preview, rejouer les cinq recettes contre elle — **un jour**. La procédure
   complète est dans `PREVIEW.md`.

Soit **un jour et demi** avant un GO de production, dont une demi-journée qui
ne dépend pas de moi.

## Un point d'exploitation trouvé en route

PostgREST garde en mémoire la description du schéma. Après une migration, il
continue de servir l'ancienne et répond des erreurs incompréhensibles jusqu'à
recevoir `notify pgrst, 'reload schema'`. Supabase l'émet tout seul ; un
déploiement manuel, non. Cela rendait la recette intermittente — ce qui est
pire qu'une recette fausse, parce qu'on finit par croire au hasard.
