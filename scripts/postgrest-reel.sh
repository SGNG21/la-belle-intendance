#!/usr/bin/env bash
# Démarre le VRAI PostgREST contre la base de recette.
#
# La doublure (postgrest-de-test.mjs) reste pour les essais rapides : elle
# démarre en une seconde et n'exige rien. Ce script-ci sert au niveau de
# recette supérieur, celui qui engage la compatibilité.
#
# PostgREST est obtenu par nix, qui le sert depuis son cache binaire :
#   nix build 'nixpkgs#postgrest' --out-link /tmp/pgrst-nix
#
#   scripts/postgrest-reel.sh [port] [port-postgres]
set -euo pipefail

PORT="${1:-54322}"
PGPORT="${2:-5433}"
BIN="${POSTGREST_BIN:-/tmp/pgrst-nix-bin/bin/postgrest}"

if [ ! -x "$BIN" ]; then
  echo "PostgREST introuvable. Le construire :" >&2
  echo "  nix build 'nixpkgs#postgrest' --out-link /tmp/pgrst-nix" >&2
  exit 1
fi

conf="$(mktemp)"
cat > "$conf" <<CONF
db-uri = "postgres://postgres@127.0.0.1:${PGPORT}/postgres"
db-schemas = "public"
# Le rôle anonyme est volontairement un rôle SANS droits : c'est ainsi qu'on
# vérifie que la sécurité niveau ligne tient. Le rôle de service, lui, passe
# par l'en-tête d'authentification, comme chez Supabase.
db-anon-role = "anonyme"
server-port = ${PORT}
server-host = "127.0.0.1"
jwt-secret = "recette-locale-secret-de-32-caracteres-minimum"
db-pool = 4
CONF

echo "config : $conf"
exec "$BIN" "$conf"
