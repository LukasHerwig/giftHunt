#!/bin/bash

# Sync remote data to local Supabase instance
echo "🔄 Syncing remote data to local database..."

# 1. Start local Supabase (if not already running)
echo "Starting local Supabase..."
npx supabase start

# 2. Reset local database with latest migrations
echo "Resetting local database with latest migrations..."
npx supabase db reset

# 3. Dump data from remote database
echo "Dumping data from remote database..."
npx supabase db dump --data-only -f remote_data.sql

# 4. Import data to local database
echo "Importing data to local database..."
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f remote_data.sql

# 5. Clean up the dump file
rm remote_data.sql

echo "✅ Sync complete! Your local database now has the latest schema and remote data."
echo "🚀 Run 'npm run dev' to start developing with real data!"