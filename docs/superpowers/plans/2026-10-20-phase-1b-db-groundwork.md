# Phase 1b – Database groundwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the database pieces the redesign needs that the current app doesn't notice: share links that can be turned off, owner change requests that the organizer approves, a locked `is_self_managed` flag, and no automatic `anon` grants on future tables.

**Architecture:** Every change is a migration plus a pgTAP test file, test-first, on top of phase 1a's RLS model (SECURITY DEFINER helpers `is_wishlist_owner` / `is_wishlist_admin`, token RPCs, no `anon` table access). Change requests are read through RLS (owner and organizer of the list) and written only through SECURITY DEFINER RPCs, so all validation and the approve-and-apply step live in one place in the database. No frontend changes: the new RPCs are first used by the phase 4 wishlist screen.

**Tech Stack:** Supabase (Postgres 17, PostgREST, RLS), pgTAP via `npx supabase test db`.

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` (section 3 "Owner mode" / "Organizer mode", section 6 "Data model changes"). Scope agreed with the user on 2026-10-20: the owner edit lock in RLS and hiding taken columns from the owner move to phase 4, where the wishlist screen and its change-request UI are rebuilt, so the current "limited edit" screen keeps working until then.

## Global Constraints

- No frontend changes in this plan. Existing behaviour stays: a turned-off link shows the existing invalid-link state on the share page.
- All schema changes are migrations in `supabase/migrations/`, named `20261020000009_…` through `20261020000015_…`, tested locally with `npx supabase db reset` before production. Never edit the already-deployed `20261020000001`–`000008` migrations.
- **Merging to `main` runs `npx supabase db push` against production** (`.github/workflows/deploy.yml:40-45`).
- Every new table gets explicit grants in the same migration (`revoke all … from anon`; explicit `grant` to `authenticated` / `service_role`), even after Task 4's default-privilege change.
- Every `SECURITY DEFINER` function sets `search_path = public` and has explicit `revoke execute … from public, anon` plus `grant execute … to <roles>`.
- Policies are created `to authenticated`.
- Change-request rules (spec section 3): requests exist only when the list has an active share link and the requester is the owner but not an organizer; new items never need a request; one pending request per item; the organizer answers with **Godkänn** (apply) or **Behåll som den är** (decline) plus an optional message; the owner can withdraw a pending request.
- Fields a request may change: `title, description, link, url, price_range, priority, is_giftcard, claim_cap` — never `is_taken`, `taken_by_name`, `taken_at`, `wishlist_id`, `claimed_by`, `claimed_at`. When an applied edit leaves `is_giftcard` false, `claim_cap` becomes null.

## Review Focus

- **Owner smuggles a protected column into a request** (`is_taken`, `wishlist_id`) to untake an item or move it → refused with `invalid_proposal`. Pinned in Task 6.
- **Organizer approves an edit for an item that was deleted in the meantime** → a clear `item_not_found`, and the request can still be declined. Pinned in Task 7.
- **Owner double-submits a request for the same item** → the second is refused with `request_pending`, not a duplicate row. Pinned in Task 6.
- **The organizer turns the link off while a giver has the page open** → a claim through that link is refused. Pinned in Task 1.
- **A gift card turned into a normal item through a request** keeps a stale `claim_cap` → cap cleared. Pinned in Task 7.

## File structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20261020000009_share_links_is_active.sql` | `is_active` column; share RPCs and `wishlist_has_share_link` respect it; stricter name trimming |
| `supabase/migrations/20261020000010_lock_self_managed.sql` | Trigger that refuses changing `is_self_managed` |
| `supabase/migrations/20261020000011_remove_admin_invitation.sql` | `remove_wishlist_admin` deletes the list's invitation regardless of address |
| `supabase/migrations/20261020000012_default_privileges.sql` | Future tables and sequences are not auto-granted to `anon` |
| `supabase/migrations/20261020000013_item_change_requests.sql` | Table, indexes, RLS, grants |
| `supabase/migrations/20261020000014_rpc_request_item_change.sql` | `validate_change_proposal`, `request_item_change`, `withdraw_change_request` |
| `supabase/migrations/20261020000015_rpc_resolve_change_request.sql` | `resolve_change_request` |
| `supabase/tests/09_…` – `15_…` | One pgTAP file per task |

## How to run things

