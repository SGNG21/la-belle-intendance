# Carte de visite

Fichier à déposer chez l'imprimeur : **`carte-la-belle-intendance.pdf`**
(2 pages — page 1 recto, page 2 verso).

Régénérer après toute modification : `node scripts/carte.mjs`

## Ce que vaut le fichier

| | |
| --- | --- |
| Format du fichier | 91 × 61 mm |
| Format coupé | 85 × 55 mm — le standard européen, celui de Vistaprint |
| Fond perdu | 3 mm sur chaque bord |
| Zone tranquille | 4 mm à l'intérieur du trait de coupe |
| Résolution | 400 ppp (1433 × 961 px par face) |
| Couleurs | RVB |
| Polices | aucune — tout est aplati en pixels |
| Compression | sans perte |

Trois choix méritent une explication.

**Le fond perdu.** Les aplats, la photo et le feuillage débordent jusqu'au bord
du fichier. Le massicot coupe une pile de plusieurs centaines de cartes d'un
coup et dévie toujours un peu ; sans ce débord, une carte sur dix sortirait avec
un liséré blanc.

**La zone tranquille.** Aucun texte, et surtout pas le filet doré, ne s'approche
à moins de 4 mm du trait de coupe. Un filet posé sur la coupe est le défaut le
plus visible qui soit : il paraît plus épais d'un côté que de l'autre dès que la
découpe dévie d'un demi-millimètre.

**L'aplatissement.** Le texte est rendu en pixels plutôt qu'en caractères. Il
n'y a donc aucune police à incorporer, aucun risque que l'imprimeur substitue
un caractère, et ce que vous voyez à l'écran est exactement ce qui sortira.
C'est le fichier le plus sûr à confier à un imprimeur grand public.

## Déposer chez Vistaprint

1. Cartes de visite → format standard **85 × 55 mm**.
2. « Importer un fichier » (et non l'éditeur en ligne, qui recomposerait tout).
3. Déposer `carte-la-belle-intendance.pdf`. Les deux faces sont reconnues
   automatiquement : page 1 au recto, page 2 au verso.
4. Si un écran propose d'ajuster à la page, **refuser** : le fichier est déjà
   au bon format, tout ajustement le déformerait.
5. Papier conseillé : mat 350 g. Le brillant écrase les beiges et fait briller
   le filet doré au point de le rendre illisible.

### La couleur

Le fichier est en RVB, Vistaprint le convertit en CMJN à la réception. La
conversion est fidèle sur le crème et le doré ; le bleu marine peut sortir d'un
cheveu plus terne qu'à l'écran. C'est normal et sans gravité. Si l'imprimeur
réclame explicitement du CMJN, il faut repasser par un logiciel de PAO — le
navigateur qui produit ces images ne sait pas écrire de CMJN.

## Les fichiers

```
carte-la-belle-intendance.pdf   le fichier à envoyer
carte-recto.png                 la face 1 seule, si un imprimeur préfère des images
carte-verso.png                 la face 2 seule
assets/                         photo, monogramme, feuillages et polices
```

Les textes imprimés (téléphone, e-mail, domaine, SIRET) sont lus à l'exécution
dans `src/config/site.ts`. Ils ne se recopient pas à la main : corriger la
source, relancer le script, et la carte suit.
