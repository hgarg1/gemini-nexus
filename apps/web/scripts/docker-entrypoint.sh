#!/bin/sh
set -e

if [ "$RUN_PROD_SCRIPTS" = "true" ]; then
  echo "Running production scripts..."
  
  echo "Applying database migrations..."
  # Use prisma db push to sync schema with database. 
  # In a strict production env, 'migrate deploy' is better, but 'db push' is safer if migrations folder is missing.
  npx prisma db push --schema=packages/database/prisma/schema.prisma --skip-generate

  echo "Seeding admin..."
  if [ -f apps/web/scripts/seed-admin.js ]; then
    node apps/web/scripts/seed-admin.js || echo "seed-admin.js failed."
  else
     echo "seed-admin.js not found, skipping."
  fi

  echo "Seeding RBAC..."
  if [ -f apps/web/scripts/seed-rbac.js ]; then
    node apps/web/scripts/seed-rbac.js || echo "seed-rbac.js failed."
  else
     echo "seed-rbac.js not found, skipping."
  fi

  echo "Fixing admin permissions..."
  if [ -f apps/web/scripts/fix-admin-perms.js ]; then
    node apps/web/scripts/fix-admin-perms.js || echo "fix-admin-perms.js failed."
  else
     echo "fix-admin-perms.js not found, skipping."
  fi
fi

# Execute the main container command
exec "$@"
