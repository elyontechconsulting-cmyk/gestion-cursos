#!/usr/bin/env bash
# Aplica el esquema y publica las Edge Functions en Supabase.
# Uso: SUPABASE_PROJECT_REF=xxxx APISPERU_TOKEN=yyyy ALLOWED_ORIGINS=https://app.vercel.app bash scripts/deploy-supabase.sh
# Requisitos: npm i -g supabase  ·  supabase login
set -euo pipefail
cd "$(dirname "$0")/.."

: "${SUPABASE_PROJECT_REF:?Defina SUPABASE_PROJECT_REF (Settings → General → Reference ID)}"

supabase link --project-ref "$SUPABASE_PROJECT_REF"

echo "▶ Aplicando migraciones…"
supabase db push

echo "▶ Configurando secretos de Edge Functions…"
if [[ -n "${APISPERU_TOKEN:-}" ]]; then supabase secrets set APISPERU_TOKEN="$APISPERU_TOKEN"; fi
if [[ -n "${ALLOWED_ORIGINS:-}" ]]; then supabase secrets set ALLOWED_ORIGINS="$ALLOWED_ORIGINS"; fi

echo "▶ Publicando funciones…"
supabase functions deploy consulta-dni
supabase functions deploy crear-usuario

echo "✔ Supabase listo."
