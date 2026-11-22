-- Vérification des verrous de la migration 20261122_lot1_metier.sql.
--
-- Chaque bloc tente une opération qui DOIT être refusée par la base. Un test
-- qui passe silencieusement est un test raté : on attend une erreur, sauf en
-- T6 (facturation légitime) et T13 (calcul de durée).
--
-- Rejouer :
--   createdb lbi_test && psql -d lbi_test -f supabase/migrations/20261122_lot1_metier.sql
--   psql -d lbi_test -f supabase/tests/verrous.sql
--
-- Résultat attendu, vérifié le 22 novembre 2026 sur PostgreSQL 16.15 :
--   T1  contrat actif en double .................. REFUSÉ (unicité)
--   T2  contrat forfait avec taux horaire ........ REFUSÉ (cohérence)
--   T3  facturer un passage non terminé .......... REFUSÉ (déclencheur)
--   T4  facturer sans compte rendu ............... REFUSÉ (déclencheur)
--   T5  deuxième compte rendu .................... REFUSÉ (unicité)
--   T6  facturation légitime ..................... ACCEPTÉ
--   T7  même passage sur deux factures ........... REFUSÉ (unicité)
--   T8  numéro sur un brouillon .................. REFUSÉ (cohérence)
--   T9  modifier une facture émise ............... REFUSÉ (déclencheur)
--   T10 même clé d'envoi deux fois ............... REFUSÉ (clé primaire)
--   T11 supplément chiffré deux fois ............. REFUSÉ (cohérence)
--   T12 approbation incomplète ................... REFUSÉ (cohérence)
--   T13 durée réelle calculée .................... 4.25 h

\set ON_ERROR_STOP off
\pset tuples_only on
-- Jeu d'essai
insert into clients (id, nom) values ('11111111-1111-1111-1111-111111111111', 'Cliente');
insert into biens (id, client_id, libelle, acces)
  values ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Maison','code 4812');
insert into contrats (id, client_id, bien_id, base, libelle, forfait_ht, debut)
  values ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','forfait','Entretien',140,'2026-01-01');
insert into interventions (id, client_id, bien_id, contrat_id, date, debut, fin, duree_prevue_h, statut)
  values ('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','2026-11-24','09:05','13:20',4.5,'planifiee');
insert into factures (id, client_id) values ('55555555-5555-5555-5555-555555555555','11111111-1111-1111-1111-111111111111');

\echo '--- T1 deux contrats actifs sur le meme bien'
insert into contrats (client_id, bien_id, base, libelle, forfait_ht, debut)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','forfait','Doublon',99,'2026-02-01');

\echo '--- T2 contrat forfait portant un taux horaire'
insert into contrats (client_id, bien_id, base, libelle, forfait_ht, taux_horaire_ht, heures_convenues, debut)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','forfait','Ambigu',140,32,4.5,'2027-01-01');

\echo '--- T3 facturer un passage non termine'
insert into facture_lignes (facture_id, rang, libelle, montant_ht, intervention_id)
  values ('55555555-5555-5555-5555-555555555555',1,'Passage',140,'44444444-4444-4444-4444-444444444444');

update interventions set statut='faite' where id='44444444-4444-4444-4444-444444444444';
\echo '--- T4 facturer un passage sans compte rendu'
insert into facture_lignes (facture_id, rang, libelle, montant_ht, intervention_id)
  values ('55555555-5555-5555-5555-555555555555',1,'Passage',140,'44444444-4444-4444-4444-444444444444');

insert into comptes_rendus (intervention_id, client_id, statut)
  values ('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','valide');
\echo '--- T5 second compte rendu sur le meme passage'
insert into comptes_rendus (intervention_id, client_id)
  values ('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111');

\echo '--- T6 facturation legitime (doit reussir)'
insert into facture_lignes (facture_id, rang, libelle, montant_ht, intervention_id)
  values ('55555555-5555-5555-5555-555555555555',1,'Passage du 24 novembre',140,'44444444-4444-4444-4444-444444444444');

\echo '--- T7 DOUBLE FACTURATION : le meme passage sur une autre facture'
insert into factures (id, client_id) values ('66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111');
insert into facture_lignes (facture_id, rang, libelle, montant_ht, intervention_id)
  values ('66666666-6666-6666-6666-666666666666',1,'Encore le meme passage',140,'44444444-4444-4444-4444-444444444444');

\echo '--- T8 facture brouillon portant un numero'
update factures set numero='2026-042' where id='55555555-5555-5555-5555-555555555555';

\echo '--- T9 modifier une facture emise'
update factures set statut='emise', numero='2026-042', date_emission='2026-11-24' where id='55555555-5555-5555-5555-555555555555';
update facture_lignes set montant_ht=999 where facture_id='55555555-5555-5555-5555-555555555555';

\echo '--- T10 DOUBLE ENVOI : meme cle d idempotence'
insert into envois (cle, objet, objet_id) values ('cr:44444444-4444-4444-4444-444444444444:envoi','compte_rendu',null);
insert into envois (cle, objet, objet_id) values ('cr:44444444-4444-4444-4444-444444444444:envoi','compte_rendu',null);

\echo '--- T11 supplement chiffre deux fois'
insert into supplements (intervention_id, libelle, montant_ht, heures, taux_horaire_ht)
  values ('44444444-4444-4444-4444-444444444444','Vitres',40,1.5,32);

\echo '--- T12 supplement approuve a moitie'
insert into supplements (intervention_id, libelle, montant_ht, approuve_par)
  values ('44444444-4444-4444-4444-444444444444','Vitres',40,'Helene');

\echo '--- T13 duree reelle calculee'
select 'duree reelle = ' || duree_reelle_h(i) from interventions i where i.id='44444444-4444-4444-4444-444444444444';
