-- Agenda, intervenants, exceptions, et surtout : la stabilité du passé.
-- Rejouer après les trois migrations. Tout « REFUS attendu » doit lever.

\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

insert into clients (id, nom, email) values ('11111111-1111-1111-1111-111111111111','Delaunay','h@exemple.fr');
insert into biens (id, client_id, libelle, commune, acces) values ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Maison du Pre','Villecien','code 4812');
insert into intervenants (id, nom, couleur) values ('99999999-9999-9999-9999-999999999999','Coralie','navy');
insert into contrats (id, client_id, bien_id, base, libelle, forfait_ht, debut)
  values ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','forfait','Entretien quinzaine',140,'2026-11-03');
insert into interventions (id, client_id, bien_id, contrat_id, intervenant_id, date, duree_prevue_h)
  values ('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','99999999-9999-9999-9999-999999999999','2026-11-24',4.5);

\echo '=== B1 un passage non clos n a pas d instantane'
select 'fige=' || coalesce(fige_base::text,'(aucun)') from interventions where id='44444444-4444-4444-4444-444444444444';

\echo '=== B2 cloture : les conditions sont recopiees sur le passage'
-- Chaque fonction est appelee dans SA PROPRE instruction : appelee depuis un
-- predicat sur une table vide, Postgres ne l'evaluerait jamais.
select 'clos=' || (clore_intervention('44444444-4444-4444-4444-444444444444','09:05','13:20','[]'::jsonb,'RAS',9)).statut;
select 'fige=' || fige_base || ' forfait=' || fige_forfait_ht from interventions where id='44444444-4444-4444-4444-444444444444';

\echo '=== B3 facturation au tarif du jour du passage'
select 'cr=' || (etablir_compte_rendu('44444444-4444-4444-4444-444444444444', array['h@exemple.fr'])).statut;
select 'facture=' || (facturer_intervention('44444444-4444-4444-4444-444444444444')).statut;
select 'facture_ht=' || sum(montant_ht) from facture_lignes where intervention_id='44444444-4444-4444-4444-444444444444';

\echo '=== B4 LE POINT CLE : on augmente le tarif du contrat APRES coup'
update contrats set forfait_ht = 200 where id='33333333-3333-3333-3333-333333333333';
select 'contrat_aujourdhui=' || forfait_ht from contrats where id='33333333-3333-3333-3333-333333333333';
select 'instantane_du_passage=' || fige_forfait_ht from interventions where id='44444444-4444-4444-4444-444444444444';
select 'facture_inchangee=' || sum(montant_ht) from facture_lignes where intervention_id='44444444-4444-4444-4444-444444444444';
select 'historique_inchange=' || detail from historique_client where objet_id='44444444-4444-4444-4444-444444444444';

\echo '=== B5 un second passage est facture au NOUVEAU tarif'
insert into interventions (id, client_id, bien_id, contrat_id, date, duree_prevue_h)
  values ('55555555-5555-5555-5555-555555555555','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','2026-12-08',4.5);
select 'clos=' || (clore_intervention('55555555-5555-5555-5555-555555555555','09:00','13:00','[]'::jsonb,null,9)).statut;
select 'cr=' || (etablir_compte_rendu('55555555-5555-5555-5555-555555555555', array['h@exemple.fr'])).statut;
select 'facture=' || (facturer_intervention('55555555-5555-5555-5555-555555555555')).statut;
select 'second_passage_ht=' || sum(montant_ht) from facture_lignes where intervention_id='55555555-5555-5555-5555-555555555555';

\echo '=== B6 agenda : occurrences recurrentes projetees'
select jour || ' ' || statut || ' ' || coalesce(intervenant,'(non affecte)') from projeter_agenda('2026-11-03','2026-12-15');

\echo '=== B7 exception : on annule l occurrence du 17 novembre'
select 'exception=' || (annuler_occurrence('33333333-3333-3333-3333-333333333333','2026-11-17','Cliente absente')).genre;
select 'le_17_a_disparu=' || (count(*) = 0)::text from projeter_agenda('2026-11-03','2026-12-15') where jour='2026-11-17';

\echo '=== B8 deplacer un passage prevu'
insert into interventions (id, client_id, bien_id, contrat_id, date, duree_prevue_h)
  values ('66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','2026-12-22',4.5);
select 'deplace_vers=' || (deplacer_intervention('66666666-6666-6666-6666-666666666666','2026-12-23','10:00','Jour ferie')).date;
select 'statut_apres=' || statut from interventions where id='66666666-6666-6666-6666-666666666666';
select 'pas_de_doublon_le_22=' || (count(*) = 0)::text from projeter_agenda('2026-12-20','2026-12-31') where jour='2026-12-22';

\echo '=== B9 deplacer un passage REALISE (REFUS attendu)'
select (deplacer_intervention('44444444-4444-4444-4444-444444444444','2026-12-30',null,null)).id;

\echo '=== B10 un passage sans contrat ne peut pas etre clos (REFUS attendu)'
insert into interventions (id, client_id, bien_id, date, duree_prevue_h)
  values ('77777777-7777-7777-7777-777777777777','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','2026-12-29',2);
select (clore_intervention('77777777-7777-7777-7777-777777777777','09:00','11:00',null,null,null)).id;

\echo '=== B11 affectation visible dans l agenda'
select 'affecte=' || coalesce(intervenant,'(aucun)') from projeter_agenda('2026-11-24','2026-11-24');
