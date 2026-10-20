# Phase 4a – Claim privacy and owner edit lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The owner of a shared (non-self-managed) list can no longer read who took what, and can no longer edit or delete existing items while an active share link exists. Both are enforced in the database.

**Architecture:** Two additive migrations. (1) `items_owner_all` is split into four policies; update and delete additionally require `not wishlist_has_share_link(wishlist_id)`. (2) `SELECT` on the five claim columns of `wishlist_items` is revoked from `authenticated`; organizers (and self-managed owners) read them through a new view `wishlist_items_admin`, filtered by `is_wishlist_admin(wishlist_id)`. The old Admin and SelfManaged screens, still live until phase 4c, switch their item reads to the view and stop using `select('*')` / bare `.select()` on the table.

**Tech Stack:** PostgreSQL RLS and column privileges, pgTAP (`npm run test:db`), Supabase JS client, React/TS.

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` section 6 (the mechanism was left to this plan; agreed in chat: column revoke + view; turning a link off lets the owner edit directly again).

## Global Constraints

- New objects get explicit `GRANT`s in the same migration (Supabase stops auto-granting new tables on 2026-10-30); `anon` gets nothing.
- Schema changes are migrations in `supabase/migrations/`, tested locally before `db push`. Next numbers: `20261020000018`, `20261020000019`.
- Merging to `main` runs `supabase db push` on production automatically, and the old screens must keep working against it: the frontend change ships in the same PR.
- Never hardcode user-facing strings; no UI changes in this phase.
- `wishlist_has_share_link(uuid)` already counts only active, unexpired links (migration 000009); reuse it, do not redefine it.

## Review Focus

- **A column added to `wishlist_items` later** silently becomes unreadable for everyone but admins (no grant) → a test pins the exact set of unreadable columns. (Task 2)
- **Any remaining `select('*')` or bare `.select()` on `wishlist_items`** fails with "permission denied" for every signed-in user, including organizers. (Task 3 grep gate and browser run)
- **Organizer of a list who is not its owner, and a stranger** must see nothing through the view; **anon** must not read the table or the view. (Task 2)
- **Self-managed owner** (is also the admin) keeps full access to items and claims. (Tasks 1 and 2)
- **Link turned off, then on again:** the owner can edit while it is off and is locked out again once it is on. (Task 1)

---

### Task 1: Owner edit lock

**Files:**
- Create: `supabase/migrations/20261020000018_owner_edit_lock.sql`
- Create: `supabase/tests/18_owner_edit_lock_test.sql`
- Modify: `supabase/tests/08_grants_test.sql` (policy name list only)

**Interfaces:**
- Consumes: `public.is_wishlist_owner(uuid)`, `public.wishlist_has_share_link(uuid)` (true only for owner or admin of a list with an active, unexpired link), fixture `_seed.psql`.
- Produces: policies `items_owner_select`, `items_owner_insert`, `items_owner_update`, `items_owner_delete` on `wishlist_items` (replace `items_owner_all`; `items_admin_all` is unchanged).

- [ ] **Step 1: Write the failing test** `supabase/tests/18_owner_edit_lock_test.sql`

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
\ir _seed.psql

-- W1 has an active link (tok-w1): the owner may add but not edit or delete
:as_owner
update wishlist_items set title = 'Ändrad' where id = :'i1';
delete from wishlist_items where id = :'i3';
select lives_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ny') $$,
  'owner can still add items to a shared list');
select is((select count(*)::int from wishlist_items where wishlist_id = :'w1'), 4, 'owner still reads the items of a shared list');
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok', 'owner cannot edit an item while the link is active');
select ok(exists (select 1 from wishlist_items where id = :'i3'), 'owner cannot delete an item while the link is active');

-- The organizer is not affected
:as_admin
update wishlist_items set title = 'Bok (arrangör)' where id = :'i1';
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok (arrangör)', 'the organizer can edit while the link is active');

-- Link turned off: the owner edits directly; turned on again: locked again
update share_links set is_active = false where token = 'tok-w1';
:as_owner
update wishlist_items set title = 'Bok (ägare)' where id = :'i1';
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok (ägare)', 'owner can edit once the link is turned off');

update share_links set is_active = true where token = 'tok-w1';
:as_owner
update wishlist_items set title = 'Igen' where id = :'i1';
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok (ägare)', 'turning the link on again locks the owner out again');

-- An expired link does not lock; neither does a list without a link
insert into wishlist_items (id, wishlist_id, title) values
  ('bbbbbbbb-0000-0000-0000-000000000009', :'w4', 'Gammal sak'),
  ('bbbbbbbb-0000-0000-0000-00000000000a', :'w2', 'Julklapp');
:as_owner
update wishlist_items set title = 'a' where id = 'bbbbbbbb-0000-0000-0000-000000000009';
delete from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-00000000000a';
reset role;
select is((select title from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000009'), 'a', 'owner can edit when the only link has expired');
select ok(not exists (select 1 from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-00000000000a'), 'owner can delete on a list without a link');

-- A self-managed owner is the organizer and is never locked
insert into share_links (wishlist_id, token, created_by) values (:'w3', 'tok-w3', :'u_self');
:as_self
update wishlist_items set title = 'Napp 2' where id = :'i4';
reset role;
select is((select title from wishlist_items where id = :'i4'), 'Napp 2', 'a self-managed owner can edit while the link is active');

select * from finish();
rollback;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase test db supabase/tests/18_owner_edit_lock_test.sql 2>&1 | tail -25`
Expected: FAIL on `owner cannot edit an item while the link is active`, `owner cannot delete …` and `turning the link on again locks …` (the owner can still edit today); the other tests pass. If the local stack is down: `npx supabase start`.

