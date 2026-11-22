-- Lot 1, cinquième partie — les codes d'erreur, corrigés par la recette.
--
-- NON APPLIQUÉE en production.
--
-- Ce que la recette avec le vrai PostgREST a révélé, et que la doublure
-- masquait :
--
-- 1. **Le code 40001 était un piège.** Je l'avais choisi pour « conflit »
--    parce qu'il s'appelle serialization_failure et que le nom allait bien.
--    Or PostgreSQL et tout l'outillage autour lui donnent un sens précis :
--    « ta transaction a échoué pour une raison transitoire, recommence ».
--    PostgREST applique donc sa politique de reprise, et la requête ne
--    revient jamais. Vérifié : aucune réponse après quinze secondes, et la
--    requête n'apparaît même pas dans son journal.
--
-- 2. **Les exceptions métier sortaient en 500.** PostgREST traduit P0001 et
--    P0002 en « erreur serveur », ce qui est exact du point de vue de
--    PostgreSQL — une exception non prévue — et faux du nôtre : un passage
--    déjà clos n'est pas une panne.
--
-- La solution tient dans une convention de PostgREST : un SQLSTATE de la
-- forme PTxyz devient le statut HTTP xyz. On s'en sert pour dire ce que l'on
-- veut vraiment dire.
--
--   PT404 — l'objet n'existe pas
--   PT409 — l'état actuel interdit l'opération, ou une autre est passée avant
--   PT422 — la demande est mal formée
--
-- Les messages, eux, ne changent pas : ils étaient déjà écrits pour l'écran.

begin;

-- ------------------------------------------------------------- le conflit

