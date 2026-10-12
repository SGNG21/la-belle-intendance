/**
 * Fabrique les visuels de la page Facebook.
 *
 * Rendus par un vrai navigateur avec les polices du site, pour que la marque
 * soit la même partout. La couverture est dessinée en 1640 × 720 : Facebook
 * en montre 820 × 312 sur ordinateur et 640 × 360 sur téléphone, donc tout ce
 * qui compte reste dans la zone centrale commune aux deux recadrages.
 *
 * Usage : node scripts/facebook.mjs
 */
// Playwright n'est pas une dépendance du site : on prend celui de la machine.
// Le paquet est en CommonJS, d'où l'export par défaut.
const pw = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const chromium = pw.chromium ?? pw.default.chromium;
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SORTIE = "marketing/facebook";
const b64 = (p) => readFileSync(resolve(p)).toString("base64");

const POLICES = `
@font-face { font-family: Marcellus; src: url(data:font/woff2;base64,${b64("node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff2")}) format("woff2"); }
@font-face { font-family: Cormorant; font-weight: 400; src: url(data:font/woff2;base64,${b64("node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2")}) format("woff2"); }
@font-face { font-family: Jost; src: url(data:font/woff2;base64,${b64("node_modules/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2")}) format("woff2"); }
`;

const LOGO = `data:image/png;base64,${b64("public/logo.png")}`;
const PASTILLE = `data:image/png;base64,${b64("public/icone-512.png")}`;

/**
 * Un seul beige sur toute la panoplie : celui du logo lui-même.
 *
 * Poser le logo sur le crème de la charte faisait apparaître un carré plus
 * clair au milieu de la photo de profil. On prend donc la couleur du fichier,
 * la même que celle des icônes du site.
 */
const BEIGE = "#faf6eb";

const BASE = `
${POLICES}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Jost, sans-serif; -webkit-font-smoothing: antialiased; }
.navy { background: #182a45; color: #f4eee2; }
.creme { background: ${BEIGE}; color: #182a45; }
.plaque { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.nom { font-family: Marcellus, serif; letter-spacing: 0.18em; text-transform: uppercase; }
.filet { width: 7rem; height: 1px; background: #ae8130; }
.serif { font-family: Cormorant, serif; }
img.pastille { border-radius: 50%; display: block; }
`;

async function rendre(page, { largeur, hauteur, html, fichier }) {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.setContent(`<style>${BASE}</style>${html}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SORTIE}/${fichier}`, clip: { x: 0, y: 0, width: largeur, height: hauteur } });
  console.log(`${fichier} — ${largeur} × ${hauteur}`);
}

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ deviceScaleFactor: 1 });

/* ---------- Photo de profil : recadrée en cercle par Facebook ---------- */
// Pas de plaque sous le logo : le carré de public/logo.png porte déjà le bon
// beige, sur toute sa surface. Une plaque d'une autre nuance se verrait.
{
  const sharp = (await import(process.env.SHARP_MODULE ?? "sharp")).default;
  await sharp("public/logo.png").resize(1080, 1080).png().toFile(`${SORTIE}/profil.png`);
  console.log("profil.png — 1080 × 1080");
}

/* ---------- Couverture ---------- */
await rendre(page, {
  largeur: 1640,
  hauteur: 720,
  fichier: "couverture.png",
  html: `<div class="plaque navy" style="gap:30px">
    <img class="pastille" src="${PASTILLE}" style="width:130px">
    <div class="nom" style="font-size:62px">La Belle Intendance</div>
    <div class="filet"></div>
    <div class="serif" style="font-size:38px;color:#f4eee2;opacity:.92">Ménage à domicile, grandes demeures et résidences secondaires</div>
    <div style="font-size:24px;letter-spacing:.2em;text-transform:uppercase;color:#aec6d2">Joigny (89) et ses alentours</div>
  </div>`,
});

/* ---------- Couverture, avec les repères de recadrage ---------- */
await rendre(page, {
  largeur: 1640,
  hauteur: 720,
  fichier: "couverture-reperes.png",
  html: `<div style="position:relative;width:100%;height:100%">
    <img src="data:image/png;base64,${b64(`${SORTIE}/couverture.png`)}" style="width:100%;height:100%">
    <div style="position:absolute;inset:0 0 72px 0;border:3px dashed rgba(190,122,84,.9)"></div>
    <div style="position:absolute;top:0;bottom:0;left:180px;right:180px;border:3px dashed rgba(147,165,140,.95)"></div>
    <div style="position:absolute;left:14px;top:14px;font-size:20px;color:#be7a54">— — ordinateur (820 × 312)</div>
    <div style="position:absolute;left:196px;bottom:14px;font-size:20px;color:#93a58c">— — téléphone (640 × 360)</div>
  </div>`,
});