- Docker must be running; `npx supabase start` once.
- `npx supabase db reset && npm run test:db` → expected tail `Result: PASS`. All earlier files (`01_`–`08_`) must keep passing.
- Fixture `supabase/tests/_seed.psql` (from phase 1a), included with `\ir _seed.psql`. Relevant: W1 owned by `u_owner`, organized by `u_admin`, active link `tok-w1`, items I1 'Bok', I2 'Presentkort' (gift card, cap 2, one claim), I3 'Lampa' (taken); W2 owned by `u_owner`, not shared; W3 self-managed by `u_self` with item I4; W4 owned by `u_owner` with only an expired link `tok-expired`. Login snippets `:as_owner :as_admin :as_stranger :as_invitee :as_self :as_anon`; run `reset role;` before switching users or inspecting rows as `postgres`.
- RLS makes `UPDATE`/`DELETE` on rows you can't change affect 0 rows silently; missing table privileges raise `42501`.
- Error codes: `P0001` raised by our functions, `P0002` not-found raised by our functions, `22023` invalid argument, `42501` permission denied, `23505` unique violation, `23514` check violation.

---

### Task 1: Turn share links off; stricter name trimming

**Files:**
- Create: `supabase/tests/09_share_link_active_test.sql`
- Create: `supabase/migrations/20261020000009_share_links_is_active.sql`

**Interfaces:**
- Produces: column `share_links.is_active boolean not null default true` (organizers flip it through the existing `share_links_admin_update` policy). `get_shared_wishlist(p_token)` raises `inactive_link` (P0001) for a turned-off link; `claim_shared_item` raises `invalid_link` (P0002) for it; `wishlist_has_share_link` counts only active, unexpired links. `claim_shared_item` trims spaces, tabs, carriage returns and newlines from the name.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/09_share_link_active_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);
\ir _seed.psql

-- Only the organizer can turn the link off
:as_owner
update share_links set is_active = false where wishlist_id = :'w1';
reset role;
select ok((select is_active from share_links where token = 'tok-w1'), 'the owner cannot turn the link off');

:as_admin
update share_links set is_active = false where wishlist_id = :'w1';
reset role;
select ok(not (select is_active from share_links where token = 'tok-w1'), 'the organizer can turn the link off');

:as_anon
select throws_ok($$ select public.get_shared_wishlist('tok-w1') $$, 'P0001', 'inactive_link', 'a turned-off link no longer opens the list');
select throws_ok(
  $$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', 'Mia') $$,
  'P0002', 'invalid_link', 'a turned-off link cannot be used to claim (page still open)');
reset role;

:as_owner
select ok(not public.wishlist_has_share_link(:'w1'), 'a turned-off link does not count as shared');
reset role;

-- Turned back on, it works again
update share_links set is_active = true where token = 'tok-w1';
:as_anon
select lives_ok($$ select public.get_shared_wishlist('tok-w1') $$, 'a link turned back on works');
select throws_ok(
  $$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', E'\n\t ') $$,
  '22023', 'invalid_name', 'a name of only tabs, newlines and spaces is refused');
select lives_ok(
  $$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', E'\tMia\n') $$,
  'a name with surrounding whitespace is accepted');
reset role;
select is((select taken_by_name from wishlist_items where id = :'i1'), 'Mia', 'tabs and newlines are trimmed from the name');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `09_share_link_active_test.sql` with `column "is_active" does not exist`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000009_share_links_is_active.sql`:

```sql
-- Organizers can turn a share link off (spec: "create, copy and turn off the link").
-- A turned-off link stops opening the list and stops claims; turning it on again
-- restores it with the same token.
alter table public.share_links
  add column is_active boolean not null default true;

