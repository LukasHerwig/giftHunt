# Phase 1a – RLS lockdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every role can only read and write what the current app already lets it do in the UI – with no visible UI change.

**Architecture:** Replace every table policy in `public` with least-privilege policies for `authenticated`, built on small `SECURITY DEFINER` helper functions (no cross-table RLS recursion). Everything an anonymous user or an invitee-before-sign-in needs (share page, claiming, invitation lookup) moves into `SECURITY DEFINER` RPC functions that take the secret token as an argument, so tables never have to be readable by `anon`. The frontend services switch the affected calls to `supabase.rpc(...)`. RLS is covered by pgTAP tests run with `npx supabase test db`.

**Tech Stack:** Supabase (Postgres 17, PostgREST, RLS), pgTAP via `supabase test db`, React 18 + TypeScript, supabase-js v2.

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` (section 6). Phase 1a is the security prerequisite found while planning phase 1: the live database is readable and writable far beyond what the UI allows. Phase 1b (spec section 6: `is_active`, change requests, owner edit lock, hiding taken columns from the owner) is a separate plan on top of this one.

## Global Constraints

- No UI changes. The only user-visible text change is clearer claim error messages (Task 9), through i18n keys in both `src/locales/en.json` and `src/locales/sv.json`.
- All schema changes are migrations in `supabase/migrations/`, timestamp prefix `20261020…`, applied locally with `npx supabase db reset` before anything reaches production.
- **Merging to `main` runs `npx supabase db push` against production automatically** (`.github/workflows/deploy.yml:40-45`) and deploys the frontend in the same run. Migrations and the frontend changes therefore ship in one PR.
- Supabase stops auto-granting new tables from 2026-10-30: every grant this plan relies on is written explicitly (Task 8).
- Every `SECURITY DEFINER` function sets `search_path = public` and has explicit `revoke execute … from public, anon` / `grant execute … to <roles>`.
- Policies are created `to authenticated` (never `public`); `anon` gets no table privileges at all after Task 8.
- Existing behaviour that stays: one admin per wishlist, one invitation per wishlist, removing the admin deletes share links and untakes items, a self-managed list's creator is also its admin (`wishlist_admins` row).
- Out of scope (phase 1b): the owner can still read `is_taken` / `taken_by_name` on `wishlist_items` through the API.

## Roles used in this plan

| Role | Meaning |
|---|---|
| anon | not signed in (share page, invitation page before sign-in) |
| owner | `wishlists.creator_id = auth.uid()` |
| admin / organizer | has a `wishlist_admins` row for the wishlist (includes a self-managed list's creator) |
| invitee | signed in with the email of a pending, unexpired `admin_invitations` row |
| stranger | signed in, none of the above |

## Target access matrix

| Table | owner | admin | invitee | stranger | anon |
|---|---|---|---|---|---|
| `wishlists` | all | select | select | – | – |
| `wishlist_items` | all | all | – | – | – |
| `item_claims` | – | select, delete | – | – | – |
| `share_links` | – (existence via RPC) | all | – | – | – |
| `wishlist_admins` | select, delete; insert self only on a self-managed list | select own row | – | – | – |
| `admin_invitations` | all (own wishlist) | – | select own | – | – |
| `profiles` | own: all; read profiles of people they share a wishlist or pending invitation with | same | same | own only | – |

RPCs: `get_shared_wishlist`, `claim_shared_item`, `get_invitation_by_token` (anon + authenticated); `accept_invitation`, `wishlist_has_share_link`, `remove_wishlist_admin` (authenticated).

## Review Focus

- **Keep-alive user isn't owner/admin of the keep-alive wishlist** → the daily workflow starts failing after merge. Expected: it keeps passing. Pinned by the pre-merge check in Task 12, step 2.
- **Invitation email differs in letter case from the account email** (`Anna@x.se` vs `anna@x.se`) → the invitee can't see or accept it. Expected: matching is case-insensitive. Pinned by a test in Task 6.
- **Two givers claim the same regular item at the same time** → the second silently overwrites the first giver's name. Expected: the second gets "already taken". Pinned by the `already_taken` test in Task 5 (the RPC locks the row with `for update`).
- **Gift card at its cap gets one more claim** → today only the UI prevents it. Expected: the database refuses. Pinned by the `claim_cap_reached` test in Task 5.
- **Share token for list A used to claim an item on list B** → today possible with any item id. Expected: refused. Pinned by the `item_not_found` test in Task 5.

## File structure

| File | Responsibility |
|---|---|
| `supabase/tests/_seed.psql` | Shared fixture (users, wishlists, items, claims, links, invitations) and `:as_<role>` login snippets. Included by every test with `\ir`; not run on its own (pg_prove only picks `*.sql`). |
| `supabase/tests/01_helpers_test.sql` … `08_grants_test.sql` | One pgTAP file per task |
| `supabase/migrations/20261020000001_rls_helpers.sql` | Helper functions |
| `supabase/migrations/20261020000002_rls_wishlists_items.sql` | `wishlists`, `wishlist_items` policies |
| `supabase/migrations/20261020000003_rls_claims_share_links.sql` | `item_claims`, `share_links` policies |
| `supabase/migrations/20261020000004_rls_invitations_admins_profiles.sql` | `admin_invitations`, `wishlist_admins`, `profiles` policies |
| `supabase/migrations/20261020000005_rpc_shared_wishlist.sql` | `get_shared_wishlist`, `claim_shared_item` |
| `supabase/migrations/20261020000006_rpc_invitations.sql` | `get_invitation_by_token`, `accept_invitation` |
| `supabase/migrations/20261020000007_rpc_owner.sql` | `wishlist_has_share_link`, `remove_wishlist_admin` |
| `supabase/migrations/20261020000008_table_grants.sql` | Revoke `anon`, explicit grants for `authenticated` and `service_role` |
| `src/integrations/supabase/types.ts` | Regenerated (RPC types) |
| `src/PublicWishlist/services/PublicWishlistService.ts`, `src/PublicWishlist/hooks/usePublicWishlist.ts`, `src/PublicWishlist/types.ts` | Share page via RPC |
| `src/AcceptInvitation/services/AcceptInvitationService.ts`, `src/AcceptInvitation/hooks/useAcceptInvitation.ts`, `src/AcceptInvitation/types.ts`, `src/AcceptInvitation/README.md` | Invitation page via RPC |
| `src/Dashboard/services/DashboardService.ts` | Accept via RPC |
| `src/ManageWishlist/services/ManageWishlistService.ts` | Share-link existence and admin removal via RPC |
| `package.json` | `test:db` script |

## How to run things

- Docker must be running. Start the stack once: `npx supabase start`.
- Apply all migrations from scratch: `npx supabase db reset`
- Run the database tests: `npx supabase test db` (expected tail: `Result: PASS`)
- pgTAP error codes used in tests: `42501` = permission denied / RLS violation, `P0001` = raised by our functions, `P0002` = not found raised by our functions, `23505` = unique violation.

---

### Task 1: Test fixture, `test:db` script and helper functions

**Files:**
- Create: `supabase/tests/_seed.psql`
- Create: `supabase/tests/01_helpers_test.sql`
- Create: `supabase/migrations/20261020000001_rls_helpers.sql`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces (SQL, all `stable security definer`, executable by `authenticated` only):
  - `public.is_wishlist_owner(p_wishlist_id uuid) returns boolean`
  - `public.is_wishlist_admin(p_wishlist_id uuid) returns boolean`
  - `public.item_wishlist_id(p_item_id uuid) returns uuid`
  - `public.has_pending_invitation(p_wishlist_id uuid) returns boolean`
  - `public.can_see_profile(p_profile_id uuid) returns boolean`
- Produces (tests): psql variables `:w1 :w2 :w3 :w4 :i1 :i2 :i3 :i4 :inv_w2 :inv_w4 :u_owner :u_admin :u_stranger :u_invitee :u_self` and login snippets `:as_owner :as_admin :as_stranger :as_invitee :as_self :as_anon`. After a snippet, run `reset role;` before switching to another user or checking state as `postgres`.

- [ ] **Step 1: Write the fixture**

Create `supabase/tests/_seed.psql`:

```sql
-- Shared fixture for every RLS test. Included with \ir from each *_test.sql
-- inside that test's transaction, so everything is rolled back afterwards.
-- Not a test itself: pg_prove only runs *.sql files.

\set u_owner    '11111111-0000-0000-0000-000000000001'
\set u_admin    '11111111-0000-0000-0000-000000000002'
\set u_stranger '11111111-0000-0000-0000-000000000003'
\set u_invitee  '11111111-0000-0000-0000-000000000004'
\set u_self     '11111111-0000-0000-0000-000000000005'

