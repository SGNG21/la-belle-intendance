# Henrri — audit de l'API

Audit du 22 novembre 2026. **Aucune authentification n'a été faite** : il n'y a
eu aucun appel sur votre compte, et aucune clé n'a transité. Ce qui suit vient
de la description de l'interface elle-même — les opérations exposées, leurs
paramètres obligatoires, leurs contraintes déclarées. C'est un audit de
capacité, pas un essai fonctionnel. La distinction a son importance et la
section « ce qui reste à éprouver » dit exactement ce qu'elle laisse ouvert.

## Ce que l'API sait faire

| Besoin | Disponible | Remarque |
|---|---|---|
| Créer un client | oui | `professional` ou `individual` — les deux cas d'Hélène et du cabinet |
| Créer un devis | oui | type « Devis », document comme un autre |
| Créer une facture | oui | brouillon, puis lignes, puis finalisation |
| Ajouter une ligne | oui | **avec une réserve importante, voir plus bas** |
| Appliquer un taux de TVA | oui | `vatPercent` par ligne |
| Finaliser une facture | oui | **irréversible**, exige `confirm: true` en production |
| Récupérer le PDF | oui | **pas une URL publique, voir plus bas** |
| Lister, filtrer, paginer | oui | `minId` permet une synchronisation incrémentale propre |
| Échéancier de paiement | oui | plusieurs échéances par facture |
| Enregistrer un règlement | oui | avec mode et date |
| Créer un avoir | oui | type de document dédié |
| Tableau de bord, CA | oui | mensuel, annuel, meilleurs clients |

La couverture est bonne. Les opérations du parcours — client, devis, facture,
paiement, avoir — existent toutes.

## Les quatre contraintes qui pèsent sur l'intégration

### 1. Une ligne facturable exige un article en bibliothèque
C'est la contrainte structurante. Une ligne d'article réclame un `itemId` :
on ne peut pas envoyer une ligne au fil de l'eau avec un libellé libre et un
prix. Les lignes en texte libre existent, mais ne portent ni quantité ni prix.

**Conséquence.** Il faut tenir un catalogue d'articles chez Henrri qui
corresponde aux prestations, et le synchroniser. Chaque nouveau libellé
facturable demande d'abord la création d'un article. Ce n'est pas rédhibitoire,
c'est une demi-journée de travail supplémentaire et une pièce mobile de plus.

### 2. Le PDF n'est pas un lien qu'on envoie
L'adresse du PDF exige un en-tête d'autorisation : elle ne s'ouvre pas dans un
navigateur. Impossible donc de coller ce lien dans un e-mail au client.

**Conséquence.** Le serveur récupère le fichier puis le joint à l'e-mail, ou
le réexpose derrière notre propre contrôle d'accès. Une demi-journée de plus.

### 3. La finalisation est irréversible
Une facture finalisée ne se corrige que par un avoir. C'est conforme à la règle
comptable, et cela rend le verrou anti-double-facturation **critique** : il doit
agir avant l'appel, pas après. C'est exactement ce que fait la contrainte
`ligne_un_seul_passage` de la migration du lot 1.

### 4. Pas de notification entrante
Rien dans l'interface ne permet à Henrri de nous prévenir d'un changement. Un
paiement saisi directement dans Henrri ne nous sera pas signalé.

**Conséquence.** La synchronisation se fait par interrogation régulière, avec
`minId`. Une tâche quotidienne suffit. À noter aussi : le champ « payé » d'une
facture se met à jour avec du retard ; c'est l'échéance qu'il faut lire.

## Une réserve de méthode

L'accès dont nous disposons ici est un outil d'assistant, pensé pour une
conversation, avec une session qui expire et des clés saisies à la main.
**Ce n'est pas le chemin d'intégration d'une application.** Celle-ci devra
appeler l'API REST d'Henrri directement, avec ses propres identifiants côté
serveur. L'audit ci-dessus porte sur les opérations exposées ; il est probable
mais non garanti que l'API REST offre exactement les mêmes.

## Ce qui reste à éprouver

Ces points demandent une authentification, et **des clés de bac à sable, pas
de production** :

1. Les identifiants des types de document sur votre compte, et l'existence
   d'un type « facture d'acompte » si vous en avez l'usage.
2. Le comportement en franchise de TVA : une facture à 0 % porte-t-elle
   automatiquement la mention de l'article 293 B, ou faut-il l'ajouter ?
3. La mention du crédit d'impôt services à la personne, et l'attestation
   fiscale annuelle, que vos clients attendent en janvier.
4. Le format de la numérotation, et si elle accepte une série par année.
5. Le palier tarifaire nécessaire pour l'accès API.
6. Le temps de réponse réel sur la création d'une facture complète.

**Le point 3 est le plus susceptible de tout changer.** Si Henrri ne produit pas
l'attestation fiscale annuelle que réclament les particuliers employant en
CESU, le gain se réduit beaucoup.

## Recommandation

**Garder Henrri, sous réserve du point 3.** Les opérations nécessaires existent,
et la numérotation légale comme l'archivage sont exactement ce qu'il ne faut pas
réécrire. Le coût d'intégration est d'environ **une journée de plus** que prévu,
à cause du catalogue d'articles et du PDF authentifié.

Aucune alternative n'est proposée ici, parce qu'aucune n'est justifiée pour
l'instant. Si le point 3 est rédhibitoire, les candidats à examiner seraient des
éditeurs français couvrant le CESU et l'attestation fiscale ; ce serait un
nouvel audit, pas une bascule.

## Sur la facturation électronique

Henrri étant un éditeur français de facturation, la conformité suit l'éditeur :
c'est le principal argument pour ne pas écrire nos propres factures. À
confirmer auprès d'eux : leur statut au regard des plateformes agréées et leur
calendrier.

Rappel du point établi dans l'architecture : la clientèle est très
majoritairement composée de particuliers, hors du champ de l'obligation entre
entreprises. **À faire confirmer par votre comptable.**