create or replace function public.get_shared_wishlist(p_token text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_link share_links%rowtype;
begin
  select * into v_link from share_links where token = p_token;
  if not found then
    raise exception 'invalid_link' using errcode = 'P0002';
  end if;
  if not v_link.is_active then
    raise exception 'inactive_link' using errcode = 'P0001';
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
  v_name text := btrim(coalesce(p_name, ''), E' \t\r\n');
begin
  if v_name = '' or length(v_name) > 100 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  select * into v_link from share_links where token = p_token;
  if not found
     or not v_link.is_active
     or (v_link.expires_at is not null and v_link.expires_at < now()) then
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

create or replace function public.wishlist_has_share_link(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (public.is_wishlist_owner(p_wishlist_id) or public.is_wishlist_admin(p_wishlist_id))
    and exists (
      select 1 from share_links
      where wishlist_id = p_wishlist_id
        and is_active
        and (expires_at is null or expires_at > now())
    );
$$;
```

`create or replace` keeps the functions' existing execute grants from phase 1a, so no grant statements are needed.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`09` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/09_share_link_active_test.sql supabase/migrations/20261020000009_share_links_is_active.sql
git commit -m "feat(db): let organizers turn share links off"
```

---

### Task 2: Lock `is_self_managed` after creation

**Files:**
- Create: `supabase/tests/10_self_managed_lock_test.sql`
- Create: `supabase/migrations/20261020000010_lock_self_managed.sql`

**Interfaces:**
- Produces: any `UPDATE` that changes `wishlists.is_self_managed` raises `is_self_managed_locked` (P0001). Other wishlist updates are unaffected. Closes the path where an owner flips their list to self-managed, adds themselves as admin and reads claims.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/10_self_managed_lock_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
\ir _seed.psql

:as_owner
select throws_ok(
  $$ update wishlists set is_self_managed = true where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  'P0001', 'is_self_managed_locked', 'an owner cannot turn a list self-managed afterwards');
select lives_ok(
  $$ update wishlists set title = 'Jul 2026' where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  'other settings can still change');
reset role;

:as_self
select throws_ok(
  $$ update wishlists set is_self_managed = false where id = 'aaaaaaaa-0000-0000-0000-000000000003' $$,
  'P0001', 'is_self_managed_locked', 'a self-managed list cannot be turned back');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `10_self_managed_lock_test.sql` – the two `throws_ok` checks report that no exception was thrown.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000010_lock_self_managed.sql`:

```sql
-- is_self_managed is chosen when the list is created and never changes: flipping it
-- on later would let an owner become their own admin and read who bought what.
create or replace function public.prevent_is_self_managed_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_self_managed is distinct from old.is_self_managed then
    raise exception 'is_self_managed_locked' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_is_self_managed_change() from public, anon, authenticated;

create trigger wishlists_lock_is_self_managed
  before update of is_self_managed on public.wishlists
  for each row execute function public.prevent_is_self_managed_change();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`10` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/10_self_managed_lock_test.sql supabase/migrations/20261020000010_lock_self_managed.sql
git commit -m "fix(db): lock is_self_managed after a list is created"
```

---

### Task 3: Removing the admin deletes the list's invitation

**Files:**
- Create: `supabase/tests/11_remove_admin_invitation_test.sql`
- Create: `supabase/migrations/20261020000011_remove_admin_invitation.sql`

**Interfaces:**
- Produces: `remove_wishlist_admin(p_wishlist_id uuid) returns json` – unchanged signature and return shape `{ admin_email, had_share_links }`; it now deletes the list's invitation whatever address it was sent to. A list allows only one invitation (`admin_invitations_one_per_wishlist`), so a leftover row blocked re-inviting when the invitation address differed from the admin's account email.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/11_remove_admin_invitation_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);
\ir _seed.psql

-- W1's admin accepted an invitation sent to an older address
insert into admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at, accepted)
values (:'w1', 'old-address@test.se', 'inv-w1-old', :'u_owner', now() + interval '7 days', true);

:as_owner
select is(public.remove_wishlist_admin(:'w1') ->> 'admin_email', 'admin@test.se', 'the admin is removed');
reset role;

select is(
  (select count(*)::int from admin_invitations where wishlist_id = :'w1'), 0,
  'the list''s invitation is gone even though it was sent to another address');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `11_remove_admin_invitation_test.sql` – the second check got 1, expected 0.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000011_remove_admin_invitation.sql`:

```sql
-- A list has at most one invitation, so delete it by list instead of by the admin's
-- current email (which may differ from the address the invitation was sent to).
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

  delete from admin_invitations where wishlist_id = p_wishlist_id;

  return json_build_object('admin_email', v_email, 'had_share_links', v_had_links);
end;
$$;
```

`create or replace` keeps the existing execute grants (authenticated, service_role).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`11` ok (including `07_owner_rpc_test.sql`), `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/11_remove_admin_invitation_test.sql supabase/migrations/20261020000011_remove_admin_invitation.sql
git commit -m "fix(db): remove the list's invitation when removing its admin"
```

---

### Task 4: No automatic `anon` grants on future tables

**Files:**
- Create: `supabase/tests/12_default_privileges_test.sql`
- Create: `supabase/migrations/20261020000012_default_privileges.sql`

**Interfaces:**
- Produces: tables and sequences that `postgres` creates in `public` from now on are not granted to `anon`. (Functions are not covered: Postgres grants `EXECUTE` to `PUBLIC` by default, which is why every function in this project revokes it explicitly.)

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/12_default_privileges_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

-- Migrations run as postgres, like this test
create table public.zz_default_privilege_probe (id int);
create sequence public.zz_default_privilege_probe_seq;

select is(
  (select count(*)::int
   from unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('anon', 'public.zz_default_privilege_probe', p)),
  0, 'a new table is not granted to anon');

select ok(
  not has_sequence_privilege('anon', 'public.zz_default_privilege_probe_seq', 'USAGE'),
  'a new sequence is not granted to anon');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `12_default_privileges_test.sql` – `a new table is not granted to anon` got 4, and the sequence check fails.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000012_default_privileges.sql`:

```sql
-- Supabase's default privileges grant every new public table and sequence to anon.
-- Anonymous access in this app goes only through token RPCs, so stop that for
-- objects created by postgres (which runs the migrations).
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`12` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/12_default_privileges_test.sql supabase/migrations/20261020000012_default_privileges.sql
git commit -m "fix(db): stop auto-granting new tables to anon"
```

---

### Task 5: `item_change_requests` table

**Files:**
- Create: `supabase/tests/13_change_requests_table_test.sql`
- Create: `supabase/migrations/20261020000013_item_change_requests.sql`

**Interfaces:**
- Produces: table `public.item_change_requests` with columns `id uuid`, `wishlist_id uuid not null` (→ wishlists, cascade), `item_id uuid` (→ wishlist_items, **set null** so the outcome survives an approved removal), `item_title text not null` (snapshot), `kind text` (`edit` | `remove`), `proposed jsonb` (non-null exactly for `edit`), `status text` (`pending` | `approved` | `declined` | `withdrawn`, default `pending`), `message text` (≤ 500), `created_by uuid not null`, `created_at timestamptz`, `resolved_by uuid`, `resolved_at timestamptz`. Unique index `item_change_requests_one_pending_per_item` on `item_id` where `status = 'pending'`. RLS: `change_requests_owner_read` and `change_requests_admin_read` (select only). `authenticated` has only `SELECT`; writes happen through the RPCs in Tasks 6–7.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/13_change_requests_table_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
\ir _seed.psql

insert into public.item_change_requests (id, wishlist_id, item_id, item_title, kind, proposed, created_by)
values ('dddddddd-0000-0000-0000-000000000001', :'w1', :'i1', 'Bok', 'edit', '{"title":"Bok 2"}', :'u_owner');

:as_owner
select is((select count(*)::int from item_change_requests), 1, 'the owner sees requests on their list');
select throws_ok(
  $$ insert into item_change_requests (wishlist_id, item_id, item_title, kind, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'Presentkort', 'remove', '11111111-0000-0000-0000-000000000001') $$,
  '42501', null, 'the owner cannot insert directly (only through the RPC)');
select throws_ok(
  $$ update item_change_requests set status = 'approved' $$,
  '42501', null, 'the owner cannot approve their own request by updating it');
reset role;

:as_admin
select is((select count(*)::int from item_change_requests), 1, 'the organizer sees requests on their list');
reset role;

:as_stranger
select is((select count(*)::int from item_change_requests), 0, 'a stranger sees nothing');
reset role;

:as_invitee
select is((select count(*)::int from item_change_requests), 0, 'an invitee sees nothing');
reset role;

:as_anon
select throws_ok($$ select count(*) from public.item_change_requests $$, '42501', null, 'anon cannot read requests');
reset role;

select is(
  (select count(*)::int from unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('anon', 'public.item_change_requests', p)),
  0, 'anon has no privileges on the table');

select throws_ok(
  $$ insert into item_change_requests (wishlist_id, item_id, item_title, kind, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Bok', 'remove', '11111111-0000-0000-0000-000000000001') $$,
  '23505', null, 'only one pending request per item');

select throws_ok(
  $$ insert into item_change_requests (wishlist_id, item_id, item_title, kind, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003', 'Lampa', 'edit', '11111111-0000-0000-0000-000000000001') $$,
  '23514', null, 'an edit request must carry the proposed fields');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `13_change_requests_table_test.sql` with `relation "public.item_change_requests" does not exist`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000013_item_change_requests.sql`:

```sql
-- Once a list is shared, the owner's edits and removals become requests the
-- organizer approves (spec section 3). Reads go through RLS; writes only through
-- request_item_change / withdraw_change_request / resolve_change_request.
create table public.item_change_requests (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  -- set null, not cascade: an approved removal deletes the item but the owner
  -- should still see the outcome
  item_id uuid references public.wishlist_items(id) on delete set null,
  item_title text not null,
  kind text not null check (kind in ('edit', 'remove')),
  proposed jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  message text check (message is null or length(message) <= 500),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  constraint item_change_requests_proposed_matches_kind
    check ((kind = 'edit') = (proposed is not null))
);

create index item_change_requests_wishlist_status_idx
  on public.item_change_requests (wishlist_id, status);

create unique index item_change_requests_one_pending_per_item
  on public.item_change_requests (item_id)
  where status = 'pending';

alter table public.item_change_requests enable row level security;

create policy "change_requests_owner_read" on public.item_change_requests
  for select to authenticated
  using (public.is_wishlist_owner(wishlist_id));

create policy "change_requests_admin_read" on public.item_change_requests
  for select to authenticated
  using (public.is_wishlist_admin(wishlist_id));

revoke all on public.item_change_requests from anon, authenticated;
grant select on public.item_change_requests to authenticated;
grant select, insert, update, delete on public.item_change_requests to service_role;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`13` ok, `Result: PASS`. (`08_grants_test.sql`'s exact-policy-set check covers only the seven phase-1a tables, so the two new policies don't affect it.)

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/13_change_requests_table_test.sql supabase/migrations/20261020000013_item_change_requests.sql
git commit -m "feat(db): add item_change_requests table"
```

---

### Task 6: Owner RPCs – `request_item_change` and `withdraw_change_request`

**Files:**
- Create: `supabase/tests/14_request_item_change_test.sql`
- Create: `supabase/migrations/20261020000014_rpc_request_item_change.sql`

**Interfaces:**
- Consumes: `item_change_requests` (Task 5), `share_links.is_active` (Task 1), `is_wishlist_owner`, `is_wishlist_admin` (phase 1a).
- Produces:
  - `public.validate_change_proposal(p_proposed jsonb) returns void` – internal (no `EXECUTE` for any client role); raises `invalid_proposal` (22023) unless `p_proposed` is a non-empty JSON object whose keys are all in `title, description, link, url, price_range, priority, is_giftcard, claim_cap`, with `title` a non-blank string, `description`/`link`/`url`/`price_range` string or null, `priority` a whole number or null, `is_giftcard` a boolean, `claim_cap` a whole number ≥ 1 or null.
  - `public.request_item_change(p_item_id uuid, p_kind text, p_proposed jsonb default null) returns uuid` (authenticated) – returns the new request id. Raises, in this order: `item_not_found` (P0002) if the item doesn't exist or the caller doesn't own its list; `edit_directly` (P0001) if the caller is also an organizer of the list (self-managed) or the list has no active, unexpired share link; `invalid_kind` (22023); for `edit`, whatever `validate_change_proposal` raises; `request_pending` (P0001) if the item already has a pending request. `remove` ignores `p_proposed`.
  - `public.withdraw_change_request(p_request_id uuid) returns void` (authenticated) – sets a pending request the caller created to `withdrawn`; otherwise raises `request_not_found` (P0002).

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/14_request_item_change_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);
\ir _seed.psql

-- An item on W4, which has only an expired link
insert into wishlist_items (id, wishlist_id, title) values ('bbbbbbbb-0000-0000-0000-000000000005', :'w4', 'Sjal');

:as_owner
select lives_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'edit', '{"title":"Bok 2","price_range":"200 kr"}') $$,
  'the owner requests an edit on a shared list');
