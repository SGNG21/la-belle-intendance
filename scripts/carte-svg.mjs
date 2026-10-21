/**
 * La même carte de visite, en SVG modifiable.
 *
 * Illustrator ouvre le SVG nativement : le texte reste du texte, les tracés
 * restent des tracés, et chaque bloc arrive dans un groupe nommé. C'est le
 * format à donner à quelqu'un qui doit retoucher la carte — le PDF produit par
 * scripts/carte.mjs, lui, est aplati exprès et ne se modifie pas.
 *
 * Le dessin est écrit à la main plutôt que converti depuis la page HTML : une
 * conversion automatique rendrait un empilement de masques d'écrêtage et de
 * lettres vectorisées, inexploitable. Ici l'unité du document est le
 * millimètre, ce qui rend les coordonnées lisibles et la règle d'Illustrator
 * directement comparable au gabarit de l'imprimeur.
 *
 * Les images (photo, monogramme, feuillages) sont incorporées en base64 : le
 * fichier est lourd mais autonome, aucun lien à recoller.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const dossier = join(racine, "marketing", "carte-visite");
const actifs = join(dossier, "assets");

/* Géométrie, en millimètres. */
const L = 91; // largeur du fichier, fond perdu compris
const H = 61; // hauteur du fichier
const PERDU = 3; // fond perdu par bord
const SUR = 7; // bord du fichier → zone tranquille (3 de perdu + 4 de marge)

const NAVY = "#182a45";
const NAVY_CLAIR = "#22395a";
const OR = "#ae8130";
const PAPIER = "#fbf8f1";

/* Les noms de familles tels qu'Illustrator les cherchera dans le système. */
const DISPLAY = "Marcellus, serif";
const SERIF = "'Cormorant Garamond Light', 'Cormorant Garamond', Cormorant, serif";

function coordonnees() {
  const src = readFileSync(join(racine, "src", "config", "site.ts"), "utf8");
  const lire = (clef) => src.match(new RegExp(`${clef}:\\s*"([^"]*)"`))[1];
  return {
    telephone: lire("phone"),
    email: lire("email"),
    siret: lire("siret"),
    domaine: src.match(/CANONICAL_URL = "https:\/\/([^"]+)"/)[1],
  };
}

const image = (f, type) =>
  `data:${type};base64,${readFileSync(join(actifs, f)).toString("base64")}`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Un bloc de texte. `taille` et `interlettre` sont en millimètres, comme tout
 * le reste du document : à 1 unité = 1 mm, une capitale de 2 mm fait vraiment
 * 2 mm sur la carte imprimée.
 */
function texte(x, y, contenu, o = {}) {
  const a = [
    `x="${x}"`,
    `y="${y}"`,
    `font-family="${o.police ?? SERIF}"`,
    `font-size="${o.taille}"`,
    `fill="${o.couleur ?? NAVY}"`,
  ];
  if (o.ancre) a.push(`text-anchor="${o.ancre}"`);
  if (o.interlettre) a.push(`letter-spacing="${o.interlettre}"`);
  if (o.graisse) a.push(`font-weight="${o.graisse}"`);
  if (o.opacite) a.push(`opacity="${o.opacite}"`);
  if (o.chiffres) a.push(`style="font-variant-numeric:lining-nums tabular-nums"`);
  return `<text ${a.join(" ")}>${contenu}</text>`;
}

/** Les traits de coupe et la zone tranquille, sur un calque masqué. */
const reperes = () => `  <g id="Reperes-ne-pas-imprimer" display="none">
    <rect x="${PERDU}" y="${PERDU}" width="${L - 2 * PERDU}" height="${H - 2 * PERDU}"
      fill="none" stroke="#e2007a" stroke-width="0.1" stroke-dasharray="1 1"/>
    <rect x="${SUR}" y="${SUR}" width="${L - 2 * SUR}" height="${H - 2 * SUR}"
      fill="none" stroke="#00a0e2" stroke-width="0.1" stroke-dasharray="1 1"/>
  </g>`;

const entete = (titre) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${L}mm" height="${H}mm" viewBox="0 0 ${L} ${H}">
  <title>${titre}</title>
  <desc>Carte de visite La Belle Intendance — ${L} × ${H} mm, coupe à 85 × 55 mm, fond perdu de ${PERDU} mm.</desc>`;

function recto() {
  const mono = { l: 18, h: 18 * (320 / 380) };
  const cx = L / 2;
  const monoY = 15.4;

  return `${entete("Carte de visite — recto")}
  <defs>
    <linearGradient id="voile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4eee2" stop-opacity="0.10"/>
      <stop offset="0.46" stop-color="#f4eee2" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#f4eee2" stop-opacity="0.80"/>
    </linearGradient>
  </defs>

  <g id="Fond">
    <image href="${image("photo-recto.jpg", "image/jpeg")}" x="0" y="0" width="${L}" height="${H}"
      preserveAspectRatio="xMidYMid slice"/>
    <rect x="0" y="0" width="${L}" height="${H}" fill="url(#voile)"/>
  </g>

  <g id="Cadre">
    <rect x="${SUR}" y="${SUR}" width="${L - 2 * SUR}" height="${H - 2 * SUR}"
      fill="none" stroke="${OR}" stroke-width="0.22"/>
  </g>

  <g id="Marque">
    <image href="${image("monogramme.png", "image/png")}" x="${cx - mono.l / 2}" y="${monoY}"
      width="${mono.l}" height="${mono.h}"/>
    ${texte(cx, 38.6, "LA BELLE INTENDANCE", { police: DISPLAY, taille: 3.95, interlettre: 0.42, ancre: "middle" })}
    <path id="Losange" d="M ${cx} ${41.9} l 0.75 0.75 l -0.75 0.75 l -0.75 -0.75 Z" fill="${OR}"/>
    ${texte(cx, 47.2, "ENTRETIEN DE LA MAISON &amp; CONCIERGERIE", { taille: 1.75, interlettre: 0.28, couleur: NAVY_CLAIR, ancre: "middle" })}
  </g>

