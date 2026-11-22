-- Lot 1, quatrième partie — concurrence entre appareils.
--
-- NON APPLIQUÉE en production.
--
-- Le problème : Coralie relève un passage sur son téléphone pendant qu'elle
-- le modifie depuis l'ordinateur, ou bien le téléphone était hors réseau et
-- renvoie une heure plus tard un relevé fondé sur un état périmé. Sans garde,
-- le dernier arrivé écrase l'autre en silence, et personne ne le sait.
--
-- La parade retenue est le verrouillage optimiste : chaque intervention porte
-- un numéro de version, l'appelant dit sur quelle version il a travaillé, et
-- la base refuse si elle a changé depuis. Refuser, et non fusionner : une
-- fusion automatique de deux relevés produirait un compte rendu que personne
-- n'a écrit.

begin;

-- « if not exists » : une migration doit pouvoir être rejouée sans tout
-- interrompre, sinon la moindre reprise laisse la base à mi-chemin.
alter table interventions
  add column if not exists version int not null default 1,
  add column if not exists maj_le  timestamptz not null default now();

-- La version s'incrémente d'elle-même : aucun appelant ne peut l'oublier.
create or replace function bump_version()
returns trigger language plpgsql as $$
begin
  new.version := old.version + 1;
  new.maj_le := now();
  return new;
end;
$$;

drop trigger if exists intervention_version on interventions;
create trigger intervention_version
  before update on interventions
  for each row execute function bump_version();

/**
 * Erreur de conflit, assez riche pour que l'écran sache quoi proposer.
 *
 * On renvoie la version attendue, la version réelle et qui a touché la ligne
 * en dernier. L'utilisatrice doit pouvoir répondre « garde le mien » ou
 * « garde l'autre » en connaissance de cause.
 */