- [ ] **Step 3: Write the migration** `supabase/migrations/20261020000018_owner_edit_lock.sql`

```sql
-- Once the organizer has an active share link, the owner can no longer edit or
-- delete existing items directly: those become change requests (request_item_change).
-- New items still go straight in. Turning the link off (or letting it expire)
-- lifts the lock. Previously only the frontend enforced this.
-- The organizer (and a self-managed owner, who is the organizer) keeps full access
-- through items_admin_all.
drop policy if exists "items_owner_all" on public.wishlist_items;

create policy "items_owner_select" on public.wishlist_items
  for select to authenticated
  using (public.is_wishlist_owner(wishlist_id));

create policy "items_owner_insert" on public.wishlist_items
  for insert to authenticated
  with check (public.is_wishlist_owner(wishlist_id));

create policy "items_owner_update" on public.wishlist_items
  for update to authenticated
  using (public.is_wishlist_owner(wishlist_id) and not public.wishlist_has_share_link(wishlist_id))
  with check (public.is_wishlist_owner(wishlist_id));

create policy "items_owner_delete" on public.wishlist_items
  for delete to authenticated
  using (public.is_wishlist_owner(wishlist_id) and not public.wishlist_has_share_link(wishlist_id));
```

- [ ] **Step 4: Apply and update the stray-policy test**

Run: `npx supabase migration up 2>&1 | tail -3` (keeps local data; do not `db reset` yet).
Then open `supabase/tests/08_grants_test.sql`, find the `set_eq` that lists the expected policy names (from the line `-- No stray policy` on), and in the `wishlist_items` entry replace `items_owner_all` with the four names `items_owner_select, items_owner_insert, items_owner_update, items_owner_delete` in the same format as its neighbours. Keep `items_admin_all`.

- [ ] **Step 5: Run the new test and the whole suite**

