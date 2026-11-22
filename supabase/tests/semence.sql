-- Jeu d'essai de la recette locale. Noms inventés, aucune donnée réelle.
-- Ce fichier suppose un schéma neuf : voir scripts/base-de-test.sh.
-- Il n'efface rien lui-même, et c'est volontaire — le déclencheur qui fige
-- une facture émise refuse la suppression de ses lignes, ce qui est la bonne
-- règle en production et rend le « vidage de tables » impossible.
begin;

-- Les personnes, avec leurs comptes. Adresses fictives.
insert into intervenants (id, nom, couleur, email, role) values
  ('10000000-0000-0000-0000-000000000001','Coralie','navy','coralie@exemple.fr','proprietaire'),
  ('10000000-0000-0000-0000-000000000002','Nadia','terracotta','nadia@exemple.fr','intervenant'),
  ('10000000-0000-0000-0000-000000000003','Sabine','sage','sabine@exemple.fr','intervenant');

insert into clients (id, nom, email, telephone, commune, type, mode, notes) values
  ('20000000-0000-0000-0000-000000000001','Hélène Delaunay','h.delaunay@exemple.fr','06 12 34 56 78','Villecien','particulier','cesu','Joignable le soir après 18 h.'),
  ('20000000-0000-0000-0000-000000000002','Cabinet Marchand','contact@exemple.fr','03 86 00 00 00','Joigny','professionnel','prestation',null),
  ('20000000-0000-0000-0000-000000000003','Gîte des Tilleuls','gite@exemple.fr','06 00 00 00 00','Armeau','professionnel','prestation',null);

insert into biens (id, client_id, libelle, adresse, commune, surface, chambres, salles_de_bains, wc, pieces_vie, km, acces, particularites) values
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','La Maison du Pré','4 chemin du Pré Vert','Villecien',165,4,2,2,2,9,'Clé dans la boîte à code au portail, code 4812. Alarme : badge sur le trousseau.','Deux chats. Piano dans le séjour : chiffon sec.'),
  ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Bureaux du cabinet','12 rue Gabriel Cortel','Joigny',90,0,0,2,3,3,'Badge remis en main propre.','Ne pas déplacer les dossiers.'),
  ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Gîte des Tilleuls','2 route de Villeneuve','Armeau',75,3,1,1,1,14,'Boîte à clés, code 7730.','Vérifier le gaz en partant.');

insert into contrats (id, client_id, bien_id, base, libelle, forfait_ht, taux_horaire_ht, heures_convenues, tva, debut) values
  ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','forfait','Entretien de La Maison du Pré',140,null,null,0,'2026-03-24'),
  ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','horaire','Bureaux, hebdomadaire',null,38,2,0.2,'2026-05-02');

-- Passages : deux faits et facturés, un en cours aujourd'hui, deux à venir.
insert into interventions (id, client_id, bien_id, contrat_id, intervenant_id, date, debut, fin, duree_prevue_h, statut, checklist, observations, km, photos_autorisees,
                           fige_base, fige_libelle, fige_forfait_ht, fige_tva, fige_le) values
  ('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','2026-11-10','09:00','13:30',4.5,'faite','[]','RAS.',9,true,'forfait','Entretien de La Maison du Pré',140,0,'2026-11-10T13:30:00Z');

insert into interventions (id, client_id, bien_id, contrat_id, intervenant_id, date, debut, duree_prevue_h, statut, checklist, observations, km, photos_autorisees) values
  ('50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','2026-11-24','09:05',4.5,'en_cours',
   '[{"id":"l1","label":"Cuisine et office","fait":true,"note":""},
     {"id":"l2","label":"Séjour et piano","fait":true,"note":"Chiffon sec, comme convenu."},
     {"id":"l3","label":"Chambre des enfants","fait":true,"note":""},
     {"id":"l4","label":"Chambre d''amis","fait":true,"note":""},
     {"id":"l5","label":"Chambre parentale","fait":true,"note":""},
     {"id":"l6","label":"Bureau","fait":false,"note":"Porte fermée à clé, pas pu entrer."},
     {"id":"l7","label":"Salle de bains du haut","fait":true,"note":""},
     {"id":"l8","label":"Salle de bains du bas","fait":true,"note":""},
     {"id":"l9","label":"WC","fait":true,"note":""},
     {"id":"l10","label":"Entrée et couloirs","fait":true,"note":""},
     {"id":"l11","label":"Lits faits, linge changé","fait":true,"note":""},
     {"id":"l12","label":"Arrosage des plantes","fait":true,"note":""},
     {"id":"l13","label":"Relève du courrier","fait":true,"note":"Deux plis sur la console."},
     {"id":"l14","label":"Vitres du séjour","fait":null,"note":""}]'::jsonb,
   'Fuite légère sous le siphon de la salle de bains du bas. À faire voir à un plombier.',9,true),
  ('50000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003',null,'10000000-0000-0000-0000-000000000002','2026-11-25','14:00',3,'planifiee','[]','',14,false),
  ('50000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','2026-11-26','08:30',2,'planifiee','[]','',3,false);

insert into supplements (intervention_id, libelle, heures, taux_horaire_ht, approuve_par, approuve_le, approuve_canal) values
  ('50000000-0000-0000-0000-000000000002','Vitres du séjour',1.25,32,'Hélène Delaunay','2026-11-20T10:00:00Z','sms');
insert into supplements (intervention_id, libelle, montant_ht) values
  ('50000000-0000-0000-0000-000000000002','Dégivrage du congélateur',25);

-- Le passage du 10 novembre a son compte rendu envoyé et sa facture payée.
insert into comptes_rendus (intervention_id, client_id, statut, valide_le, envoye_le, destinataires, empreinte_envoyee)
  values ('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','envoye','2026-11-10T13:45:00Z','2026-11-10T14:00:00Z',array['h.delaunay@exemple.fr'],'abc123');
commit;

select facturer_intervention('50000000-0000-0000-0000-000000000001');
select emettre_facture((select id from factures limit 1));
select enregistrer_paiement((select id from factures limit 1), '2026-11-12', 140, 'virement');
