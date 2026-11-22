-- Parcours complet par les fonctions, et tentatives de le casser.
--
-- Rejouer : psql -d lbi_test -f supabase/tests/operations.sql
-- Tout « REFUSÉ » attendu est signalé dans le libellé du bloc.

\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

-- Jeu d'essai
insert into clients (id, nom, email) values ('11111111-1111-1111-1111-111111111111','Cliente','c@exemple.fr');
insert into biens (id, client_id, libelle, acces) values ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Maison','code 4812');
insert into contrats (id, client_id, bien_id, base, libelle, forfait_ht, debut)
  values ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','forfait','Entretien',140,'2026-11-01');
insert into interventions (id, client_id, bien_id, contrat_id, date, duree_prevue_h, statut)
  values ('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','2026-11-24',4.5,'planifiee');
insert into supplements (intervention_id, libelle, heures, taux_horaire_ht, approuve_par, approuve_le, approuve_canal)
  values ('44444444-4444-4444-4444-444444444444','Vitres',1.25,32,'Cliente',now(),'sms');
insert into supplements (intervention_id, libelle, montant_ht)
  values ('44444444-4444-4444-4444-444444444444','Congelateur',25);

\echo '=== A1 facturer avant cloture (REFUS attendu)'
select facturer_intervention('44444444-4444-4444-4444-444444444444') is not null;

\echo '=== A2 clore le passage'
select 'statut=' || (clore_intervention('44444444-4444-4444-4444-444444444444','09:05','13:20','[]'::jsonb,'RAS',9)).statut;

\echo '=== A3 reclore le meme passage (REFUS attendu)'
select (clore_intervention('44444444-4444-4444-4444-444444444444','09:00','12:00',null,null,null)).id;

\echo '=== A4 etablir le compte rendu'
select 'cr=' || (etablir_compte_rendu('44444444-4444-4444-4444-444444444444', array['c@exemple.fr'])).statut;

\echo '=== A5 retablir : doit rendre le MEME compte rendu, pas un second'
select 'meme_cr=' || ((etablir_compte_rendu('44444444-4444-4444-4444-444444444444', array['c@exemple.fr'])).id
                      = (select id from comptes_rendus where intervention_id='44444444-4444-4444-4444-444444444444'))::text;
select 'nb_cr=' || count(*) from comptes_rendus where intervention_id='44444444-4444-4444-4444-444444444444';

\echo '=== A6 reserver l envoi : premier appel'
select 'premier=' || reserver_envoi('cr:44444444:envoi','compte_rendu',null);
\echo '=== A7 reserver l envoi : second appel (doit dire deja_fait)'
select 'second=' || reserver_envoi('cr:44444444:envoi','compte_rendu',null);

\echo '=== A8 marquer envoye'
select 'envoye=' || (marquer_cr_envoye((select id from comptes_rendus where intervention_id='44444444-4444-4444-4444-444444444444'),'abc123')).statut;
\echo '=== A9 marquer envoye une seconde fois (REFUS attendu)'
select (marquer_cr_envoye((select id from comptes_rendus where intervention_id='44444444-4444-4444-4444-444444444444'),'abc123')).id;

\echo '=== A10 facturer : le forfait et le seul supplement approuve'
select 'facture=' || (facturer_intervention('44444444-4444-4444-4444-444444444444')).statut;
select 'lignes=' || string_agg(libelle || ':' || montant_ht, ' | ' order by rang) from facture_lignes;
select 'total_ht=' || sum(montant_ht) from facture_lignes;

\echo '=== A11 DOUBLE FACTURATION du meme passage (REFUS attendu)'
select (facturer_intervention('44444444-4444-4444-4444-444444444444')).id;

\echo '=== A12 emettre : attribution du numero'
select 'numero=' || (emettre_facture((select id from factures limit 1))).numero;
\echo '=== A13 emettre une seconde fois (REFUS attendu)'
select (emettre_facture((select id from factures limit 1))).id;

\echo '=== A14 paiement partiel puis solde'
select 'apres_acompte=' || (enregistrer_paiement((select id from factures limit 1), current_date, 100, 'virement')).statut;
select 'apres_solde=' || (enregistrer_paiement((select id from factures limit 1), current_date, 80, 'virement')).statut;

\echo '=== A15 le passage ne figure plus dans la liste a facturer'
select 'a_facturer=' || count(*) from interventions_a_facturer();

\echo '=== A16 historique du client'
select type || ' | ' || titre from historique_client where client_id='11111111-1111-1111-1111-111111111111' order by le;

\echo '=== A17 agenda projete sur deux semaines'
select jour || ' ' || statut from projeter_agenda('2026-11-17','2026-11-30');

-- =====================================================================
-- A18 — concurrence sur la numérotation.
--
-- Huit émissions lancées en parallèle depuis huit connexions doivent
-- produire huit numéros uniques et consécutifs. C'est le FOR UPDATE sur la
-- ligne du compteur qui les met en file au lieu de leur donner le même.
--
-- Ne se rejoue pas en une seule session psql : lancer depuis un shell,
--   for ID in $(psql -tAc "select id from interventions_a_facturer()"); do
--     ( psql -tAc "select emettre_facture((facturer_intervention('$ID')).id);" ) &
--   done; wait
--   psql -tAc "select count(distinct numero)=count(*) from factures where numero is not null;"
--
-- Vérifié le 22 novembre 2026 : 9 factures, numéros uniques, aucun trou.
-- =====================================================================
