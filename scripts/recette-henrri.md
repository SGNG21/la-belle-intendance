# Recette Henrri — à lancer en bac à sable

Cette recette **n'est pas un script exécutable** : l'API Henrri n'est pas
joignable depuis cet environnement autrement que par l'outil d'assistant, qui
exige une saisie de clés. Elle est donc écrite comme une suite d'appels à
passer, dans l'ordre, avec ce qu'on attend de chacun.

## Avant de commencer

**Des clés de bac à sable, jamais de production.**
Elles s'obtiennent ici : <https://henrri.io/API/TUTOS/getSandBoxAccess/>

L'authentification se fait avec `environment: "sandbox"`. Aucune clé n'est
conservée côté serveur ; la session est à repasser à chaque appel.

Ne collez jamais de clé de production dans une conversation. Le bac à sable
suffit à tout ce qui suit, et une facture de bac à sable n'a aucune valeur
légale.

## Les douze étapes

| # | Appel | Ce qu'on vérifie | Décision si ça rate |
|---|---|---|---|
| 1 | `authenticate` (sandbox) | la session s'ouvre | clés ou droits API à revoir |
| 2 | `get_me` | raison sociale, régime de TVA, numéro SAP éventuel | — |
| 3 | `get_document_types` | les identifiants réels du compte : facture, avoir, devis, acompte | nos constantes sont à corriger |
| 4 | `create_customer` type `individual` | un particulier se crée | bloquant |
| 5 | `create_item` | un article se crée, prix et TVA retenus | catalogue à prévoir |
| 6 | `create_document` type facture | brouillon créé, pas de numéro encore | bloquant |
| 7 | `add_document_line` ×2 | une ligne d'article et une ligne de texte | la ligne article exige `itemId` |
| 8 | `get_document` | totaux justes, **mention 293 B présente ou non** | **point bloquant si absente** |
| 9 | `set_payment_milestones` | acompte puis solde | acomptes à gérer autrement |
| 10 | `finalize_document` `confirm: true` | **numéro attribué** ; noter son format | — |
| 11 | `get_document_pdf_url` puis `GET` avec le jeton | le PDF se récupère ; **chercher la mention du crédit d'impôt** | **point bloquant si absente** |
| 12 | `pay_payment_milestone` puis `get_payment_milestones` | `isPaid` passe à vrai | — |

## Les trois points qui décident

### A. L'attestation fiscale annuelle CESU
Aucun appel de l'interface ne la produit. Chercher dans `get_me` et dans les
réglages du compte. **Si elle n'existe pas, même hors API**, Henrri ne couvre
pas le besoin principal de vos clients particuliers et la décision bascule.

### B. La mention de l'article 293 B
À l'étape 8, sur une facture à 0 % de TVA. Si elle n'apparaît pas
automatiquement, il faut la poser en ligne de texte — faisable, mais à ne pas
oublier sur chaque facture.

### C. La mention du crédit d'impôt services à la personne
À l'étape 11, dans le PDF. Même raisonnement.

## Essais de robustesse, après le parcours

| Essai | Attendu |
|---|---|
| `finalize_document` une seconde fois | refus |
| `add_document_line` sur un document finalisé | refus |
| `create_document` deux fois de suite | **deux factures** — c'est à nous de dédoublonner |
| une ligne d'article à prix zéro | refus documenté ; passer par le prix de ligne |
| `list_documents` avec `minId` | seuls les nouveaux reviennent |

## Ce que la recette ne fera pas

Aucune facture de production. Aucun envoi à un client. Aucune opération sur un
compte réel. Le bac à sable est cloisonné et ses documents n'ont pas de valeur
légale.

## Une fois la recette passée

Reporter les conclusions dans `FACTURATION-RESPONSABILITES.md`, trancher le
scénario A ou B, et seulement alors écrire l'intégration. Tant que ce n'est
pas fait, `factures.ref_externe` reste la place vide qui l'attend.
