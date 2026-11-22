# n8n — audit d'accès et règle d'isolement

Audit du 22 novembre 2026, en lecture seule. **Rien n'a été créé ni modifié.**

## Ce que l'instance contient

| | |
|---|---|
| Projets accessibles | Un seul, personnel (`Geoffrey Nozza`). **Les projets d'équipe ne sont pas activés** sur cette instance. |
| Workflows | 6, tous POLIVIA ou ICOS. Aucun pour La Belle Intendance. |
| Workflow **actif** | `POLIVIA — Intake formulaire site` — reçoit les soumissions du site POLIVIA et écrit dans une Data Table. |
| Workflows inactifs | 2 POLIVIA de test, 3 « preuve ICOS » sans description. |
| Identifiants | `POLIVIA intake` (JWT) et `SMTP account`. Aucun dédié à La Belle Intendance. |

## La conséquence

Les projets d'équipe étant désactivés, **un projet n8n séparé est impossible**.
L'isolement ne peut donc être que conventionnel. Il repose sur trois règles,
qui n'ont de valeur que si elles sont tenues sans exception :

1. **Préfixe de nom `LBI — `** sur tout workflow de ce projet. Il rend
   l'appartenance visible dans une liste qui mélange les clients.
2. **Tag `la-belle-intendance`** sur chacun, pour filtrer.
3. **Identifiants dédiés.** Ne jamais réutiliser `POLIVIA intake` ni le
   `SMTP account` existant : un identifiant partagé entre deux clients est une
   fuite en attente. Créer `LBI — SMTP` et `LBI — webhook` le moment venu.

**Interdits.** Ne pas toucher aux six workflows existants. Ne pas désactiver
`POLIVIA — Intake formulaire site`, qui tourne en production. Ne pas écrire
dans les Data Tables `polivia_*`.

### La limite à connaître
Ces règles sont des conventions, pas des barrières. Sur une instance partagée
sans projets d'équipe, rien n'empêche techniquement un workflow de lire les
identifiants d'un autre client. Si l'isolement doit être réel — et il devrait
l'être dès qu'un vrai client est en jeu — il faut soit activer les projets
d'équipe, soit une seconde instance. C'est une décision à prendre, pas un
détail d'installation.

## Les automatisations prévues

Aucune n'est créée aujourd'hui : elles n'auraient rien à traiter tant que les
tables `interventions` et `factures` n'existent pas. Elles relèvent du lot 8 du
plan, après les lots 1 à 4.

| Automatisation | Déclencheur | Effet | Garde-fou |
|---|---|---|---|
| Rappel de passage | Veille à 18 h | SMS ou e-mail au client | Un seul par intervention, marqué en base |
| Brouillon de compte rendu | Intervention close | Prépare le texte depuis la checklist | Ne crée jamais l'envoi, seulement le brouillon |
| Préparation de facture | Compte rendu envoyé | Crée le brouillon de facture | Refusé si `intervention.facture_id` est déjà rempli |
| Relance de facture | 15 jours après échéance | E-mail de relance | Une relance par facture et par palier |
| Demande d'avis | 3ᵉ passage d'un client | Invitation à l'avis Google | Une seule fois par client, jamais après un incident |
| Suivi d'abonnement | Mensuel | Signale les abonnements sans passage | Lecture seule |

**Règle commune.** Toute automatisation qui envoie quelque chose au client
passe par une clé d'idempotence stockée côté application. n8n peut rejouer une
exécution ; l'application doit absorber ce rejeu sans second envoi. Un workflow
qui ne peut pas être rejoué sans dommage est un workflow mal écrit.

En phase de démonstration : aucun envoi réel, aucune facture officielle.