Run: `npx supabase test db 2>&1 | tail -15`
Expected: every file passes, including `18_owner_edit_lock_test.sql` (10/10) and `08_grants_test.sql`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261020000018_owner_edit_lock.sql supabase/tests/18_owner_edit_lock_test.sql supabase/tests/08_grants_test.sql
git commit -m "feat(db): lock owner edits and deletes while a share link is active"
```

---

### Task 2: Claim columns private to organizers

**Files:**
- Create: `supabase/migrations/20261020000019_claim_columns_private.sql`
- Create: `supabase/tests/19_claim_columns_private_test.sql`
- Modify: `supabase/tests/08_grants_test.sql` (the `authenticated has full DML` count)

**Interfaces:**
- Consumes: `public.is_wishlist_admin(uuid)`, policies from Task 1.
- Produces: view `public.wishlist_items_admin` with columns `id, wishlist_id, title, description, price_range, priority, created_at, updated_at, url, link, is_giftcard, claim_cap, is_taken, taken_by_name, taken_at`; rows only for lists where the caller is the admin. `authenticated` can `SELECT` only these columns of `wishlist_items`: `id, wishlist_id, title, description, price_range, priority, created_at, updated_at, url, link, is_giftcard, claim_cap`. Unreadable for `authenticated`: `claimed_at, claimed_by, is_taken, taken_at, taken_by_name` (`claimed_by`/`claimed_at` are unused legacy columns). `INSERT`/`UPDATE`/`DELETE` privileges are unchanged, so untake still works as a plain table update. `service_role` is unchanged.

- [ ] **Step 1: Write the failing test** `supabase/tests/19_claim_columns_private_test.sql`

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);
\ir _seed.psql

-- The owner of a shared list cannot read any claim column
:as_owner
select throws_ok($$ select is_taken from wishlist_items $$, '42501', null, 'owner cannot read is_taken');
select throws_ok($$ select taken_by_name from wishlist_items $$, '42501', null, 'owner cannot read taken_by_name');
select throws_ok($$ select claimed_by from wishlist_items $$, '42501', null, 'owner cannot read the legacy claimed_by');
select throws_ok($$ select * from wishlist_items $$, '42501', null, 'select * on the table is refused');
select lives_ok(
  $$ select id, wishlist_id, title, description, price_range, priority, created_at, updated_at, url, link, is_giftcard, claim_cap from wishlist_items $$,
  'owner can read every non-claim column');
reset role;

-- Even the organizer reads claims through the view, not the table
:as_admin
select throws_ok($$ select * from wishlist_items $$, '42501', null, 'organizer cannot select * from the table either');
select is((select count(*)::int from wishlist_items_admin where wishlist_id = :'w1'), 3, 'organizer reads the list through the view');
select is((select taken_by_name from wishlist_items_admin where id = :'i3'), 'Lo', 'the view shows who took an item');
reset role;

-- Owner (not organizer), stranger and anon get nothing from the view
:as_owner
select is((select count(*)::int from wishlist_items_admin), 0, 'owner sees no rows in the admin view');
reset role;
:as_stranger
select is((select count(*)::int from wishlist_items_admin), 0, 'stranger sees no rows in the admin view');
reset role;
:as_anon
select throws_ok($$ select * from wishlist_items_admin $$, '42501', null, 'anon cannot read the admin view');
reset role;

-- A self-managed owner is the organizer and sees claims on their own list
:as_self
select is((select count(*)::int from wishlist_items_admin), 1, 'self-managed owner reads their list through the view');
reset role;

-- Untake is still a plain table update for the organizer
:as_admin
update wishlist_items set is_taken = false, taken_by_name = null, taken_at = null where id = :'i3';
reset role;
select ok(not (select is_taken from wishlist_items where id = :'i3'), 'organizer can still untake with a table update');

-- The unreadable set is exactly the claim columns: a column added later without a
-- grant fails here instead of silently breaking the owner's screen.
select is(
  (select array_agg(column_name::text order by column_name)
   from information_schema.columns
   where table_schema = 'public' and table_name = 'wishlist_items'
     and not has_column_privilege('authenticated', 'public.wishlist_items', column_name, 'select')),
  array['claimed_at', 'claimed_by', 'is_taken', 'taken_at', 'taken_by_name'],
  'exactly the claim columns are unreadable for authenticated');

select ok(has_table_privilege('service_role', 'public.wishlist_items', 'select'), 'service_role can still read the table');

select * from finish();
rollback;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase test db supabase/tests/19_claim_columns_private_test.sql 2>&1 | tail -25`
Expected: FAIL with `relation "wishlist_items_admin" does not exist` errors and the `throws_ok` tests failing (the owner can read the columns today).

- [ ] **Step 3: Write the migration** `supabase/migrations/20261020000019_claim_columns_private.sql`

