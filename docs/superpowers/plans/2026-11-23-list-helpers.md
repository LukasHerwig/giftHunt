# List Helpers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the creator of a self-managed list invite helpers who can add, edit and delete items and see the gift overview, while the list itself (settings, archive, delete, share link on/off, inviting) stays the creator's. Issue #58.

**Architecture:** A helper is an extra `wishlist_admins` row on a self-managed list, invited through `admin_invitations`. One migration lifts the one-per-list limits for self-managed lists only, lets admins insert items on them, keeps share-link create/turn-off with the creator, and adds `remove_wishlist_helper` and `leave_wishlist`. The app adds a `helper` mode, reusing `OrganizerWishlist`. The creator gets a helpers sheet, and Home and the accept page get helper wording.

**Tech Stack:** React 18 + TypeScript + Vite, Supabase (Postgres RLS, plpgsql RPCs), pgTAP (`npm run test:db`), node:test (`npm run test:unit`), react-i18next.

**Spec:** `docs/superpowers/specs/2026-11-23-list-helpers-design.md`

## Global Constraints

- Work in `/Users/lukasherwig/Developer/giftHunt/giftHunt-list-helpers` on branch `list-helpers`. Stage files by name, new commits only, end each commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Everything new applies **only** to self-managed lists (`is_self_managed = true`). Ordinary lists keep today's behaviour and error codes; the existing pgTAP files 01–23 must pass unchanged.
- One migration file: `supabase/migrations/20261123000024_list_helpers.sql`. Tasks 1–3 each append a section. Write it by hand in the style of `20261023000023_archive_wishlists.sql` (security definer, `set search_path = public`, `revoke … from public, anon`, `grant … to authenticated, service_role`); `db diff` doesn't capture function bodies well.
- New pgTAP files reuse `\ir _seed.psql` (W3 is `u_self`'s self-managed list with item `i4`). Add helper users inside each test file, not to the seed.
- The role is called "helper" in code and English, "hjälpare" in Swedish. Every user-facing string goes in both `src/locales/en.json` and `src/locales/sv.json`.
- UI: `gh-*` tokens only, `useIsMobile()` → `Drawer`/`Dialog`, toasts from `@/lib/toast`, destructive actions full-width at the bottom with `ConfirmBlock`, no sub-components defined inside render bodies.
- Claim columns are read only through `wishlist_items_admin` / `ITEM_COLUMNS`. Never `select('*')` on `wishlist_items`.
- Lint baseline: 10 problems (3 errors, 7 warnings). Do not add more.
- No UI code before the boards in Task 4 are approved.

## Review Focus

1. **Helper calling the API directly** for list-level actions (update `wishlists`, `archive_wishlist`, insert into `admin_invitations`, insert/update `share_links`) must be refused. Pinned in Task 2's test.
2. **A removed helper with the list still open** loses all reads at once. The next action fails, and on reload `index.tsx` resolves `none` and goes Home. Pinned in Task 3's test (removed helper sees 0 items and 0 claims).
3. **Inviting the same address twice in different case** (`Anna@x.se`, `anna@x.se`) on a self-managed list is refused with `23505`, so the app shows `invite_pending`. Pinned in Task 1's test.
4. **A list archived while a helper invitation is pending:** the invitation is gone and accepting raises `invitation_not_found`. Pinned in Task 3's test.
5. **A guest opening a shared self-managed list with helpers** sees the creator as organizer, and the page doesn't error. Pinned in Task 2's test.

---

### Task 1: Constraints, triggers, `accepted_by`, `accept_invitation`

**Files:**
- Create: `supabase/migrations/20261123000024_list_helpers.sql`
- Test: `supabase/tests/24_helpers_constraints_test.sql`

**Interfaces:**
- Produces:
  - `public.is_self_managed(p_wishlist_id uuid) returns boolean` (stable, security definer)
  - column `admin_invitations.accepted_by uuid references auth.users on delete set null`
  - unique `(wishlist_id, admin_id)` on `wishlist_admins`
  - partial unique index `admin_invitations_pending_email` on `(wishlist_id, lower(email)) where not accepted`
  - `accept_invitation` fills `accepted_by`.

- [ ] **Step 1: Write the failing test** `24_helpers_constraints_test.sql`. Add users `u_help1` (`help1@test.se`) and `u_help2` (`help2@test.se`). Assertions:
  - As `u_self`, two invitations on W3 (help1, help2) both insert: `lives_ok`.
  - A third invitation on W3 to `HELP1@test.se` → `throws_ok(…, '23505')`.
  - As `u_self`, an invitation on W3 to `self@test.se` → `throws_ok(…, 'P0001', 'cannot_invite_self')`.
  - Help1 and help2 each `accept_invitation` → `lives_ok`. W3 then has 3 `wishlist_admins` rows. Each invitation's `accepted_by` equals the accepter.
  - As `u_self`, an invitation on W3 to `help1@test.se` after help1 accepted → `throws_ok(…, 'P0001', 'already_helper')`.
  - Ordinary list W2 (already has a pending invitation): as owner, a second invitation to `other@test.se` → `throws_ok(…, '23505')`, unchanged from today.
  - Ordinary list W1 (has organizer `u_admin`): direct insert of a second `wishlist_admins` row as postgres for `u_stranger` → `throws_ok(…, 'P0001', 'admin_already_exists')`. Insert of `(w1, u_admin)` again with `on conflict (wishlist_id, admin_id) do nothing` → `lives_ok`.

- [ ] **Step 2: Run it and see it fail.** Run `npx supabase db reset && npm run test:db`. Expect `24_helpers_constraints_test.sql` to fail on the second W3 invitation (`23505` from `admin_invitations_one_per_wishlist`).

- [ ] **Step 3: Write the migration's first section.**
  - Add `is_self_managed`.
  - Drop `wishlist_admins_one_per_wishlist` and add `unique (wishlist_id, admin_id)`.
  - Drop `admin_invitations_one_per_wishlist` and add index `admin_invitations_pending_email`.
  - Add `accepted_by`.
  - Trigger `wishlist_admins_one_per_ordinary_list` (before insert). Lock the wishlist row (`perform 1 from wishlists where id = new.wishlist_id for update`). If the list isn't self-managed and a row exists for a different `admin_id`, raise `admin_already_exists` (P0001).
  - Trigger `admin_invitations_rules` (before insert):
    - ordinary list with any pending invitation → raise with `errcode = '23505'`
    - self-managed list and `lower(new.email)` equals the creator's profile email → `cannot_invite_self`
    - self-managed list and the email belongs to an existing admin's profile → `already_helper`
  - Replace `accept_invitation`. Copy the body from `20261020000016_owner_cannot_accept_own_invitation.sql`, change `on conflict (wishlist_id)` to `on conflict (wishlist_id, admin_id)`, and set `accepted = true, accepted_by = auth.uid()`.

- [ ] **Step 4: Run it and see it pass.** Run `npx supabase db reset && npm run test:db`. Expect all files to pass, 01–23 included.

- [ ] **Step 5: Commit** the migration and the test: `feat(helpers): several organizers and invitations on self-managed lists (#58)`.

### Task 2: What helpers may do: items, share links, guest page, invitation lookup

**Files:**
- Modify: `supabase/migrations/20261123000024_list_helpers.sql` (append)
- Test: `supabase/tests/25_helpers_rights_test.sql`

**Interfaces:**
- Consumes: `is_self_managed` from Task 1.
- Produces:
  - policy `items_helper_insert`
  - share-link insert, update and delete policies limited to the creator on self-managed lists
  - `get_shared_wishlist` with `organizer_name` = the creator on self-managed lists
  - `get_invitation_by_token` JSON gains `'is_self_managed'`.

- [ ] **Step 1: Write the failing test.** Set-up as postgres: `u_help1` is an admin on W3, W3 has share link `tok-w3` created by `u_self`, and item `i4` is taken. Each row of the spec's roles table, as help1:
  - Insert an item on W3 → `lives_ok`. Update `i4` title and delete it → it works (check with `is`).
  - Read `wishlist_items_admin` for W3 → sees `is_taken`. Delete a claim on W3's gift card item (add one in the set-up) → works. Update `i4` setting `is_taken = false` → works.
  - Read `share_links` for W3 → 1 row.
  - Insert into `share_links` for W3 → `throws_ok(…, '42501')`. Update `is_active` → 0 rows changed (check `is`). Delete → the row still exists.
  - Update `wishlists` title on W3 → unchanged. `archive_wishlist(w3)` → `throws_ok(…, '42501', 'not_owner')`. Insert an `admin_invitations` row on W3 → `throws_ok(…, '42501')`. Delete W3 → it still exists.
  - As `u_self`, insert and update `share_links` on W3 → work.
  - As anon, `get_shared_wishlist('tok-w3')` → `lives_ok`, and `->'wishlist'->>'organizer_name'` = `'Siri Self'`.
  - `get_shared_wishlist('tok-w1')` still returns `'Ada Admin'`.
  - `get_invitation_by_token` for a W3 invitation returns `is_self_managed = true`; for `inv-w2` it returns `false`.
  - On ordinary W1, `u_admin` inserting an item still fails with `42501`.

- [ ] **Step 2: Run it and see it fail.** Run `npm run test:db`. Expect a failure at the helper's item insert (`42501`).

- [ ] **Step 3: Append the section.**
  - Policy `items_helper_insert`: `is_wishlist_admin(wishlist_id) and is_self_managed(wishlist_id) and not wishlist_is_archived(wishlist_id)`.
  - Recreate `share_links_admin_insert`, `share_links_admin_update` and `share_links_admin_delete` from their latest versions, adding `and (not is_self_managed(wishlist_id) or is_wishlist_owner(wishlist_id))` to `using` and `with check`. Find the latest versions with `grep -n share_links_admin supabase/migrations/*.sql`; the archive migration redefined some of them.
  - Replace `get_shared_wishlist` from its latest version (`20261020000017_shared_organizer_name.sql`). The only change is the organizer subquery: `where wa.wishlist_id = w.id and (not w.is_self_managed or wa.admin_id = w.creator_id)`.
  - Replace `get_invitation_by_token` from `20261020000006`, adding `'is_self_managed', w.is_self_managed`.

- [ ] **Step 4: Run it and see it pass.** Run `npm run test:db`. Expect all files to pass.

- [ ] **Step 5: Commit**: `feat(helpers): helpers add items; share link and list stay the creator's (#58)`.

### Task 3: Removing and leaving, plus generated types

**Files:**
- Modify: `supabase/migrations/20261123000024_list_helpers.sql` (append)
- Modify: `src/integrations/supabase/types.ts` (regenerated)
- Test: `supabase/tests/26_helpers_remove_leave_test.sql`

**Interfaces:**
- Produces:
  - `public.remove_wishlist_helper(p_wishlist_id uuid, p_admin_id uuid) returns void`. Errors: `not_owner` (42501), `not_self_managed` (P0001), `cannot_remove_creator` (P0001), `archived_locked` (P0001), `not_helper` (P0002).
  - `public.leave_wishlist(p_wishlist_id uuid) returns void`. Errors: `not_helper` (P0002), which also covers the creator calling it.
  - `remove_wishlist_admin` raises `self_managed` (P0001) on self-managed lists.

- [ ] **Step 1: Write the failing test.** Set-up: help1 and help2 are admins on W3 through accepted invitations (`accepted_by` set), W3 has a share link, and `i4` is taken.
  - As stranger or help2, `remove_wishlist_helper(w3, help1)` → `42501 not_owner`.
  - As `u_self`, `remove_wishlist_helper(w3, u_self)` → `cannot_remove_creator`. On W1 as owner → `not_self_managed`.
  - As `u_self`, remove help1 → `lives_ok`. Help1's admin row and their invitation are gone. Help2, the share link, `i4.is_taken` and the claims are unchanged.
  - As help1 afterwards: 0 rows from `wishlists`, `wishlist_items`, `wishlist_items_admin` and `item_claims` for W3.
  - As `u_self`, help1 can be invited again (`lives_ok`).
  - As help2, `leave_wishlist(w3)` → `lives_ok`, and the row and invitation are gone. As `u_self`, `leave_wishlist(w3)` → `not_helper`.
  - As `u_self`, `remove_wishlist_admin(w3)` → `throws_ok(…, 'P0001', 'self_managed')`, and the creator's row is still there.
  - Archive with a pending helper invitation: invite help2 on W3, `archive_wishlist(w3)`, then help2 `accept_invitation` → `P0002 invitation_not_found`. Only the creator's admin row is left.

- [ ] **Step 2: Run it and see it fail.** Run `npm run test:db`. Expect "function remove_wishlist_helper does not exist".

- [ ] **Step 3: Append the section.**
  - Both functions are security definer and granted to `authenticated` and `service_role`.
  - `remove_wishlist_helper` and `leave_wishlist` delete the `wishlist_admins` row and `admin_invitations where wishlist_id = … and accepted_by = <admin>`.
  - Replace `remove_wishlist_admin` from its latest version (`20261023000023_archive_wishlists.sql`), adding the `self_managed` guard after the owner check.

- [ ] **Step 4: Run it and see it pass.** Run `npm run test:db`. Expect all files to pass.

- [ ] **Step 5: Regenerate the types** with `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`. Check with `npx tsc --noEmit -p tsconfig.app.json`, which should give no new errors.

- [ ] **Step 6: Commit** the migration, the test and `types.ts`: `feat(helpers): creator removes a helper, a helper leaves (#58)`.

### Task 4: Design boards (approval gate)

**Files:** none in the repo. Boards go in a claude.ai Design artifact that uses the GiftHunt design system (https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu).

- [ ] **Step 1:** Make these boards, each at mobile 390 and desktop 1280, light and dark, in sv:
  1. **The creator's helpers sheet:** helpers list, pending invitations, invite field, remove/withdraw with confirm, empty state.
  2. **The helper's list screen:** `self` mode without settings or archive. The share link appears as copy only, or as a calm "no link yet" line. "Leave list" sits at the bottom.
  3. **Where the creator opens the helpers sheet** on the organizer screen.
  4. **The Home card** for a helped list, and the invitation card with helper wording.
  5. **`/accept-invitation`** with helper wording.
- [ ] **Step 2:** Share the link and wait for the user's approval. Record the artifact URL in `src/Wishlist/README.md`'s Design section (committed in Task 8).

### Task 5: Helper mode and the helper's screen

**Files:**
- Modify: `src/Wishlist/types/index.ts:103` (`Mode` gains `'helper'`)
- Modify: `src/Wishlist/lib/mode.ts`, `src/Wishlist/lib/mode.test.ts`
- Modify: `src/Wishlist/index.tsx` (route `helper` to `OrganizerWishlist`)
- Modify: `src/Wishlist/components/OrganizerWishlist.tsx` (`mode: 'organizer' | 'self' | 'helper'`)
- Modify: `src/Wishlist/hooks/useOrganizerWishlist.ts` (add `leaveList`)
- Modify: `src/Wishlist/services/OrganizerService.ts` (add `leave`)
- Modify: `src/locales/en.json`, `src/locales/sv.json`

**Interfaces:**
- Consumes: `leave_wishlist` RPC (Task 3), the approved boards 2 and 4.
- Produces:
  - `Mode = 'owner' | 'organizer' | 'self' | 'helper' | 'archived' | 'none'`
  - `OrganizerService.leave(wishlistId: string): Promise<void>`
  - `useOrganizerWishlist(...).leaveList(): Promise<void>`, which navigates Home with toast `wishlist.helper.toast.left` and pose `'teary'`.

- [ ] **Step 1: Write the failing tests** in `mode.test.ts`:
  - `test('someone with an organizer row on a self-managed list they did not create is a helper')`: `resolveMode({ wishlist: list({ is_self_managed: true }), userId: 'anna', isOrganizer: true })` → `'helper'`.
  - `test('a helper has no mode on an archived list')`: same list with `archived_at` set → `'none'`.
  - The existing `organizer` test (ordinary list) is unchanged.
- [ ] **Step 2: Run them and see them fail.** Run `npm run test:unit`. The first new test fails with `'organizer' !== 'helper'`.
- [ ] **Step 3: Implement the mode** in `resolveMode` and `Mode`. Run `npm run test:unit` and expect it to pass.
- [ ] **Step 4: Build the helper screen** in `OrganizerWishlist`, following board 2:
  - Helpers get the same add-item entry as `self`.
  - Settings, archive and delete are hidden.
  - Requests are hidden, as for `self`.
  - The share-link area shows copy when a link is active, otherwise the "no link yet" line. Create and turn-off are hidden.
  - "Leave list" sits at the bottom with `ConfirmBlock` and calls `leaveList`.
  - Add the new strings under `wishlist.helper.*` in both locales.
- [ ] **Step 5: Check it.**
  - Run `npx tsc --noEmit -p tsconfig.app.json && npm run lint && npm run test:unit`. Lint should stay at the baseline.
  - In Chrome against local Supabase, accept a helper invitation, then add, edit and delete an item, make an item free, copy the link, and leave the list. Check at 390 and 1280, light and dark, sv and en, and compare with board 2.
- [ ] **Step 6: Commit**: `feat(helpers): helper mode on the list screen (#58)`.

### Task 6: The creator's helpers sheet

**Files:**
- Create: `src/Wishlist/components/HelpersSheet.tsx`
- Create: `src/Wishlist/lib/helpers.ts`, `src/Wishlist/lib/helpers.test.ts`
- Modify: `src/Wishlist/services/OrganizerService.ts`, `src/Wishlist/hooks/useOrganizerWishlist.ts`, `src/Wishlist/components/OrganizerWishlist.tsx`, `src/Wishlist/components/index.ts`, locales

**Interfaces:**
- Consumes:
  - `WishlistService.invite(wishlistId, email)`, unchanged, which already maps `23505` → `invite_pending`
  - `WishlistService.revokeInvitation(id)`
  - `remove_wishlist_helper` (Task 3).
- Produces:
  - `type HelperEntry = { kind: 'helper'; adminId: string; name: string; email: string | null } | { kind: 'pending'; invitationId: string; email: string }`
  - `toHelperEntries(creatorId: string, admins: AdminRow[], invites: InviteRow[], now: Date): HelperEntry[]` in `lib/helpers.ts`. It leaves out the creator's own row and expired invitations, and lists helpers by name first, then pending invitations by email.
  - `OrganizerService.loadHelpers(wishlistId: string, creatorId: string): Promise<HelperEntry[]>`
  - `OrganizerService.removeHelper(wishlistId: string, adminId: string): Promise<void>`
  - In the hook: `helpers: HelperEntry[]` (loaded only in `self` mode), `inviteHelper(email)`, `withdrawHelperInvite(id)`, `removeHelper(adminId)`, plus a `{ kind: 'helpers' }` sheet state.

- [ ] **Step 1: Write the failing tests** in `helpers.test.ts`:
  - `test('the creator is not listed as a helper')`
  - `test('expired invitations are left out')`
  - `test('helpers come first, sorted by name, then pending invitations')`
  - `test('a helper without a name shows their email')`
- [ ] **Step 2: Run them and see them fail.** Run `npm run test:unit` and expect "Cannot find module './helpers.ts'".
- [ ] **Step 3: Implement `toHelperEntries`.** Run `npm run test:unit` and expect it to pass.
- [ ] **Step 4: Build the sheet and its entry point** following boards 1 and 3:
  - Mobile uses `Drawer`, desktop uses `Dialog`.
  - Errors map to toasts: `invite_pending`, `cannot_invite_self`, `already_helper`, and `emailSent: false`, which reuses the owner flow's copy.
  - Remove and withdraw use an inline `ConfirmBlock`.
  - On success: `toast.success(…, 'wink')` for an invitation and `'teary'` for a removal.
  - Define the sheet at module top level.
- [ ] **Step 5: Check it.**
  - Run tsc, lint and unit tests.
  - In Chrome: invite two addresses, see both pending, accept one in another browser profile, then remove them. Check that the share link and taken items are untouched.
  - Check both viewports, both themes and both languages against boards 1 and 3.
- [ ] **Step 6: Commit**: `feat(helpers): creator invites and removes helpers (#58)`.

### Task 7: Home and the accept page

**Files:**
- Modify: `src/Home/services/HomeService.ts:47-67` (`loadOwned`), `src/Home/services/HomeService.ts` (`loadInvitations`, which needs `is_self_managed` per invitation)
- Create or modify: a pure mapper in `src/Home/lib/` with a test (follow the folder's existing pattern; create `src/Home/lib/ownedOrganizer.ts` if there is none)
- Modify: `src/Home/components/InvitationCard.tsx`, `src/Home/components/ListSection.tsx`, `src/AcceptInvitation/` page component, locales

**Interfaces:**
- Consumes: `get_invitation_by_token` → `is_self_managed` (Task 2), board 4 and board 5.
- Produces: `ownedOrganizer(list: { is_self_managed: boolean; creator_id: string }, admins: { admin_id: string; profile: ProfileName | null }[]): ProfileName | null`. It returns null for self-managed lists, otherwise `admins[0]?.profile ?? null`. If board 4 shows a helper count, also export `helperCount(...)`: the non-creator rows on a self-managed list.

- [ ] **Step 1: Write the failing tests**:
  - `test('a self-managed list has no organizer on its Home card, even with helpers')`
  - `test('an ordinary list shows its organizer')`
- [ ] **Step 2: Run them and see them fail.** Run `npm run test:unit`.
- [ ] **Step 3: Implement the mapper** and use it in `loadOwned`. Add `admin_id` and `creator_id` to the select. Run `npm run test:unit` and expect it to pass.
- [ ] **Step 4: Apply the wording from boards 4 and 5.**
  - Helped lists already appear through `loadOrganized`; give their card the helper label from board 4.
  - `InvitationCard` and `/accept-invitation` use helper wording when `is_self_managed` is true.
- [ ] **Step 5: Check it.** Run tsc, lint and unit tests, then check in Chrome against boards 4 and 5 at both viewports, both themes and both languages.
- [ ] **Step 6: Commit**: `feat(helpers): Home and invitations speak of helpers (#58)`.

### Task 8: Docs and full verification

**Files:**
- Modify: `CLAUDE.md` ("Admin system rules": replace "One admin per wishlist" with the self-managed exception and the helper rights, and add `accepted_by` to the data-model row), `src/Wishlist/README.md` (helper mode, helpers sheet, boards link), `src/Home/README.md`, `src/AcceptInvitation/README.md`.

- [ ] **Step 1: Update the docs** listed above.
- [ ] **Step 2: Run the full verification.**
  - `npm run test:unit`
  - `npx tsc --noEmit -p tsconfig.app.json`
  - `npm run lint` (baseline 10)
  - `npm run build`
  - `npx supabase db reset && npm run test:db`
  
  All must pass.
- [ ] **Step 3: Commit**: `docs(helpers): rules and READMEs for list helpers (#58)`.
- [ ] **Step 4: Get the review.** A fresh reviewer on the most capable model reads the whole branch against the spec and this plan; the change touches RLS and migrations, so this is required. Then use superpowers:finishing-a-development-branch. Don't push or open the PR without the user's go-ahead. The PR says `Closes #58` and notes the production `db push`.
