# Recette avec le vrai PostgREST

La doublure `scripts/postgrest-de-test.mjs` a permis de brancher les écrans sur
une vraie base et d'éprouver le parcours. Elle ne prouve pas la compatibilité
finale : elle reproduit ce que nous avons observé du dialecte, pas ce que
PostgREST fait réellement. Ce document donne la recette à passer avant de
considérer le lot comme livrable en production.

## Pourquoi elle n'a pas été exécutée ici

Trois voies ont été tentées dans l'environnement de développement :

| Voie | Résultat |
|---|---|
| Binaire officiel depuis GitHub | téléchargement refusé par la politique réseau |
| Image Docker `postgrest/postgrest` | aucun démon Docker |
| Paquet npm | aucun paquet officiel ; `postgrest` sur npm est un client, pas le serveur |

La recette est donc **prête à lancer**, pas jouée. C'est une limite réelle du
lot, et elle figure dans les points bloquants.

## Monter l'environnement

Sur une machine disposant de Docker, hors production :

```bash
docker run -d --name lbi-pg -e POSTGRES_PASSWORD=recette -p 5433:5432 postgres:16
```

```bash
PGHOST=127.0.0.1 PGPORT=5433 PGPASSWORD=recette scripts/base-de-test.sh 127.0.0.1 5433
```

```bash
docker run -d --name lbi-pgrst --network host \
  -e PGRST_DB_URI="postgres://postgres:recette@127.0.0.1:5433/postgres" \
  -e PGRST_DB_SCHEMAS=public \
  -e PGRST_DB_ANON_ROLE=postgres \
  postgrest/postgrest:v12.2.3
```

Puis l'application contre ce PostgREST, et non contre Supabase :

```bash
SUPABASE_URL=http://127.0.0.1:3000 SUPABASE_SERVICE_ROLE_KEY=inutile-en-recette INTENDANCE_CODE=recette INTENDANCE_CODE_INTERVENANT=recette-2 npm run start
```

## Les contrôles à passer

Dans cet ordre. Les deux premiers suffisent à décider s'il faut corriger
quelque chose.

```bash
node scripts/recette.mjs http://127.0.0.1:3100 recette recette-2
```

```bash
node scripts/recette-hors-ligne.mjs http://127.0.0.1:3100 recette
```

```bash
node scripts/audit-routes.mjs http://127.0.0.1:3100
```

Attendu, identique à ce qui passe sur la doublure : **35**, **22** et
**29 refus sans fuite**. Tout écart est un écart de compatibilité, et c'est
précisément ce que la recette cherche.

## Les sept points à comparer

Ce sont les endroits où la doublure a dû faire un choix, donc ceux où elle peut
se tromper.

### 1. Appel de fonction, forme de la réponse
Une fonction qui rend une ligne composite : objet seul ou tableau d'un
élément ? La doublure rend **un objet**, sauf pour `projeter_agenda` et
`interventions_a_facturer` où elle rend un **tableau**. Si PostgREST diffère,
`rpc()` dans `src/lib/operations.ts` est le seul endroit à corriger.

### 2. Paramètres tableau et jsonb
`etablir_compte_rendu` prend un `text[]`, `clore_intervention` un `jsonb`. La
doublure lit les types dans le catalogue pour distinguer les deux. PostgREST
s'appuie sur le même catalogue : l'accord est probable mais non vérifié.

### 3. Forme des erreurs
La doublure rend `{ message, details, code }`. L'extraction d'un conflit dans
`detailDuConflit()` dépend de ce que `details` contienne le JSON levé par
`raise ... using detail = ...`. **C'est le point le plus fragile de la
compatibilité** : si PostgREST place ce texte ailleurs, le conflit resterait
détecté — le code 409 vient de notre traduction — mais l'écran perdrait la
version réelle et l'heure, donc la phrase qui aide l'utilisatrice.

### 4. Codes HTTP
La doublure rend 400 pour toute erreur SQL. PostgREST distingue : 404 pour une
fonction absente, 409 pour une violation d'unicité, 400 pour le reste.
`db()` ramenant tout code non-2xx à 502 et `traduire()` lisant ensuite le
détail, le comportement devrait être le même. **À vérifier explicitement** sur
la double facturation, qui doit ressortir en 409 côté application.

### 5. Transactions
Chaque appel `/rpc/` doit être une transaction : si `facturer_intervention`
échoue sur sa deuxième ligne, aucune facture ne doit subsister. C'est le
comportement documenté de PostgREST et celui de la doublure. **Test direct** :
appeler `facturer_intervention` deux fois sur le même passage, puis compter les
factures. Il doit y en avoir une.

### 6. Sécurité niveau ligne
La doublure **ne l'applique pas du tout**. Les tables sont en RLS active sans
politique, donc seule la clé de service passe — c'est la configuration de
production et elle n'a jamais été éprouvée ici. À vérifier : avec un rôle
anonyme, aucune table ne doit répondre.

### 7. Sélection imbriquée
`clients?select=*,biens(id,libelle)` : la doublure reconstruit l'imbrication
par convention de nommage. PostgREST, lui, suit les clés étrangères réelles.
L'écart se verrait sur une table liée autrement que par `<table>_id`.

## Ce qui ne changera pas

Les contraintes, les déclencheurs et les fonctions sont en base : ils se
comportent de la même façon quel que soit ce qui les appelle. Les **35 refus
attendus** des quatre fichiers de `supabase/tests/` sont donc déjà vérifiés
indépendamment de PostgREST, par `psql`. La recette ci-dessus ne porte que sur
la couche de transport.
