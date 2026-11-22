#!/usr/bin/env bash
# Reconstruit la base de recette : schéma neuf, migrations, jeu d'essai.
#
# On reconstruit plutôt qu'on n'efface, et ce n'est pas un détail : le
# déclencheur qui fige une facture émise refuse aussi la suppression de ses
# lignes. C'est voulu — une pièce comptable ne s'efface pas — mais cela
# interdit de « vider les tables » entre deux recettes.
#
#   scripts/base-de-test.sh [hôte] [port]
set -euo pipefail

export PATH=/usr/lib/postgresql/16/bin:$PATH
export PGHOST="${1:-127.0.0.1}" PGPORT="${2:-5433}" PGUSER=postgres

racine="$(cd "$(dirname "$0")/.." && pwd)"

psql -q -c 'drop schema public cascade; create schema public;'

# Les deux tables déjà en production, reconstituées à l'identique pour que les
# clés étrangères des migrations aient de quoi s'accrocher.
psql -q -v ON_ERROR_STOP=1 <<'SQL'
create table clients (
  id uuid primary key default gen_random_uuid(), nom text not null, email text,
  telephone text, commune text, type text default 'particulier', mode text,
  adresse text, notes text, actif boolean default true,
  cree_le timestamptz default now(), maj_le timestamptz default now());
create table biens (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  libelle text not null, adresse text, commune text, surface int, chambres int,
  salles_de_bains int, wc int, pieces_vie int, lits int,
  cuisine_equipee boolean default false, usage text,
  caracteristiques text[] default '{}', prestations jsonb default '[]',
  frequence text, duree_h numeric, acces text, particularites text, notes text,
  km int, cree_le timestamptz default now());
create table demandes (
  id uuid primary key default gen_random_uuid(), recu_le timestamptz default now(),
  client_id uuid references clients(id) on delete set null,
  nom text not null, email text not null, telephone text, commune text,
  type_client text, logement text, surface int, chambres int, salles_de_bains int,
  frequence text, besoin text, score int, priorite text,
  raisons text[] default '{}', page text, utm jsonb default '{}',
  statut text default 'nouveau', suivi text);
create table devis (
  id uuid primary key default gen_random_uuid(), cree_le timestamptz default now(),
  numero text, client_id uuid references clients(id) on delete set null,
  client_nom text, client_email text, bien_id uuid references biens(id) on delete set null,
  prestation text, lignes jsonb default '[]', total_ttc numeric default 0,
  statut text default 'brouillon', envoye_le timestamptz, notes text,
  mode text, frequence text, validite_jours int);
create table reglages (
  cle text primary key, valeur jsonb not null default '{}');
SQL

for f in "$racine"/supabase/migrations/*.sql; do
  psql -q -v ON_ERROR_STOP=1 -f "$f"
done

psql -q -v ON_ERROR_STOP=1 -f "$racine/supabase/tests/semence.sql"
echo "base de recette prête"
