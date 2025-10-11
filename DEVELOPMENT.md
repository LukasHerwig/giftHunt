# Wishlist App Development Workflow

## Overview

This project uses Supabase for the database with a local development setup for safe testing before deploying to production.

## Environment Setup

### Local Development Environment

- **Database**: Local Supabase Docker container
- **URL**: `http://127.0.0.1:54321`
- **Studio**: `http://127.0.0.1:54323`
- **Environment file**: `.env.local`

### Production Environment

- **Database**: Cloud Supabase
- **URL**: `https://pjiofxvhzcengexymoms.supabase.co`
- **Environment file**: `.env`

## Complete Development Workflow

### 1. Starting a New Feature

```bash
# 1. Create a new feature branch
git checkout -b feature/your-feature-name

# 2. Start local Supabase (if not running)
npx supabase start

# 3. Ensure you're using local environment
# Make sure .env.local exists and contains local Supabase settings

# 4. Start development server
npm run dev
```

You should see the orange banner "🚧 LOCAL DEVELOPMENT MODE" on your app.

### 2. Making Database Changes

When you need to modify the database schema:

```bash
# 1. Make changes to your database using either:
#    - Local Supabase Studio (http://127.0.0.1:54323)
#    - Direct SQL commands
#    - App functionality that modifies schema

# 2. Generate a migration file from your changes
npx supabase db diff --file your_feature_name

# 3. Review the generated migration file
# Check: supabase/migrations/[timestamp]_your_feature_name.sql

# 4. Test the migration by resetting local database
npx supabase db reset

# 5. Verify everything works in your app
npm run dev
```

### 3. Testing Your Changes

```bash
# Reset local database to test clean migration
npx supabase db reset

# Test your app thoroughly
npm run dev

# Check local database state
# Visit: http://127.0.0.1:54323
```

### 4. Deploying to Production

When you're satisfied with your changes:

```bash
# 1. Switch to production environment
mv .env.local .env.local.backup

# 2. Push migrations to production
npx supabase db push

# 3. Test production deployment
npm run dev
# (Should now connect to production - no orange banner)

# 4. If everything works, commit your changes
git add .
git commit -m "Add your feature"
git push origin feature/your-feature-name

# 5. Switch back to local development
mv .env.local.backup .env.local
```

### 5. Merging to Main

```bash
# 1. Create pull request
# 2. After review and merge to main
git checkout main
git pull origin main

# 3. Sync local database with latest production state
npx supabase db pull
npx supabase db reset
```

## Essential Commands

### Database Management

```bash
# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop

# Check status of all services
npx supabase status

# Reset local database (applies all migrations)
npx supabase db reset

# Pull latest schema from production
npx supabase db pull
```

### Migration Commands

```bash
# Create new migration from database changes
npx supabase db diff --file feature_name

# Apply migrations to production
npx supabase db push

# View migration status
npx supabase migration list
```

### Environment Switching

```bash
# Switch to LOCAL development
mv .env.local.backup .env.local 2>/dev/null || echo "Already using local"

# Switch to PRODUCTION
mv .env.local .env.local.backup 2>/dev/null || echo "Already using production"
```

## How to Know Which Environment You're Using

### Visual Indicator

- **Local**: Orange banner "🚧 LOCAL DEVELOPMENT MODE" at top of app
- **Production**: No banner

### Browser Console Check

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
// Local: http://127.0.0.1:54321
// Production: https://pjiofxvhzcengexymoms.supabase.co
```

### Network Tab

Check browser dev tools - API calls should go to:

- **Local**: `127.0.0.1:54321`
- **Production**: `pjiofxvhzcengexymoms.supabase.co`

## Troubleshooting

### Sync Issues

If your local database gets out of sync:

```bash
npx supabase db pull
npx supabase db reset
```

### Migration Conflicts

If migrations conflict:

```bash
# Reset to clean state
npx supabase db reset

# Re-create your changes
npx supabase db diff --file fixed_feature_name
```

### Environment Issues

If unsure which environment you're using:

```bash
# Force switch to local
cp .env.local.example .env.local
# (Make sure .env.local contains local Supabase settings)

# Force switch to production
rm .env.local
```

## Safety Rules

1. **Always test locally first** - Never push migrations directly to production
2. **Keep .env.local for local development** - Only remove when deploying
3. **Use feature branches** - Never develop directly on main
4. **Reset local database regularly** - Ensures clean migration testing
5. **Pull before new features** - Keep local database synced with production

## File Structure

```
├── .env                     # Production environment variables
├── .env.local              # Local environment variables (when developing)
├── .env.local.backup       # Backup of local env (when using production)
├── supabase/
│   ├── config.toml        # Supabase configuration
│   └── migrations/        # All database migrations
├── src/
│   └── integrations/
│       └── supabase/      # Supabase client configuration
└── DEVELOPMENT.md         # This file
```
