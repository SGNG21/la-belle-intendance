/**
 * Fabrique les icônes du site à partir du logo.
 *
 * Le logo porte un rinceau de feuillage et des filets d'or : superbe à
 * grande taille, illisible à seize pixels. L'icône de l'onglet se resserre
 * donc sur le monogramme, les autres gardent le dessin entier. C'est le même
 * logo, recadré — pas un second logo.
 *
 * Usage : node scripts/icones.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SOURCE = "public/logo-source.png";

/**
 * Le beige du fond, mesuré sur le logo lui-même.
 *
 * Le fond du fichier n'est pas exactement le crème de la charte : poser le
 * logo sur un crème choisi à la main laissait voir un carré plus clair au
 * milieu de l'image. On prend donc la couleur du logo, moyennée sur ses
 * quatre coins — un seul beige, et plus de soudure.
 */
async function beigeDuLogo() {
  const { width, height } = await sharp(SOURCE).metadata();
  const coins = [
    [0, 0],
    [width - 8, 0],
    [0, height - 8],
    [width - 8, height - 8],
  ];
  let r = 0, g = 0, b = 0;
  for (const [left, top] of coins) {
    const { data } = await sharp(SOURCE).extract({ left, top, width: 8, height: 8 }).raw().toBuffer({ resolveWithObject: true });
    let sr = 0, sg = 0, sb = 0;
    for (let i = 0; i < data.length; i += 4) {
      sr += data[i];
      sg += data[i + 1];
      sb += data[i + 2];
    }
    const n = data.length / 4;
    r += sr / n;
    g += sg / n;
    b += sb / n;
  }
  return { r: Math.round(r / 4), g: Math.round(g / 4), b: Math.round(b / 4), alpha: 1 };
}

const CREME = await beigeDuLogo();
const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("");

/** Le logo détouré de son fond, posé au centre d'un carré crème. */
async function carre(rognage = 0, marge = 1.16) {
  const brut = await sharp(SOURCE).trim({ threshold: 12 }).toBuffer();
  const { width, height } = await sharp(brut).metadata();
  const marque = rognage
    ? await sharp(brut).extract({ left: Math.round(width * rognage), top: 0, width: Math.round(width * (1 - rognage)), height }).toBuffer()
    : brut;
  const m = await sharp(marque).metadata();
  const cote = Math.round(Math.max(m.width, m.height) * marge);
  return sharp({ create: { width: cote, height: cote, channels: 4, background: CREME } })
    .composite([{ input: marque, gravity: "center" }])
    .png()
    .toBuffer();
}

const png = (source, taille) => sharp(source).resize(taille, taille, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer();

/** Un .ico est un conteneur : en-tête, une entrée par taille, puis les PNG. */
function ico(images, tailles) {
  const entete = Buffer.alloc(6);
  entete.writeUInt16LE(1, 2);
  entete.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entrees = images.map((buf, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(tailles[i], 0);
    e.writeUInt8(tailles[i], 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });
  return Buffer.concat([entete, ...entrees, ...images]);
}

const entier = await carre();
const resserre = await carre(0.26, 1.1);

writeFileSync("public/favicon.ico", ico([await png(resserre, 16), await png(entier, 32), await png(entier, 48)], [16, 32, 48]));
writeFileSync("public/icone-192.png", await png(entier, 192));
writeFileSync("public/icone-512.png", await png(entier, 512));
writeFileSync("public/apple-touch-icon.png", await png(entier, 180));
writeFileSync("public/logo.png", await png(entier, 1024));
console.log("Icônes écrites dans public/ : favicon.ico, icone-192, icone-512, apple-touch-icon, logo.");

/* ---------- La marque pour les e-mails ---------- */

/**
 * Pastille servie dans le bandeau navy des e-mails.
 *
 * Le fond navy est cuit dans l'image : une messagerie qui gère mal la
 * transparence afficherait sinon un carré blanc. Le disque reprend
 * exactement la couleur de fond du logo, si bien que la soudure ne se voit
 * pas. Deux fois la taille d'affichage, pour les écrans à forte densité.
 */
const NAVY = "#182a45";
const FOND = hex(CREME); // le beige mesuré sur le logo
const OR = "#ae8130";

async function pastilleCourriel(cote) {
  const disque = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cote}" height="${cote}">
       <rect width="${cote}" height="${cote}" fill="${NAVY}"/>
       <circle cx="${cote / 2}" cy="${cote / 2}" r="${cote / 2 - 1}" fill="${FOND}"/>
       <circle cx="${cote / 2}" cy="${cote / 2}" r="${cote / 2 - 2}" fill="none" stroke="${OR}" stroke-width="${cote / 56}" stroke-opacity="0.55"/>
     </svg>`,
  );
  const marque = await sharp(SOURCE).trim({ threshold: 12 }).resize({ width: Math.round(cote * 0.62) }).toBuffer();
  return sharp(disque).composite([{ input: marque, gravity: "center" }]).png({ compressionLevel: 9 }).toBuffer();
}

/** Même pastille, coins transparents : pour la signature Gmail, sur fond clair. */
async function pastilleClaire(cote) {
  const disque = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cote}" height="${cote}">
       <circle cx="${cote / 2}" cy="${cote / 2}" r="${cote / 2 - 1}" fill="${FOND}"/>
       <circle cx="${cote / 2}" cy="${cote / 2}" r="${cote / 2 - 2}" fill="none" stroke="${OR}" stroke-width="${cote / 56}" stroke-opacity="0.55"/>
     </svg>`,
  );
  const marque = await sharp(SOURCE).trim({ threshold: 12 }).resize({ width: Math.round(cote * 0.62) }).toBuffer();
  return sharp(disque).composite([{ input: marque, gravity: "center" }]).png({ compressionLevel: 9 }).toBuffer();
}

writeFileSync("public/email/marque.png", await pastilleCourriel(112));
writeFileSync("public/email/marque-signature.png", await pastilleClaire(128));
console.log(`Pastilles des e-mails écrites. Beige unique : ${FOND}`);