select is((select count(*)::int from item_change_requests where status = 'pending'), 1, 'the request is pending and visible to the owner');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'remove') $$,
  'P0001', 'request_pending', 'only one pending request per item');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"is_taken":false}') $$,
  '22023', 'invalid_proposal', 'taken status cannot be changed through a request');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"wishlist_id":"aaaaaaaa-0000-0000-0000-000000000003"}') $$,
  '22023', 'invalid_proposal', 'an item cannot be moved to another list');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"title":"   "}') $$,
  '22023', 'invalid_proposal', 'the title cannot be blank');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"claim_cap":0}') $$,
  '22023', 'invalid_proposal', 'the claim cap must be a whole number of at least 1');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"priority":"high"}') $$,
  '22023', 'invalid_proposal', 'priority must be a number');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{}') $$,
  '22023', 'invalid_proposal', 'an empty edit is refused');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'rename') $$,
  '22023', 'invalid_kind', 'an unknown kind is refused');
select lives_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'remove') $$,
  'the owner requests a removal');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000005', 'edit', '{"title":"Halsduk"}') $$,
  'P0001', 'edit_directly', 'a list without an active link is edited directly');
reset role;

:as_self
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000004', 'edit', '{"title":"Napp 2"}') $$,
  'P0001', 'edit_directly', 'a self-managed list is edited directly');
