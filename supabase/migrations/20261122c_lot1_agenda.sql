-- Lot 1, troisième partie — intervenants, exceptions, et la stabilité du passé.
--
-- NON APPLIQUÉE en production.
--
-- Le défaut que ce fichier corrige : jusqu'ici, la facture d'un passage se
-- calculait en lisant le contrat vivant. Changer le tarif en mars changeait
-- donc rétroactivement ce qu'on avait facturé en janvier. Un passage réalisé
-- doit être un fait figé, pas une vue sur des paramètres actuels.
--
-- La correction : au moment où le passage est clos, les conditions tarifaires
-- sont recopiées sur lui. La facturation lit cette copie, jamais le contrat.

begin;

-- ------------------------------------------------------------ intervenants

create table intervenants (
  id      uuid primary key default gen_random_uuid(),
  nom     text not null,
  couleur text not null default 'slate'
          check (couleur in ('slate', 'terracotta', 'sage', 'gold', 'navy')),
  actif   boolean not null default true,
  cree_le timestamptz not null default now()
);

alter table interventions
  add column intervenant_id uuid references intervenants(id) on delete set null;

create index intervention_par_intervenant on interventions (intervenant_id, date desc);

-- ------------------------------------- le passé ne bouge plus : l'instantané

-- Les conditions au moment du passage. Nulles tant qu'il n'est pas clos.
alter table interventions
  add column fige_base             base_tarifaire,
  add column fige_libelle          text,
  add column fige_forfait_ht       numeric(10,2),
  add column fige_taux_horaire_ht  numeric(10,2),
  add column fige_heures_convenues numeric(5,2),
  add column fige_tva              numeric(4,3),
  add column fige_le               timestamptz;

comment on column interventions.fige_base is
  'Conditions tarifaires recopiées à la clôture. La facturation lit ces colonnes et jamais le contrat, pour qu''un changement de tarif ne réécrive pas le passé.';

-- Un passage clos porte forcément son instantané ; un passage qui ne l'est pas
-- n'en a pas. Sans cela, on pourrait facturer sur des conditions absentes.
alter table interventions
  add constraint intervention_fige_si_faite check (
    (statut <> 'faite') or (fige_base is not null and fige_le is not null)
  );

-- ------------------------------------------- exceptions aux récurrences

-- Une occurrence projetée depuis un contrat peut être supprimée ou déplacée
-- sans toucher au contrat lui-même : un client absent une semaine ne justifie
-- pas de réécrire ses conditions.
create table contrat_exceptions (
  id           uuid primary key default gen_random_uuid(),
  contrat_id   uuid not null references contrats(id) on delete cascade,
  jour         date not null,
  genre        text not null check (genre in ('supprimee', 'deplacee')),
  nouveau_jour date,
  motif        text,
  cree_le      timestamptz not null default now(),

  unique (contrat_id, jour),
  constraint exception_coherente check (
    (genre = 'supprimee' and nouveau_jour is null)
    or (genre = 'deplacee' and nouveau_jour is not null)
  )
);

-- ------------------------------------------------- clôture avec instantané

create or replace function clore_intervention(
  p_id uuid, p_debut time, p_fin time, p_checklist jsonb, p_observations text, p_km int
) returns interventions language plpgsql as $$
declare i interventions; c contrats;
begin
  select * into i from interventions where id = p_id for update;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'P0002'; end if;
  if i.statut not in ('planifiee', 'en_cours') then
    raise exception 'Passage déjà clos ou annulé (%).', i.statut using errcode = 'P0001';
  end if;

  select * into c from contrats where id = i.contrat_id;
  if c.id is null then
    raise exception 'Aucun contrat sur ce passage : impossible de figer les conditions.' using errcode = 'P0001';
  end if;

  update interventions
     set statut = 'faite',
         debut = p_debut, fin = p_fin,
         checklist = coalesce(p_checklist, checklist),
         observations = coalesce(p_observations, observations),
         km = coalesce(p_km, km),
         -- L'instantané. À partir d'ici, ce passage ne dépend plus du contrat.
         fige_base = c.base,
         fige_libelle = c.libelle,
         fige_forfait_ht = c.forfait_ht,
         fige_taux_horaire_ht = c.taux_horaire_ht,
         fige_heures_convenues = c.heures_convenues,
         fige_tva = c.tva,
         fige_le = now()
   where id = p_id
   returning * into i;
  return i;
