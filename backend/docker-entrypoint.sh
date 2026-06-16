#!/bin/sh
set -e

echo "==> Aplicando migraciones de base de datos..."
pnpm exec prisma migrate deploy

echo "==> Verificando datos esenciales (superadmin, catálogos)..."
pnpm exec ts-node prisma/seed-deploy.ts

echo "==> Iniciando aplicación..."
exec node dist/main
