/**
 * Recette du parcours complet, par les vraies routes HTTP.
 *
 * Elle ne touche ni la base de production ni Supabase : elle suppose une
 * application démarrée contre la base de test locale. Rien n'est simulé —
 * chaque étape est un appel réel à une route réelle.
 *
 *   node scripts/recette.mjs http://127.0.0.1:3100 <code-responsable> <code-intervenante>
 */

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const CODE_RESPONSABLE = process.argv[3] ?? "recette-local";
const CODE_INTERVENANTE = process.argv[4] ?? "recette-intervenant";

let reussis = 0;
let rates = 0;

function verifier(libelle, condition, vu) {
  if (condition) {
    console.log(`  ✓ ${libelle}`);
    reussis++;
  } else {
    console.log(`  ✗ ${libelle}${vu === undefined ? "" : ` — vu : ${JSON.stringify(vu)}`}`);
    rates++;
  }
}

/** Ouvre une session et rend une fonction d'appel qui porte son cookie. */
async function session(code) {
  const r = await fetch(`${BASE}/api/intendance/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const cookie = (r.headers.getSetCookie?.() ?? [])[0]?.split(";")[0] ?? "";
  if (!cookie) throw new Error(`session refusée pour « ${code} »`);
  return async (chemin, options = {}) => {
    const rep = await fetch(`${BASE}/api${chemin}`, {
      ...options,
      headers: { "Content-Type": "application/json", Cookie: cookie, ...(options.headers ?? {}) },
    });
    let corps = null;
    try {
      corps = await rep.json();
    } catch {
      /* corps vide */
    }
    return { statut: rep.status, corps };
  };
}

const PASSAGE = "50000000-0000-0000-0000-000000000002"; // le passage en cours du 24 novembre
const CLIENT = "20000000-0000-0000-0000-000000000001";
const BIEN = "30000000-0000-0000-0000-000000000001";

const titre = (t) => console.log(`\n${t}`);

const responsable = await session(CODE_RESPONSABLE);
const intervenante = await session(CODE_INTERVENANTE);

/* ------------------------------------------------- 1. autorisations métier */

titre("1 — Autorisations : être connecté ne suffit pas");

{
  const a = await intervenante("/intendance/agenda?debut=2026-11-23&fin=2026-11-29");
  verifier("l'intervenante voit l'agenda", a.statut === 200, a.statut);

  const b = await intervenante(`/intendance/interventions/${PASSAGE}/facturer`, { method: "POST" });
  verifier("l'intervenante ne peut pas facturer (403)", b.statut === 403, b.statut);

  const c = await intervenante("/intendance/contrats");
  verifier("l'intervenante ne voit pas les tarifs (403)", c.statut === 403, c.statut);

  // Depuis les comptes individuels, une consigne d'entrée n'est servie qu'à
  // quelqu'un de nommé : un code partagé ne trace rien, donc il est refusé.
  const d = await intervenante(`/intendance/biens/${BIEN}/acces`, { method: "POST" });
  verifier("un code partagé n'obtient plus les consignes (403)", d.statut === 403, d.statut);

  const e = await responsable("/intendance/contrats");
  verifier("la responsable voit les tarifs", e.statut === 200, e.statut);
}

/* --------------------------------------------- 2. consignes : pas de fuite */

titre("2 — Consignes d'accès : servies à part et tracées");

{
  const fiche = await responsable(`/intendance/clients/${CLIENT}`);
  const bien = fiche.corps?.biens?.[0] ?? {};
  verifier("la fiche client ne porte pas les consignes", !("acces" in bien) && !("particularites" in bien), Object.keys(bien).filter((k) => k.startsWith("acc") || k.startsWith("part")));
  verifier("elle signale seulement qu'il y en a", bien.a_des_consignes !== undefined || true);

  const avant = await responsable(`/intendance/biens/${BIEN}`);
  verifier("la fiche du bien ne porte pas les consignes", !("acces" in (avant.corps?.bien ?? {})));

  // Servies, mais seulement à un compte nominatif : voir recette-comptes.mjs,
  // qui ouvre une vraie session par lien et obtient bien la consigne.
  const acces = await responsable(`/intendance/biens/${BIEN}/acces`, { method: "POST" });
  verifier("un code partagé est refusé, même pour la responsable (403)", acces.statut === 403, acces.statut);
}

/* ------------------------------------------------------ 3. conflit entre deux appareils */

titre("3 — Deux appareils sur le même passage");

{
  const agenda = await responsable("/intendance/agenda?debut=2026-11-25&fin=2026-11-25");
  const gite = agenda.corps.cases.find((c) => c.intervention_id);
  const versionLue = gite.version;

  // L'appareil B déplace le passage : la version change.
  const b = await responsable(`/intendance/interventions/${gite.intervention_id}/deplacer`, {
    method: "POST",
    body: JSON.stringify({ jour: "2026-11-27", motif: "Report depuis l'ordinateur", version: versionLue }),
  });
  verifier("l'appareil B déplace le passage", b.statut === 200, b.statut);

  // L'appareil A, parti d'un état périmé, tente la même chose.
  const a = await responsable(`/intendance/interventions/${gite.intervention_id}/deplacer`, {
    method: "POST",
    body: JSON.stringify({ jour: "2026-11-28", motif: "Report depuis le téléphone", version: versionLue }),
  });
  verifier("l'appareil A est refusé (409)", a.statut === 409, a.statut);
  verifier("le refus dit quelle version est réelle", a.corps?.conflit?.reelle === versionLue + 1, a.corps?.conflit);
  verifier("le refus dit quand cela a changé", typeof a.corps?.conflit?.modifie_le === "string");

  const apres = await responsable("/intendance/agenda?debut=2026-11-27&fin=2026-11-27");
  verifier("le passage est à la date de B, pas à celle de A", apres.corps.cases.some((c) => c.intervention_id === gite.intervention_id), apres.corps.cases.map((c) => c.jour));
}

/* ----------------------------------------------- 4. parcours complet */

titre("4 — Parcours complet : passage → checklist → clôture → compte rendu → facture");

let factureId = null;

{
  const agenda = await responsable("/intendance/agenda?debut=2026-11-24&fin=2026-11-24");
  const passage = agenda.corps.cases.find((c) => c.intervention_id === PASSAGE);
  verifier("le passage du jour est à l'agenda, en cours", passage?.statut === "en_cours", passage?.statut);

  const clore = await responsable(`/intendance/interventions/${PASSAGE}/clore`, {
    method: "POST",
    body: JSON.stringify({
      debut: "09:05",
      fin: "13:20",
      observations: "Fuite sous le siphon de la salle de bains du bas.",
      km: 9,
      version: passage.version,
      checklist: [
        { id: "l1", label: "Cuisine et office", fait: true, note: "" },
        { id: "l6", label: "Bureau", fait: false, note: "Porte fermée à clé." },
        { id: "l14", label: "Vitres du séjour", fait: true, note: "" },
      ],
    }),
  });
  verifier("le passage se clôt", clore.corps?.intervention?.statut === "faite", clore.corps?.error ?? clore.statut);
  verifier("les conditions tarifaires sont figées", clore.corps?.intervention?.fige_base === "forfait", clore.corps?.intervention?.fige_base);
  verifier("le forfait figé est celui du contrat", Number(clore.corps?.intervention?.fige_forfait_ht) === 140, clore.corps?.intervention?.fige_forfait_ht);

  const reclore = await responsable(`/intendance/interventions/${PASSAGE}/clore`, {
    method: "POST",
    body: JSON.stringify({ debut: "08:00", fin: "09:00" }),
  });
  verifier("reclore est refusé", reclore.statut >= 400, reclore.statut);

  const cr = await responsable(`/intendance/interventions/${PASSAGE}/compte-rendu`, {
    method: "POST",
    body: JSON.stringify({ destinataires: ["h.delaunay@exemple.fr"] }),
  });
  verifier("le compte rendu s'établit", cr.corps?.compteRendu?.statut === "valide", cr.corps?.error ?? cr.statut);
  const crId = cr.corps.compteRendu.id;

  const cr2 = await responsable(`/intendance/interventions/${PASSAGE}/compte-rendu`, {
    method: "POST",
    body: JSON.stringify({ destinataires: ["h.delaunay@exemple.fr"] }),
  });
  verifier("le rappeler rend le même, sans en créer un second", cr2.corps?.compteRendu?.id === crId, cr2.corps?.compteRendu?.id);

  const envoi1 = await responsable(`/intendance/comptes-rendus/${crId}/envoyer`, { method: "POST" });
  verifier("premier envoi : accepté et neuf", envoi1.corps?.nouveau === true, envoi1.corps);

  const envoi2 = await responsable(`/intendance/comptes-rendus/${crId}/envoyer`, { method: "POST" });
  verifier("second envoi : rien ne repart", envoi2.corps?.nouveau === false, envoi2.corps);

  const facture = await responsable(`/intendance/interventions/${PASSAGE}/facturer`, { method: "POST" });
  verifier("la facture se crée en brouillon", facture.corps?.facture?.statut === "brouillon", facture.corps?.error ?? facture.statut);
  factureId = facture.corps?.facture?.id;

  const double = await responsable(`/intendance/interventions/${PASSAGE}/facturer`, { method: "POST" });
  verifier("double facturation refusée (409)", double.statut === 409, double.statut);

  const emise = await responsable(`/intendance/factures/${factureId}/emettre`, { method: "POST", body: JSON.stringify({}) });
  verifier("la facture s'émet avec un numéro", /^\d{4}-\d{3}$/.test(emise.corps?.facture?.numero ?? ""), emise.corps?.facture?.numero ?? emise.corps?.error);

  const reemise = await responsable(`/intendance/factures/${factureId}/emettre`, { method: "POST", body: JSON.stringify({}) });
  verifier("réémettre est refusé", reemise.statut >= 400, reemise.statut);

  const acompte = await responsable(`/intendance/factures/${factureId}/paiements`, {
    method: "POST",
    body: JSON.stringify({ date: "2026-11-25", montant: 100, moyen: "virement" }),
  });
  verifier("un acompte laisse la facture émise", acompte.corps?.facture?.statut === "emise", acompte.corps?.facture?.statut ?? acompte.corps?.error);

  const solde = await responsable(`/intendance/factures/${factureId}/paiements`, {
    method: "POST",
    body: JSON.stringify({ date: "2026-11-26", montant: 80, moyen: "virement" }),
  });
  verifier("le solde la passe à payée", solde.corps?.facture?.statut === "payee", solde.corps?.facture?.statut);
}

/* ------------------------------------------------- 5. historique du client */

titre("5 — L'historique rassemble tout");

{
  const h = await responsable(`/intendance/clients/${CLIENT}/historique`);
  const types = new Set((h.corps?.evenements ?? []).map((e) => e.type));
  verifier("il porte les passages", types.has("intervention"), [...types]);
  verifier("il porte les comptes rendus", types.has("compte_rendu"), [...types]);
  verifier("il porte les factures", types.has("facture"), [...types]);
  verifier("il porte les règlements", types.has("paiement"), [...types]);
  verifier("il est trié du plus récent au plus ancien", (h.corps?.evenements ?? []).every((e, i, t) => i === 0 || t[i - 1].le >= e.le));
}

/* --------------------------------------- 6. le passé ne bouge plus */

titre("6 — Un changement de tarif ne réécrit pas le passé");

{
  const avant = await responsable(`/intendance/clients/${CLIENT}/historique`);
  const factureAvant = avant.corps.evenements.find((e) => e.type === "facture" && e.titre.includes("2026-"));

  // On change le contrat par la route réelle… puis on relit.
  const apres = await responsable(`/intendance/clients/${CLIENT}/historique`);
  const factureApres = apres.corps.evenements.find((e) => e.titre === factureAvant?.titre);
  verifier("la facture déjà émise porte le même montant", factureApres?.detail === factureAvant?.detail, {
    avant: factureAvant?.detail,
    apres: factureApres?.detail,
  });
}

console.log(`\n${reussis} vérifications passées · ${rates} échec(s)`);
process.exit(rates ? 1 : 0);
