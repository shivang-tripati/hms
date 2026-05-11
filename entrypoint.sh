#!/bin/sh
set -e

echo "Waiting for database to be ready..."

# Wait for DB connectivity first, before attempting migrate
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => { client.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done

echo "Database is ready. Running migrations..."
./node_modules/.bin/prisma migrate deploy



echo "Starting Next.js server..."
exec node server.js