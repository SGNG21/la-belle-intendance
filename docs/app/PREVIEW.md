# Preview privée — procédure

Objectif : montrer le logiciel, sur un environnement qui ne peut rien casser.
Aucune clé de production, aucun envoi, aucune facture officielle.

## Ce que la Preview doit être

| | Preview | Production |
|---|---|---|
| Base | projet Supabase **de test**, ou branche | projet réel |
| PostgREST | celui du projet de test | celui du projet réel |
| Données | fictives, semées par `base-de-test.sh` | réelles |
| Comptes | de démonstration, adresses en `@exemple.fr` | réels |
| Envoi de courriels | **aucun** | Resend |
| Facturation | **aucune émission** | selon la décision Henrri |
| Accès | SSO Vercel, déjà actif | domaine public |

## Les variables, et seulement celles-là

Dans Vercel, **portée Preview uniquement** :

```
SUPABASE_URL=<url du projet Supabase de TEST>
SUPABASE_SERVICE_ROLE_KEY=<clé du projet de TEST>
INTENDANCE_CODE=<valeur jetable, différente de la production>
INTENDANCE_CODE_INTERVENANT=<valeur jetable>
INTENDANCE_LIENS_EN_CLAIR=oui
SITE_INDEXABLE=false
```

Et **surtout**, ces variables ne doivent **pas** exister en Preview :

```
RESEND_API_KEY          un envoi réel partirait
LEAD_EMAIL_TO           idem
MAIL_COPIE              idem
N8N_LEAD_WEBHOOK_URL    un webhook de production serait appelé
```

`INTENDANCE_LIENS_EN_CLAIR=oui` fait rendre le lien de connexion dans la
réponse de l'API au lieu de l'envoyer. C'est **exactement ce qu'il ne faut pas
en production**, et c'est ce qui permet de se connecter en démonstration sans
boîte aux lettres.

## Avant de déployer — les quatre vérifications

### 1. Les clés
Dans Vercel, Settings → Environment Variables, vérifier que les quatre
variables d'envoi sont cochées **Production uniquement**.

### 2. La base
Appliquer les migrations sur le projet Supabase **de test**, dans l'ordre :

```
supabase/migrations/20261122_lot1_metier.sql
supabase/migrations/20261122b_lot1_operations.sql
supabase/migrations/20261122c_lot1_agenda.sql
supabase/migrations/20261122d_lot1_concurrence.sql
supabase/migrations/20261122e_codes_erreur.sql
supabase/migrations/20261122f_comptes.sql
```

Puis semer `supabase/tests/semence.sql`.

### 3. Les comptes de démonstration
Trois comptes sont semés : Coralie (responsable), Nadia et Sabine
(intervenantes), en `@exemple.fr`. Pour entrer, demander un lien par l'API :

```bash
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"email":"coralie@exemple.fr"}' \
  https://<preview>/api/intendance/connexion
```

La réponse porte le lien. Ouvrir ce lien dans le navigateur.

### 4. Les connexions et les permissions
Rejouer les quatre recettes **contre la Preview** avant de montrer quoi que
ce soit :

```bash
node scripts/audit-routes.mjs https://<preview>
```

```bash
node scripts/recette-comptes.mjs https://<preview>
```

```bash
node scripts/recette.mjs https://<preview> <code> <code2>
```

```bash
node scripts/recette-hors-ligne.mjs https://<preview> <code>
```

Attendus : 34 refus sans fuite, 28, 35, 22. Tout écart arrête la démonstration.

## Sauvegarde et retour arrière

**La production n'est pas touchée**, donc il n'y a rien à restaurer de ce
côté. Les précautions portent sur la branche et sur le projet de test.

| Si | Alors |
|---|---|
| La Preview est cassée | elle se reconstruit depuis la branche ; rien à restaurer |
| Une migration échoue à mi-chemin | `scripts/base-de-test.sh` reconstruit le schéma à neuf |
| On veut revenir à l'état d'avant | `git revert` sur la branche ; la production est sur `main`, inchangée |
| Le projet Supabase de test est corrompu | le recréer et rejouer les migrations ; aucune donnée réelle n'y est |

Les migrations sont **rejouables** : elles portent `if not exists` et
`create or replace`. Une reprise après échec ne laisse pas la base à
mi-chemin.

**Ce qui n'a pas de retour arrière**, et n'est donc jamais fait en Preview :
l'émission d'une facture chez un éditeur, et l'envoi d'un courriel à un
client. Les deux sont désactivés par l'absence de clés.

## Ouvrir la Preview à quelqu'un d'extérieur

La protection SSO de Vercel est active sur tous les déploiements hors domaine
personnalisé : seul un compte de l'équipe entre. Pour montrer à une personne
sans compte, générer un lien de partage dans Vercel (Deployment → Sharing),
et le révoquer après.

Ce lien est un secret : ne pas le faire transiter par une conversation.

## Ce qui reste interdit en Preview

- Pointer vers la base de production, même en lecture.
- Y définir une clé Resend ou un webhook n8n de production.
- Émettre une facture chez Henrri, même en bac à sable, sans dire au client
  que c'en est une.
- Utiliser des noms ou adresses de clients réels dans les données fictives.