reset role;

:as_stranger
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'edit', '{"title":"x"}') $$,
  'P0002', 'item_not_found', 'a stranger cannot request changes');
reset role;

select id as req_i1 from item_change_requests where item_id = :'i1' and status = 'pending' \gset

:as_admin
select throws_ok(
  format('select public.withdraw_change_request(%L)', :'req_i1'),
  'P0002', 'request_not_found', 'only the person who asked can withdraw');
reset role;

:as_owner
select lives_ok(format('select public.withdraw_change_request(%L)', :'req_i1'), 'the owner withdraws the request');
select throws_ok(
  format('select public.withdraw_change_request(%L)', :'req_i1'),
  'P0002', 'request_not_found', 'a withdrawn request cannot be withdrawn again');
select lives_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'edit', '{"title":"Bok 3"}') $$,
  'after withdrawing, a new request can be made');
reset role;

:as_anon
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'remove') $$,
  '42501', null, 'anon cannot request changes');
reset role;

select results_eq(
  $$ select item_title, kind, created_by from item_change_requests
     where item_id = 'bbbbbbbb-0000-0000-0000-000000000003' $$,
  $$ values ('Lampa'::text, 'remove'::text, '11111111-0000-0000-0000-000000000001'::uuid) $$,
  'the request keeps a title snapshot and who asked');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `14_request_item_change_test.sql` with `function public.request_item_change(unknown, unknown, unknown) does not exist`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000014_rpc_request_item_change.sql`:

```sql
-- Raises invalid_proposal unless p_proposed only changes fields an owner may change,
-- with sensible types. Nested IFs (not AND chains) so a cast only runs after its
-- type check: SQL does not guarantee AND evaluation order.
create or replace function public.validate_change_proposal(p_proposed jsonb)
returns void language plpgsql immutable set search_path = public as $$
declare
  v_key text;
  v_value jsonb;
