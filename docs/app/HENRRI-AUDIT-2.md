# Henrri — audit de capacité, seconde passe

22 novembre 2026. **Toujours sans authentification** : aucun appel sur votre
compte, aucune clé transmise. Ce qui suit vient de la description de
l'interface. La section finale dit ce que cela laisse ouvert, et le test qui
l'épuiserait est écrit et prêt à lancer.

## Point par point

### Création de brouillons — **oui**
`create_document` crée un document en brouillon : type, client, titre,
sous-titre, échéance. Les lignes s'ajoutent ensuite.

### Émission — **oui, et irréversible**
`finalize_document` verrouille le document. `confirm: true` est obligatoire en
production. Une facture finalisée ne se corrige que par un avoir, ce qui est
la règle comptable — et ce qui rend notre verrou anti-double-facturation
critique **avant** l'appel, jamais après.

### Numérotation — **chez Henrri, et c'est le point de décision**
Le numéro est attribué à la finalisation. Si l'on retient ce scénario, notre
`prochain_numero()` ne doit plus servir : deux compteurs, c'est deux séries
légales, donc une non-conformité. Voir `FACTURATION-RESPONSABILITES.md`.

### Acomptes et règlements — **oui, en deux temps**
`set_payment_milestones` pose les échéances **sur un document finalisé** —
montant ou pourcentage, et date. `pay_payment_milestone` enregistre le
règlement, avec un mode à retrouver par `list_payment_modes` puisqu'il varie
d'un compte à l'autre.

**Un piège documenté par l'éditeur** : après l'enregistrement, c'est `isPaid`
sur l'échéance qu'il faut relire, pas `paid` sur la facture, qui se met à jour
avec du retard. Une synchronisation naïve verrait des impayés qui n'en sont
pas.

### Documents PDF — **oui, mais pas un lien partageable**
`get_document_pdf_url` rend une adresse qui exige l'en-tête d'autorisation :
elle ne s'ouvre pas dans un navigateur et ne se colle pas dans un courriel.
Le serveur doit récupérer le fichier et le joindre lui-même.

### Erreurs et doublons — **à la charge de l'appelant**
Rien dans l'interface ne dédoublonne. Deux appels à `create_document`
produisent deux factures. La protection reste la nôtre : la clé d'idempotence
posée **avant** l'appel, et la contrainte `ligne_un_seul_passage` qui empêche
qu'un passage parte deux fois.

Un détail qui coûtera une heure si on l'ignore : une ligne d'article à prix
zéro est **refusée** (traitée comme absente). Pour une prestation offerte, il
faut créer l'article à son prix normal et mettre zéro sur la ligne.

### Traçabilité — **par interrogation, pas par notification**
`list_documents` avec `minId` permet une synchronisation incrémentale propre.
Mais rien ne permet à Henrri de nous prévenir : un règlement saisi directement
chez eux ne nous sera pas signalé. Une tâche quotidienne suffit, à condition
de la prévoir.

### Contraintes légales et CESU — **le point bloquant**
L'interface expose la TVA par ligne, les types de document (facture, avoir,
devis, acompte) et les conditions de paiement. Elle **n'expose rien** qui
ressemble à :

- l'**attestation fiscale annuelle** que les particuliers employant en CESU
  attendent en janvier pour leur déclaration ;
- la mention du **crédit d'impôt services à la personne** ;
- un numéro de **déclaration SAP**.

Ces éléments existent peut-être dans les réglages du compte, hors API. C'est
exactement ce qu'il faut vérifier, et c'est le seul point qui peut faire
renoncer à Henrri.

## Ce qui ne se décide pas sans essai

| À vérifier | Pourquoi cela compte |
|---|---|
| L'attestation fiscale annuelle CESU | Vos clients la réclament ; sans elle, le gain fond |
| La mention 293 B en franchise de TVA | Obligatoire sur chaque facture |
| La mention du crédit d'impôt | Attendue par les particuliers |
| Les types de document du compte | Les identifiants varient d'un compte à l'autre |
| Le format de numérotation | Série annuelle ou continue ? |
| Le palier tarifaire pour l'API | Coût réel |
| Le temps de réponse d'une facture complète | Tenue de l'écran |

## Le test, prêt à lancer

`scripts/recette-henrri.mjs` enchaîne le parcours complet **en bac à sable** :
profil, types de document, client, article, brouillon, lignes, échéances,
finalisation, PDF, règlement, puis relecture. Il s'arrête avant toute
opération irréversible si on ne le lance pas avec `--finaliser`, et il refuse
catégoriquement de tourner sur l'environnement de production.

Pour le lancer il me faut des **clés de bac à sable**, à obtenir ici :
<https://henrri.io/API/TUTOS/getSandBoxAccess/>

Ne communiquez jamais vos clés de production : le test n'en a pas besoin, et
le script les refuse.

## Recommandation, inchangée

**Henrri reste candidat, sans engagement.** Les opérations du parcours
existent toutes. Le coût d'intégration est d'environ une journée de plus que
prévu — catalogue d'articles à synchroniser, PDF à récupérer côté serveur.

La décision dépend d'un seul point : l'attestation fiscale CESU. S'il est
tenu, on garde Henrri et il porte la numérotation. Sinon, l'application la
porte, et il faudra traiter nous-mêmes la conformité — ce que le brief
demandait justement d'éviter.
