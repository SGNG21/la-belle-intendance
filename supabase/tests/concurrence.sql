-- Conflits entre deux appareils sur la même intervention.
-- Toute ligne « REFUS attendu » doit lever une erreur 40001.

\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

insert into clients (id, nom, email) values ('aaaaaaaa-0000-0000-0000-000000000001','Delaunay','h@exemple.fr');
insert into biens (id, client_id, libelle) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Maison');
insert into contrats (id, client_id, bien_id, base, libelle, forfait_ht, debut)
  values ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','forfait','Entretien',140,'2026-11-01');
insert into interventions (id, client_id, bien_id, contrat_id, date, duree_prevue_h)
  values ('dddddddd-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','2026-11-24',4.5);

\echo '=== C1 version initiale'
select 'version=' || version from interventions where id='dddddddd-0000-0000-0000-000000000001';

\echo '=== C2 le telephone A lit la version 1, puis l ordinateur B deplace le passage'
select 'B_deplace=' || (deplacer_intervention('dddddddd-0000-0000-0000-000000000001','2026-11-25',null,'Report',1)).date;
select 'version_apres_B=' || version from interventions where id='dddddddd-0000-0000-0000-000000000001';

\echo '=== C3 le telephone A, hors reseau depuis, renvoie son releve sur la version 1 (REFUS attendu)'
select (clore_intervention('dddddddd-0000-0000-0000-000000000001','09:00','13:00','[]'::jsonb,'Releve du telephone',9,1)).id;

\echo '=== C4 A relit la version reelle et rejoue : accepte'
select 'clos=' || (clore_intervention('dddddddd-0000-0000-0000-000000000001','09:00','13:00','[]'::jsonb,'Releve du telephone',9,2)).statut;
select 'version_apres=' || version from interventions where id='dddddddd-0000-0000-0000-000000000001';

\echo '=== C5 sans version fournie, aucun controle (voie de secours assumee)'
insert into interventions (id, client_id, bien_id, contrat_id, date, duree_prevue_h)
  values ('dddddddd-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','2026-12-01',4);
select 'clos_sans_version=' || (clore_intervention('dddddddd-0000-0000-0000-000000000002','09:00','12:00',null,null,null,null)).statut;

\echo '=== C6 annuler avec une version perimee (REFUS attendu)'
insert into interventions (id, client_id, bien_id, contrat_id, date, duree_prevue_h)
  values ('dddddddd-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','2026-12-15',4);
select 'deplace=' || (deplacer_intervention('dddddddd-0000-0000-0000-000000000003','2026-12-16',null,null,1)).date;
select (annuler_intervention('dddddddd-0000-0000-0000-000000000003','Cliente absente',1)).id;

\echo '=== C7 annuler avec la bonne version : accepte'
select 'annule=' || (annuler_intervention('dddddddd-0000-0000-0000-000000000003','Cliente absente',2)).statut;

\echo '=== C8 double saisie du meme passage le meme jour (REFUS attendu)'
select (poser_intervention('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','2026-12-01','09:00',4,null)).id;

\echo '=== C9 un passage annule ne bloque pas une nouvelle saisie'
select 'repose=' || (poser_intervention('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','2026-12-16','09:00',4,null)).date;