\set w1 'aaaaaaaa-0000-0000-0000-000000000001'
\set w2 'aaaaaaaa-0000-0000-0000-000000000002'
\set w3 'aaaaaaaa-0000-0000-0000-000000000003'
\set w4 'aaaaaaaa-0000-0000-0000-000000000004'

\set i1 'bbbbbbbb-0000-0000-0000-000000000001'
\set i2 'bbbbbbbb-0000-0000-0000-000000000002'
\set i3 'bbbbbbbb-0000-0000-0000-000000000003'
\set i4 'bbbbbbbb-0000-0000-0000-000000000004'

\set inv_w2 'cccccccc-0000-0000-0000-000000000002'
\set inv_w4 'cccccccc-0000-0000-0000-000000000004'

-- Users (the on_auth_user_created trigger creates the profiles)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', :'u_owner',    'authenticated', 'authenticated', 'owner@test.se',    '', '{}', '{"full_name":"Olle Owner"}',    now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'u_admin',    'authenticated', 'authenticated', 'admin@test.se',    '', '{}', '{"full_name":"Ada Admin"}',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'u_stranger', 'authenticated', 'authenticated', 'stranger@test.se', '', '{}', '{"full_name":"Sam Stranger"}',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'u_invitee',  'authenticated', 'authenticated', 'invitee@test.se',  '', '{}', '{"full_name":"Ivy Invitee"}',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'u_self',     'authenticated', 'authenticated', 'self@test.se',     '', '{}', '{"full_name":"Siri Self"}',     now(), now());

-- W1: owner's list, organized by admin, shared with token tok-w1
-- W2: owner's list, pending invitation to Invitee@test.se (mixed case on purpose)
-- W3: self-managed list of u_self
-- W4: owner's list with an expired share link and an expired invitation
insert into public.wishlists (id, title, creator_id, is_self_managed) values
  (:'w1', 'Födelsedag', :'u_owner', false),
  (:'w2', 'Jul',        :'u_owner', false),
  (:'w3', 'Babyshower', :'u_self',  true),
  (:'w4', 'Gammal',     :'u_owner', false);

insert into public.wishlist_admins (wishlist_id, admin_id, invited_by) values
  (:'w1', :'u_admin', :'u_owner'),
  (:'w3', :'u_self',  :'u_self');

insert into public.wishlist_items (id, wishlist_id, title, is_giftcard, claim_cap, is_taken, taken_by_name, priority) values
  (:'i1', :'w1', 'Bok',         false, null, false, null, 2),
  (:'i2', :'w1', 'Presentkort', true,  2,    false, null, 3),
  (:'i3', :'w1', 'Lampa',       false, null, true,  'Lo', 1),
  (:'i4', :'w3', 'Napp',        false, null, false, null, 2);

insert into public.item_claims (item_id, claimer_name) values (:'i2', 'Kim');

insert into public.share_links (wishlist_id, token, created_by, expires_at) values
  (:'w1', 'tok-w1',      :'u_admin', null),
  (:'w4', 'tok-expired', :'u_owner', now() - interval '1 day');

insert into public.admin_invitations (id, wishlist_id, email, invitation_token, invited_by, expires_at) values
  (:'inv_w2', :'w2', 'Invitee@test.se', 'inv-w2',      :'u_owner', now() + interval '7 days'),
  (:'inv_w4', :'w4', 'invitee@test.se', 'inv-expired', :'u_owner', now() - interval '1 day');

-- Login snippets: expand with :as_owner etc. Run `reset role;` before switching.
\set as_owner    'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000001","email":"owner@test.se","role":"authenticated"}''; set local role authenticated;'
\set as_admin    'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000002","email":"admin@test.se","role":"authenticated"}''; set local role authenticated;'
\set as_stranger 'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000003","email":"stranger@test.se","role":"authenticated"}''; set local role authenticated;'
\set as_invitee  'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000004","email":"invitee@test.se","role":"authenticated"}''; set local role authenticated;'
\set as_self     'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000005","email":"self@test.se","role":"authenticated"}''; set local role authenticated;'
\set as_anon     'set local request.jwt.claims = ''{"role":"anon"}''; set local role anon;'
```

- [ ] **Step 2: Write the failing helper test**

Create `supabase/tests/01_helpers_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);
\ir _seed.psql

:as_owner
select ok(public.is_wishlist_owner(:'w1'), 'owner owns W1');
select ok(not public.is_wishlist_admin(:'w1'), 'owner is not admin of W1');
select ok(public.can_see_profile(:'u_admin'), 'owner can see the admin of their list');
select ok(not public.can_see_profile(:'u_stranger'), 'owner cannot see a stranger');
reset role;

:as_admin
select ok(public.is_wishlist_admin(:'w1'), 'admin administers W1');
select is(public.item_wishlist_id(:'i1'), :'w1'::uuid, 'item_wishlist_id resolves the wishlist');
reset role;

:as_invitee
select ok(public.has_pending_invitation(:'w2'), 'invitee has a pending invitation to W2 (case-insensitive email)');
select ok(not public.has_pending_invitation(:'w4'), 'expired invitation does not count');
reset role;

:as_anon
select throws_ok(
  $$ select public.is_wishlist_owner('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', null, 'anon cannot call the helpers');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 3: Add the `test:db` script and run the test to verify it fails**

In `package.json` `"scripts"`, add after `"keepalive"`:

```json
    "test:db": "supabase test db"
```

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `01_helpers_test.sql` with `function public.is_wishlist_owner(unknown) does not exist`.

- [ ] **Step 4: Write the helper migration**

Create `supabase/migrations/20261020000001_rls_helpers.sql`:

```sql
-- Helper functions for RLS policies. SECURITY DEFINER so a policy on one table
-- can check another table without triggering that table's policies (no recursion).

create or replace function public.is_wishlist_owner(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wishlists where id = p_wishlist_id and creator_id = auth.uid()
  );
$$;

create or replace function public.is_wishlist_admin(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wishlist_admins where wishlist_id = p_wishlist_id and admin_id = auth.uid()
  );
$$;

create or replace function public.item_wishlist_id(p_item_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select wishlist_id from wishlist_items where id = p_item_id;
$$;

create or replace function public.has_pending_invitation(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_invitations
    where wishlist_id = p_wishlist_id
      and lower(email) = lower(auth.jwt() ->> 'email')
      and accepted = false
      and (expires_at is null or expires_at > now())
  );
$$;

-- True for your own profile, for the owner/admin you share a wishlist with,
-- and for the sender of a pending invitation to you.
create or replace function public.can_see_profile(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_profile_id = auth.uid()
    or exists (
      select 1 from wishlists w
      join wishlist_admins wa on wa.wishlist_id = w.id
      where (w.creator_id = auth.uid() and wa.admin_id = p_profile_id)
         or (wa.admin_id = auth.uid() and w.creator_id = p_profile_id)
    )
    or exists (
      select 1 from admin_invitations ai
      where ai.invited_by = p_profile_id
        and lower(ai.email) = lower(auth.jwt() ->> 'email')
        and ai.accepted = false
        and (ai.expires_at is null or ai.expires_at > now())
    );
$$;

revoke execute on function public.is_wishlist_owner(uuid)      from public, anon;
revoke execute on function public.is_wishlist_admin(uuid)      from public, anon;
revoke execute on function public.item_wishlist_id(uuid)       from public, anon;
revoke execute on function public.has_pending_invitation(uuid) from public, anon;
revoke execute on function public.can_see_profile(uuid)        from public, anon;

grant execute on function public.is_wishlist_owner(uuid)      to authenticated, service_role;
grant execute on function public.is_wishlist_admin(uuid)      to authenticated, service_role;
grant execute on function public.item_wishlist_id(uuid)       to authenticated, service_role;
grant execute on function public.has_pending_invitation(uuid) to authenticated, service_role;
grant execute on function public.can_see_profile(uuid)        to authenticated, service_role;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx supabase db reset && npm run test:db`
Expected: `01_helpers_test.sql .. ok`, `Result: PASS`.

- [ ] **Step 6: Commit**

```bash
git add package.json supabase/tests/_seed.psql supabase/tests/01_helpers_test.sql supabase/migrations/20261020000001_rls_helpers.sql
git commit -m "feat(db): add RLS helper functions and pgTAP fixture"
```

---

### Task 2: Policies for `wishlists` and `wishlist_items`

**Files:**
- Create: `supabase/tests/02_wishlists_items_test.sql`
- Create: `supabase/migrations/20261020000002_rls_wishlists_items.sql`

**Interfaces:**
- Consumes: `is_wishlist_admin`, `is_wishlist_owner`, `has_pending_invitation` (Task 1); fixture (Task 1).
- Produces: policies `wishlists_owner_all`, `wishlists_admin_read`, `wishlists_invitee_read`, `items_owner_all`, `items_admin_all`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/02_wishlists_items_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);
\ir _seed.psql

