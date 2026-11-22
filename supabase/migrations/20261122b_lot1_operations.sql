-- Lot 1, deuxième partie — les opérations, et pourquoi elles sont en base.
--
-- NON APPLIQUÉE en production.
--
-- Raison d'être de ce fichier : l'application parle à la base par PostgREST,
-- qui exécute une instruction à la fois. Or « créer la facture ET ses lignes,
-- ou rien » ne se fait pas en deux appels : entre les deux, un plantage laisse
-- une facture vide, et deux appels simultanés en créent deux. Une fonction
-- Postgres, elle, est une transaction : tout passe ou rien ne passe.
--
-- Les règles métier vivent donc ici, en un seul endroit, et l'API se contente
-- de les appeler. Un écran oublieux, un second onglet ou un workflow n8n
-- rejoué ne peuvent pas les contourner.

begin;

-- --------------------------------------------------------------- historique

-- L'historique n'est pas une table : ce serait une copie à tenir à jour, donc
-- une source d'incohérence. C'est une vue sur ce qui existe déjà.
create view historique_client as
  select i.client_id, i.date::timestamptz as le, 'intervention' as type,
         'Passage ' || case i.statut when 'faite' then 'effectué'
                                     when 'annulee' then 'annulé'
                                     else 'prévu' end as titre,
         coalesce(to_char(duree_reelle_h(i), 'FM0.00') || ' h', '') as detail,
         i.id as objet_id
    from interventions i
  union all
  select cr.client_id, coalesce(cr.envoye_le, cr.valide_le, cr.cree_le), 'compte_rendu',
         case when cr.envoye_le is not null then 'Compte rendu envoyé'
              when cr.valide_le is not null then 'Compte rendu validé'
              else 'Compte rendu en brouillon' end,
         coalesce(array_to_string(cr.destinataires, ', '), ''), cr.id
    from comptes_rendus cr
  union all
  select f.client_id, coalesce(f.date_emission::timestamptz, f.cree_le), 'facture',
         case when f.numero is not null then 'Facture ' || f.numero else 'Facture en brouillon' end,
         to_char(coalesce((select sum(l.montant_ht) from facture_lignes l where l.facture_id = f.id), 0), 'FM999999.00') || ' €',
         f.id
    from factures f
  union all
  select f.client_id, p.date::timestamptz, 'paiement', 'Paiement reçu',
         to_char(p.montant, 'FM999999.00') || ' € · ' || p.moyen, p.id
    from paiements p join factures f on f.id = p.facture_id;

-- ------------------------------------------------------ numérotation

-- Une série de factures ne saute pas de numéro et n'en réutilise aucun.
-- Le compteur est verrouillé le temps de l'attribution : deux émissions
-- simultanées se mettent en file au lieu de prendre le même numéro.
create table compteurs (
  annee    int primary key,
  dernier  int not null default 0
);

create or replace function prochain_numero(p_annee int)
returns text language plpgsql as $$
declare n int;
begin
  insert into compteurs (annee, dernier) values (p_annee, 0) on conflict (annee) do nothing;
  -- FOR UPDATE : la ligne de l'année est verrouillée jusqu'à la fin de la transaction.
  select dernier + 1 into n from compteurs where annee = p_annee for update;
  update compteurs set dernier = n where annee = p_annee;
  return p_annee || '-' || lpad(n::text, 3, '0');
end;
$$;

-- -------------------------------------------------- clore une intervention

create or replace function clore_intervention(
  p_id uuid, p_debut time, p_fin time, p_checklist jsonb, p_observations text, p_km int
) returns interventions language plpgsql as $$
declare i interventions;
begin
  update interventions
     set statut = 'faite', debut = p_debut, fin = p_fin,
         checklist = coalesce(p_checklist, checklist),
         observations = coalesce(p_observations, observations),
         km = coalesce(p_km, km)
   where id = p_id and statut in ('planifiee', 'en_cours')
   returning * into i;

  if i.id is null then
    raise exception 'Passage introuvable ou déjà clos.' using errcode = 'P0002';
  end if;
  return i;
end;
$$;

-- ---------------------------------------------- établir un compte rendu

-- Idempotente : rappelée sur le même passage, elle rend le compte rendu
-- existant au lieu d'en créer un second ou d'échouer.
create or replace function etablir_compte_rendu(p_intervention_id uuid, p_destinataires text[])
returns comptes_rendus language plpgsql as $$
declare cr comptes_rendus; i interventions;
begin
  select * into i from interventions where id = p_intervention_id;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'P0002'; end if;
  if i.statut <> 'faite' then
    raise exception 'Le passage n''est pas terminé.' using errcode = 'P0001';
  end if;

  select * into cr from comptes_rendus where intervention_id = p_intervention_id;
  if cr.id is not null then return cr; end if;

  insert into comptes_rendus (intervention_id, client_id, statut, destinataires)
  values (p_intervention_id, i.client_id, 'valide', coalesce(p_destinataires, '{}'))
  returning * into cr;
  return cr;
