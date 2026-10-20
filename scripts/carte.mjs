/**
 * Carte de visite, prête pour l'impression.
 *
 * Deux faces rendues à 400 ppp, assemblées en un PDF de 91 × 61 mm — soit
 * 85 × 55 mm de carte plus 3 mm de fond perdu sur chaque bord.
 *
 * Trois règles commandent la mise en page :
 *  - le fond perdu : les aplats et le feuillage débordent jusqu'au bord du
 *    fichier, pour qu'un massicot qui dévie d'un millimètre ne découvre pas
 *    une bande blanche ;
 *  - la zone tranquille : rien de lisible ni le filet doré ne s'approche à
 *    moins de 4 mm du trait de coupe, parce que la découpe n'est jamais au
 *    dixième près ;
 *  - tout est aplati : le texte est rendu en pixels, donc aucune police à
 *    incorporer, et l'imprimeur ne peut pas substituer un caractère.
 *
 * Les textes viennent de src/config/site.ts : le numéro, l'adresse e-mail et
 * le SIRET ne se recopient pas à la main.
 */
import { readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pw from "/opt/node-tools/node_modules/playwright/index.js";

const { chromium } = pw;
const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const dossier = join(racine, "marketing", "carte-visite");
const actifs = join(dossier, "assets");

/** 400 ppp : un millimètre vaut ce nombre de pixels. */
const PPP = 400;
const MM = PPP / 25.4;
const px = (mm) => Math.round(mm * MM);

const LARGEUR = px(91); // 85 + 3 de fond perdu de chaque côté
const HAUTEUR = px(61); // 55 + 3

/** Les coordonnées de l'entreprise, lues à la source. */
function coordonnees() {
  const src = readFileSync(join(racine, "src", "config", "site.ts"), "utf8");
  const lire = (clef) => {
    const m = src.match(new RegExp(`${clef}:\\s*"([^"]*)"`));
    if (!m) throw new Error(`${clef} introuvable dans src/config/site.ts`);
    return m[1];
  };
  return {
    telephone: lire("phone"),
    email: lire("email"),
    siret: lire("siret"),
    domaine: src.match(/CANONICAL_URL = "https:\/\/([^"]+)"/)[1],
  };
}

const b64 = (f, type) => `data:${type};base64,${readFileSync(join(actifs, f)).toString("base64")}`;

function page(corps) {
  const police = (nom, fichier, graisse) =>
    `@font-face{font-family:"${nom}";font-weight:${graisse};font-display:block;src:url("${b64(fichier, "font/woff2")}") format("woff2")}`;

  return `<!doctype html><meta charset="utf-8"><style>
${police("Marcellus", "marcellus-latin-400-normal.woff2", 400)}
${police("Cormorant", "cormorant-garamond-latin-400-normal.woff2", 400)}
${police("Cormorant", "cormorant-garamond-latin-600-normal.woff2", 600)}
:root{
  --mm:${MM}px;
  --navy:#182a45; --navy-clair:#22395a; --or:#ae8130; --creme:#f4eee2; --papier:#fbf8f1;
  --perdu:3; /* mm de fond perdu */
  --sur:7;   /* mm du bord du fichier à la zone tranquille (3 de perdu + 4 de marge) */
}
*{margin:0;padding:0;box-sizing:border-box}
/* Cormorant dessine par défaut des chiffres elzéviriens, où le 1 se confond
   avec un I et où le 0 plonge sous la ligne. Sur un numéro de téléphone et un
   SIRET, on impose les chiffres capitales. */
.chiffres{font-variant-numeric:lining-nums tabular-nums;
  font-feature-settings:"lnum" 1,"tnum" 1,"onum" 0}
html,body{width:${LARGEUR}px;height:${HAUTEUR}px;overflow:hidden}
.carte{position:relative;width:${LARGEUR}px;height:${HAUTEUR}px;overflow:hidden;
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
/* Le filet, posé sur la zone tranquille. */
.filet{position:absolute;inset:calc(var(--sur) * var(--mm));border:calc(0.22 * var(--mm)) solid var(--or);pointer-events:none}
.fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.centre{position:absolute;inset:calc(var(--sur) * var(--mm));display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center}
.mot{font-family:"Marcellus",serif;color:var(--navy);letter-spacing:calc(0.42 * var(--mm));
  text-transform:uppercase;line-height:1.05}
.bas{font-family:"Cormorant",serif;color:var(--navy-clair);text-transform:uppercase;
  letter-spacing:calc(0.28 * var(--mm))}
.losange{width:calc(1.5 * var(--mm));height:calc(1.5 * var(--mm));background:var(--or);
  transform:rotate(45deg)}
</style>${corps}`;
}

function recto(c) {
  return page(`<div class="carte">
  <img class="fond" src="${b64("photo-recto.jpg", "image/jpeg")}" alt="">
  <div style="position:absolute;inset:0;background:
    linear-gradient(180deg, rgba(244,238,226,.10) 0%, rgba(244,238,226,.34) 46%, rgba(244,238,226,.80) 100%)"></div>
  <div class="filet"></div>
  <div class="centre">
    <img src="${b64("monogramme.png", "image/png")}" style="width:calc(18 * var(--mm));height:auto;
      margin-bottom:calc(1.6 * var(--mm))" alt="">
    <div class="mot" style="font-size:calc(3.95 * var(--mm))">La Belle Intendance</div>
    <div class="losange" style="margin:calc(2.1 * var(--mm)) 0 calc(1.7 * var(--mm))"></div>
    <div class="bas" style="font-size:calc(1.75 * var(--mm))">Entretien de la maison &amp; conciergerie</div>
  </div>
</div>`);
}