-- Stranger: sees and changes nothing
:as_stranger
select is((select count(*)::int from wishlists), 0, 'stranger sees no wishlists');
select is((select count(*)::int from wishlist_items), 0, 'stranger sees no items');
update wishlist_items set title = 'Hacked' where id = :'i1';
delete from wishlist_items where id = :'i1';
select throws_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'X') $$,
  '42501', null, 'stranger cannot add items');
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok', 'stranger update and delete had no effect');

-- (anon is covered by 08_grants_test.sql: after Task 8 anon has no table privileges at all)

-- Owner: full access to own lists
:as_owner
select is((select count(*)::int from wishlists), 3, 'owner sees their three lists');
select is((select count(*)::int from wishlist_items where wishlist_id = :'w1'), 3, 'owner sees W1 items');
select lives_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ny') $$,
  'owner can add items');
update wishlist_items set title = 'Bok 2' where id = :'i1';
select is((select count(*)::int from wishlist_items where wishlist_id = :'w3'), 0, 'owner cannot see someone else''s list items');
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok 2', 'owner update applied');

-- Admin: reads the list, full access to its items
:as_admin
select is((select count(*)::int from wishlists), 1, 'admin sees the list they organize');
update wishlist_items set is_taken = false, taken_by_name = null where id = :'i3';
update wishlists set title = 'X' where id = :'w1';
reset role;
select ok(not (select is_taken from wishlist_items where id = :'i3'), 'admin can untake an item');
select is((select title from wishlists where id = :'w1'), 'Födelsedag', 'admin cannot change the list itself');

-- Invitee: can read the list they are invited to, nothing else
:as_invitee
select is((select title from wishlists where id = :'w2'), 'Jul', 'invitee sees the invited list');
select is((select count(*)::int from wishlists where id <> :'w2'), 0, 'invitee sees no other list');
reset role;

select * from finish();
rollback;
```

Note: RLS makes an `UPDATE`/`DELETE` on rows the role may not change silently affect 0 rows (no error), so those checks switch back to `postgres` with `reset role` and inspect the row. Only `INSERT … ` violating `WITH CHECK` raises `42501`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `02_wishlists_items_test.sql` (for example `stranger sees no wishlists` got 4, `stranger sees no items` got 4).

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000002_rls_wishlists_items.sql`:

```sql
-- wishlists: owner manages, admin and invitee read. Public access goes through
-- get_shared_wishlist() instead of table policies.
drop policy if exists "creators_can_manage_wishlists"        on public.wishlists;
drop policy if exists "admins_can_read_wishlists"            on public.wishlists;
drop policy if exists "public_can_read_via_share_links"      on public.wishlists;
drop policy if exists "allow_wishlist_read_for_invitations"  on public.wishlists;
drop policy if exists "wishlists_admin_read"                 on public.wishlists;
drop policy if exists "wishlists_creator_access"             on public.wishlists;

create policy "wishlists_owner_all" on public.wishlists
  for all to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "wishlists_admin_read" on public.wishlists
  for select to authenticated
  using (public.is_wishlist_admin(id));

create policy "wishlists_invitee_read" on public.wishlists
  for select to authenticated
  using (public.has_pending_invitation(id));

-- wishlist_items: owner and admin of the list. Claiming goes through claim_shared_item().
drop policy if exists "wishlist_items_policy" on public.wishlist_items;

create policy "items_owner_all" on public.wishlist_items
  for all to authenticated
  using (public.is_wishlist_owner(wishlist_id))
  with check (public.is_wishlist_owner(wishlist_id));

create policy "items_admin_all" on public.wishlist_items
  for all to authenticated
  using (public.is_wishlist_admin(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id));
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01_…` and `02_…` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/02_wishlists_items_test.sql supabase/migrations/20261020000002_rls_wishlists_items.sql
git commit -m "fix(db): restrict wishlists and items to owner, admin and invitee"
```

---

### Task 3: Policies for `item_claims` and `share_links`

**Files:**
- Create: `supabase/tests/03_claims_share_links_test.sql`
- Create: `supabase/migrations/20261020000003_rls_claims_share_links.sql`

**Interfaces:**
- Consumes: `is_wishlist_admin`, `item_wishlist_id` (Task 1).
- Produces: policies `claims_admin_read`, `claims_admin_delete`, `share_links_admin_read`, `share_links_admin_insert`, `share_links_admin_update`, `share_links_admin_delete`. After this task the owner cannot read or delete share links directly (Task 7 adds the RPCs the owner uses).

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/03_claims_share_links_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);
\ir _seed.psql

-- Owner: no claims, no share-link tokens (surprise protection)
:as_owner
select is((select count(*)::int from item_claims), 0, 'owner cannot read claims');
select is((select count(*)::int from share_links), 0, 'owner cannot read share links');
delete from share_links where wishlist_id = :'w1';
reset role;
select is((select count(*)::int from share_links where wishlist_id = :'w1'), 1, 'owner cannot delete share links directly');

-- Stranger and anon: nothing
:as_stranger
select is((select count(*)::int from share_links), 0, 'stranger cannot list share links');
select is((select count(*)::int from item_claims), 0, 'stranger cannot read claims');
select throws_ok(
  $$ insert into share_links (wishlist_id, token, created_by) values ('aaaaaaaa-0000-0000-0000-000000000001', 'evil', '11111111-0000-0000-0000-000000000003') $$,
  '42501', null, 'stranger cannot create a share link');
reset role;

:as_anon
select throws_ok(
  $$ insert into item_claims (item_id, claimer_name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Evil') $$,
  '42501', null, 'anon cannot insert claims directly');
reset role;

-- Admin: reads claims and links, can remove a claim and create a link
:as_admin
select is((select count(*)::int from item_claims), 1, 'admin reads claims of their list');
select is((select token from share_links where wishlist_id = :'w1'), 'tok-w1', 'admin reads the share link');
delete from item_claims where item_id = :'i2';
reset role;
select is((select count(*)::int from item_claims where item_id = :'i2'), 0, 'admin can remove a claim');

-- Self-managed creator acts as admin of their own list
:as_self
select lives_ok(
  $$ insert into share_links (wishlist_id, token, created_by) values ('aaaaaaaa-0000-0000-0000-000000000003', 'tok-w3', '11111111-0000-0000-0000-000000000005') $$,
  'self-managed creator can create a share link');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `03_claims_share_links_test.sql` (for example `owner cannot read claims` got 1, `stranger cannot list share links` got 2).

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000003_rls_claims_share_links.sql`:

```sql
-- item_claims: only the list's admin reads or removes claims. Givers claim
-- through claim_shared_item().
drop policy if exists "anyone_can_insert_claims" on public.item_claims;
drop policy if exists "anyone_can_read_claims"   on public.item_claims;
drop policy if exists "admins_can_delete_claims" on public.item_claims;

create policy "claims_admin_read" on public.item_claims
  for select to authenticated
  using (public.is_wishlist_admin(public.item_wishlist_id(item_id)));

create policy "claims_admin_delete" on public.item_claims
  for delete to authenticated
  using (public.is_wishlist_admin(public.item_wishlist_id(item_id)));

-- share_links: admin only. The owner never sees the token; anon resolves a
-- token through get_shared_wishlist().
drop policy if exists "anyone_can_read_share_links"     on public.share_links;
drop policy if exists "creators_can_manage_share_links" on public.share_links;
drop policy if exists "share_links_create"              on public.share_links;
drop policy if exists "share_links_delete"              on public.share_links;
drop policy if exists "share_links_own_access"          on public.share_links;
drop policy if exists "share_links_update"              on public.share_links;

create policy "share_links_admin_read" on public.share_links
  for select to authenticated
  using (public.is_wishlist_admin(wishlist_id));

create policy "share_links_admin_insert" on public.share_links
  for insert to authenticated
  with check (public.is_wishlist_admin(wishlist_id) and created_by = auth.uid());

create policy "share_links_admin_update" on public.share_links
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id));

create policy "share_links_admin_delete" on public.share_links
  for delete to authenticated
  using (public.is_wishlist_admin(wishlist_id));
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`03` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/03_claims_share_links_test.sql supabase/migrations/20261020000003_rls_claims_share_links.sql
git commit -m "fix(db): restrict claims and share links to the list admin"
```

