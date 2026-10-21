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
npm run test:unit    # Unit tests for pure logic (node:test, needs Node 22.18+)

# Supabase
npx supabase start   # Start local Docker-based Supabase
npx supabase stop
npx supabase db reset            # Wipe local DB and re-apply all migrations
npx supabase db diff --file name # Generate migration from local schema changes
npx supabase db push             # Apply migrations to production
npx supabase db pull             # Sync production schema to local
```

There is no frontend test suite. Database RLS and RPC tests (pgTAP) live in `supabase/tests/`: `npm run test:db` (needs the local stack: `npx supabase start`, then `npx supabase db reset`).

## Architecture

**GiftHunt** is a React 18 SPA (Vite + TypeScript) for sharing wishlists with friends. It is deployed to GitHub Pages at `/giftHunt/` and uses Supabase (PostgreSQL + Auth + RLS) as the backend.

### Feature-first directory structure

Each top-level directory under `src/` is a self-contained feature with:

- `index.tsx` — entry component (route target)
- `components/` — UI components private to the feature
- `hooks/` — state hooks (e.g. `useHome.ts`)
- `services/` — Supabase query functions
- `types/` — TypeScript interfaces

Features: `Home` (`/`: invitations, my lists, lists I organize, new list), `Wishlist` (`/wishlist/:id`: one screen that adapts to the viewer: the owner, an invited organizer, or the creator of a self-managed list), `Auth` (`/auth`: sign in / sign up), `Onboarding` (first-time name), `Profile` (`/profile`: name, theme, language, sign out), `AcceptInvitation` (`/accept-invitation?token=…`: accepts directly when signed in), `PublicWishlist` (share-link view for anonymous users).

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

`AuthProvider` (`src/components/auth/AuthProvider.tsx`) wraps the router and redirects unauthenticated users to `/auth`. Public routes: `/auth`, `/accept-invitation`, `/shared/*`. After sign-in, `OnboardingService.checkIfOnboardingNeeded()` gates first-time users to `/onboarding`. Where a signed-in person goes next is `postLoginPath(pendingToken)` (`src/Auth/lib/postLoginPath.ts`): back to `/accept-invitation?token=…` while an invitation token is pending in `sessionStorage` (`pendingInvitationToken`, removed only when the invitation is accepted or no longer valid), else Home. The header avatar opens `/profile`; theme, language and sign out live there.

### Environments

- **Local**: `.env.local` → `http://127.0.0.1:54321` — orange "LOCAL DEVELOPMENT MODE" banner visible in app
- **Production**: `.env` → Supabase cloud — no banner

`dev:local` / `dev:prod` scripts swap the active env file before starting Vite.

### i18n

All UI strings go through `react-i18next`. Translation files: `src/locales/en.json` and `src/locales/sv.json`. Configure in `src/lib/i18n.ts`.

**Never hardcode user-facing strings in JSX.** Always use `const { t } = useTranslation()` and `t('feature.key')`.

### URL generation

**Always use `getBaseUrl()` from `src/lib/urlUtils.ts`** for any link the app generates (invitations, share links, etc.). The app is deployed to GitHub Pages under `/giftHunt/`, so hardcoded `window.location.origin` links will be wrong in production. The `VITE_APP_BASE_URL` env var sets the base in production builds.

### UI / GiftHunt design system

The look comes from the **GiftHunt design system** (claude.ai artifact: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu — tokens, brand book, components). Read its README before building UI.

- **Tokens** live in `src/styles/tokens.css` as `--gh-*` CSS variables (colours as RGB channels) and in Tailwind as `gh-*` colours (`bg-gh-surface-200`, `text-gh-muted`, `border-gh-line`), `rounded-gh-*` radii and `shadow-gh-*` shadows. Never hardcode a colour. Light is `:root`, dark is `.dark` (set by `src/lib/theme.ts`, which also sets `data-theme`).
- **Accent:** `gh-primary` (pastel Smultron) fills only the one primary action, with `text-gh-on-primary` (never white). Links, focus and active markers use `gh-primary-strong`.
- **Type:** IBM Plex Sans (`font-sans`) for UI; Fredoka (`font-brand`) only for the GiftHunt wordmark. Body 16px, captions 13px, nothing under 12px.
- **Brand:** the app mark is the Rosett bow (`RosettMark`; sources in `docs/brand/`, the PNGs in `public/` are generated from `icon-square.svg`). The mascot **Rosetten** (`Rosetten` with poses `hello`, `happy`, `sleep`, `lost`, `sad`, `locked`, and `RosettenLoader`) lives in `src/components/brand/`. Use it only in empty states (`EmptyState pose=…`), errors, the 404 page and full-screen loading: one per view, always with a heading, never beside anything that is taken. `Skeleton` stays first for lists and detail pages. Its outline follows the theme (`text-gh-ink`); its fixed fills are in `palette.ts`, everything else uses `gh-*`. Mischief: the `Peek` wrapper (Home list cards) and `RosettenRunner` (app shell) run only on the calm routes in `mischiefRoute` (never `/wishlist/*`, `/shared/*`); the limits are in `src/lib/mischief.ts`. All toasts go through `@/lib/toast` (Rosetten's speech bubble): import `toast` from there, never from `sonner`. The Profile switch `Lekfull maskot` and reduced motion stop everything that moves.
- **Status:** item status is a word plus a pill (`gh-available`/`gh-available-bg` "Ledig", `gh-taken`/`gh-taken-bg` "Tagen"); destructive is `gh-danger` (rust), never the accent.
- **Legacy:** older screens still use shadcn variables and an `ios-*` palette; both point at the GiftHunt tokens (`src/index.css`). Text on `bg-ios-blue` / `bg-ios-red` uses `text-ios-on-blue` / `text-ios-on-red`. New code uses the `gh-*` names only.

**Page column** — on desktop the header and every in-app page share one column: `PAGE_COLUMN` from `src/components/pageColumn.ts` (centred, max 960px, 16px sides on mobile and 32px from `md`, so 896px of content). Use `cn(PAGE_COLUMN, '…vertical padding and layout…')` on a page's `<main>`, never your own `max-w-*`/`px-*`; a unit test fails if a screen hardcodes `max-w-[720px]` or `max-w-[960px]`. Narrow forms (auth, onboarding, invitation) are 440px on purpose and stay centred.

**Responsive overlays** — use `useIsMobile()` to switch:

- Mobile → `Drawer` (bottom sheet) from `@/components/ui/drawer`
- Desktop → `Dialog` (centered modal) from `@/components/ui/dialog`

**Prevent input focus loss**: never define sub-components (e.g. `FormContent`) inside a parent component's render body. Define them at the module's top level — inline component definitions are treated as new types on every render, destroying DOM state and focus.

Action placement convention: primary actions top-right, cancel/close top-left, destructive actions full-width at the bottom.

### Gift card / multi-claim items

When `is_giftcard = true`, multiple people can claim the same item via `item_claims`. The optional `claim_cap` (integer) limits how many claims are allowed; `null` = unlimited.

- **Public view**: item shown as taken (no progress indicator) once cap is reached.
- **Organizer / self-managed view**: a gift card moves to Tagna when its cap is reached; the organizer removes individual gifts one by one in the item sheet (inline `ConfirmBlock`).
- Always set `claim_cap = null` when saving a non-giftcard item.

### Admin system rules

- One admin per wishlist (enforced by DB constraint).
- Invitation workflow: creator sends invite → recipient gets email with token → acceptance creates `wishlist_admins` record + marks invitation accepted.
- Hide the invite button when an admin already exists OR a pending invitation exists.
- A self-managed list (`is_self_managed = true`) lets the creator act as their own organizer on the same screen: add items, settings, share link, make free, remove a gift; no change requests.
- An invited organizer cannot add items (the database refuses it): the owner decides what is on the list. The organizer can still edit, delete, make an item free and answer change requests.

### RLS patterns

- Personal data: `auth.uid() = user_id`
- Admin access: `EXISTS (SELECT 1 FROM wishlist_admins WHERE wishlist_id = ... AND admin_id = auth.uid())`
- Avoid circular cross-table policy references — use simple `auth.uid()` checks where possible.
- Claim data (`is_taken`, `taken_by_name`, `taken_at`) is not readable from `wishlist_items` by any signed-in user. Organizers read it through the `wishlist_items_admin` view; use `ITEM_COLUMNS` from `src/lib/itemColumns.ts` (never `select('*')` or a bare `.select()`) on the table. A new column on `wishlist_items` needs an explicit `GRANT SELECT (col)` for `authenticated`.
- The owner of a non-self-managed list cannot update or delete existing items while an active share link exists (changes go through `request_item_change`).

### Database migrations

All schema changes go in `supabase/migrations/` as timestamped SQL files. Generate via `npx supabase db diff`, not by hand. Never push directly to production without testing locally with `npx supabase db reset` first.

To sync production data into local: `./sync-remote-data.sh`.

## How we work

Scale the process to the size of the change. Say which flow you pick; the user can override it.

| Kind of work | Flow |
| --- | --- |
| **Small bug or tweak** (wrong label, bad redirect, one-file fix) | Fix it (failing test first when it is logic), show the result, then push and PR once the user says so. No issue, design or plan. |
| **Bigger bug** (cause unclear, touches data, auth or RLS) | Reproduce and find the cause first, propose the fix in chat, implement after approval. |
| **UI update to an existing screen** | Short design in chat, or one board in the design canvas if it is visual. Approve, then implement; write a plan only when there are several steps. |
| **New feature** | Issue → design (canvas if visual) → approved → plan → approved → implement → verify → PR. |

- **Issues:** features get a GitHub issue (`gh issue create`): problem, who it affects, acceptance criteria, what is out of scope. Design, plan and PR link back to it; the PR says `Closes #N`. Skip issues for anything smaller than a feature.
- **Design:** visual work is designed as boards in a claude.ai Design artifact that uses the GiftHunt design system (link above), approved by the user before any code. Specs and plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/` (dated `YYYY-MM-DD-name.md`).
- **Branches:** new work happens in a git worktree on its own branch (never on `main`); stage files by name; new commits, never amend unless asked.
- **Verify:** `npm run test:unit`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run build`, and `npm run test:db` when the database changes. Anything visible is also checked in Chrome against local Supabase (mobile 390 px and desktop 1280 px, light and dark, sv and en) and compared with the approved design. Baseline: lint has 10 known problems (3 errors, 7 warnings); do not add more.
- **Review:** before merging a feature, or anything touching auth, RLS or migrations, have a fresh reviewer (most capable model) read the whole branch against the plan. Small fixes skip this.
- **Approval:** never push, open a PR or merge without the user saying so. Say when a merge will run `supabase db push` against production (any new migration) and what it changes there.
- **Docs:** update this file and the feature `README.md` in the same PR when behavior or conventions change.
