-- Lot 1, sixième partie — des comptes individuels.
--
-- NON APPLIQUÉE en production.
--
-- Migration **additive** : rien n'est renommé, rien n'est supprimé. La table
-- `intervenants` existe déjà et porte les affectations de passages ; on
-- l'étend plutôt que de la remplacer, pour que `interventions.intervenant_id`
-- continue de pointer au même endroit.
--
-- Ce que ce fichier corrige : jusqu'ici deux codes partagés tenaient lieu
-- d'identité. On savait qu'une consigne d'entrée avait été consultée, jamais
-- par qui. Pour une donnée qui permet d'entrer chez quelqu'un, une
-- traçabilité anonyme ne trace rien.
--
-- Choix d'authentification : **pas de mot de passe**. Un lien à usage unique
-- envoyé par courriel, valable quinze minutes. Trois raisons pour cette
-- équipe : rien à mémoriser ni à noter sur un carnet ; la révocation est
-- immédiate, il suffit de désactiver la personne ; et l'envoi de courriels
-- existe déjà, c'est celui des comptes rendus.

begin;

-- ------------------------------------------------- les personnes

alter table intervenants
  add column if not exists email        text,
  add column if not exists role         text not null default 'intervenant',
  add column if not exists desactive_le timestamptz;

-- Les rôles reconnus. La table de droits vit dans src/lib/roles.ts ; ici on
-- se contente de refuser un rôle inventé.
alter table intervenants
  drop constraint if exists intervenant_role_connu;
alter table intervenants
  add constraint intervenant_role_connu
  check (role in ('proprietaire', 'intervenant'));

-- Une adresse identifie une personne. Insensible à la casse, parce que
-- personne ne retape son adresse de la même façon deux fois.
create unique index if not exists personne_email_unique
  on intervenants (lower(email))
  where email is not null;

-- « actif » existait déjà et sert aux filtres de l'agenda ; « desactive_le »
-- dit quand le compte a été fermé. Les deux doivent rester d'accord.
create or replace function synchroniser_actif()
returns trigger language plpgsql as $$
begin
  new.actif := new.desactive_le is null;
  return new;
end;
$$;

drop trigger if exists personne_actif on intervenants;
create trigger personne_actif
  before insert or update of desactive_le on intervenants
  for each row execute function synchroniser_actif();

-- ------------------------------------------- les liens de connexion

create table if not exists connexions (
  -- On garde l'empreinte, jamais le jeton : la base volée ne donne aucun accès.
  jeton_hash  text primary key,
  personne_id uuid not null references intervenants(id) on delete cascade,
  cree_le     timestamptz not null default now(),
  expire_le   timestamptz not null,
  utilise_le  timestamptz,
  -- D'où vient la demande, pour repérer un envoi qu'on n'a pas sollicité.
  demande_de  text
);

create index if not exists connexion_par_personne on connexions (personne_id, cree_le desc);

-- ------------------------------------------------------ les sessions

-- Une table, et non un jeton autoporteur. Un jeton signé ne se révoque pas :
-- il reste valable jusqu'à son expiration, même après le départ de la
-- personne. Ici, une ligne supprimée ferme la session à la requête suivante.
create table if not exists sessions (
  jeton_hash    text primary key,
  personne_id   uuid not null references intervenants(id) on delete cascade,
  cree_le       timestamptz not null default now(),
  expire_le     timestamptz not null,
  revoque_le    timestamptz,
  dernier_acces timestamptz not null default now()
);

create index if not exists session_par_personne on sessions (personne_id, cree_le desc);

/**
 * La personne derrière un jeton de session, ou rien.
 *
 * Un seul endroit décide : expirée, révoquée, ou personne désactivée, la
 * réponse est la même — aucun accès. Rendre le rôle ici évite que chaque
 * route refasse le raisonnement à sa façon.
 */
create or replace function session_personne(p_jeton_hash text)
returns table (personne_id uuid, nom text, email text, role text)
language sql volatile as $$
  update sessions s
     set dernier_acces = now()
   where s.jeton_hash = p_jeton_hash
     and s.revoque_le is null
     and s.expire_le > now()
     and exists (
       select 1 from intervenants p
        where p.id = s.personne_id and p.desactive_le is null
     )
  returning (select p.id from intervenants p where p.id = s.personne_id),
            (select p.nom from intervenants p where p.id = s.personne_id),
            (select p.email from intervenants p where p.id = s.personne_id),
            (select p.role from intervenants p where p.id = s.personne_id);
$$;

/** Ouvre une session depuis un lien de connexion. Le lien ne sert qu'une fois. */
create or replace function ouvrir_session(
  p_lien_hash text, p_session_hash text, p_jours int default 30
) returns table (personne_id uuid, nom text, role text)
language plpgsql as $$
declare c connexions; p intervenants;
begin
  update connexions
     set utilise_le = now()
   where jeton_hash = p_lien_hash
     and utilise_le is null
     and expire_le > now()
   returning * into c;

  if c.jeton_hash is null then
    raise exception 'Lien de connexion invalide ou déjà utilisé.' using errcode = 'PT401';
  end if;

  select * into p from intervenants where id = c.personne_id;
  if p.desactive_le is not null then
    raise exception 'Ce compte est désactivé.' using errcode = 'PT403';
  end if;

  insert into sessions (jeton_hash, personne_id, expire_le)
  values (p_session_hash, p.id, now() + make_interval(days => p_jours));

  return query select p.id, p.nom, p.role;
end;
$$;

/**
 * Ferme les sessions d'une personne.
 *
 * Appelée à la désactivation d'un compte : sans cela, la personne partie
 * garderait un accès valable trente jours.
 */
create or replace function revoquer_sessions(p_personne_id uuid)
returns int language sql as $$
  with ferme as (
    update sessions set revoque_le = now()
     where personne_id = p_personne_id and revoque_le is null
    returning 1
  )
  select count(*)::int from ferme;
$$;

create or replace function desactiver_personne(p_personne_id uuid)
returns intervenants language plpgsql as $$
declare p intervenants;
begin
  update intervenants set desactive_le = now()
   where id = p_personne_id and desactive_le is null
   returning * into p;
  if p.id is null then
    raise exception 'Personne introuvable ou déjà désactivée.' using errcode = 'PT409';
  end if;
  perform revoquer_sessions(p_personne_id);
  return p;
end;
$$;

-- ------------------------------------- la trace, enfin nominative

alter table acces_revelations
  add column if not exists personne_id uuid references intervenants(id) on delete set null;

comment on column acces_revelations.par is
  'Ancien champ libre, conservé pour l''historique. Les consultations nouvelles renseignent personne_id.';

create index if not exists acces_par_personne
  on acces_revelations (personne_id, le desc);

/**
 * Enregistre la consultation d'une consigne d'entrée, au nom de quelqu'un.
 *
 * La trace est posée **avant** que la consigne ne parte. Si elle échouait
 * après coup, on aurait servi un secret sans savoir à qui.
 */
create or replace function tracer_acces(p_bien_id uuid, p_personne_id uuid)
returns acces_revelations language plpgsql as $$
declare t acces_revelations;
begin
  if p_personne_id is null then
    raise exception 'Une consultation de consigne doit être attribuable.' using errcode = 'PT403';
  end if;
  insert into acces_revelations (bien_id, personne_id, par)
  values (p_bien_id, p_personne_id,
          coalesce((select nom from intervenants where id = p_personne_id), 'inconnu'))
  returning * into t;
  return t;
end;
$$;

alter table connexions enable row level security;
alter table sessions   enable row level security;

commit;
