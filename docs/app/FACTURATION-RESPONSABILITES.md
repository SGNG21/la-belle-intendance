# Facturation — qui fait quoi

Le risque que ce document écarte : **deux systèmes qui attribuent chacun des
numéros de facture.** Une série légale doit être unique, continue et sans trou.
Deux compteurs, et l'on obtient deux factures « 2027-014 » avec des montants
différents, ce qui se découvre en général au contrôle.

## La règle, en une phrase

> Un seul système attribue les numéros. L'autre n'en attribue jamais.

Tout le reste en découle.

## Les deux scénarios possibles

### A — Henrri porte la pièce légale (recommandé, sous réserve)

| Responsabilité | Qui |
|---|---|
| Préparer le contenu : lignes, montants, rattachement au passage | **L'application** |
| Attribuer le numéro | **Henrri** |
| Émettre, figer, archiver | **Henrri** |
| Produire le PDF | **Henrri** |
| Encaisser et pointer les règlements | **Henrri**, recopié chez nous |
| Lier facture et passage, empêcher la double facturation | **L'application** |

L'application **ne génère alors aucun numéro**. Le champ `factures.numero`
n'est plus rempli par `prochain_numero()` : il reçoit celui que Henrri renvoie,
et `factures.ref_externe` garde l'identifiant Henrri.

**Ce qu'il faut changer dans le code**, le jour où ce scénario est retenu :
désactiver l'appel à `prochain_numero()` dans `emettre_facture()`, qui prendra
le numéro en paramètre. La table `compteurs` reste en place mais inutilisée —
la supprimer ferait perdre la possibilité de revenir en arrière.

### B — L'application porte la pièce légale

| Responsabilité | Qui |
|---|---|
| Tout le cycle, de la préparation à l'archivage | **L'application** |
| Numérotation | **L'application**, par `prochain_numero()` |
| Conformité, conservation, facturation électronique | **À notre charge** |

C'est l'état actuel du code, et c'est le scénario de repli. Il fonctionne —
la numérotation est éprouvée, y compris sous concurrence — mais il nous rend
responsables de la conformité, ce que le brief demandait justement d'éviter.

## Ce qui est interdit dans les deux cas

- **Les deux à la fois.** Pas de « brouillon numéroté chez nous puis renuméroté
  chez Henrri » : le premier numéro aurait existé.
- **Réutiliser un numéro**, même après annulation. Une facture erronée se
  corrige par un avoir, jamais par une réécriture.
- **Créer la facture chez Henrri avant que le passage soit facturable.** La
  finalisation y est irréversible ; le verrou doit agir avant l'appel, et c'est
  ce que fait la contrainte `ligne_un_seul_passage`.

## L'ordre des opérations en scénario A

L'enchaînement protège contre la facture créée deux fois chez Henrri si le
réseau coupe au mauvais moment.

1. L'application vérifie que le passage est facturable — clos, compte rendu
   établi, pas déjà facturé. La base refuse sinon.
2. Elle crée la facture **chez elle**, en brouillon, sans numéro.
3. Elle pose une **clé d'idempotence** dans `envois`, de la forme
   `henrri:facture:<id>`. Si la clé existe déjà, on s'arrête : l'appel a déjà
   eu lieu, même si l'on n'en a pas vu la réponse.
4. Elle appelle Henrri : création, lignes, finalisation.
5. Elle recopie le numéro rendu et `ref_externe` sur sa propre facture.

Si le réseau coupe entre 4 et 5, la facture existe chez Henrri mais pas son
numéro chez nous. La clé d'idempotence empêche d'en créer une seconde ; la
réparation consiste à relire le document chez Henrri et à recopier son numéro.
C'est un cas à traiter explicitement, pas à espérer.

## Ce qui ne dépend pas du scénario

L'application reste seule maîtresse du **lien entre un passage et sa facture**.
C'est elle qui sait qu'un passage a déjà été facturé, et aucun logiciel de
facturation ne peut le savoir à sa place.

## La décision n'est pas prise

Henrri reste candidat, sans engagement, comme demandé. Le scénario A dépend
d'un point à vérifier avec des clés de bac à sable : **l'attestation fiscale
annuelle** que les particuliers employant en CESU attendent en janvier. Si
Henrri ne la produit pas, le gain se réduit beaucoup et le scénario B redevient
sérieux.

En attendant, le code tient le scénario B et reste prêt pour le A : c'est
pourquoi `factures.ref_externe` existe déjà, inutilisé.