end;
$$;

-- ------------------------------------------------- envoyer, une seule fois

-- Le verrou anti-double-envoi.
--
-- La clé d'idempotence est insérée AVANT l'envoi. Si elle existe déjà, la
-- fonction rend « deja_fait » sans rien changer : le second clic, le second
-- onglet et le rejeu d'un workflow n8n retombent tous sur ce cas. L'appelant
-- n'envoie l'e-mail que si la fonction a rendu « a_envoyer ».
create or replace function reserver_envoi(p_cle text, p_objet text, p_objet_id uuid)
returns text language plpgsql as $$
begin
  insert into envois (cle, objet, objet_id) values (p_cle, p_objet, p_objet_id);
  return 'a_envoyer';
exception when unique_violation then
  return 'deja_fait';
end;
$$;

create or replace function marquer_cr_envoye(p_cr_id uuid, p_empreinte text)
returns comptes_rendus language plpgsql as $$
declare cr comptes_rendus;
begin
  update comptes_rendus
     set statut = 'envoye', envoye_le = now(), empreinte_envoyee = p_empreinte
   where id = p_cr_id and envoye_le is null
   returning * into cr;
  if cr.id is null then
    raise exception 'Compte rendu introuvable ou déjà envoyé.' using errcode = 'P0001';
  end if;
  return cr;
end;
$$;

-- ------------------------------------------------------ facturer un passage

-- Crée la facture ET ses lignes en une transaction. Le prix vient du contrat
-- et des suppléments approuvés — le temps réel n'entre nulle part.
create or replace function facturer_intervention(p_intervention_id uuid)
returns factures language plpgsql as $$
declare
  i interventions; c contrats; f factures; s supplements;
  rang int := 0; montant numeric;
begin
  select * into i from interventions where id = p_intervention_id;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'P0002'; end if;

  select * into c from contrats where id = i.contrat_id;
  if c.id is null then raise exception 'Aucun contrat sur ce passage.' using errcode = 'P0001'; end if;

  insert into factures (client_id, tva) values (i.client_id, c.tva) returning * into f;

  -- La ligne du contrat. En abonnement, le passage est déjà couvert : aucune ligne.
  if c.base = 'forfait' then
    rang := rang + 1;
    insert into facture_lignes (facture_id, rang, libelle, detail, quantite, unite, pu_ht, montant_ht, intervention_id)
    values (f.id, rang, c.libelle, 'Forfait contractuel, indépendant de la durée.',
            1, 'passage', c.forfait_ht, c.forfait_ht, i.id);
  elsif c.base = 'horaire' then
    rang := rang + 1;
    insert into facture_lignes (facture_id, rang, libelle, detail, quantite, unite, pu_ht, montant_ht, intervention_id)
    values (f.id, rang, c.libelle, 'Heures convenues au contrat, et non heures relevées.',
            c.heures_convenues, 'h', c.taux_horaire_ht,
            round(c.heures_convenues * c.taux_horaire_ht, 2), i.id);
  else
    -- Abonnement : on rattache quand même le passage à la facture, à montant nul,
    -- pour que le verrou anti-double-facturation joue aussi dans ce cas.
    rang := rang + 1;
    insert into facture_lignes (facture_id, rang, libelle, detail, quantite, unite, pu_ht, montant_ht, intervention_id)
    values (f.id, rang, c.libelle, 'Compris dans l''abonnement, non facturé à l''unité.',
            null, null, null, 0, i.id);
  end if;

  -- Les suppléments approuvés, et eux seuls.
  for s in select * from supplements where intervention_id = i.id and approuve_par is not null loop
    montant := coalesce(s.montant_ht, round(s.heures * s.taux_horaire_ht, 2));
    if montant > 0 then
      rang := rang + 1;
      insert into facture_lignes (facture_id, rang, libelle, detail, quantite, unite, pu_ht, montant_ht, supplement_id)
      values (f.id, rang, s.libelle,
              'Approuvé par ' || s.approuve_par || ' le ' || to_char(s.approuve_le, 'DD/MM/YYYY') || ' (' || s.approuve_canal || ').',
              coalesce(s.heures, 1), case when s.heures is not null then 'h' else 'forfait' end,
              coalesce(s.taux_horaire_ht, s.montant_ht), montant, s.id);
    end if;
  end loop;

  return f;