create or replace function conflit(p_attendue int, p_reelle int, p_maj timestamptz)
returns void language plpgsql as $$
begin
  raise exception using
    errcode = '40001',
    message = 'Ce passage a été modifié ailleurs.',
    detail = json_build_object(
      'attendue', p_attendue, 'reelle', p_reelle,
      -- « OF » rend « +00 », que JavaScript ne sait pas lire : il faut un
      -- fuseau complet, sinon l'écran affiche « Invalid Date ».
      'modifie_le', to_char(p_maj at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )::text;
end;
$$;

-- --------------------------------------------- clôture avec contrôle de version

create or replace function clore_intervention(
  p_id uuid, p_debut time, p_fin time, p_checklist jsonb, p_observations text,
  p_km int, p_version int default null
) returns interventions language plpgsql as $$
declare i interventions; c contrats;
begin
  select * into i from interventions where id = p_id for update;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'P0002'; end if;

  -- Le contrôle de version avant tout le reste : inutile de valider un relevé
  -- qu'on va refuser.
  if p_version is not null and p_version <> i.version then
    perform conflit(p_version, i.version, i.maj_le);
  end if;

  -- « reportee » est un état d'attente, pas une fin : un passage déplacé à
  -- demain doit pouvoir être clos demain. Seuls « faite » et « annulee »
  -- ferment la porte.
  if i.statut not in ('planifiee', 'en_cours', 'reportee') then
    raise exception 'Passage déjà clos ou annulé (%).', i.statut using errcode = 'P0001';
  end if;

  select * into c from contrats where id = i.contrat_id;
  if c.id is null then
    raise exception 'Aucun contrat sur ce passage : impossible de figer les conditions.' using errcode = 'P0001';
  end if;

  update interventions
     set statut = 'faite', debut = p_debut, fin = p_fin,
         checklist = coalesce(p_checklist, checklist),
         observations = coalesce(p_observations, observations),
         km = coalesce(p_km, km),
         fige_base = c.base, fige_libelle = c.libelle,
         fige_forfait_ht = c.forfait_ht, fige_taux_horaire_ht = c.taux_horaire_ht,
         fige_heures_convenues = c.heures_convenues, fige_tva = c.tva, fige_le = now()
   where id = p_id
   returning * into i;
  return i;
end;
$$;

create or replace function deplacer_intervention(
  p_id uuid, p_jour date, p_debut time default null, p_motif text default null,
  p_version int default null
) returns interventions language plpgsql as $$
declare i interventions; ancien_jour date; ancien_contrat uuid;
begin
  select * into i from interventions where id = p_id for update;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'P0002'; end if;
  if p_version is not null and p_version <> i.version then
    perform conflit(p_version, i.version, i.maj_le);
  end if;
  if i.statut = 'faite' then
    raise exception 'Un passage réalisé ne se déplace pas.' using errcode = 'P0001';
  end if;
  if p_jour = i.date then return i; end if;

  ancien_jour := i.date;
  ancien_contrat := i.contrat_id;

  update interventions
     set date = p_jour, debut = coalesce(p_debut, debut),
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

-- -------------------------------------------------- annuler une intervention

create or replace function annuler_intervention(p_id uuid, p_motif text, p_version int default null)
returns interventions language plpgsql as $$
declare i interventions;
begin
  select * into i from interventions where id = p_id for update;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'P0002'; end if;
  if p_version is not null and p_version <> i.version then
    perform conflit(p_version, i.version, i.maj_le);
  end if;
  if i.statut = 'faite' then
    raise exception 'Un passage réalisé ne s''annule pas. Passer par un avoir si déjà facturé.' using errcode = 'P0001';
  end if;

  update interventions
     set statut = 'annulee',
         observations = trim(both e'\n' from observations || e'\n' || 'Annulé : ' || coalesce(p_motif, 'sans motif'))
   where id = p_id
   returning * into i;

  -- L'occurrence d'origine est retirée de l'agenda projeté.
  if i.contrat_id is not null then
    insert into contrat_exceptions (contrat_id, jour, genre, motif)
    values (i.contrat_id, i.date, 'supprimee', p_motif)
    on conflict (contrat_id, jour) do update set genre = 'supprimee', nouveau_jour = null;
  end if;
  return i;
end;
$$;

-- ------------------------------------------------ poser un passage ponctuel

create or replace function poser_intervention(
  p_client_id uuid, p_bien_id uuid, p_contrat_id uuid, p_jour date,
  p_debut time, p_duree numeric, p_intervenant_id uuid
) returns interventions language plpgsql as $$
declare i interventions;
begin
  -- Deux passages le même jour sur le même bien sont presque toujours une
  -- double saisie. On refuse plutôt que de laisser le doublon s'installer.
  if exists (
    select 1 from interventions
     where bien_id = p_bien_id and date = p_jour and statut <> 'annulee'
  ) then
    raise exception 'Un passage est déjà prévu ce jour-là sur ce bien.' using errcode = 'P0001';
  end if;

  insert into interventions (client_id, bien_id, contrat_id, date, debut, duree_prevue_h, intervenant_id)
  values (p_client_id, p_bien_id, p_contrat_id, p_jour, p_debut, coalesce(p_duree, 2), p_intervenant_id)
  returning * into i;
  return i;
end;
$$;

-- L'agenda porte la version de chaque passage : l'écran la renvoie lors d'un
-- déplacement ou d'une annulation, et le serveur refuse si elle a changé.
drop function if exists projeter_agenda(date, date);

create or replace function projeter_agenda(p_debut date, p_fin date)
returns table (
  jour date, contrat_id uuid, client_id uuid, bien_id uuid,
  libelle text, duree_h numeric, intervention_id uuid, statut text,
  intervenant_id uuid, intervenant text, client text, commune text,
  recurrente boolean, version int
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
  occurrences as (
    select b.* from brutes b
     where not exists (
       select 1 from contrat_exceptions e
        where e.contrat_id = b.contrat_id and e.jour = b.jour
     )
  )
  select o.jour, o.contrat_id, o.client_id, o.bien_id, o.libelle, o.duree_h,
         i.id, coalesce(i.statut::text, 'projete'),
         i.intervenant_id, iv.nom, cl.nom, bi.commune, true, i.version
    from occurrences o
    left join interventions i on i.contrat_id = o.contrat_id and i.date = o.jour
    left join intervenants iv on iv.id = i.intervenant_id
    left join clients cl on cl.id = o.client_id
    left join biens bi on bi.id = o.bien_id
  union all
  select i.date, i.contrat_id, i.client_id, i.bien_id,
         coalesce(i.fige_libelle, c.libelle, 'Passage ponctuel'), i.duree_prevue_h, i.id, i.statut::text,
         i.intervenant_id, iv.nom, cl.nom, bi.commune, false, i.version
    from interventions i
    left join contrats c on c.id = i.contrat_id
    left join intervenants iv on iv.id = i.intervenant_id
    left join clients cl on cl.id = i.client_id
    left join biens bi on bi.id = i.bien_id
   where i.date between p_debut and p_fin
     and not exists (
       select 1 from occurrences o
        where o.contrat_id = i.contrat_id and o.jour = i.date
     )
  order by 1, 2;
$$;

commit;