/* ---------- Publications ---------- */

/**
 * Deux gabarits seulement, pour que la page ait l'air d'une seule main :
 * « claire » — un propos, une précision, la marque en bas ;
 * « sombre » — une liste, sur le navy.
 */
const claire = ({ kicker, titre, corps, pied = "la-belle-intendance.fr" }) => `
  <div class="plaque creme" style="gap:30px;padding:100px">
    ${kicker ? `<div class="nom" style="font-size:26px;color:#ae8130">${kicker}</div>` : ""}
    <div class="serif" style="font-size:66px;line-height:1.22">${titre}</div>
    <div class="filet"></div>
    <div style="font-size:28px;color:#4d5f74;line-height:1.6">${corps}</div>
    <div style="display:flex;align-items:center;gap:20px;margin-top:14px">
      <img class="pastille" src="${PASTILLE}" style="width:72px">
      <div class="nom" style="font-size:22px;color:#182a45">${pied}</div>
    </div>
  </div>`;

const sombre = ({ kicker, lignes, pied = "La Belle Intendance · Joigny" }) => `
  <div class="plaque navy" style="gap:0;padding:90px;justify-content:space-between;align-items:stretch;text-align:left">
    <div class="nom" style="font-size:30px;color:#ae8130">${kicker}</div>
    <div style="display:flex;flex-direction:column;gap:34px">
      ${lignes
        .map(
          ([t, d]) => `<div>
            <div class="serif" style="font-size:50px;line-height:1.2">${t}</div>
            <div style="font-size:25px;color:#aec6d2;margin-top:10px;line-height:1.5">${d}</div>
          </div>`,
        )
        .join("")}
    </div>
    <div style="display:flex;align-items:center;gap:24px">
      <img class="pastille" src="${PASTILLE}" style="width:76px">
      <div class="nom" style="font-size:24px">${pied}</div>
    </div>
  </div>`;

const publications = [
  {
    fichier: "post-1-presentation.png",
    html: `<div class="plaque creme" style="gap:36px;padding:100px">
      <img class="pastille" src="${PASTILLE}" style="width:150px">
      <div class="serif" style="font-size:72px;line-height:1.25">Un intérieur tenu,<br>sans y penser.</div>
      <div class="filet"></div>
      <div style="font-size:30px;color:#4d5f74;line-height:1.6">Ménage régulier, grands ménages,<br>intendance de résidences secondaires</div>
      <div class="nom" style="font-size:24px;color:#ae8130;margin-top:20px">la-belle-intendance.fr</div>
    </div>`,
  },
  {
    fichier: "post-2-prestations.png",
    html: sombre({
      kicker: "Ce que nous faisons",
      lignes: [
        ["Entretien régulier", "La même personne, selon un cahier des charges établi avec vous."],
        ["Grand ménage", "Avant une réception, au printemps, après une longue absence."],
        ["Grandes demeures", "Préparation avant votre arrivée, contrôle après votre départ."],
      ],
    }),
  },
  {
    fichier: "post-3-devis.png",
    html: `<div class="plaque creme" style="gap:34px;padding:110px">
      <div class="nom" style="font-size:28px;color:#ae8130">Devis gratuit</div>
      <div class="serif" style="font-size:80px;line-height:1.2">Dites-nous ce dont<br>vous avez besoin.</div>
      <div style="font-size:30px;color:#4d5f74;line-height:1.6">Une visite sur place, un devis écrit,<br>et rien ne commence avant votre accord.</div>
      <div style="margin-top:30px;background:#182a45;color:#faf6eb;padding:26px 54px;border-radius:4px;font-size:34px;letter-spacing:.04em">07 83 29 15 41</div>
      <div class="nom" style="font-size:22px;color:#4d5f74;margin-top:8px">la-belle-intendance.fr</div>
    </div>`,
  },
  {
    fichier: "post-4-combien.png",
    html: claire({
      kicker: "La question qu'on nous pose le plus",
      titre: "« Combien ça coûte ? »",
      corps: "Cela dépend de votre maison. Nous venons voir, puis nous écrivons un devis. Gratuit, sans engagement.",
    }),
  },
  {
    fichier: "post-5-residence-secondaire.png",
    html: sombre({
      kicker: "Résidence secondaire",
      lignes: [
        ["Avant votre arrivée", "Maison aérée, volets ouverts, sols faits, réfrigérateur prêt."],
        ["Pendant votre absence", "Courrier relevé, plantes arrosées, passage de contrôle."],
        ["Après votre départ", "Remise en ordre, et un compte rendu si vous êtes loin."],
      ],
    }),
  },
  {
    fichier: "post-6-compte-rendu.png",
    html: claire({
      kicker: "Pour les propriétaires éloignés",
      titre: "Savoir, sans avoir<br>à demander.",
      corps: "Après chaque passage, un compte rendu : les pièces faites, ce qui a été remarqué, des photos si besoin.",
    }),
  },
  {
    fichier: "post-7-cesu.png",
    html: sombre({
      kicker: "Deux façons de nous régler",
      lignes: [
        ["Facture de l'entreprise", "Au forfait mensuel ou par passage, selon le contrat."],
        ["Emploi direct au CESU", "Vous devenez employeur : crédit d'impôt de 50 % sur les heures déclarées."],
      ],
      pied: "Nous expliquons les deux, vous choisissez",
    }),
  },
  {
    fichier: "post-8-printemps.png",
    html: claire({
      kicker: "Grand ménage",
      titre: "Une fois par an,<br>de fond en comble.",
      corps: "Vitres, plinthes, placards, derrière les meubles. Ce qu'un passage hebdomadaire ne fait jamais.",
    }),
  },
  {
    fichier: "post-9-professionnels.png",
    html: claire({
      kicker: "Bureaux, cabinets, commerces",
      titre: "Avant l'ouverture,<br>après la fermeture.",
      corps: "Un contrat d'entretien aux horaires qui vous conviennent, avec un interlocuteur unique.",
    }),
  },
  {
    fichier: "post-10-citation.png",
    html: `<div class="plaque navy" style="gap:40px;padding:120px">
      <img class="pastille" src="${PASTILLE}" style="width:110px">
      <div class="serif" style="font-size:62px;line-height:1.35">Une maison tenue,<br>ça ne se voit pas.<br>Ça se remarque<br>quand ça ne l'est plus.</div>
      <div class="filet"></div>
      <div class="nom" style="font-size:22px;color:#aec6d2">La Belle Intendance · Joigny</div>
    </div>`,
  },
];
for (const p of publications) await rendre(page, { largeur: 1080, hauteur: 1080, ...p });