end;
$$;

-- ------------------------------------------------------- émettre la facture

create or replace function emettre_facture(p_facture_id uuid, p_echeance_jours int default 30)
returns factures language plpgsql as $$
declare f factures;
begin
  select * into f from factures where id = p_facture_id for update;
  if f.id is null then raise exception 'Facture introuvable.' using errcode = 'P0002'; end if;
  if f.statut <> 'brouillon' then
    raise exception 'Facture déjà émise (%).', f.statut using errcode = 'P0001';
  end if;
  if not exists (select 1 from facture_lignes where facture_id = f.id) then
    raise exception 'Facture sans ligne.' using errcode = 'P0001';
  end if;

  update factures
     set statut = 'emise',
         numero = prochain_numero(extract(year from current_date)::int),
         date_emission = current_date,
         date_echeance = current_date + p_echeance_jours
   where id = f.id
   returning * into f;
  return f;
end;
$$;

-- ---------------------------------------------------------- les paiements

create or replace function enregistrer_paiement(
  p_facture_id uuid, p_date date, p_montant numeric, p_moyen text
) returns factures language plpgsql as $$
declare f factures; total numeric; paye numeric;
begin
  select * into f from factures where id = p_facture_id for update;
  if f.id is null then raise exception 'Facture introuvable.' using errcode = 'P0002'; end if;
  if f.statut = 'brouillon' then
    raise exception 'Une facture non émise ne reçoit pas de paiement.' using errcode = 'P0001';
  end if;

  insert into paiements (facture_id, date, montant, moyen)
  values (p_facture_id, p_date, p_montant, p_moyen);

  select round(sum(montant_ht) * (1 + f.tva), 2) into total from facture_lignes where facture_id = f.id;
  select coalesce(sum(montant), 0) into paye from paiements where facture_id = f.id;

  if paye >= total then
    update factures set statut = 'payee' where id = f.id returning * into f;
  end if;
  return f;
end;
$$;

-- ------------------------------------------------------------- l'agenda

-- Les passages à venir, projetés depuis les contrats actifs.
--
-- Rien n'est écrit : on calcule les occurrences à la volée. Une intervention
-- n'est créée en base que lorsqu'elle est réellement posée ou close, ce qui
-- évite de remplir la table de milliers de lignes hypothétiques qu'il faudrait
-- ensuite corriger à chaque changement de contrat.
create or replace function projeter_agenda(p_debut date, p_fin date)
returns table (
  jour date, contrat_id uuid, client_id uuid, bien_id uuid,
  libelle text, duree_h numeric, intervention_id uuid, statut text
) language sql stable as $$
  with occurrences as (
    select c.id as contrat_id, c.client_id, c.bien_id, c.libelle,
           coalesce(c.heures_convenues, 4) as duree_h,
           generate_series(
             greatest(c.debut, p_debut),
             least(coalesce(c.fin, p_fin), p_fin),
             case c.base when 'abonnement' then interval '14 days' else interval '7 days' end
           )::date as jour
      from contrats c
     where c.debut <= p_fin and (c.fin is null or c.fin >= p_debut)
  )
  select o.jour, o.contrat_id, o.client_id, o.bien_id, o.libelle, o.duree_h,
         i.id, coalesce(i.statut::text, 'projete')
    from occurrences o
    left join interventions i
      on i.contrat_id = o.contrat_id and i.date = o.jour
  union all
  -- Les passages ponctuels, qui ne viennent d'aucun contrat récurrent.
  select i.date, i.contrat_id, i.client_id, i.bien_id,
         coalesce(c.libelle, 'Passage ponctuel'), i.duree_prevue_h, i.id, i.statut::text
    from interventions i
    left join contrats c on c.id = i.contrat_id
   where i.date between p_debut and p_fin
     and (i.contrat_id is null
          or not exists (select 1 from contrats c2 where c2.id = i.contrat_id
                          and i.date between c2.debut and coalesce(c2.fin, p_fin)))
  order by 1;
$$;

-- Ce qui attend d'être facturé : passage clos, compte rendu fait, pas de facture.
create or replace function interventions_a_facturer()
returns setof interventions language sql stable as $$
  select i.* from interventions i
   where i.statut = 'faite'
     and exists (select 1 from comptes_rendus cr where cr.intervention_id = i.id)
     and not exists (select 1 from facture_lignes l where l.intervention_id = i.id)
   order by i.date;
$$;

commit;