end;
$$;

-- --------------------------------------- facturation sur l'instantané

create or replace function facturer_intervention(p_intervention_id uuid)
returns factures language plpgsql as $$
declare i interventions; f factures; s supplements; rang int := 0; montant numeric;
begin
  select * into i from interventions where id = p_intervention_id;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'P0002'; end if;
  if i.fige_base is null then
    raise exception 'Les conditions du passage ne sont pas figées : clore le passage d''abord.' using errcode = 'P0001';
  end if;

  -- Les conditions lues ici sont celles du jour du passage, pas celles
  -- d'aujourd'hui. C'est tout l'objet de l'instantané.
  insert into factures (client_id, tva) values (i.client_id, i.fige_tva) returning * into f;

  if i.fige_base = 'forfait' then
    rang := rang + 1;
    insert into facture_lignes (facture_id, rang, libelle, detail, quantite, unite, pu_ht, montant_ht, intervention_id)
    values (f.id, rang, i.fige_libelle, 'Forfait contractuel, indépendant de la durée.',
            1, 'passage', i.fige_forfait_ht, i.fige_forfait_ht, i.id);
  elsif i.fige_base = 'horaire' then
    rang := rang + 1;
    insert into facture_lignes (facture_id, rang, libelle, detail, quantite, unite, pu_ht, montant_ht, intervention_id)
    values (f.id, rang, i.fige_libelle, 'Heures convenues au contrat, et non heures relevées.',
            i.fige_heures_convenues, 'h', i.fige_taux_horaire_ht,
            round(i.fige_heures_convenues * i.fige_taux_horaire_ht, 2), i.id);
  else
    rang := rang + 1;
    insert into facture_lignes (facture_id, rang, libelle, detail, quantite, unite, pu_ht, montant_ht, intervention_id)
    values (f.id, rang, i.fige_libelle, 'Compris dans l''abonnement, non facturé à l''unité.',
            null, null, null, 0, i.id);
  end if;

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

-- ------------------------------------------------ déplacer une intervention

create or replace function deplacer_intervention(
  p_id uuid, p_jour date, p_debut time default null, p_motif text default null
) returns interventions language plpgsql as $$
declare i interventions; ancien_jour date; ancien_contrat uuid;
begin
  select * into i from interventions where id = p_id for update;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'P0002'; end if;
  -- Un passage réalisé est un fait : on ne le déplace pas, on en crée un autre.
  if i.statut = 'faite' then
    raise exception 'Un passage réalisé ne se déplace pas.' using errcode = 'P0001';
  end if;
  if p_jour = i.date then
    return i;
  end if;

  -- La date d'origine est retenue AVANT la mise à jour. Sans cela, l'exception
  -- serait posée sur la nouvelle date et l'occurrence de l'ancienne
  -- réapparaîtrait dans l'agenda : le client semblerait avoir deux passages.
  ancien_jour := i.date;
  ancien_contrat := i.contrat_id;

  update interventions
     set date = p_jour,
         debut = coalesce(p_debut, debut),
         statut = case when statut = 'planifiee' then 'reportee'::statut_intervention else statut end,
         observations = case when p_motif is null then observations
                             else trim(both e'\n' from observations || e'\n' || 'Reporté : ' || p_motif) end
   where id = p_id
   returning * into i;

  if ancien_contrat is not null then
    insert into contrat_exceptions (contrat_id, jour, genre, nouveau_jour, motif)
    values (ancien_contrat, ancien_jour, 'deplacee', p_jour, p_motif)
    on conflict (contrat_id, jour) do update
      set genre = 'deplacee', nouveau_jour = excluded.nouveau_jour, motif = excluded.motif;
  end if;
  return i;