```sql
-- Who took what is for the organizer only. RLS filters rows, not columns, so the
-- claim columns of wishlist_items are taken away from every signed-in user and the
-- organizer reads them through wishlist_items_admin instead. The view runs as its
-- owner (postgres) and filters rows itself with is_wishlist_admin().
-- claimed_by / claimed_at are unused legacy columns and go with them.
-- A column added to wishlist_items later has no grant until it is added to the list
-- below (test 19 fails until then).
revoke select on public.wishlist_items from authenticated;

grant select (id, wishlist_id, title, description, price_range, priority,
              created_at, updated_at, url, link, is_giftcard, claim_cap)
  on public.wishlist_items to authenticated;

create view public.wishlist_items_admin with (security_invoker = false) as
select id, wishlist_id, title, description, price_range, priority,
       created_at, updated_at, url, link, is_giftcard, claim_cap,
       is_taken, taken_by_name, taken_at
from public.wishlist_items
where public.is_wishlist_admin(wishlist_id);

revoke all on public.wishlist_items_admin from public, anon;
grant select on public.wishlist_items_admin to authenticated, service_role;
```

- [ ] **Step 4: Apply, then fix test 08's privilege count**

Run: `npx supabase migration up 2>&1 | tail -3`
In `supabase/tests/08_grants_test.sql`, the `authenticated has full DML` assertion now counts 27 (table-level `SELECT` on `wishlist_items` is gone). Change `28` to `27` in that one assertion and its description to `'authenticated has full DML except SELECT on wishlist_items (column grants)'`. Leave the `service_role` assertion at 28.

- [ ] **Step 5: Run the new test and the whole suite**

Run: `npx supabase test db 2>&1 | tail -15`
Expected: all files pass, `19_claim_columns_private_test.sql` 15/15.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261020000019_claim_columns_private.sql supabase/tests/19_claim_columns_private_test.sql supabase/tests/08_grants_test.sql
git commit -m "feat(db): hide claim columns from owners behind wishlist_items_admin"
```

---

### Task 3: Old screens keep working

The Admin and SelfManaged screens (live until phase 4c) and the owner screen read `wishlist_items` with `select('*')` or `.select()` after writes. Both now fail with permission denied.

**Files:**
- Create: `src/lib/itemColumns.ts`
- Modify: `src/AdminWishlist/services/AdminWishlistService.ts:73-75`
- Modify: `src/SelfManagedWishlist/services/SelfManagedWishlistService.ts:20-21` and `:86`
- Modify: `src/ManageWishlist/services/ManageWishlistService.ts:135` and `:180`
- Modify: `src/Dashboard/services/DashboardService.ts:24` and `:92`
- Modify: `src/integrations/supabase/types.ts` (Views block of the `public` schema, the second `Views:` at about line 192)
- Modify: `CLAUDE.md` (RLS patterns)

**Interfaces:**
- Consumes: view `wishlist_items_admin` and the readable column list from Task 2.
- Produces: `ITEM_COLUMNS` (string) in `src/lib/itemColumns.ts`, the comma-separated non-claim columns for `select(...)` after writes.

- [ ] **Step 1: Create the column constant** `src/lib/itemColumns.ts`

```ts
/**
 * The columns of wishlist_items that every signed-in user may read. The claim
 * columns (is_taken, taken_by_name, taken_at) are only readable through the
 * wishlist_items_admin view, so `select('*')` on the table is refused.
 */
export const ITEM_COLUMNS =
  'id, wishlist_id, title, description, price_range, priority, created_at, updated_at, url, link, is_giftcard, claim_cap';