${reperes()}
</svg>
`;
}

function verso(c) {
  /* Colonne de gauche centrée sur x=25,5 ; filet vertical à x=44 ; colonne de
     droite calée à x=48. */
  const gx = 21.6; // centre de la colonne de gauche (7 + 29,26/2)
  const fx = 36.3; // filet vertical, à 38 % de la zone tranquille
  const dx = 39.4; // colonne de droite
  const mono = { l: 13, h: 13 * (320 / 380) };

  const picto = (x, y, d) =>
    `<g transform="translate(${x} ${y}) scale(${2.5 / 24})" fill="none" stroke="${OR}"
      stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;

  /* Une ligne de contact : le pictogramme à gauche, le texte sur sa ligne de base. */
  const ligne = (y, d, valeur, graisse) =>
    `${picto(dx, y - 1.95, d)}\n    ${texte(dx + 4, y, esc(valeur), { taille: 2.2, graisse, chiffres: true })}`;

  return `${entete("Carte de visite — verso")}
  <g id="Fond">
    <rect x="0" y="0" width="${L}" height="${H}" fill="${PAPIER}"/>
    <image href="${image("feuillage-a.png", "image/png")}" x="${L - 15.5}" y="-2"
      width="17" height="${17 * (234 / 202)}" opacity="0.95"/>
    <image href="${image("feuillage-b.png", "image/png")}" x="-2" y="${H - 17.1}"
      width="14" height="${14 * (223 / 159)}" opacity="0.95"
      transform="rotate(180 5 ${H - 7.3})"/>
  </g>

  <g id="Cadre">
    <rect x="${SUR}" y="${SUR}" width="${L - 2 * SUR}" height="${H - 2 * SUR}"
      fill="none" stroke="${OR}" stroke-width="0.22"/>
    <line x1="${fx}" y1="${SUR}" x2="${fx}" y2="${H - SUR}" stroke="${OR}" stroke-width="0.14" opacity="0.5"/>
  </g>

  <g id="Colonne-marque">
    <image href="${image("monogramme.png", "image/png")}" x="${gx - mono.l / 2}" y="15.6"
      width="${mono.l}" height="${mono.h}"/>
    ${texte(gx, 31.6, "LA BELLE", { police: DISPLAY, taille: 2.5, interlettre: 0.42, ancre: "middle" })}
    ${texte(gx, 34.9, "INTENDANCE", { police: DISPLAY, taille: 2.5, interlettre: 0.42, ancre: "middle" })}
    <line x1="${gx - 4.5}" y1="37.4" x2="${gx + 4.5}" y2="37.4" stroke="${OR}" stroke-width="0.18" opacity="0.75"/>
    ${texte(gx, 40.1, "ENTRETIEN DE LA MAISON", { taille: 1.35, interlettre: 0.28, couleur: NAVY_CLAIR, ancre: "middle" })}
    ${texte(gx, 42.2, "&amp; CONCIERGERIE", { taille: 1.35, interlettre: 0.28, couleur: NAVY_CLAIR, ancre: "middle" })}
    ${texte(gx, 46.3, "MAISONS SOIGNÉES,", { taille: 1.3, interlettre: 0.28, couleur: OR, ancre: "middle" })}
    ${texte(gx, 48.3, "VIES PLUS DOUCES", { taille: 1.3, interlettre: 0.28, couleur: OR, ancre: "middle" })}
  </g>

  <g id="Coordonnees">
    ${texte(dx, 18.4, "Coralie ", { taille: 4.4, graisse: 600 }).replace(
      "</text>",
      `<tspan letter-spacing="0.1">RENAULT</tspan></text>`,
    )}
    ${texte(dx, 22.1, "INTENDANTE", { taille: 1.45, interlettre: 0.28, couleur: OR })}
    ${texte(dx, 24.6, "LA BELLE INTENDANCE", { taille: 1.45, interlettre: 0.28, couleur: NAVY_CLAIR, opacite: 0.8 })}

    ${ligne(30.3, '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>', c.telephone, 600)}
    ${ligne(34.4, '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', c.email)}
    ${ligne(38.5, '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>', c.domaine)}
    ${ligne(42.6, '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/>', "Joigny et ses environs — Yonne (89)")}

    <rect x="${dx}" y="45.6" width="24.5" height="4.6" fill="none"
      stroke="${OR}" stroke-opacity="0.55" stroke-width="0.14"/>
    ${texte(dx + 1.7, 48.8, `SIRET ${c.siret}`, { taille: 1.7, couleur: NAVY_CLAIR, chiffres: true })}
  </g>

${reperes()}
</svg>
`;
}

const c = coordonnees();
mkdirSync(dossier, { recursive: true });
for (const [nom, svg] of [["recto", recto()], ["verso", verso(c)]]) {
  const f = join(dossier, `carte-${nom}.svg`);
  writeFileSync(f, svg, "utf8");
  console.log(`carte-${nom}.svg — ${L} × ${H} mm, texte modifiable`);
}