begin
  if p_proposed is null or jsonb_typeof(p_proposed) <> 'object' or p_proposed = '{}'::jsonb then
    raise exception 'invalid_proposal' using errcode = '22023';
  end if;

  for v_key, v_value in select key, value from jsonb_each(p_proposed) loop
    if v_key = 'title' then
      if jsonb_typeof(v_value) <> 'string' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
      if btrim(v_value #>> '{}', E' \t\r\n') = '' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    elsif v_key in ('description', 'link', 'url', 'price_range') then
      if jsonb_typeof(v_value) not in ('string', 'null') then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    elsif v_key = 'priority' then
      if jsonb_typeof(v_value) = 'number' then
        if (v_value #>> '{}')::numeric <> trunc((v_value #>> '{}')::numeric) then
          raise exception 'invalid_proposal' using errcode = '22023';
        end if;
      elsif jsonb_typeof(v_value) <> 'null' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    elsif v_key = 'is_giftcard' then
      if jsonb_typeof(v_value) <> 'boolean' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    elsif v_key = 'claim_cap' then
      if jsonb_typeof(v_value) = 'number' then
        if (v_value #>> '{}')::numeric < 1
           or (v_value #>> '{}')::numeric <> trunc((v_value #>> '{}')::numeric) then
          raise exception 'invalid_proposal' using errcode = '22023';
        end if;
      elsif jsonb_typeof(v_value) <> 'null' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    else
      -- Anything else (is_taken, taken_by_name, wishlist_id, …) is never changeable
      raise exception 'invalid_proposal' using errcode = '22023';
    end if;
  end loop;
end;
$$;

create or replace function public.request_item_change(
  p_item_id uuid, p_kind text, p_proposed jsonb default null)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
  v_item wishlist_items%rowtype;
  v_id uuid;
begin
  select * into v_item from wishlist_items where id = p_item_id;
  if not found or not public.is_wishlist_owner(v_item.wishlist_id) then
    raise exception 'item_not_found' using errcode = 'P0002';
  end if;

  -- Requests exist only for an owner who isn't also the organizer, on a shared list
  if public.is_wishlist_admin(v_item.wishlist_id)
     or not exists (
       select 1 from share_links
       where wishlist_id = v_item.wishlist_id
         and is_active
         and (expires_at is null or expires_at > now())) then
    raise exception 'edit_directly' using errcode = 'P0001';
  end if;

  if p_kind is null or p_kind not in ('edit', 'remove') then
    raise exception 'invalid_kind' using errcode = '22023';
  end if;

  if p_kind = 'edit' then
    perform public.validate_change_proposal(p_proposed);
  else
    p_proposed := null;
  end if;

  begin
    insert into item_change_requests (wishlist_id, item_id, item_title, kind, proposed, created_by)
    values (v_item.wishlist_id, v_item.id, v_item.title, p_kind, p_proposed, auth.uid())
    returning id into v_id;
  exception when unique_violation then
    raise exception 'request_pending' using errcode = 'P0001';
  end;

  return v_id;
end;
$$;

create or replace function public.withdraw_change_request(p_request_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  update item_change_requests
  set status = 'withdrawn', resolved_by = auth.uid(), resolved_at = now()
  where id = p_request_id and created_by = auth.uid() and status = 'pending';

  if not found then
    raise exception 'request_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.validate_change_proposal(jsonb)            from public, anon, authenticated;
revoke execute on function public.request_item_change(uuid, text, jsonb)      from public, anon;
revoke execute on function public.withdraw_change_request(uuid)               from public, anon;
grant execute on function public.request_item_change(uuid, text, jsonb)       to authenticated, service_role;
grant execute on function public.withdraw_change_request(uuid)                to authenticated, service_role;
```

`request_item_change` calls `validate_change_proposal` as its owner (`postgres`), so revoking `EXECUTE` from client roles doesn't affect it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`14` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/14_request_item_change_test.sql supabase/migrations/20261020000014_rpc_request_item_change.sql
git commit -m "feat(db): let owners request and withdraw item changes"
```

---

### Task 7: Organizer RPC – `resolve_change_request`

**Files:**
- Create: `supabase/tests/15_resolve_change_request_test.sql`
- Create: `supabase/migrations/20261020000015_rpc_resolve_change_request.sql`

**Interfaces:**
- Consumes: `item_change_requests` (Task 5), `is_wishlist_admin` (phase 1a).
- Produces: `public.resolve_change_request(p_request_id uuid, p_approve boolean, p_message text default null) returns void` (authenticated). Raises, in this order: `request_not_found` (P0002) if the request doesn't exist or the caller isn't an organizer of its list; `not_pending` (P0001); `invalid_message` (22023) if the trimmed message is longer than 500 characters; when approving, `item_not_found` (P0002) if the item is gone. Approving an `edit` applies each proposed field (JSON null sets the column null), then clears `claim_cap` if the item is not a gift card; approving a `remove` deletes the item. Records `status` (`approved` / `declined`), the trimmed message (blank → null), `resolved_by`, `resolved_at`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/15_resolve_change_request_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);
\ir _seed.psql

\set r_edit   'dddddddd-0000-0000-0000-000000000001'
\set r_card   'dddddddd-0000-0000-0000-000000000002'
\set r_remove 'dddddddd-0000-0000-0000-000000000003'
\set r_gone   'dddddddd-0000-0000-0000-000000000004'
\set r_w3     'dddddddd-0000-0000-0000-000000000005'
\set r_msg    'dddddddd-0000-0000-0000-000000000006'

insert into item_change_requests (id, wishlist_id, item_id, item_title, kind, proposed, created_by) values
  (:'r_edit',   :'w1', :'i1', 'Bok',         'edit',   '{"title":"Bok 2","description":"Inbunden","priority":5}', :'u_owner'),
  (:'r_card',   :'w1', :'i2', 'Presentkort', 'edit',   '{"is_giftcard":false}',                                   :'u_owner'),
  (:'r_remove', :'w1', :'i3', 'Lampa',       'remove', null,                                                      :'u_owner'),
  (:'r_gone',   :'w1', null,  'Borta',       'edit',   '{"title":"x"}',                                           :'u_owner'),
  (:'r_w3',     :'w3', :'i4', 'Napp',        'edit',   '{"title":"x"}',                                           :'u_self'),
  (:'r_msg',    :'w1', null,  'Gammal',      'remove', null,                                                      :'u_owner');

:as_owner
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_edit'),
  'P0002', 'request_not_found', 'the owner cannot approve their own request');
reset role;

:as_admin
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_w3'),
  'P0002', 'request_not_found', 'an organizer of another list cannot resolve it');
select lives_ok(
  format('select public.resolve_change_request(%L, true, %L)', :'r_edit', '  Fixat!  '),
  'the organizer approves an edit');
select throws_ok(
  format('select public.resolve_change_request(%L, false)', :'r_edit'),
  'P0001', 'not_pending', 'a resolved request cannot be resolved again');
select lives_ok(format('select public.resolve_change_request(%L, true)', :'r_card'), 'the organizer approves turning the gift card off');
select lives_ok(format('select public.resolve_change_request(%L, true)', :'r_remove'), 'the organizer approves a removal');
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_gone'),
  'P0002', 'item_not_found', 'an edit for a deleted item cannot be approved');
select lives_ok(format('select public.resolve_change_request(%L, false)', :'r_gone'), 'but it can be declined');
select throws_ok(
  format('select public.resolve_change_request(%L, false, %L)', :'r_msg', repeat('a', 501)),
  '22023', 'invalid_message', 'a message over 500 characters is refused');
reset role;

select results_eq(
  $$ select title, description, priority from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  $$ values ('Bok 2'::text, 'Inbunden'::text, 5) $$,
  'the approved edit is applied');
select results_eq(
  $$ select is_giftcard, claim_cap from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000002' $$,
  $$ values (false, null::int) $$,
  'turning a gift card off clears its claim cap');
select is(
  (select count(*)::int from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000003'), 0,
  'the approved removal deleted the item');
select results_eq(
  format('select status, message, resolved_by from item_change_requests where id = %L', :'r_edit'),
  $$ values ('approved'::text, 'Fixat!'::text, '11111111-0000-0000-0000-000000000002'::uuid) $$,
  'the outcome and the trimmed message are recorded');
select is(
  (select status from item_change_requests where id = :'r_remove'), 'approved',
  'the removal keeps its outcome after the item is gone');
select is(
  (select status from item_change_requests where id = :'r_gone'), 'declined',
  'a declined request is recorded');

:as_anon
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_msg'),
  '42501', null, 'anon cannot resolve requests');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `15_resolve_change_request_test.sql` with `function public.resolve_change_request(unknown, boolean) does not exist`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000015_rpc_resolve_change_request.sql`:

```sql
-- The organizer answers a request: approve applies it to the item in the same
-- transaction, decline leaves the item as it is. The organizer sees whether the
-- item is claimed; the owner only sees the outcome and the optional message.
create or replace function public.resolve_change_request(
  p_request_id uuid, p_approve boolean, p_message text default null)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  v_req item_change_requests%rowtype;
  v_message text := nullif(btrim(coalesce(p_message, ''), E' \t\r\n'), '');
begin
  select * into v_req from item_change_requests where id = p_request_id for update;
  if not found or not public.is_wishlist_admin(v_req.wishlist_id) then
    raise exception 'request_not_found' using errcode = 'P0002';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'not_pending' using errcode = 'P0001';
  end if;
  if v_message is not null and length(v_message) > 500 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  if p_approve then
    if v_req.item_id is null then
      raise exception 'item_not_found' using errcode = 'P0002';
    end if;

    if v_req.kind = 'remove' then
      delete from wishlist_items where id = v_req.item_id;
    else
      update wishlist_items set
        title       = case when v_req.proposed ? 'title'       then v_req.proposed ->> 'title'                  else title end,
        description = case when v_req.proposed ? 'description' then v_req.proposed ->> 'description'            else description end,
        link        = case when v_req.proposed ? 'link'        then v_req.proposed ->> 'link'                   else link end,
        url         = case when v_req.proposed ? 'url'         then v_req.proposed ->> 'url'                    else url end,
        price_range = case when v_req.proposed ? 'price_range' then v_req.proposed ->> 'price_range'            else price_range end,
        priority    = case when v_req.proposed ? 'priority'    then (v_req.proposed ->> 'priority')::numeric::int  else priority end,
        is_giftcard = case when v_req.proposed ? 'is_giftcard' then (v_req.proposed ->> 'is_giftcard')::boolean else is_giftcard end,
        claim_cap   = case when v_req.proposed ? 'claim_cap'   then (v_req.proposed ->> 'claim_cap')::numeric::int else claim_cap end
      where id = v_req.item_id;

      -- A normal item never has a claim cap
      update wishlist_items set claim_cap = null
      where id = v_req.item_id and not coalesce(is_giftcard, false) and claim_cap is not null;
    end if;
  end if;

  update item_change_requests
  set status = case when p_approve then 'approved' else 'declined' end,
      message = v_message,
      resolved_by = auth.uid(),
      resolved_at = now()
  where id = p_request_id;
end;
$$;

revoke execute on function public.resolve_change_request(uuid, boolean, text) from public, anon;
grant execute on function public.resolve_change_request(uuid, boolean, text)  to authenticated, service_role;
```

`->>` on a JSON `null` yields SQL `NULL`, so a proposed `null` clears that column.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: `01`–`15` ok, `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/15_resolve_change_request_test.sql supabase/migrations/20261020000015_rpc_resolve_change_request.sql
git commit -m "feat(db): let organizers approve or decline change requests"
```

---

### Task 8: Verify, PR and production check

**Files:** none (verification and PR).

- [ ] **Step 1: Full local run**

Run: `npx supabase db reset && npm run test:db`
Expected: 15 files ok, `Result: PASS`.

Run: `npx tsc --noEmit -p tsconfig.app.json && npm run build`
Expected: only the 2 type errors that also exist on `main` (`useAdminWishlist.ts:218`, `Dashboard/components/index.ts:7`); build ok. (No frontend files changed; this guards against accidental edits.)

- [ ] **Step 2: Quick browser smoke test against local Supabase** (`npm run dev:local`)

The share page, claiming, the organizer's share-link creation and the owner's "limited edit" warning still work exactly as before (the frontend doesn't use the new RPCs yet).

- [ ] **Step 3: Open the PR** (after the user agrees)

Push the branch and open a PR with the test output. The PR body says that merging runs `db push` and that no frontend behaviour changes.

- [ ] **Step 4: After the user merges – verify production**

- The deploy run applied `20261020000009`–`000015`.
- Anonymous `GET /rest/v1/item_change_requests?select=id&limit=1` returns `401`.
- Anonymous `POST /rest/v1/rpc/get_shared_wishlist` with a bogus token still returns `invalid_link`.
- Trigger the "Supabase Keep-Alive" workflow; it passes.
