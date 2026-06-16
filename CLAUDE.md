# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 8080 (uses .env.local if present)
npm run dev:local    # Explicitly switch to local Supabase + start
npm run dev:prod     # Explicitly switch to production Supabase + start
npm run build        # Production build
npm run lint         # ESLint

# Supabase
npx supabase start   # Start local Docker-based Supabase
npx supabase stop
npx supabase db reset            # Wipe local DB and re-apply all migrations
npx supabase db diff --file name # Generate migration from local schema changes
npx supabase db push             # Apply migrations to production
npx supabase db pull             # Sync production schema to local
```

There is no test suite.

## Architecture

**GiftHunt** is a React 18 SPA (Vite + TypeScript) for sharing wishlists with friends. It is deployed to GitHub Pages at `/giftHunt/` and uses Supabase (PostgreSQL + Auth + RLS) as the backend.

### Feature-first directory structure

Each top-level directory under `src/` is a self-contained feature with:

- `index.tsx` — entry component (route target)
- `components/` — UI components private to the feature
- `hooks/` — state hooks (e.g. `useDashboard.ts`)
- `services/` — Supabase query functions
- `types/` — TypeScript interfaces

Features: `Dashboard`, `ManageWishlist` (owner editing items), `AdminWishlist` (admin reading/stats), `SelfManagedWishlist` (creator acting as own admin — reuses AdminWishlist components), `Auth`, `Onboarding`, `Profile`, `SharedWishlists`, `AcceptInvitation`, `PublicWishlist` (share-link view for anonymous users).

**Shared code:**

- `src/components/` — cross-feature components (AppHeader, BackButton, etc.) and `ui/` (shadcn/ui primitives)
- `src/lib/` — utilities (`cn`, `urlUtils`, `metadataUtils`, `theme`, `EmailService`, `i18n`)
- `src/contexts/` — ThemeProvider
- `src/integrations/supabase/` — typed Supabase client and auto-generated `types.ts`

### Data model (key tables)

| Table               | Purpose                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `wishlists`         | Owned by `creator_id`; has `enable_links/price/priority` config flags                         |
| `wishlist_items`    | Items with optional `link`, `price_range`, `priority`, `is_giftcard`, `is_taken`, `claim_cap` |
| `wishlist_admins`   | Many admins per wishlist (admin can see taken-by names, untake)                               |
| `admin_invitations` | Token-based invitations to become admin                                                       |
| `share_links`       | Tokens enabling public `/shared/:token` access                                                |
| `item_claims`       | Per-claimer records for gift card items (`id`, `item_id`, `claimer_name`, `claimed_at`)       |
| `profiles`          | Auth user profiles                                                                            |

### Auth flow

`AuthProvider` (`src/components/auth/AuthProvider.tsx`) wraps the router and redirects unauthenticated users to `/auth`. Public routes: `/auth`, `/accept-invitation`, `/shared/*`. After sign-in, `OnboardingService.checkIfOnboardingNeeded()` gates first-time users to `/onboarding`.

### Environments

- **Local**: `.env.local` → `http://127.0.0.1:54321` — orange "LOCAL DEVELOPMENT MODE" banner visible in app
- **Production**: `.env` → Supabase cloud — no banner

`dev:local` / `dev:prod` scripts swap the active env file before starting Vite.

### i18n

All UI strings go through `react-i18next`. Translation files: `src/locales/en.json` and `src/locales/sv.json`. Configure in `src/lib/i18n.ts`.

**Never hardcode user-facing strings in JSX.** Always use `const { t } = useTranslation()` and `t('feature.key')`.

### URL generation

**Always use `getBaseUrl()` from `src/lib/urlUtils.ts`** for any link the app generates (invitations, share links, etc.). The app is deployed to GitHub Pages under `/giftHunt/`, so hardcoded `window.location.origin` links will be wrong in production. The `VITE_APP_BASE_URL` env var sets the base in production builds.

### UI / iOS design system

The app follows an iOS-inspired design system:

- **Backgrounds**: `#000000` (main), `#1C1C1E` (secondary surfaces)
- **Accent colors**: iOS Blue `#007AFF` (primary actions), iOS Green `#34C759` (success)
- **Corner radii**: `rounded-[24px]` for cards and dialogs
- **Typography**: Bold tracking-tight headers; 17px body, 13px labels

**Responsive overlays** — use `useIsMobile()` to switch:

- Mobile → `Drawer` (bottom sheet) from `@/components/ui/drawer`
- Desktop → `Dialog` (centered modal) from `@/components/ui/dialog`

**Prevent input focus loss**: never define sub-components (e.g. `FormContent`) inside a parent component's render body. Define them at the module's top level — inline component definitions are treated as new types on every render, destroying DOM state and focus.

Action placement convention: primary actions top-right, cancel/close top-left, destructive actions full-width at the bottom.

### Gift card / multi-claim items

When `is_giftcard = true`, multiple people can claim the same item via `item_claims`. The optional `claim_cap` (integer) limits how many claims are allowed; `null` = unlimited.

- **Public view**: item shown as taken (no progress indicator) once cap is reached.
- **Admin / self-managed view**: item moves to the "taken" section when cap is reached; admins can remove individual claims one-by-one via `RemoveClaimDialog` (same sheet pattern as `UntakeItemDialog`).
- Always set `claim_cap = null` when saving a non-giftcard item.

### Admin system rules

- One admin per wishlist (enforced by DB constraint).
- Invitation workflow: creator sends invite → recipient gets email with token → acceptance creates `wishlist_admins` record + marks invitation accepted.
- Hide the invite button when an admin already exists OR a pending invitation exists.
- `SelfManagedWishlist` (`is_self_managed = true` on the wishlist) lets the creator act as their own admin with full add/edit/delete/untake/remove-claim capabilities — it reuses `AdminWishlist` components directly.

### RLS patterns

- Personal data: `auth.uid() = user_id`
- Admin access: `EXISTS (SELECT 1 FROM wishlist_admins WHERE wishlist_id = ... AND admin_id = auth.uid())`
- Avoid circular cross-table policy references — use simple `auth.uid()` checks where possible.

### Database migrations

All schema changes go in `supabase/migrations/` as timestamped SQL files. Generate via `npx supabase db diff`, not by hand. Never push directly to production without testing locally with `npx supabase db reset` first.

To sync production data into local: `./sync-remote-data.sh`.
