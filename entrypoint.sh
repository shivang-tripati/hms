#!/bin/sh
set -e

echo "Waiting for database..."

until ./node_modules/.bin/prisma migrate deploy; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done

echo "Starting Next.js server..."
exec node server.js