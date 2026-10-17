#!/usr/bin/env bash
# Despliegue del frontend en Vercel.
# Uso: bash scripts/deploy-vercel.sh [--prod]
# Requisitos: npm i -g vercel  ·  vercel login  ·  vercel link (una vez)
set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="preview"
[[ "${1:-}" == "--prod" ]] && TARGET="production"

command -v vercel >/dev/null || { echo "Instale Vercel CLI: npm i -g vercel"; exit 1; }

echo "▶ Verificando tipos y compilando localmente…"
npm ci
npm run typecheck
npm run build

echo "▶ Variables requeridas en Vercel ($TARGET): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY"
for v in VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY; do
  if ! vercel env ls "$TARGET" 2>/dev/null | grep -q "$v"; then
    echo "  ⚠ Falta $v. Agréguela con: vercel env add $v $TARGET"
  fi
done

echo "▶ Desplegando ($TARGET)…"
if [[ "$TARGET" == "production" ]]; then
  vercel pull --yes --environment=production
  vercel build --prod
  vercel deploy --prebuilt --prod
else
  vercel pull --yes --environment=preview
  vercel build
  vercel deploy --prebuilt
fi
echo "✔ Listo. Agregue la URL final a ALLOWED_ORIGINS (Edge Functions) y a Auth → URL Configuration en Supabase."