/* ---------- Visuels publicitaires ---------- */

// Une photo réelle vaut mieux qu'une carte typographique dans un fil payant :
// on recadre, et on pose une bande sobre avec la marque et une seule ligne.
const sharpMod = (await import(process.env.SHARP_MODULE ?? "sharp")).default;

async function creativePhoto({ photo, largeur, hauteur, ligne, fichier }) {
  const fond = await sharpMod(photo).resize(largeur, hauteur, { fit: "cover", position: "attention" }).toBuffer();
  const bande = Math.round(hauteur * 0.17);
  const html = `<div style="position:relative;width:100%;height:100%;overflow:hidden">
      <img src="data:image/png;base64,${fond.toString("base64")}" style="width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;left:0;right:0;bottom:0;height:${bande}px;background:#182a45;display:flex;align-items:center;gap:${Math.round(bande * 0.22)}px;padding:0 ${Math.round(largeur * 0.07)}px">
        <img class="pastille" src="${PASTILLE}" style="width:${Math.round(bande * 0.58)}px">
        <div>
          <div class="nom" style="font-size:${Math.round(bande * 0.2)}px;color:#faf6eb">La Belle Intendance</div>
          <div style="font-size:${Math.round(bande * 0.17)}px;color:#aec6d2;margin-top:6px">${ligne}</div>
        </div>
      </div>
    </div>`;
  await rendre(page, { largeur, hauteur, html, fichier });
}

await creativePhoto({
  photo: "public/images/salon-prepare-fleurs.webp",
  largeur: 1080,
  hauteur: 1080,
  ligne: "Ménage et intendance de maison — Joigny (89)",
  fichier: "pub-1-carre.png",
});
await creativePhoto({
  photo: "public/images/salon-prepare-fleurs.webp",
  largeur: 1080,
  hauteur: 1350,
  ligne: "Ménage et intendance de maison — Joigny (89)",
  fichier: "pub-1-vertical.png",
});
await creativePhoto({
  photo: "public/images/salon-poele-allume.webp",
  largeur: 1080,
  hauteur: 1920,
  ligne: "Devis gratuit · 07 83 29 15 41",
  fichier: "pub-2-story.png",
});
await rendre(page, {
  largeur: 1080,
  hauteur: 1080,
  fichier: "pub-3-devis.png",
  html: claire({
    kicker: "Joigny et ses alentours",
    titre: "Votre maison,<br>tenue par la même<br>personne.",
    corps: "Entretien régulier, grands ménages, résidences secondaires. Visite sur place et devis écrit, gratuits.",
    pied: "07 83 29 15 41",
  }),
});

await navigateur.close();
