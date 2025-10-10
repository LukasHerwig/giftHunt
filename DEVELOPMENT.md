# Supabase Development Workflow Commands

## Local Development

# Start local Supabase (what you just did)

npx supabase start

# Stop local Supabase

npx supabase stop

# Reset local database (fresh start with all migrations)

npx supabase db reset

# View local database in browser

# Go to: http://127.0.0.1:54323

## Migrations

# Create a new migration

npx supabase db diff --file new_feature_name

# Test migration locally

npx supabase db reset

# Push to production (when ready)

npx supabase db push

## Environment Switching

# Local development: Keep .env.local

# Production: Rename .env.local to .env.local.backup

## Useful

# Check status of local services

npx supabase status

# Pull latest from production to local

npx supabase db pull
