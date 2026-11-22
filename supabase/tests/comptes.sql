-- Comptes individuels : sessions, révocation, cloisonnement, traçabilité.
-- Tout « REFUS attendu » doit lever.

\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

\echo '=== D1 un lien de connexion, puis une session'
insert into connexions (jeton_hash, personne_id, expire_le)
  values ('lien-coralie', '10000000-0000-0000-0000-000000000001', now() + interval '15 minutes');
select 'ouverte pour ' || nom || ' (' || role || ')' from ouvrir_session('lien-coralie','sess-coralie',30);

\echo '=== D2 la session rend la bonne personne'
select 'session = ' || nom || ' / ' || role from session_personne('sess-coralie');

\echo '=== D3 le lien ne sert qu une fois (REFUS attendu)'
select (ouvrir_session('lien-coralie','sess-bis',30)).personne_id;

\echo '=== D4 un lien expire (REFUS attendu)'
insert into connexions (jeton_hash, personne_id, expire_le)
  values ('lien-perime', '10000000-0000-0000-0000-000000000002', now() - interval '1 minute');
select (ouvrir_session('lien-perime','sess-perime',30)).personne_id;

\echo '=== D5 une session inconnue ne rend rien'
select 'lignes=' || count(*) from session_personne('jeton-invente');

\echo '=== D6 session pour Nadia, puis revocation'
insert into connexions (jeton_hash, personne_id, expire_le)
  values ('lien-nadia', '10000000-0000-0000-0000-000000000002', now() + interval '15 minutes');
select 'ouverte pour ' || nom from ouvrir_session('lien-nadia','sess-nadia',30);
select 'avant = ' || count(*) from session_personne('sess-nadia');
select 'revoquees = ' || revoquer_sessions('10000000-0000-0000-0000-000000000002');
select 'apres = ' || count(*) from session_personne('sess-nadia');

\echo '=== D7 desactiver une personne ferme ses sessions'
insert into connexions (jeton_hash, personne_id, expire_le)
  values ('lien-sabine', '10000000-0000-0000-0000-000000000003', now() + interval '15 minutes');
select 'ouverte pour ' || nom from ouvrir_session('lien-sabine','sess-sabine',30);
select 'avant = ' || count(*) from session_personne('sess-sabine');
select 'desactivee = ' || (desactiver_personne('10000000-0000-0000-0000-000000000003')).nom;
select 'apres = ' || count(*) from session_personne('sess-sabine');
select 'actif = ' || actif from intervenants where id='10000000-0000-0000-0000-000000000003';

\echo '=== D8 une personne desactivee ne peut plus ouvrir de session (REFUS attendu)'
insert into connexions (jeton_hash, personne_id, expire_le)
  values ('lien-sabine-2', '10000000-0000-0000-0000-000000000003', now() + interval '15 minutes');
select (ouvrir_session('lien-sabine-2','sess-sabine-2',30)).personne_id;

\echo '=== D9 deux adresses identiques sont refusees (REFUS attendu)'
insert into intervenants (nom, email) values ('Doublon', 'CORALIE@exemple.fr');

\echo '=== D10 un role invente est refuse (REFUS attendu)'
insert into intervenants (nom, email, role) values ('Pirate', 'pirate@exemple.fr', 'administrateur');

\echo '=== D11 la trace nomme la personne'
select 'trace par ' || par from tracer_acces('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001');
select 'personne_id renseigne = ' || (personne_id is not null)::text from acces_revelations order by le desc limit 1;

\echo '=== D12 une consultation anonyme est refusee (REFUS attendu)'
select (tracer_acces('30000000-0000-0000-0000-000000000001', null)).id;