end;
$$;

create or replace function annuler_occurrence(p_contrat_id uuid, p_jour date, p_motif text)
returns contrat_exceptions language sql as $$
  insert into contrat_exceptions (contrat_id, jour, genre, motif)
  values (p_contrat_id, p_jour, 'supprimee', p_motif)
  on conflict (contrat_id, jour) do update
    set genre = 'supprimee', nouveau_jour = null, motif = excluded.motif
  returning *;
$$;

-- --------------------------------------------- l'agenda, exceptions comprises

drop function if exists projeter_agenda(date, date);

create or replace function projeter_agenda(p_debut date, p_fin date)
returns table (
  jour date, contrat_id uuid, client_id uuid, bien_id uuid,
  libelle text, duree_h numeric, intervention_id uuid, statut text,
  intervenant_id uuid, intervenant text, client text, commune text, recurrente boolean
) language sql stable as $$
  with brutes as (
    select c.id as contrat_id, c.client_id, c.bien_id, c.libelle,
           coalesce(c.heures_convenues, 4) as duree_h,
           generate_series(
             greatest(c.debut, p_debut),
             least(coalesce(c.fin, p_fin), p_fin),
             case c.base when 'abonnement' then interval '14 days' else interval '7 days' end
           )::date as jour
      from contrats c
     where c.debut <= p_fin and (c.fin is null or c.fin >= p_debut)
  ),
  -- Les exceptions retirent l'occurrence supprimée et celle qui a été déplacée :
  -- le passage déplacé existe désormais comme intervention à sa nouvelle date.
  occurrences as (
    select b.* from brutes b
     where not exists (
       select 1 from contrat_exceptions e
        where e.contrat_id = b.contrat_id and e.jour = b.jour
     )
  )
  select o.jour, o.contrat_id, o.client_id, o.bien_id, o.libelle, o.duree_h,
         i.id, coalesce(i.statut::text, 'projete'),
         i.intervenant_id, iv.nom, cl.nom, bi.commune, true
    from occurrences o
    left join interventions i on i.contrat_id = o.contrat_id and i.date = o.jour
    left join intervenants iv on iv.id = i.intervenant_id
    left join clients cl on cl.id = o.client_id
    left join biens bi on bi.id = o.bien_id
  union all
  select i.date, i.contrat_id, i.client_id, i.bien_id,
         coalesce(i.fige_libelle, c.libelle, 'Passage ponctuel'), i.duree_prevue_h, i.id, i.statut::text,
         i.intervenant_id, iv.nom, cl.nom, bi.commune, false
    from interventions i
    left join contrats c on c.id = i.contrat_id
    left join intervenants iv on iv.id = i.intervenant_id
    left join clients cl on cl.id = i.client_id
    left join biens bi on bi.id = i.bien_id
   where i.date between p_debut and p_fin
     and not exists (
       -- On ne la répète pas si elle est déjà rendue par la branche récurrente.
       select 1 from occurrences o
        where o.contrat_id = i.contrat_id and o.jour = i.date
     )
  order by 1, 2;
$$;

-- L'historique s'appuie lui aussi sur l'instantané, pour la même raison.
create or replace view historique_client as
  select i.client_id, i.date::timestamptz as le, 'intervention' as type,
         'Passage ' || case i.statut when 'faite' then 'effectué'
                                     when 'annulee' then 'annulé'
                                     when 'reportee' then 'reporté'
                                     else 'prévu' end as titre,
         coalesce(i.fige_libelle, '') ||
         coalesce(' · ' || to_char(duree_reelle_h(i), 'FM0.00') || ' h', '') as detail,
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

alter table intervenants        enable row level security;
alter table contrat_exceptions  enable row level security;

commit;
