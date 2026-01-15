#!/bin/sh
set -e

if [ "$RUN_PROD_SCRIPTS" = "true" ]; then
  echo "Running production scripts..."
  
  echo "Applying database migrations..."
  # Use prisma db push to sync schema with database. 
  # In a strict production env, 'migrate deploy' is better, but 'db push' is safer if migrations folder is missing.
  npx prisma db push --schema=packages/database/prisma/schema.prisma

  echo "Seeding admin..."
  node apps/web/scripts/seed-admin.js || echo "seed-admin.js not found, skipping or failed."
fi

# Execute the main container command
exec "$@"
