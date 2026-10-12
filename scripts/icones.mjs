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
const CREME = { r: 0xf4, g: 0xee, b: 0xe2, alpha: 1 };

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