---

### Task 4: Policies for `admin_invitations`, `wishlist_admins` and `profiles`

**Files:**
- Create: `supabase/tests/04_invitations_admins_profiles_test.sql`
- Create: `supabase/migrations/20261020000004_rls_invitations_admins_profiles.sql`

**Interfaces:**
- Consumes: `is_wishlist_owner`, `can_see_profile` (Task 1).
- Produces: policies `invitations_owner_all`, `invitations_invitee_read`, `admins_read`, `admins_owner_self_insert`, `admins_owner_delete`, `profiles_own_all`, `profiles_related_read`. Invitees can no longer update invitations directly (Task 6 adds `accept_invitation`).

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/04_invitations_admins_profiles_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);
\ir _seed.psql

-- Stranger
:as_stranger
select is((select count(*)::int from admin_invitations), 0, 'stranger cannot read invitations');
select is((select count(*)::int from profiles), 1, 'stranger only sees their own profile');
select is((select count(*)::int from wishlist_admins), 0, 'stranger sees no admin rows');
update admin_invitations set accepted = true where id = :'inv_w2';
reset role;
select ok(not (select accepted from admin_invitations where id = :'inv_w2'), 'stranger cannot accept someone else''s invitation');

-- Invitee: own invitation and the inviter's profile, no direct accept
:as_invitee
select is((select count(*)::int from admin_invitations), 2, 'invitee sees their invitations (case-insensitive email)');
select is((select full_name from profiles where id = :'u_owner'), 'Olle Owner', 'invitee sees the inviter''s profile');
update admin_invitations set accepted = true where id = :'inv_w2';
reset role;
select ok(not (select accepted from admin_invitations where id = :'inv_w2'), 'invitee cannot accept by direct update');

-- Owner: own invitations, the admin's profile, no admin rows for non-self-managed lists
:as_owner
select is((select count(*)::int from admin_invitations), 2, 'owner sees invitations for their lists');
select is((select email from profiles where id = :'u_admin'), 'admin@test.se', 'owner sees the admin''s profile');
select is((select count(*)::int from profiles where id = :'u_stranger'), 0, 'owner cannot see a stranger''s profile');
select throws_ok(
  $$ insert into wishlist_admins (wishlist_id, admin_id, invited_by) values ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001') $$,
  '42501', null, 'owner cannot make themselves admin of a normal list');
reset role;

-- Admin: sees the owner's profile
:as_admin
select is((select full_name from profiles where id = :'u_owner'), 'Olle Owner', 'admin sees the owner''s profile');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `04_invitations_admins_profiles_test.sql` (for example `stranger cannot read invitations` got 2, `stranger only sees their own profile` got 5).

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000004_rls_invitations_admins_profiles.sql`:

```sql
-- admin_invitations: the owner manages invitations for their lists, the invitee
-- reads their own. Lookup by token and accepting go through RPCs.
drop policy if exists "admin_invitations_policy"       on public.admin_invitations;
drop policy if exists "allow_invitation_read_by_token" on public.admin_invitations;

create policy "invitations_owner_all" on public.admin_invitations
  for all to authenticated
  using (public.is_wishlist_owner(wishlist_id))
  with check (public.is_wishlist_owner(wishlist_id) and invited_by = auth.uid());

create policy "invitations_invitee_read" on public.admin_invitations
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- wishlist_admins: admins see their own row, the owner sees and removes the
-- admin of their list. The owner may add only themselves, and only on a
-- self-managed list. Invited admins are added by accept_invitation().
drop policy if exists "wishlist_admins_insert_allowed" on public.wishlist_admins;
drop policy if exists "wishlist_admins_simple_access"  on public.wishlist_admins;

create policy "admins_read" on public.wishlist_admins
  for select to authenticated
  using (admin_id = auth.uid() or public.is_wishlist_owner(wishlist_id));

create policy "admins_owner_self_insert" on public.wishlist_admins
  for insert to authenticated
  with check (
    admin_id = auth.uid()
    and invited_by = auth.uid()
    and exists (
      select 1 from public.wishlists
      where id = wishlist_id and creator_id = auth.uid() and is_self_managed
    )
  );

create policy "admins_owner_delete" on public.wishlist_admins
  for delete to authenticated
  using (public.is_wishlist_owner(wishlist_id));

-- profiles: your own, plus the people you share a list or a pending invitation with.
drop policy if exists "allow_anon_profile_read"            on public.profiles;
drop policy if exists "allow_profile_read_for_invitations" on public.profiles;
drop policy if exists "profiles_authenticated_read"        on public.profiles;
drop policy if exists "profiles_own_modify"                on public.profiles;
drop policy if exists "users_can_access_own_profile"       on public.profiles;

create policy "profiles_own_all" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_related_read" on public.profiles
  for select to authenticated
  using (public.can_see_profile(id));
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`04` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/04_invitations_admins_profiles_test.sql supabase/migrations/20261020000004_rls_invitations_admins_profiles.sql
git commit -m "fix(db): restrict invitations, admins and profiles"
```

---

### Task 5: RPCs for the share page – `get_shared_wishlist` and `claim_shared_item`

**Files:**
- Create: `supabase/tests/05_shared_rpc_test.sql`
- Create: `supabase/migrations/20261020000005_rpc_shared_wishlist.sql`

**Interfaces:**
- Produces:
  - `public.get_shared_wishlist(p_token text) returns json` – shape
    `{ wishlist: { title, description, enable_links, enable_price, enable_priority, creator_name }, items: [{ id, title, description, link, url, price_range, priority, is_taken, is_giftcard, claim_cap, claim_count }], share_link: { wishlist_id, expires_at } }`.
    Items are ordered `priority desc nulls first, created_at desc` (same as today's PostgREST query). Raises `invalid_link` (P0002) for an unknown token, `expired_link` (P0001) for an expired one. Never returns `taken_by_name`, `taken_at` or claimer names.
  - `public.claim_shared_item(p_token text, p_item_id uuid, p_name text) returns void`. Raises `invalid_name` (22023) for an empty or >100-character name, `invalid_link` (P0002), `item_not_found` (P0002) when the item is not on the token's list, `already_taken` (P0001), `claim_cap_reached` (P0001); a repeated gift-card name raises the unique violation `23505`.
  - Both executable by `anon` and `authenticated`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/05_shared_rpc_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);
\ir _seed.psql

:as_anon
select is(public.get_shared_wishlist('tok-w1') -> 'wishlist' ->> 'title', 'Födelsedag', 'anon loads the list by token');
select is(public.get_shared_wishlist('tok-w1') -> 'wishlist' ->> 'creator_name', 'Olle Owner', 'creator name is included');
select is(json_array_length(public.get_shared_wishlist('tok-w1') -> 'items'), 3, 'all items are returned');
select is(public.get_shared_wishlist('tok-w1') -> 'items' -> 0 ->> 'title', 'Presentkort', 'highest priority first');
select is((public.get_shared_wishlist('tok-w1') -> 'items' -> 0 ->> 'claim_count')::int, 1, 'claim count is included');
select ok(not (public.get_shared_wishlist('tok-w1')::jsonb -> 'items' -> 0 ? 'taken_by_name'), 'who took what is never returned');
select throws_ok($$ select public.get_shared_wishlist('nope') $$, 'P0002', 'invalid_link', 'unknown token is refused');
select throws_ok($$ select public.get_shared_wishlist('tok-expired') $$, 'P0001', 'expired_link', 'expired token is refused');

-- Regular item
select lives_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', '  Mia  ') $$, 'anon claims a regular item');
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', 'Noa') $$, 'P0001', 'already_taken', 'a taken item cannot be claimed again');

-- Gift card with claim_cap 2 and one existing claim by Kim
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000002', 'Kim') $$, '23505', null, 'the same name cannot claim a gift card twice');
select lives_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000002', 'Noa') $$, 'second gift-card claim fits under the cap');
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000002', 'Pia') $$, 'P0001', 'claim_cap_reached', 'the cap is enforced');

-- Wrong list, bad name, bad link
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000004', 'Mia') $$, 'P0002', 'item_not_found', 'an item from another list cannot be claimed');
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000004', '   ') $$, '22023', 'invalid_name', 'an empty name is refused');
reset role;

select results_eq(
  $$ select is_taken, taken_by_name from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  $$ values (true, 'Mia') $$,
  'the claim is stored with the trimmed name');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `05_shared_rpc_test.sql` with `function public.get_shared_wishlist(unknown) does not exist`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000005_rpc_shared_wishlist.sql`:

```sql
-- The share page (/shared/:token) for anonymous givers. The token is the secret:
-- without it nothing about the list is readable.

create or replace function public.get_shared_wishlist(p_token text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_link share_links%rowtype;
begin
  select * into v_link from share_links where token = p_token;
  if not found then
    raise exception 'invalid_link' using errcode = 'P0002';
  end if;
  if v_link.expires_at is not null and v_link.expires_at < now() then
    raise exception 'expired_link' using errcode = 'P0001';
  end if;

  return json_build_object(
    'wishlist', (
      select json_build_object(
        'title', w.title,
        'description', w.description,
        'enable_links', w.enable_links,
        'enable_price', w.enable_price,
        'enable_priority', w.enable_priority,
        'creator_name', p.full_name)
      from wishlists w
      left join profiles p on p.id = w.creator_id
      where w.id = v_link.wishlist_id),
    'items', coalesce((
      select json_agg(json_build_object(
          'id', i.id,
          'title', i.title,
          'description', i.description,
          'link', i.link,
          'url', i.url,
          'price_range', i.price_range,
          'priority', i.priority,
          'is_taken', i.is_taken,
          'is_giftcard', i.is_giftcard,
          'claim_cap', i.claim_cap,
          'claim_count', (select count(*) from item_claims c where c.item_id = i.id))
        order by i.priority desc nulls first, i.created_at desc)
      from wishlist_items i
      where i.wishlist_id = v_link.wishlist_id), '[]'::json),
    'share_link', json_build_object(
      'wishlist_id', v_link.wishlist_id,
      'expires_at', v_link.expires_at)
  );
end;
$$;

create or replace function public.claim_shared_item(p_token text, p_item_id uuid, p_name text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  v_link share_links%rowtype;
  v_item wishlist_items%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_name = '' or length(v_name) > 100 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  select * into v_link from share_links where token = p_token;
  if not found or (v_link.expires_at is not null and v_link.expires_at < now()) then
    raise exception 'invalid_link' using errcode = 'P0002';
  end if;

  -- Lock the item so two givers claiming at once are serialized.
  select * into v_item from wishlist_items
  where id = p_item_id and wishlist_id = v_link.wishlist_id
  for update;
  if not found then
    raise exception 'item_not_found' using errcode = 'P0002';
  end if;

  if coalesce(v_item.is_giftcard, false) then
    if v_item.claim_cap is not null
       and (select count(*) from item_claims where item_id = p_item_id) >= v_item.claim_cap then
      raise exception 'claim_cap_reached' using errcode = 'P0001';
    end if;
    -- A repeated name raises the unique violation (23505) the client already handles.
    insert into item_claims (item_id, claimer_name) values (p_item_id, v_name);
  else
    if v_item.is_taken then
      raise exception 'already_taken' using errcode = 'P0001';
    end if;
    update wishlist_items
    set is_taken = true, taken_by_name = v_name, taken_at = now()
    where id = p_item_id;
  end if;
end;
$$;

revoke execute on function public.get_shared_wishlist(text)             from public;
revoke execute on function public.claim_shared_item(text, uuid, text)   from public;
grant execute on function public.get_shared_wishlist(text)              to anon, authenticated, service_role;
grant execute on function public.claim_shared_item(text, uuid, text)    to anon, authenticated, service_role;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`05` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/05_shared_rpc_test.sql supabase/migrations/20261020000005_rpc_shared_wishlist.sql
git commit -m "feat(db): serve the share page and claims through token RPCs"
```

---

### Task 6: RPCs for invitations – `get_invitation_by_token` and `accept_invitation`

**Files:**
- Create: `supabase/tests/06_invitation_rpc_test.sql`
- Create: `supabase/migrations/20261020000006_rpc_invitations.sql`

**Interfaces:**
- Produces:
  - `public.get_invitation_by_token(p_token text) returns json` (anon + authenticated) – `{ id, email, accepted, expires_at, invited_by, wishlist_id, wishlist_title, wishlist_description, inviter_email, inviter_full_name }`, or `null` when the token is unknown.
  - `public.accept_invitation(p_invitation_id uuid) returns void` (authenticated only). Raises `invitation_not_found` (P0002) when the invitation doesn't exist or isn't addressed to the caller's email (case-insensitive), `already_accepted` (P0001), `invitation_expired` (P0001). Inserts the `wishlist_admins` row for `auth.uid()` (on conflict do nothing) and sets `accepted = true`.
  - `create_admin_on_invitation_acceptance()` becomes `security definer` with `search_path = public` (it still runs; its insert hits `on conflict do nothing`).

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/06_invitation_rpc_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
\ir _seed.psql

:as_anon
select is(public.get_invitation_by_token('inv-w2') ->> 'wishlist_title', 'Jul', 'anon reads the invitation by token');
select is(public.get_invitation_by_token('inv-w2') ->> 'inviter_full_name', 'Olle Owner', 'the inviter''s name is included');
select ok(public.get_invitation_by_token('nope') is null, 'unknown token returns null');
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  '42501', null, 'anon cannot accept');
reset role;

:as_stranger
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'P0002', 'invitation_not_found', 'someone else cannot accept the invitation');
reset role;

:as_invitee
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000004') $$,
  'P0001', 'invitation_expired', 'an expired invitation cannot be accepted');
select lives_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'the invitee accepts (Invitee@test.se matches invitee@test.se)');
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'P0001', 'already_accepted', 'it cannot be accepted twice');
reset role;

select ok((select accepted from admin_invitations where id = :'inv_w2'), 'the invitation is marked accepted');
select is(
  (select admin_id from wishlist_admins where wishlist_id = :'w2'), :'u_invitee'::uuid,
  'the invitee is now admin of W2');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `06_invitation_rpc_test.sql` with `function public.get_invitation_by_token(unknown) does not exist`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000006_rpc_invitations.sql`:

```sql
-- /accept-invitation reads the invitation by its token before the invitee has
-- signed in; accepting requires being signed in with the invited email.

create or replace function public.get_invitation_by_token(p_token text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', ai.id,
    'email', ai.email,
    'accepted', ai.accepted,
    'expires_at', ai.expires_at,
    'invited_by', ai.invited_by,
    'wishlist_id', ai.wishlist_id,
    'wishlist_title', w.title,
    'wishlist_description', w.description,
    'inviter_email', p.email,
    'inviter_full_name', p.full_name)
  from admin_invitations ai
  join wishlists w on w.id = ai.wishlist_id
  left join profiles p on p.id = ai.invited_by
  where ai.invitation_token = p_token;
$$;