```

- [ ] **Step 2: Switch the organizer reads to the view**

In `AdminWishlistService.getWishlistItems` (line 73) and `SelfManagedWishlistService.getItems` (line 20) replace `.from('wishlist_items')` with `.from('wishlist_items_admin')` for the `.select('*')` read only. Leave updates, deletes and untakes on the table. The view's column set equals what the screens used (minus the unused legacy `claimed_*`).

- [ ] **Step 3: Replace returning-`*` on item writes**

`ManageWishlistService.ts:135` and `:180` and `SelfManagedWishlistService.ts:86`: change `.select()` to `.select(ITEM_COLUMNS)` and add `import { ITEM_COLUMNS } from '@/lib/itemColumns';`. If `tsc` complains that the returned object lacks `is_taken` etc., make the return type the readable subset (`Omit<WishlistItem, 'is_taken' | 'taken_by_name' | 'taken_at'>`) or cast where the caller only needs the readable fields. Do not add the claim columns back.

- [ ] **Step 4: Dashboard counts**

`DashboardService.ts:24` and `:92`: change `.select('*', { count: 'exact', head: true })` to `.select('id', { count: 'exact', head: true })`.

- [ ] **Step 5: Type the view** in `src/integrations/supabase/types.ts`

Replace the second `Views: { [_ in never]: never }` (the one inside the `public` schema, before `Functions: { "accept_invitation"`) with, in the file's existing style:

```ts
          Views: {
            "wishlist_items_admin": {
              Row: {
                "claim_cap": number | null,"created_at": string,"description": string | null,"id": string,"is_giftcard": boolean | null,"is_taken": boolean,"link": string | null,"price_range": string | null,"priority": number | null,"taken_at": string | null,"taken_by_name": string | null,"title": string,"updated_at": string,"url": string | null,"wishlist_id": string
              }
              Relationships: []
            }
          }
```

- [ ] **Step 6: Grep gate and static checks**

Run:
```bash
grep -rn -A4 "from('wishlist_items')" src | grep -nE "select\('\*'|\.select\(\)" ; echo "grep exit: $?"
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS"
npm run build 2>&1 | tail -2
```
Expected: grep prints nothing and `grep exit: 1`; tsc shows only the 2 pre-existing errors (`src/AdminWishlist/hooks/useAdminWishlist.ts:218`, `src/Dashboard/components/index.ts:7`); build succeeds. `npm run lint` keeps its 4 pre-existing errors.

- [ ] **Step 7: Browser verification against local Supabase**

Run the app (`npm run dev:local` in this worktree), with the e2e data (users `anna@e2e.se` owner and `erik@e2e.se` organizer, password `Passw0rd!`; reseed with `docker exec -i supabase_db_pjiofxvhzcengexymoms psql -U postgres < /tmp/p3-seed.sql` if the data is gone). Use Chrome DevTools MCP, isolated contexts per user, and watch the network tab for any 4xx on `wishlist_items`:

1. Anna (owner): dashboard shows item counts; open her list's manage screen; the items load; add an item; edit it; delete it. Note the share link exists, so editing existing items shows the limited dialog (frontend) and a direct update would be refused by the database.
2. Erik (organizer): admin screen loads items with taken-by names; untake an item; remove a single gift-card claim; edit an item.
3. Anna creates a self-managed list from the dashboard: add an item, edit it, delete it, open the share link area.
4. As Anna in the console: `await supabase.from('wishlist_items').select('is_taken')` is refused (add a quick fetch via the page's own network: use evaluate_script with `fetch` to `<SUPABASE_URL>/rest/v1/wishlist_items?select=is_taken` using the stored session token) and returns an error with code `42501`.

Expected: no 4xx other than the deliberate probe in step 4; no console errors.

- [ ] **Step 8: Document the rule** in `CLAUDE.md`

Under `### RLS patterns` add:

```
- Claim data (`is_taken`, `taken_by_name`, `taken_at`) is not readable from `wishlist_items` by any signed-in user. Organizers read it through the `wishlist_items_admin` view; use `ITEM_COLUMNS` from `src/lib/itemColumns.ts` (never `select('*')` or a bare `.select()`) on the table. A new column on `wishlist_items` needs an explicit `GRANT SELECT (col)` for `authenticated`.
- The owner of a non-self-managed list cannot update or delete existing items while an active share link exists (changes go through `request_item_change`).
```

- [ ] **Step 9: Full checks and commit**

Run: `npx supabase db reset 2>&1 | tail -3 && npm run test:db 2>&1 | tail -8 && npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"`
Expected: db tests all pass (19 files), unit tests 21/21.

```bash
git add src/lib/itemColumns.ts src/AdminWishlist/services/AdminWishlistService.ts src/SelfManagedWishlist/services/SelfManagedWishlistService.ts src/ManageWishlist/services/ManageWishlistService.ts src/Dashboard/services/DashboardService.ts src/integrations/supabase/types.ts CLAUDE.md
git commit -m "feat: read claims through wishlist_items_admin; stop selecting claim columns"
```
