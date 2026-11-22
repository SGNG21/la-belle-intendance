# Des codes partagés aux comptes individuels

## Où nous en sommes

Deux codes d'accès, donc deux rôles : responsable et intervenante. Le rôle
n'est pas inscrit dans le cookie mais déduit de lui — on ne peut pas se
promouvoir en le modifiant. Chaque route déclare le droit qu'elle exige et
`guarded()` le vérifie.

C'est suffisant tant que **deux personnes au plus** se servent de l'outil, et
cela le devient de moins en moins dès la troisième.

## Les trois limites, par ordre de gravité

**On ne sait pas qui a fait quoi.** La table `acces_revelations` enregistre
`par = 'session'`. On sait donc qu'une consigne d'entrée a été consultée, pas
par qui. Pour une donnée qui permet d'entrer chez un client, c'est la limite la
plus sérieuse : une traçabilité qui ne nomme personne ne trace rien.

**Un départ oblige à changer le code de tout le monde.** Une intervenante qui
s'en va emporte un code que les autres utilisent encore. En pratique on ne le
change pas, et l'accès reste ouvert.

**Toutes les intervenantes voient tous les chantiers.** Les droits sont portés
par le rôle, pas par la personne, donc « ses propres passages » n'existe pas
comme notion.

## La bascule, en trois temps

### Temps 1 — Une table de personnes
Reprendre `intervenants`, qui existe déjà, et lui ajouter de quoi se connecter.

```
alter table intervenants
  add column email      text unique,
  add column role       text not null default 'intervenant'
             check (role in ('proprietaire', 'intervenant')),
  add column desactive_le timestamptz;
```

Pas de colonne de mot de passe : voir le temps 2.

### Temps 2 — Un lien de connexion par courriel
Pas de mot de passe à retenir. On envoie un lien à usage unique, valable
quinze minutes, et la session dure trente jours comme aujourd'hui.

```
create table connexions (
  jeton       text primary key,
  personne_id uuid not null references intervenants(id) on delete cascade,
  expire_le   timestamptz not null,
  utilise_le  timestamptz
);
```

Trois raisons de préférer cela à un mot de passe pour cette équipe : rien à
mémoriser ni à noter sur un carnet ; la révocation est immédiate, il suffit de
désactiver la personne ; et l'infrastructure d'envoi existe déjà — c'est celle
des comptes rendus.

La session porte alors `personne_id` et non plus l'empreinte d'un code. Le
cookie reste `httpOnly` et signé.

### Temps 3 — Les droits par personne, et la trace nominative
`roleCourant()` lit le rôle de la personne au lieu de le déduire d'un code.
`acces_revelations.par` reçoit l'identifiant de la personne, et la traçabilité
devient réelle. On peut alors restreindre une intervenante à ses propres
passages, ce qui n'a aujourd'hui aucun sens faute d'identité.

## Ce qui ne bouge pas

`src/lib/roles.ts` garde sa table de droits, inchangée. `guarded(run, droit)`
garde sa signature. Toutes les routes restent telles quelles : **seule la façon
d'établir le rôle change**. C'est la raison pour laquelle le rôle a été isolé
dans une fonction dès maintenant, alors que deux codes auraient suffi.

## Coût et moment

Deux à trois jours. À faire **avant** la troisième personne, et **avant**
l'espace client — ce dernier exige de toute façon une identité par client, donc
le même mécanisme. Le faire deux fois coûterait plus cher que de le faire une.

Tant que Coralie travaille seule, les deux codes tiennent. Ce document existe
pour que le jour où ce n'est plus vrai, la bascule ne soit pas une réécriture.
