-- Lot 1 — contrats, interventions, comptes rendus, factures.
--
-- NON APPLIQUÉE. À relire puis à passer d'abord sur une branche Supabase,
-- jamais directement sur la base de production.
--
-- Principe : les garanties du brief — pas de double envoi, pas de double
-- facturation — sont tenues ICI, par des contraintes, et non par les écrans.
-- Un écran se contourne avec un second onglet ; une contrainte d'unicité, non.
--
-- Comme le reste du projet : RLS active, aucune politique. Rien n'est lisible
-- sans la clé de service, qui ne quitte pas le serveur.

begin;

-- ---------------------------------------------------------------- contrats

create type base_tarifaire as enum ('forfait', 'horaire', 'abonnement');

create table contrats (
  id                  uuid primary key default gen_random_uuid(),
  cree_le             timestamptz not null default now(),
  client_id           uuid not null references clients(id) on delete cascade,
  bien_id             uuid not null references biens(id) on delete cascade,
  base                base_tarifaire not null,
  libelle             text not null,

  forfait_ht          numeric(10,2),
  taux_horaire_ht     numeric(10,2),
  heures_convenues    numeric(5,2),
  abonnement_ht       numeric(10,2),
  abonnement_periode  text check (abonnement_periode in ('mois', 'trimestre')),
  passages_inclus     int,

  tva                 numeric(4,3) not null default 0,
  debut               date not null,
  fin                 date,

  -- Chaque base exige ses champs et interdit les autres. Un contrat « forfait »
  -- qui porterait un taux horaire serait une ambiguïté sur le prix : refusée.
  constraint contrat_coherent check (
    case base
      when 'forfait'    then forfait_ht is not null
                         and taux_horaire_ht is null and heures_convenues is null
                         and abonnement_ht is null
      when 'horaire'    then taux_horaire_ht is not null and heures_convenues is not null
                         and forfait_ht is null and abonnement_ht is null
      when 'abonnement' then abonnement_ht is not null and abonnement_periode is not null
                         and forfait_ht is null
    end
  ),
  constraint contrat_dates check (fin is null or fin > debut)
);

-- Un seul contrat actif par bien à un instant donné : sinon on ne sait plus
-- quel prix s'applique.
create unique index contrat_actif_unique
  on contrats (bien_id)
  where fin is null;

-- ----------------------------------------------------------- interventions

create type statut_intervention as enum ('planifiee', 'en_cours', 'faite', 'annulee', 'reportee');

create table interventions (
  id               uuid primary key default gen_random_uuid(),
  cree_le          timestamptz not null default now(),
  client_id        uuid not null references clients(id) on delete restrict,
  bien_id          uuid not null references biens(id) on delete restrict,
  contrat_id       uuid references contrats(id) on delete set null,

  date             date not null,
  debut            time,
  fin              time,
  duree_prevue_h   numeric(4,2) not null,
  statut           statut_intervention not null default 'planifiee',

  checklist        jsonb not null default '[]'::jsonb,
  observations     text not null default '',
  photos_autorisees boolean not null default false,
  km               int,

  constraint intervention_horaires check (fin is null or debut is null or fin > debut)
);

create index intervention_par_date on interventions (date desc);
create index intervention_par_client on interventions (client_id, date desc);

-- Le temps réellement passé, calculé et jamais saisi deux fois.
-- Il sert à la marge. Aucune facture ne le lit : c'est le contrat qui dit le prix.
create or replace function duree_reelle_h(i interventions)
returns numeric language sql immutable as $$
  select case when i.debut is null or i.fin is null then null
              else round(extract(epoch from (i.fin - i.debut)) / 3600.0, 2) end
$$;

-- --------------------------------------------------------------- suppléments

create table supplements (
  id               uuid primary key default gen_random_uuid(),
  intervention_id  uuid not null references interventions(id) on delete cascade,
  libelle          text not null,
  montant_ht       numeric(10,2),
  heures           numeric(5,2),
  taux_horaire_ht  numeric(10,2),

  -- L'approbation du client. Sans elle, le supplément ne sera pas facturé.
  approuve_par     text,
  approuve_le      timestamptz,
  approuve_canal   text check (approuve_canal in ('sms', 'email', 'oral', 'ecrit')),

  -- Un supplément se chiffre au montant OU au temps, jamais aux deux.
  constraint supplement_chiffrage check (
    (montant_ht is not null and heures is null and taux_horaire_ht is null)
    or (montant_ht is null and heures is not null and taux_horaire_ht is not null)
  ),
  -- Une approbation est entière ou absente : « approuvé par personne » n'existe pas.
  constraint supplement_approbation check (
    (approuve_par is null and approuve_le is null and approuve_canal is null)
    or (approuve_par is not null and approuve_le is not null and approuve_canal is not null)
  )
);

-- ------------------------------------------------------------ comptes rendus

create type statut_cr as enum ('brouillon', 'valide', 'envoye');

create table comptes_rendus (
  id               uuid primary key default gen_random_uuid(),
  -- VERROU 1 : un passage ne produit qu'un compte rendu.
  intervention_id  uuid not null unique references interventions(id) on delete cascade,
  client_id        uuid not null references clients(id) on delete restrict,
  statut           statut_cr not null default 'brouillon',
  cree_le          timestamptz not null default now(),
  valide_le        timestamptz,
  envoye_le        timestamptz,
  destinataires    text[] not null default '{}',
  -- Empreinte du contenu au moment de l'envoi : si le texte change ensuite,
  -- l'écran peut dire « modifié depuis l'envoi » au lieu de laisser croire que
  -- le client a lu ce qui est affiché.
  empreinte_envoyee text,

  constraint cr_envoi_coherent check (
    (statut = 'envoye') = (envoye_le is not null)
  )
);