create or replace function conflit(p_attendue int, p_reelle int, p_maj timestamptz)
returns void language plpgsql as $$
begin
  -- PT409, et non 40001 : 40001 veut dire « recommence », et le client
  -- recommencerait sans fin une opération qui ne passera jamais.
  raise exception using
    errcode = 'PT409',
    message = 'Ce passage a été modifié ailleurs.',
    detail = json_build_object(
      'attendue', p_attendue, 'reelle', p_reelle,
      'modifie_le', to_char(p_maj at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )::text;
end;
$$;

-- -------------------------------------------- les opérations, recodées

create or replace function clore_intervention(
  p_id uuid, p_debut time, p_fin time, p_checklist jsonb, p_observations text,
  p_km int, p_version int default null
) returns interventions language plpgsql as $$
declare i interventions; c contrats;
begin
  select * into i from interventions where id = p_id for update;
  if i.id is null then
    raise exception 'Passage introuvable.' using errcode = 'PT404';
  end if;

  if p_version is not null and p_version <> i.version then
    perform conflit(p_version, i.version, i.maj_le);
  end if;

  if i.statut not in ('planifiee', 'en_cours', 'reportee') then
    raise exception 'Passage déjà clos ou annulé (%).', i.statut using errcode = 'PT409';
  end if;

  select * into c from contrats where id = i.contrat_id;
  if c.id is null then
    raise exception 'Aucun contrat sur ce passage : impossible de figer les conditions.'
      using errcode = 'PT409';
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
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'PT404'; end if;
  if p_version is not null and p_version <> i.version then
    perform conflit(p_version, i.version, i.maj_le);
  end if;
  if i.statut = 'faite' then
    raise exception 'Un passage réalisé ne se déplace pas.' using errcode = 'PT409';
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

create or replace function annuler_intervention(p_id uuid, p_motif text, p_version int default null)
returns interventions language plpgsql as $$
declare i interventions;
begin
  select * into i from interventions where id = p_id for update;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'PT404'; end if;
  if p_version is not null and p_version <> i.version then
    perform conflit(p_version, i.version, i.maj_le);
  end if;
  if i.statut = 'faite' then
    raise exception 'Un passage réalisé ne s''annule pas. Passer par un avoir si déjà facturé.'
      using errcode = 'PT409';
  end if;

  update interventions
     set statut = 'annulee',
         observations = trim(both e'\n' from observations || e'\n' || 'Annulé : ' || coalesce(p_motif, 'sans motif'))
   where id = p_id
   returning * into i;

  if i.contrat_id is not null then
    insert into contrat_exceptions (contrat_id, jour, genre, motif)
    values (i.contrat_id, i.date, 'supprimee', p_motif)
    on conflict (contrat_id, jour) do update set genre = 'supprimee', nouveau_jour = null;
  end if;
  return i;
end;
$$;

create or replace function poser_intervention(
  p_client_id uuid, p_bien_id uuid, p_contrat_id uuid, p_jour date,
  p_debut time, p_duree numeric, p_intervenant_id uuid
) returns interventions language plpgsql as $$
declare i interventions;
begin
  if exists (
    select 1 from interventions
     where bien_id = p_bien_id and date = p_jour and statut <> 'annulee'
  ) then
    raise exception 'Un passage est déjà prévu ce jour-là sur ce bien.' using errcode = 'PT409';
  end if;

  insert into interventions (client_id, bien_id, contrat_id, date, debut, duree_prevue_h, intervenant_id)
  values (p_client_id, p_bien_id, p_contrat_id, p_jour, p_debut, coalesce(p_duree, 2), p_intervenant_id)
  returning * into i;
  return i;
end;
$$;

create or replace function etablir_compte_rendu(p_intervention_id uuid, p_destinataires text[])
returns comptes_rendus language plpgsql as $$
declare cr comptes_rendus; i interventions;
begin
  select * into i from interventions where id = p_intervention_id;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'PT404'; end if;
  if i.statut <> 'faite' then
    raise exception 'Le passage n''est pas terminé.' using errcode = 'PT409';
  end if;

  select * into cr from comptes_rendus where intervention_id = p_intervention_id;
  if cr.id is not null then return cr; end if;

  insert into comptes_rendus (intervention_id, client_id, statut, destinataires)
  values (p_intervention_id, i.client_id, 'valide', coalesce(p_destinataires, '{}'))
  returning * into cr;
  return cr;
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
    raise exception 'Compte rendu introuvable ou déjà envoyé.' using errcode = 'PT409';
  end if;
  return cr;
end;
$$;

create or replace function facturer_intervention(p_intervention_id uuid)
returns factures language plpgsql as $$
declare i interventions; f factures; s supplements; rang int := 0; montant numeric;
begin
  select * into i from interventions where id = p_intervention_id;
  if i.id is null then raise exception 'Passage introuvable.' using errcode = 'PT404'; end if;
  if i.fige_base is null then
    raise exception 'Les conditions du passage ne sont pas figées : clore le passage d''abord.'
      using errcode = 'PT409';
  end if;

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

create or replace function emettre_facture(p_facture_id uuid, p_echeance_jours int default 30)
returns factures language plpgsql as $$
declare f factures;
begin
  select * into f from factures where id = p_facture_id for update;
  if f.id is null then raise exception 'Facture introuvable.' using errcode = 'PT404'; end if;
  if f.statut <> 'brouillon' then
    raise exception 'Facture déjà émise (%).', f.statut using errcode = 'PT409';
  end if;
  if not exists (select 1 from facture_lignes where facture_id = f.id) then
    raise exception 'Facture sans ligne.' using errcode = 'PT422';
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

create or replace function enregistrer_paiement(
  p_facture_id uuid, p_date date, p_montant numeric, p_moyen text
) returns factures language plpgsql as $$
declare f factures; total numeric; paye numeric;
begin
  select * into f from factures where id = p_facture_id for update;
  if f.id is null then raise exception 'Facture introuvable.' using errcode = 'PT404'; end if;
  if f.statut = 'brouillon' then
    raise exception 'Une facture non émise ne reçoit pas de paiement.' using errcode = 'PT409';
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

-- Les déclencheurs aussi : leurs refus ne sont pas des pannes.
create or replace function verifier_facturable()
returns trigger language plpgsql as $$
declare s statut_intervention; a_cr boolean;
begin
  if new.intervention_id is null then return new; end if;

  select statut into s from interventions where id = new.intervention_id;
  if s is distinct from 'faite' then
    raise exception 'Le passage % n''est pas terminé (statut : %).', new.intervention_id, s
      using errcode = 'PT409';
  end if;

  select exists (select 1 from comptes_rendus where intervention_id = new.intervention_id) into a_cr;
  if not a_cr then
    raise exception 'Le passage % n''a pas de compte rendu.', new.intervention_id
      using errcode = 'PT409';
  end if;
  return new;
end;
$$;

create or replace function facture_verrouillee()
returns trigger language plpgsql as $$
declare st statut_facture;
begin
  select statut into st from factures where id = coalesce(new.facture_id, old.facture_id);
  if st is distinct from 'brouillon' then
    raise exception 'Facture non modifiable : elle est %. Passer par un avoir.', st
      using errcode = 'PT409';
  end if;
  return coalesce(new, old);
end;
$$;

commit;
