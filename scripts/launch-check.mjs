#!/usr/bin/env node
/**
 * Contrôle avant mise en ligne. Échoue (code 1) tant qu'un point bloquant subsiste.
 * Usage : npm run launch-check
 *
 * Lit src/config/site.ts comme du texte : aucun import, aucune dépendance.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const config = readFileSync(join(root, "src/config/site.ts"), "utf8");

const blockers = [];
const warnings = [];

/** Une clé de config est « vide » si elle vaut null. */
const isNull = (key, scope) => {
  const block = scope ? config.slice(config.indexOf(`export const ${scope}`)) : config;
  const m = block.match(new RegExp(`\\b${key}:\\s*(null|"[^"]*"|\\w+)`));
  return !m || m[1] === "null";
};

const need = [
  ["phone", "CONTACT", "Numéro de téléphone"],
  ["phoneE164", "CONTACT", "Numéro au format international (+33…)"],
  ["email", "CONTACT", "Adresse e-mail"],
  ["publisherName", "LEGAL", "Nom de l'exploitant (mentions légales)"],
  ["siret", "LEGAL", "SIRET"],
  ["vatMention", "LEGAL", "Mention TVA"],
];
for (const [key, scope, label] of need) if (isNull(key, scope)) blockers.push(`Renseigner : ${label} (src/config/site.ts, ${scope}.${key})`);

if (isNull("hourlyTTC", "PRICING")) warnings.push("Tarif horaire TTC non renseigné : aucun montant n'est affiché, tout renvoie au devis écrit. Voulu ? Sinon renseigner PRICING.hourlyTTC.");
if (isNull("zoneBLimitKm", "PRICING")) warnings.push("Bornes de distance des zones B et C non renseignées : le site n'annonce aucun montant de supplément (voulu pour l'instant).");
if (/declarationNumber|sapActive|SapNotice/.test(config)) blockers.push("Reliquat de l'ancien dispositif « services à la personne » dans src/config/site.ts : l'entreprise ne se déclare pas SAP, le crédit d'impôt ne passe que par l'emploi direct au CESU.");
if (isNull("cesuNetHourly", "MODES")) warnings.push("MODES.cesuNetHourly non renseigné : aucun taux horaire net n'est annoncé pour l'emploi direct au CESU (voulu tant qu'il n'est pas arrêté).");
if (isNull("googleBusinessUrl", "CONTACT")) warnings.push("Fiche Google Business non liée (CONTACT.googleBusinessUrl) : à ajouter au schema sameAs une fois créée.");

// Repères visibles ⟦…⟧ laissés dans le code source (hors config)
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
for (const f of walk(join(root, "src")).filter((p) => /\.(tsx?|css)$/.test(p) && !p.endsWith("config/site.ts") && !p.endsWith("components/Fill.tsx"))) {
  const txt = readFileSync(f, "utf8");
  if (txt.includes("⟦")) blockers.push(`Repère ⟦…⟧ codé en dur dans ${f.replace(root, "")}`);
}

// Mentions sensibles : jamais d'avantage fiscal affirmé en dur dans une page
for (const f of walk(join(root, "src/app")).filter((p) => p.endsWith(".tsx"))) {
  const txt = readFileSync(f, "utf8");
  if (/(déduction|crédit d'impôt)[^"`]{0,40}(de )?50\s?%/i.test(txt) && !/sapActive|SapNotice/.test(txt)) {
    blockers.push(`Mention de crédit d'impôt à 50 % sans garde sapActive() dans ${f.replace(root, "")}`);
  }
}

// Variables d'environnement (celles du build courant)
if (process.env.SITE_INDEXABLE !== "true") warnings.push("SITE_INDEXABLE n'est pas à « true » : le site est en noindex (normal avant lancement).");
const leadMail = process.env.RESEND_API_KEY && process.env.LEAD_EMAIL_TO;
if (!process.env.N8N_LEAD_WEBHOOK_URL && !leadMail)
  blockers.push("Formulaire de contact sans acheminement : configurer soit N8N_LEAD_WEBHOOK_URL, soit RESEND_API_KEY + LEAD_EMAIL_TO. Sinon /api/lead répond 503 et chaque demande est perdue.");

const claims = [
  "Confirmer avec l'opératrice : « la même personne à chaque passage, autant que possible ».",
  "Confirmer : un compte rendu avec photos est bien transmis après chaque intervention en grande demeure.",
  "Confirmer le périmètre d'intendance affiché (aération, coordination d'intervenants, contrôle, fermeture).",
  "Confirmer : ménage entre deux séjours (location courte durée) facturé au forfait par rotation, lits et linge en option.",
  "Confirmer que l'emploi direct au CESU est bien proposé, et à quel taux horaire net (MODES.cesuNetHourly).",
  "Confirmer : possibilité d'intervenir hors des heures d'ouverture pour les professionnels.",
  "Prénom et rôle affichés sur la page À propos (FOUNDER).",
  "Faire relire les pages Mentions légales et Confidentialité avant publication.",
];

const out = (t, arr, mark) => arr.length && console.log(`\n${t}\n${arr.map((a) => `  ${mark} ${a}`).join("\n")}`);
console.log("Contrôle avant mise en ligne — La Belle Intendance");
out(`BLOQUANTS (${blockers.length})`, blockers, "✗");
out(`À SAVOIR (${warnings.length})`, warnings, "!");
out("À CONFIRMER (affirmations de service)", claims, "?");
console.log(blockers.length ? "\nRésultat : NON PRÊT à indexer.\n" : "\nRésultat : aucun point bloquant.\n");
process.exit(blockers.length ? 1 : 0);