function verso(c) {
  /* Un pictogramme par ligne, dessiné plutôt que chargé : à 400 ppp, un trait
     vectoriel reste net là où une icône bitmap de 24 px baverait. */
  const picto = (d) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="#ae8130" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round"
      style="width:calc(2.5 * var(--mm));height:calc(2.5 * var(--mm));flex:none">${d}</svg>`;

  const ligne = (icone, texte) =>
    `<li style="display:flex;align-items:center;gap:calc(1.5 * var(--mm))">${icone}<span>${texte}</span></li>`;

  return page(`<div class="carte" style="background:var(--papier)">
  <img src="${b64("feuillage-a.png", "image/png")}" style="position:absolute;top:calc(-2 * var(--mm));
    right:calc(-1.5 * var(--mm));width:calc(17 * var(--mm));opacity:.95" alt="">
  <img src="${b64("feuillage-b.png", "image/png")}" style="position:absolute;bottom:calc(-2.5 * var(--mm));
    left:calc(-2 * var(--mm));width:calc(14 * var(--mm));opacity:.95;transform:rotate(180deg)" alt="">
  <div class="filet"></div>

  <div style="position:absolute;inset:calc(var(--sur) * var(--mm));display:flex;align-items:stretch">

    <div style="width:38%;display:flex;flex-direction:column;align-items:center;justify-content:center;
      text-align:center;padding-right:calc(2 * var(--mm))">
      <img src="${b64("monogramme.png", "image/png")}" style="width:calc(13 * var(--mm));height:auto" alt="">
      <div class="mot" style="font-size:calc(2.5 * var(--mm));margin-top:calc(1.4 * var(--mm))">La Belle<br>Intendance</div>
      <div style="width:calc(9 * var(--mm));height:calc(0.18 * var(--mm));background:var(--or);
        margin:calc(1.5 * var(--mm)) 0;opacity:.75"></div>
      <div class="bas" style="font-size:calc(1.35 * var(--mm));line-height:1.5">Entretien de la maison<br>&amp; conciergerie</div>
    </div>

    <div style="width:calc(0.14 * var(--mm));background:var(--or);opacity:.5"></div>

    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;
      padding-left:calc(3 * var(--mm))">
      <div style="font-family:'Cormorant',serif;font-weight:600;color:var(--navy);
        font-size:calc(4.6 * var(--mm));line-height:1">Coralie Renault</div>
      <div class="bas" style="font-size:calc(1.45 * var(--mm));margin-top:calc(1.2 * var(--mm));
        line-height:1.6;color:var(--or)">Intendante</div>

      <ul class="chiffres" style="list-style:none;margin-top:calc(2.6 * var(--mm));display:flex;flex-direction:column;
        gap:calc(1.5 * var(--mm));font-family:'Cormorant',serif;font-size:calc(2.3 * var(--mm));
        color:var(--navy);line-height:1.25">
        ${ligne(picto('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>'), c.telephone)}
        ${ligne(picto('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'), c.email)}
        ${ligne(picto('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>'), c.domaine)}
        ${ligne(picto('<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/>'), "Joigny et ses environs — Yonne (89)")}
      </ul>

      <div class="chiffres" style="margin-top:calc(2.4 * var(--mm));align-self:flex-start;
        border:calc(0.14 * var(--mm)) solid rgba(174,129,48,.55);
        padding:calc(0.9 * var(--mm)) calc(2 * var(--mm));
        font-family:'Cormorant',serif;font-size:calc(1.7 * var(--mm));color:var(--navy-clair);
        letter-spacing:calc(0.05 * var(--mm))">SIRET ${c.siret}</div>
    </div>
  </div>
</div>`);
}

const c = coordonnees();
mkdirSync(dossier, { recursive: true });

const navigateur = await chromium.launch();
const onglet = await navigateur.newPage({
  viewport: { width: LARGEUR, height: HAUTEUR },
  deviceScaleFactor: 1,
});

for (const [nom, html] of [["recto", recto(c)], ["verso", verso(c)]]) {
  await onglet.setContent(html, { waitUntil: "load" });
  await onglet.evaluate(() => document.fonts.ready);
  await onglet.screenshot({ path: join(dossier, `carte-${nom}.png`), type: "png" });
  console.log(`carte-${nom}.png — ${LARGEUR} × ${HAUTEUR} px à ${PPP} ppp`);
}

await navigateur.close();

/*
 * Les deux faces deviennent un PDF de deux pages, à 400 ppp carrés. Les images
 * y entrent sans perte : un aplat crème et un filet doré d'un cinquième de
 * millimètre supportent mal la compression JPEG, qui les ourlerait.
 */
execFileSync("convert", [
  "-units", "PixelsPerInch", "-density", String(PPP),
  join(dossier, "carte-recto.png"),
  join(dossier, "carte-verso.png"),
  "-compress", "Zip",
  join(dossier, "carte-la-belle-intendance.pdf"),
]);
console.log("carte-la-belle-intendance.pdf — 2 pages, 91 × 61 mm");

console.log(`\nCoordonnées imprimées : ${c.telephone} · ${c.email} · ${c.domaine} · SIRET ${c.siret}`);