-- ----------------------------------------------------------------- factures

create type statut_facture as enum ('brouillon', 'emise', 'envoyee', 'payee', 'retard', 'avoir');

create table factures (
  id             uuid primary key default gen_random_uuid(),
  cree_le        timestamptz not null default now(),
  client_id      uuid not null references clients(id) on delete restrict,
  statut         statut_facture not null default 'brouillon',

  -- VERROU 2 : un numéro n'existe qu'à l'émission, est unique, et ne se réutilise jamais.
  numero         text unique,
  date_emission  date,
  date_echeance  date,
  tva            numeric(4,3) not null default 0,
  envoye_le      timestamptz,
  -- Référence chez l'éditeur de facturation, si l'on délègue la pièce légale.
  ref_externe    text,

  constraint facture_numero_a_emission check (
    (statut = 'brouillon') = (numero is null)
  )
);

create table facture_lignes (
  id              uuid primary key default gen_random_uuid(),
  facture_id      uuid not null references factures(id) on delete cascade,
  rang            int not null,
  libelle         text not null,
  detail          text not null default '',
  quantite        numeric(10,2),
  unite           text,
  pu_ht           numeric(10,2),
  montant_ht      numeric(10,2) not null,

  -- Le rattachement au passage facturé.
  intervention_id uuid references interventions(id) on delete restrict,
  supplement_id   uuid references supplements(id) on delete restrict,

  unique (facture_id, rang)
);

-- VERROU 3 : un passage ne peut figurer que sur une seule ligne de facture,
-- donc sur une seule facture. C'est la garantie contre la double facturation,
-- et elle est en base : aucun écran, aucun second onglet, aucune reprise de
-- workflow n8n ne peut la contourner.
create unique index ligne_un_seul_passage
  on facture_lignes (intervention_id)
  where intervention_id is not null;

create unique index ligne_un_seul_supplement
  on facture_lignes (supplement_id)
  where supplement_id is not null;

create table paiements (
  id          uuid primary key default gen_random_uuid(),
  facture_id  uuid not null references factures(id) on delete cascade,
  date        date not null,
  montant     numeric(10,2) not null check (montant > 0),
  moyen       text not null check (moyen in ('virement', 'cheque', 'especes', 'cesu'))
);

-- ------------------------------------------------- idempotence des envois

-- VERROU 4 : le double envoi.
-- Toute action qui sort du système — e-mail au client, appel à l'éditeur de
-- facturation — insère d'abord sa clé ici. Un second appel identique viole
-- l'unicité et n'a donc aucun effet. C'est ce qui protège du double clic, du
-- second onglet et du rejeu d'un workflow n8n, ce qu'aucune règle d'affichage
-- ne peut faire.
create table envois (
  cle         text primary key,
  objet       text not null,
  objet_id    uuid,
  effectue_le timestamptz not null default now(),
  resultat    jsonb
);

-- -------------------------------------------- traçabilité des accès logement

-- Qui a consulté les consignes d'entrée, et quand. Le contenu lui-même n'est
-- jamais recopié ici : on trace la consultation, pas le secret.
create table acces_revelations (
  id       uuid primary key default gen_random_uuid(),
  bien_id  uuid not null references biens(id) on delete cascade,
  par      text not null,
  le       timestamptz not null default now()
);

create index acces_revelations_par_bien on acces_revelations (bien_id, le desc);

-- ------------------------------------------------------- règles de cohérence

-- On ne facture pas un passage qui n'est pas terminé, ni un passage dont le
-- compte rendu n'est pas établi. Vérifié à l'insertion de la ligne, côté base.
create or replace function verifier_facturable()
returns trigger language plpgsql as $$
declare
  s statut_intervention;
  a_cr boolean;
begin
  if new.intervention_id is null then
    return new;
  end if;

  select statut into s from interventions where id = new.intervention_id;
  if s is distinct from 'faite' then
    raise exception 'Le passage % n''est pas terminé (statut : %).', new.intervention_id, s;
  end if;

  select exists (select 1 from comptes_rendus where intervention_id = new.intervention_id)
    into a_cr;
  if not a_cr then
    raise exception 'Le passage % n''a pas de compte rendu.', new.intervention_id;
  end if;

  return new;
end;
$$;

create trigger ligne_facturable
  before insert or update on facture_lignes
  for each row execute function verifier_facturable();

-- Une facture émise ne se modifie plus : ni ses lignes, ni son numéro, ni sa
-- date. Une correction passe par un avoir, comme le veut la règle comptable.
create or replace function facture_verrouillee()
returns trigger language plpgsql as $$
declare
  st statut_facture;
begin
  select statut into st from factures
   where id = coalesce(new.facture_id, old.facture_id);
  if st is distinct from 'brouillon' then
    raise exception 'Facture non modifiable : elle est %. Passer par un avoir.', st;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger lignes_figees
  before insert or update or delete on facture_lignes
  for each row execute function facture_verrouillee();

-- ------------------------------------------------------------------- RLS

alter table contrats           enable row level security;
alter table interventions      enable row level security;
alter table supplements        enable row level security;
alter table comptes_rendus     enable row level security;
alter table factures           enable row level security;
alter table facture_lignes     enable row level security;
alter table paiements          enable row level security;
alter table envois             enable row level security;
alter table acces_revelations  enable row level security;

commit;