create or replace function public.accept_invitation(p_invitation_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  v_inv admin_invitations%rowtype;
begin
  select * into v_inv from admin_invitations where id = p_invitation_id for update;
  if not found or lower(v_inv.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'invitation_not_found' using errcode = 'P0002';
  end if;
  if v_inv.accepted then
    raise exception 'already_accepted' using errcode = 'P0001';
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  -- Insert the admin row for the caller directly: the existing trigger looks the
  -- user up by exact email and would miss a differently-cased invitation.
  insert into wishlist_admins (wishlist_id, admin_id, invited_by)
  values (v_inv.wishlist_id, auth.uid(), v_inv.invited_by)
  on conflict (wishlist_id) do nothing;

  update admin_invitations set accepted = true where id = p_invitation_id;
end;
$$;

alter function public.create_admin_on_invitation_acceptance() security definer set search_path = public;

revoke execute on function public.get_invitation_by_token(text) from public;
revoke execute on function public.accept_invitation(uuid)       from public, anon;
grant execute on function public.get_invitation_by_token(text)  to anon, authenticated, service_role;
grant execute on function public.accept_invitation(uuid)        to authenticated, service_role;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`06` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/06_invitation_rpc_test.sql supabase/migrations/20261020000006_rpc_invitations.sql
git commit -m "feat(db): look up and accept invitations through RPCs"
```

---

### Task 7: Owner RPCs – `wishlist_has_share_link` and `remove_wishlist_admin`

**Files:**
- Create: `supabase/tests/07_owner_rpc_test.sql`
- Create: `supabase/migrations/20261020000007_rpc_owner.sql`

**Interfaces:**
- Consumes: `is_wishlist_owner`, `is_wishlist_admin` (Task 1).
- Produces:
  - `public.wishlist_has_share_link(p_wishlist_id uuid) returns boolean` (authenticated) – true when the list has an unexpired share link and the caller is its owner or admin; false otherwise. Never returns the token.
  - `public.remove_wishlist_admin(p_wishlist_id uuid) returns json` (authenticated) – owner only (`not_owner`, 42501). Deletes the list's share links, untakes its taken items, deletes the admin row and that admin's invitation. Returns `{ admin_email: text | null, had_share_links: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/07_owner_rpc_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
\ir _seed.psql

:as_owner
select ok(public.wishlist_has_share_link(:'w1'), 'owner learns W1 is shared');
select ok(not public.wishlist_has_share_link(:'w2'), 'W2 is not shared');
select ok(not public.wishlist_has_share_link(:'w4'), 'an expired link does not count');
reset role;

:as_stranger
select ok(not public.wishlist_has_share_link(:'w1'), 'a stranger learns nothing');
select throws_ok(
  $$ select public.remove_wishlist_admin('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_owner', 'only the owner can remove the admin');
reset role;

:as_owner
select is(
  public.remove_wishlist_admin(:'w1')::jsonb,
  '{"admin_email": "admin@test.se", "had_share_links": true}'::jsonb,
  'owner removes the admin and learns links were deleted');
reset role;

select is((select count(*)::int from share_links where wishlist_id = :'w1'), 0, 'share links are deleted');
select is((select count(*)::int from wishlist_admins where wishlist_id = :'w1'), 0, 'the admin row is deleted');
select ok(not (select is_taken from wishlist_items where id = :'i3'), 'taken items are untaken');

:as_owner
select is(
  public.remove_wishlist_admin(:'w2')::jsonb,
  '{"admin_email": null, "had_share_links": false}'::jsonb,
  'removing when there is no admin is harmless');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `07_owner_rpc_test.sql` with `function public.wishlist_has_share_link(unknown) does not exist`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000007_rpc_owner.sql`:

```sql
-- The owner may know whether their list is shared (it limits editing), but never
-- the token itself.
create or replace function public.wishlist_has_share_link(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (public.is_wishlist_owner(p_wishlist_id) or public.is_wishlist_admin(p_wishlist_id))
    and exists (
      select 1 from share_links
      where wishlist_id = p_wishlist_id
        and (expires_at is null or expires_at > now())
    );
$$;

-- Removing the admin also removes what only the admin could manage, in one
-- transaction: share links, taken status, and the admin's invitation.
create or replace function public.remove_wishlist_admin(p_wishlist_id uuid)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_email text;
  v_had_links boolean;
begin
  if not public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select p.email into v_email
  from wishlist_admins wa
  join profiles p on p.id = wa.admin_id
  where wa.wishlist_id = p_wishlist_id;

  with deleted as (
    delete from share_links where wishlist_id = p_wishlist_id returning 1
  )
  select count(*) > 0 into v_had_links from deleted;

  update wishlist_items
  set is_taken = false, taken_by_name = null, taken_at = null
  where wishlist_id = p_wishlist_id and is_taken;

  delete from wishlist_admins where wishlist_id = p_wishlist_id;

  if v_email is not null then
    delete from admin_invitations
    where wishlist_id = p_wishlist_id and lower(email) = lower(v_email);
  end if;

  return json_build_object('admin_email', v_email, 'had_share_links', v_had_links);
end;
$$;

revoke execute on function public.wishlist_has_share_link(uuid) from public, anon;
revoke execute on function public.remove_wishlist_admin(uuid)   from public, anon;
grant execute on function public.wishlist_has_share_link(uuid)  to authenticated, service_role;
grant execute on function public.remove_wishlist_admin(uuid)    to authenticated, service_role;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`07` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/07_owner_rpc_test.sql supabase/migrations/20261020000007_rpc_owner.sql
git commit -m "feat(db): owner RPCs for share-link status and admin removal"
```

---

### Task 8: Table grants – no `anon`, explicit `authenticated` and `service_role`

**Files:**
- Create: `supabase/tests/08_grants_test.sql`
- Create: `supabase/migrations/20261020000008_table_grants.sql`

**Interfaces:**
- Produces: `anon` has no privilege on any `public` table; `authenticated` and `service_role` have `select, insert, update, delete` on all seven tables (explicit, so a fresh `db reset` after 2026-10-30 behaves the same as production).

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/08_grants_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);
\ir _seed.psql

:as_anon
select throws_ok($$ select count(*) from public.share_links $$, '42501', null, 'anon cannot list share tokens');
select throws_ok($$ select count(*) from public.profiles $$, '42501', null, 'anon cannot read profiles or emails');
select lives_ok($$ select public.get_shared_wishlist('tok-w1') $$, 'anon can still load the share page');
reset role;

select is(
  (select count(*)::int
   from unnest(array['wishlists','wishlist_items','item_claims','share_links','wishlist_admins','admin_invitations','profiles']) t,
        unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('anon', 'public.' || t, p)),
  0, 'anon has no table privileges');

select is(
  (select count(*)::int
   from unnest(array['wishlists','wishlist_items','item_claims','share_links','wishlist_admins','admin_invitations','profiles']) t,
        unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('authenticated', 'public.' || t, p)),
  28, 'authenticated has full DML (RLS decides the rows)');

select is(
  (select count(*)::int
   from unnest(array['wishlists','wishlist_items','item_claims','share_links','wishlist_admins','admin_invitations','profiles']) t,
        unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('service_role', 'public.' || t, p)),
  28, 'service_role has full DML');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `08_grants_test.sql` – `anon cannot list share tokens` did not throw, `anon has no table privileges` got a number above 0 (the grants from `20260616000001_fix_public_wishlist_grants.sql`), and `authenticated has full DML` got less than 28 (`item_claims` has no UPDATE).

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000008_table_grants.sql`:

```sql
-- Anonymous users reach data only through the token RPCs (get_shared_wishlist,
-- claim_shared_item, get_invitation_by_token). Grants are explicit because
-- Supabase stops auto-granting new public tables on 2026-10-30.
revoke all on public.wishlists, public.wishlist_items, public.item_claims, public.share_links,
              public.wishlist_admins, public.admin_invitations, public.profiles
  from anon;

grant select, insert, update, delete
  on public.wishlists, public.wishlist_items, public.item_claims, public.share_links,
     public.wishlist_admins, public.admin_invitations, public.profiles
  to authenticated, service_role;
```

- [ ] **Step 4: Run all tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`08` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/08_grants_test.sql supabase/migrations/20261020000008_table_grants.sql
git commit -m "fix(db): revoke anon table access and grant roles explicitly"
```

---

### Task 9: Share page uses the RPCs

**Files:**
- Modify: `src/integrations/supabase/types.ts` (regenerated)
- Modify: `src/PublicWishlist/services/PublicWishlistService.ts` (whole file)
- Modify: `src/PublicWishlist/types.ts:40-44`
- Modify: `src/PublicWishlist/hooks/usePublicWishlist.ts` (`claimItem`)
- Modify: `src/locales/en.json`, `src/locales/sv.json` (`publicWishlist` object)

**Interfaces:**
- Consumes: `get_shared_wishlist`, `claim_shared_item` (Task 5).
- Produces: `PublicWishlistService.claimItem({ token, itemId, buyerName })` throws `Error` whose `message` is one of `already_taken | claim_cap_reached | already_claimed | invalid_link | invalid_name | item_not_found`, or another message for unexpected errors.

- [ ] **Step 1: Regenerate the database types**

Run: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`
Expected: `git diff --stat src/integrations/supabase/types.ts` shows additions under `Functions` (`get_shared_wishlist`, `claim_shared_item`, `get_invitation_by_token`, `accept_invitation`, `wishlist_has_share_link`, `remove_wishlist_admin`, and the helpers).

- [ ] **Step 2: Add the token to `ClaimItemData`**

In `src/PublicWishlist/types.ts`, replace:

```ts
export interface ClaimItemData {
  itemId: string;
  buyerName: string;
  isGiftcard?: boolean;
}
```

with:

```ts
export interface ClaimItemData {
  token: string;
  itemId: string;
  buyerName: string;
}
```

- [ ] **Step 3: Rewrite the service**

Replace the contents of `src/PublicWishlist/services/PublicWishlistService.ts` with:

```ts
import { supabase } from '@/integrations/supabase/client';
import { WishlistItem, Wishlist, ShareLink, ClaimItemData } from '../types';

interface SharedWishlistResponse {
  wishlist: Wishlist;
  items: WishlistItem[];
  share_link: ShareLink;
}

export class PublicWishlistService {
  static async loadWishlistByToken(token: string): Promise<{
    wishlist: Wishlist;
    items: WishlistItem[];
    shareLink: ShareLink;
  }> {
    const { data, error } = await supabase.rpc('get_shared_wishlist', {
      p_token: token,
    });

    if (error) {
      if (error.message === 'expired_link') {
        throw new Error('Link has expired');
      }
      throw new Error('Invalid or expired link');
    }

    const result = data as unknown as SharedWishlistResponse;
    return {
      wishlist: result.wishlist,
      items: result.items,
      shareLink: result.share_link,
    };
  }

  static async claimItem({
    token,
    itemId,
    buyerName,
  }: ClaimItemData): Promise<void> {
    const { error } = await supabase.rpc('claim_shared_item', {
      p_token: token,
      p_item_id: itemId,
      p_name: buyerName,
    });

    if (error) {
      // The same name already holds a claim on this gift card
      if (error.code === '23505') {
        throw new Error('already_claimed');
      }
      throw new Error(error.message);
    }
  }
}
```

`loadWishlistByToken` keeps throwing the same English messages as before (no behaviour change on load).

- [ ] **Step 4: Pass the token and translate claim errors in the hook**

In `src/PublicWishlist/hooks/usePublicWishlist.ts`, replace the guard at the top of `claimItem`:

```ts
    if (!state.selectedItem || !state.shareLink) return;
```

with:

```ts
    if (!token || !state.selectedItem || !state.shareLink) return;
```

Replace the service call:

```ts
      await PublicWishlistService.claimItem({
        itemId: state.selectedItem,
        buyerName: state.buyerName,
        isGiftcard,
      });
```

with:

```ts
      await PublicWishlistService.claimItem({
        token,
        itemId: state.selectedItem,
        buyerName: state.buyerName,
      });
```

Replace the error handling in its `catch`:

```ts
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('publicWishlist.failedToClaim');
      toast.error(errorMessage);
```

with:

```ts
      const code = error instanceof Error ? error.message : '';
      const knownCodes = [
        'already_taken',
        'claim_cap_reached',
        'already_claimed',
        'invalid_link',
        'invalid_name',
        'item_not_found',
      ];
      toast.error(
        knownCodes.includes(code)
          ? t(`publicWishlist.claimErrors.${code}`)
          : t('publicWishlist.failedToClaim'),
      );
```

Add `token` to the `useCallback` dependency array of `claimItem`:

```ts
  }, [token, state.selectedItem, state.shareLink, state.buyerName, state.items, t]);
```

- [ ] **Step 5: Add the translations**

In `src/locales/en.json`, inside the `"publicWishlist"` object, after `"failedToClaim": "Failed to claim item",` add:

```json
    "claimErrors": {
      "already_taken": "Someone got there first – this item is already taken.",
      "claim_cap_reached": "This item already has enough givers.",
      "already_claimed": "You have already claimed this item.",
      "invalid_link": "This link is invalid or has expired.",
      "invalid_name": "Enter your name (at most 100 characters).",
      "item_not_found": "This item is no longer on the list."
    },
```

In `src/locales/sv.json`, inside `"publicWishlist"`, after `"failedToClaim": "Misslyckades att reservera önskning",` add:

```json
    "claimErrors": {
      "already_taken": "Någon hann före – den här önskningen är redan tagen.",
      "claim_cap_reached": "Den här önskningen har redan tillräckligt många givare.",
      "already_claimed": "Du har redan reserverat den här önskningen.",
      "invalid_link": "Länken är ogiltig eller har gått ut.",
      "invalid_name": "Skriv ditt namn (högst 100 tecken).",
      "item_not_found": "Den här önskningen finns inte längre på listan."
    },
```

If `"failedToClaim"` is the last key of the object, move the comma so the JSON stays valid.

- [ ] **Step 6: Verify build and lint**

Run: `npm run lint && npm run build`
Expected: both succeed with no new errors. A type error that `isGiftcard` is unused or missing means a leftover reference – the hook still reads `isGiftcard` from the selected item for its local state update; only the argument to `claimItem` is removed.

- [ ] **Step 7: Verify in the browser against local Supabase**

Run: `npm run dev:local`, sign in as a test user, create a self-managed list with one regular item and one gift card (cap 1), create its share link, then open the link in a private window:
- the list renders with title, creator name and items;
- claiming the regular item works and it shows as taken;
- claiming the gift card twice with two names: the second shows "This item already has enough givers." (sv: "Den här önskningen har redan tillräckligt många givare.");
- `/shared/nope` shows the existing invalid-link state.

- [ ] **Step 8: Commit**

```bash
git add src/integrations/supabase/types.ts src/PublicWishlist/services/PublicWishlistService.ts src/PublicWishlist/types.ts src/PublicWishlist/hooks/usePublicWishlist.ts src/locales/en.json src/locales/sv.json
git commit -m "fix: load and claim shared wishlists through token RPCs"
```

---

### Task 10: Invitation page uses the RPC

**Files:**
- Modify: `src/AcceptInvitation/services/AcceptInvitationService.ts`
- Modify: `src/AcceptInvitation/hooks/useAcceptInvitation.ts:31-52`
- Modify: `src/AcceptInvitation/types.ts`
- Modify: `src/AcceptInvitation/README.md` (service and types lists)

**Interfaces:**
- Consumes: `get_invitation_by_token` (Task 6).
- Produces: `AcceptInvitationService.getInvitationByToken(token): Promise<InvitationQueryResult>` (now includes wishlist and inviter fields), `AcceptInvitationService.buildInvitationData(invitation): InvitationData` (one argument). `getInviterProfile` and `getWishlistInfo` are removed.

- [ ] **Step 1: Extend `InvitationQueryResult` and drop the two lookup types**

In `src/AcceptInvitation/types.ts`, replace:

```ts
export interface InvitationQueryResult {
  id: string;
  email: string;
  accepted: boolean;
  expires_at: string;
  invited_by: string;
  wishlist_id: string;
}

export interface InviterProfile {
  email: string | null;
  full_name: string | null;
}

export interface WishlistInfo {
  title: string | null;
  description: string | null;
}
```

with:

```ts
export interface InvitationQueryResult {
  id: string;
  email: string;
  accepted: boolean;
  expires_at: string;
  invited_by: string;
  wishlist_id: string;
  wishlist_title: string | null;
  wishlist_description: string | null;
  inviter_email: string | null;
  inviter_full_name: string | null;
}
```

- [ ] **Step 2: Update the service**

In `src/AcceptInvitation/services/AcceptInvitationService.ts`:

Replace the import block:

```ts
import {
  InvitationQueryResult,
  InviterProfile,
  WishlistInfo,
  InvitationData,
  CurrentUser,
} from '../types';
```

with:

```ts
import { InvitationQueryResult, InvitationData, CurrentUser } from '../types';
```

Replace `getInvitationByToken`, `getInviterProfile` and `getWishlistInfo` (everything from the `Get invitation data by token` comment through the end of `getWishlistInfo`) with:

```ts
  /**
   * Get invitation, wishlist and inviter data by token
   */
  static async getInvitationByToken(
    token: string
  ): Promise<InvitationQueryResult> {
    const { data, error } = await supabase.rpc('get_invitation_by_token', {
      p_token: token,
    });

    if (error || !data) {
      console.error('Invitation error:', error);
      throw new Error('Invalid or expired invitation');
    }

    return data as unknown as InvitationQueryResult;
  }
```

Replace `buildInvitationData`:

```ts
  static buildInvitationData(
    invitation: InvitationQueryResult,
    inviterProfile: InviterProfile,
    wishlistInfo: WishlistInfo
  ): InvitationData {
    const inviterEmail = inviterProfile?.email || 'Someone';
    const wishlistTitle = wishlistInfo?.title || 'Untitled Wishlist';
    const wishlistDescription = wishlistInfo?.description || '';
```

with:

```ts
  static buildInvitationData(invitation: InvitationQueryResult): InvitationData {
    const inviterEmail = invitation.inviter_email || 'Someone';
    const wishlistTitle = invitation.wishlist_title || 'Untitled Wishlist';
    const wishlistDescription = invitation.wishlist_description || '';
```

(the rest of `buildInvitationData` stays as it is).

- [ ] **Step 3: Update the hook**

In `src/AcceptInvitation/hooks/useAcceptInvitation.ts`, replace:

```ts
        // Get additional data in parallel
        const [inviterProfile, wishlistInfo, currentUser] = await Promise.all([
          AcceptInvitationService.getInviterProfile(invitation.invited_by),
          AcceptInvitationService.getWishlistInfo(invitation.wishlist_id),
          AcceptInvitationService.getCurrentUser(),
        ]);

        // Build complete invitation data
        const invitationData = AcceptInvitationService.buildInvitationData(
          invitation,
          inviterProfile,
          wishlistInfo
        );
```

with:

```ts
        const currentUser = await AcceptInvitationService.getCurrentUser();
        const invitationData =
          AcceptInvitationService.buildInvitationData(invitation);
```

- [ ] **Step 4: Update the README**

In `src/AcceptInvitation/README.md`, remove the lines for `getInviterProfile()`, `getWishlistInfo()`, `InviterProfile` and `WishlistInfo` (types list). Keep the `WishlistInfo` component lines (lines 16 and 50 refer to the component, which stays).

- [ ] **Step 5: Verify build and lint**

Run: `npm run lint && npm run build`
Expected: both succeed. `grep -rn "getInviterProfile\|getWishlistInfo\|InviterProfile" src` returns nothing.

- [ ] **Step 6: Commit**

```bash
git add src/AcceptInvitation/services/AcceptInvitationService.ts src/AcceptInvitation/hooks/useAcceptInvitation.ts src/AcceptInvitation/types.ts src/AcceptInvitation/README.md
git commit -m "fix: read invitations by token through an RPC"
```

---

### Task 11: Dashboard accept and owner screen use the RPCs

**Files:**
- Modify: `src/Dashboard/services/DashboardService.ts` (`acceptInvitation`)
- Modify: `src/ManageWishlist/services/ManageWishlistService.ts` (`loadWishlistData`, `removeAdmin`)

**Interfaces:**
- Consumes: `accept_invitation` (Task 6), `wishlist_has_share_link`, `remove_wishlist_admin` (Task 7).
- Produces: unchanged method signatures; `loadWishlistData` still returns `{ wishlist, items, shareLinks, hasActiveShareLink }` (`shareLinks` is now always `[]`, since the owner may not read tokens); `removeAdmin` still returns `{ adminEmail?, hadShareLinks }`.

- [ ] **Step 1: Accept through the RPC**

In `src/Dashboard/services/DashboardService.ts`, replace the body of `acceptInvitation`:

```ts
    // The database trigger automatically creates the admin record when accepted = true
    // So we only need to mark the invitation as accepted
    const { error } = await supabase
      .from('admin_invitations')
      .update({ accepted: true })
      .eq('id', invitationId);

    if (error) throw error;
```

with:

```ts
    // Checks the invitation is addressed to the signed-in user, creates the
    // admin record and marks the invitation accepted
    const { error } = await supabase.rpc('accept_invitation', {
      p_invitation_id: invitationId,
    });

    if (error) throw error;
```

- [ ] **Step 2: Match pending invitations case-insensitively**

In `getPendingInvitations` in the same file, replace:

```ts
      .eq('email', userEmail)
```

with:

```ts
      .ilike('email', userEmail)
```

RLS already limits the rows to invitations addressed to the user (or sent by them as owner), so `ilike`'s `_` wildcard can't match someone else's invitation.

- [ ] **Step 3: Share-link status through the RPC**

In `src/ManageWishlist/services/ManageWishlistService.ts` `loadWishlistData`, replace:

```ts
    // Load active share links for this wishlist
    const { data: shareLinksData, error: shareLinksError } = await supabase
      .from('share_links')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .or('expires_at.is.null,expires_at.gt.now()'); // Active links (no expiry or not expired)

    if (shareLinksError) {
      console.error('Error loading share links:', shareLinksError);
    }
```

with:

```ts
    // The owner may know the list is shared, but never the token itself
    const { data: hasActiveShareLink, error: shareLinkError } =
      await supabase.rpc('wishlist_has_share_link', {
        p_wishlist_id: wishlistId,
      });

    if (shareLinkError) {
      console.error('Error checking share link:', shareLinkError);
    }
```

and replace its return value:

```ts
    return {
      wishlist: wishlistData,
      items: itemsData || [],
      shareLinks: shareLinksData || [],
      hasActiveShareLink: (shareLinksData || []).length > 0,
    };
```

with:

```ts
    return {
      wishlist: wishlistData,
      items: itemsData || [],
      shareLinks: [],
      hasActiveShareLink: hasActiveShareLink === true,
    };
```

- [ ] **Step 4: Remove the admin through the RPC**

In the same file, replace the whole body of `removeAdmin` (from `// First, find the admin to get their email` through the final `return { … };`) with:

```ts
    // Deletes share links, untakes items, removes the admin and their
    // invitation in one transaction
    const { data, error } = await supabase.rpc('remove_wishlist_admin', {
      p_wishlist_id: wishlistId,
    });

    if (error) throw error;

    const result = data as unknown as {
      admin_email: string | null;
      had_share_links: boolean;
    };

    return {
      adminEmail: result.admin_email ?? undefined,
      hadShareLinks: result.had_share_links,
    };
```

The `adminId` parameter stays in the signature (callers pass it; a wishlist has at most one admin).

- [ ] **Step 5: Verify build and lint**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/Dashboard/services/DashboardService.ts src/ManageWishlist/services/ManageWishlistService.ts
git commit -m "fix: accept invitations and manage admins through RPCs"
```

---

### Task 12: End-to-end check, keep-alive check, PR and production verification

**Files:** none new (verification and PR).

- [ ] **Step 1: Full local run-through in Chrome** (`npm run dev:local`, local Supabase freshly reset)

With three accounts – Owner, Admin, Self – check every existing flow still works:
- Owner: create a normal list, add/edit/delete items before sharing, invite Admin by email (open the link from Mailpit at `http://127.0.0.1:54324`).
- Admin: open the invitation link, sign in, accept on Home; open the list via "Admin access"; create and copy the share link; see claims; untake; remove a gift-card claim; edit and delete an item.
- Owner after sharing: the "limited edit" warning appears (share-link status via RPC); remove the admin → toast says share links were deleted; the list is no longer shared.
- Giver (private window): load the share link, claim a regular item and a gift card.
- Self: create a self-managed list, add items, create a share link, see claims.
- Profile and onboarding: change name; a new account goes through onboarding.
Take screenshots at 390 px and 1280 px of the share page and the admin list for the PR.

- [ ] **Step 2: Confirm the keep-alive user owns or organizes the keep-alive wishlist**

Ask the user to run this in the Supabase SQL editor for production (replace the email with the `KEEPALIVE_EMAIL` secret):

```sql
select w.creator_id = u.id as is_owner,
       exists (select 1 from wishlist_admins wa where wa.wishlist_id = w.id and wa.admin_id = u.id) as is_admin
from wishlists w, auth.users u
where w.id = '9634b226-93d0-46c2-9dfd-0e428f2b22a7' and u.email = '<KEEPALIVE_EMAIL>';
```

Expected: `is_owner` or `is_admin` is true. If both are false, stop: the keep-alive (`scripts/keepalive.mjs`) would fail after merge, and the fix is to point `KEEPALIVE_WISHLIST_ID` at a list that user owns.

In the same SQL editor, also ask the user to run:

```sql
select tablename, policyname from pg_policies where schemaname = 'public' order by 1, 2;
```

Expected: exactly the 25 policy names the migrations created (the list from `select tablename, policyname from pg_policies where schemaname = 'public'` on the local database *before* this branch's migrations, i.e. on `main`). A policy that only exists in production (for example one added in the dashboard) would not be dropped by these migrations and, being permissive, would keep access open: add a `drop policy if exists` for it to the matching migration before merging.

- [ ] **Step 3: Open the PR**

```bash
git push -u origin <branch>
gh pr create --base main --title "fix(db): lock down RLS to what the app allows" --body "<summary of the access matrix, the RPCs, test output of npm run test:db, screenshots; note that merging runs db push to production>"
```

End the PR body with the attribution line from the session instructions.

- [ ] **Step 4: After the user merges – verify production**

When the deploy workflow has finished, rerun the anonymous count probe against production (same as during planning; counts only, no data):

```bash
set -a && . ./.env && set +a && for t in share_links admin_invitations profiles item_claims wishlist_items wishlists; do printf "%-18s " $t; curl -s -o /dev/null -w "%{http_code}\n" -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" "$VITE_SUPABASE_URL/rest/v1/$t?select=id&limit=1"; done
```

Expected: `401` or `403` for every table (anon has no privileges). Then open the production share link in a private window and check it loads, and trigger the "Supabase Keep-Alive" workflow manually and check it passes.
