# Archive wishlists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An owner can archive a wishlist they no longer need: it stays visible and read-only for the owner, and disappears for the organizer and the share link. The owner can restore it later.

**Architecture:** A nullable `wishlists.archived_at` column. Two owner-only SECURITY DEFINER RPCs, `archive_wishlist` (deletes the share link, invitations and organizer, drops waiting change requests, sets `archived_at`) and `unarchive_wishlist` (clears it). RLS refuses writes on an archived list, so read-only is enforced by the database. The frontend gets a new `archived` mode on `/wishlist/:id` (a read-only screen with a Restore button), an Archive action in the settings sheet, and a collapsed "Archived" section on Home.

**Tech Stack:** Supabase (Postgres RLS, plpgsql RPCs, pgTAP), React 18 + TypeScript, react-i18next, `node:test` for pure logic.

**Spec:** GitHub issue #56 (https://github.com/LukasHerwig/giftHunt/issues/56) and the approved design board https://claude.ai/artifact/91EZJBocaReDBhk3k96QpZ. Behaviour agreed in chat: archive removes the organizer, pending invitation and share link for good (restore gives a list with neither; the owner re-invites and re-shares, which makes a new link); items and claims are kept; the owner sees archived lists in a collapsed Home section; an archived list opens read-only with one primary action, Restore; delete still works.

## Global Constraints

- Merging runs `supabase db push` against production: this adds one migration (nullable column, 3 functions, 1 trigger, policy changes). No existing rows change. Say so in the PR.
- Migration file: `supabase/migrations/20261023000023_archive_wishlists.sql`, new policies/functions follow the style of `20261020000018_owner_edit_lock.sql` and `20261020000007_rpc_owner.sql` (`security definer set search_path = public`, `revoke execute … from public, anon`, grant to `authenticated, service_role`).
- Never `select('*')` on `wishlist_items` (use `ITEM_COLUMNS`). `wishlists` `select('*')` is already used by `WishlistService.loadWishlist`.
- All UI strings through `t()`, in both `src/locales/en.json` and `src/locales/sv.json`. No gendered copy. Toasts only via `@/lib/toast` with a pose second argument where it fits (`sleep` archived, `wink` restored).
- Only `gh-*` tokens, touch targets at least 44px, pages use `cn(PAGE_COLUMN, …)`.
- Sub-components are defined at module top level, never inside a render body.
- Stage files by name, new commits only, no pushing or PR without the user's go-ahead.
- Baselines to keep: unit tests (currently 119) green, `npx tsc --noEmit -p tsconfig.app.json` 0 errors, `npm run lint` at most 10 problems (3 errors, 7 warnings), `npm run test:db` green (currently 22 files, 216 tests).

## Review Focus

1. The organizer has the list open when it is archived: reads return nothing and writes are refused (pgTAP in Task 1: admin sees no wishlist and no items).
2. Self-managed list: the creator keeps their own `wishlist_admins` row but still cannot add items, edit items, or create a share link while archived (Task 1).
3. Bypassing the RPC: the owner cannot set or clear `archived_at` with a plain update, and cannot edit title/items of an archived list (Task 1).
4. Restore leaves no old access: the old share token no longer resolves, there is no organizer, items and claims are intact (Task 1).
5. Home: an archived list is not shown under "My wishlists", an account with only archived lists still gets the lists layout and not the first-visit empty state (Task 2 unit tests, Task 5).
6. Archiving or restoring from a stale screen (already archived, not owner) shows a clean error and no crash (Task 4 uses the existing `run` error path).

---

### Task 1: Database

**Files:**
- Create: `supabase/migrations/20261023000023_archive_wishlists.sql`
- Create: `supabase/tests/23_archive_wishlists_test.sql`
- Modify: `src/integrations/supabase/types.ts` (wishlists Row/Insert/Update, Functions)

**Interfaces:**
- Produces: column `wishlists.archived_at timestamptz null`; `public.wishlist_is_archived(p_wishlist_id uuid) returns boolean`; `public.archive_wishlist(p_wishlist_id uuid) returns void` (errors `not_owner` 42501, `already_archived` P0001); `public.unarchive_wishlist(p_wishlist_id uuid) returns void` (errors `not_owner` 42501, `not_archived` P0001); trigger error `archived_locked` P0001 when `archived_at` is changed outside the RPCs.

- [ ] **Step 1: Write the failing pgTAP test**

Create `supabase/tests/23_archive_wishlists_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(35);
\ir _seed.psql

-- A waiting change request on W1, to see it dropped by archiving
insert into public.item_change_requests (wishlist_id, item_id, item_title, kind, created_by)
values (:'w1', :'i1', 'Bok', 'remove', :'u_owner');

-- Only the owner can archive
:as_stranger
select throws_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_owner', 'a stranger cannot archive');
reset role;

:as_admin
select throws_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_owner', 'the organizer cannot archive');
reset role;

:as_owner
select lives_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'the owner archives W1');
select throws_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'P0001', 'already_archived', 'an archived list cannot be archived again');
reset role;

-- What archiving did
select ok((select archived_at is not null from public.wishlists where id = :'w1'), 'W1 is marked archived');
select is((select count(*)::int from public.share_links where wishlist_id = :'w1'), 0, 'the share link is deleted');
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w1'), 0, 'the organizer is removed');
select is((select status from public.item_change_requests where wishlist_id = :'w1'), 'withdrawn', 'waiting change requests are dropped');
select is((select count(*)::int from public.wishlist_items where wishlist_id = :'w1'), 3, 'the items are kept');
select ok((select is_taken from public.wishlist_items where id = :'i3'), 'taken status is kept');
select is((select count(*)::int from public.item_claims where item_id = :'i2'), 1, 'claims are kept');

-- The organizer sees nothing any more
:as_admin
select is((select count(*)::int from public.wishlists where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'the old organizer no longer sees the list');
select is((select count(*)::int from public.wishlist_items where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'the old organizer no longer sees its items');
reset role;

-- The owner still reads it, but cannot change it
:as_owner
select is((select count(*)::int from public.wishlist_items where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 3, 'the owner still reads the items');
update public.wishlists set title = 'Ändrad' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.wishlist_items set title = 'Ändrad' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
delete from public.wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000001';
reset role;
select is((select title from public.wishlists where id = :'w1'), 'Födelsedag', 'the title of an archived list cannot be changed');
select is((select title from public.wishlist_items where id = :'i1'), 'Bok', 'an item of an archived list cannot be changed or deleted');
:as_owner
select throws_ok(
  $$ insert into public.wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ny') $$,
  '42501', null, 'an item cannot be added to an archived list');
reset role;

-- archived_at only changes through the functions
:as_owner
select throws_ok(
  $$ update public.wishlists set archived_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000004' $$,
  'P0001', 'archived_locked', 'the owner cannot archive with a plain update');
reset role;

-- Restore
:as_stranger
select throws_ok(
  $$ select public.unarchive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_owner', 'a stranger cannot restore');
reset role;

:as_owner
select throws_ok(
  $$ select public.unarchive_wishlist('aaaaaaaa-0000-0000-0000-000000000004') $$,
  'P0001', 'not_archived', 'a list that is not archived cannot be restored');
select lives_ok(
  $$ select public.unarchive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'the owner restores W1');
reset role;

select ok((select archived_at is null from public.wishlists where id = :'w1'), 'W1 is no longer archived');

:as_anon
select throws_ok($$ select public.get_shared_wishlist('tok-w1') $$, 'P0002', 'invalid_link', 'the old share link stays dead after a restore');
reset role;

:as_owner
select lives_ok(
  $$ insert into public.wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ny') $$,
  'a restored list takes new items again');
reset role;

-- A pending invitation is removed, and none can be sent while archived
:as_owner
select lives_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000002') $$,
  'the owner archives W2');
reset role;
select is((select count(*)::int from public.admin_invitations where wishlist_id = :'w2'), 0, 'the pending invitation is removed');
:as_owner
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000002', 'ny@test.se', 'inv-new', '11111111-0000-0000-0000-000000000001', now() + interval '7 days') $$,
  '42501', null, 'no invitation can be sent for an archived list');
reset role;

-- A self-managed list: the creator is the organizer and keeps that row, but is locked out of writing
:as_self
select lives_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000003') $$,
  'the creator archives a self-managed list');
reset role;
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w3'), 1, 'the creator keeps their own organizer row');

:as_self
select throws_ok(
  $$ insert into public.wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000003', 'Ny') $$,
  '42501', null, 'no item can be added to an archived self-managed list');
select throws_ok(
  $$ insert into public.share_links (wishlist_id, token, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'tok-w3', '11111111-0000-0000-0000-000000000005') $$,
  '42501', null, 'no share link can be made for an archived self-managed list');
update public.wishlist_items set title = 'Ändrad' where id = 'bbbbbbbb-0000-0000-0000-000000000004';
reset role;
select is((select title from public.wishlist_items where id = :'i4'), 'Napp', 'an item of an archived self-managed list cannot be changed');

:as_self
select lives_ok(
  $$ select public.unarchive_wishlist('aaaaaaaa-0000-0000-0000-000000000003') $$,
  'the creator restores the self-managed list');
select lives_ok(
  $$ insert into public.share_links (wishlist_id, token, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'tok-w3', '11111111-0000-0000-0000-000000000005') $$,
  'a restored self-managed list can be shared again');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd /Users/lukasherwig/Developer/giftHunt/giftHunt-archive && npx supabase start && npx supabase db reset && npx supabase test db supabase/tests/23_archive_wishlists_test.sql`
Expected: FAIL (`function public.archive_wishlist(uuid) does not exist`, `column "archived_at" does not exist`).

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261023000023_archive_wishlists.sql`:

```sql
-- Archive a wishlist: the owner keeps reading it, nobody else sees it, nothing can be
-- changed. archive_wishlist removes what the organizer and the givers rely on (the share
-- link, the invitation, the organizer, waiting change requests); items and claims stay.
-- unarchive_wishlist brings back a plain list: no organizer, no link.
alter table public.wishlists add column archived_at timestamptz;

create or replace function public.wishlist_is_archived(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from wishlists where id = p_wishlist_id and archived_at is not null);
$$;

revoke execute on function public.wishlist_is_archived(uuid) from public, anon;
grant execute on function public.wishlist_is_archived(uuid) to authenticated, service_role;

-- archived_at changes only inside archive_wishlist / unarchive_wishlist, which set the
-- transaction-local flag below. A plain update from the app is refused.
create or replace function public.guard_archived_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.archived_at is distinct from old.archived_at
     and coalesce(current_setting('gifthunt.archiving', true), '') <> 'on' then
    raise exception 'archived_locked' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_archived_at() from public, anon, authenticated;

create trigger wishlists_guard_archived_at
  before update of archived_at on public.wishlists
  for each row execute function public.guard_archived_at();

create or replace function public.archive_wishlist(p_wishlist_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if public.wishlist_is_archived(p_wishlist_id) then
    raise exception 'already_archived' using errcode = 'P0001';
  end if;

  perform set_config('gifthunt.archiving', 'on', true);

  delete from share_links where wishlist_id = p_wishlist_id;
  delete from admin_invitations where wishlist_id = p_wishlist_id;
  -- The creator of a self-managed list is their own organizer: that row stays.
  delete from wishlist_admins where wishlist_id = p_wishlist_id and admin_id <> auth.uid();
  update item_change_requests
  set status = 'withdrawn', resolved_by = auth.uid(), resolved_at = now()
  where wishlist_id = p_wishlist_id and status = 'pending';
  update wishlists set archived_at = now() where id = p_wishlist_id;

  perform set_config('gifthunt.archiving', 'off', true);
end;
$$;

create or replace function public.unarchive_wishlist(p_wishlist_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if not public.wishlist_is_archived(p_wishlist_id) then
    raise exception 'not_archived' using errcode = 'P0001';
  end if;

  perform set_config('gifthunt.archiving', 'on', true);
  update wishlists set archived_at = null where id = p_wishlist_id;
  perform set_config('gifthunt.archiving', 'off', true);
end;
$$;

revoke execute on function public.archive_wishlist(uuid)   from public, anon;
revoke execute on function public.unarchive_wishlist(uuid) from public, anon;
grant execute on function public.archive_wishlist(uuid)   to authenticated, service_role;
grant execute on function public.unarchive_wishlist(uuid) to authenticated, service_role;

-- The owner's blanket policy becomes four, so that update can refuse archived lists.
drop policy if exists "wishlists_owner_all" on public.wishlists;

create policy "wishlists_owner_select" on public.wishlists
  for select to authenticated
  using (creator_id = auth.uid());

create policy "wishlists_owner_insert" on public.wishlists
  for insert to authenticated
  with check (creator_id = auth.uid());

create policy "wishlists_owner_update" on public.wishlists
  for update to authenticated
  using (creator_id = auth.uid() and archived_at is null)
  with check (creator_id = auth.uid());

create policy "wishlists_owner_delete" on public.wishlists
  for delete to authenticated
  using (creator_id = auth.uid());

-- Items: reading stays, writing stops on an archived list.
drop policy if exists "items_owner_insert" on public.wishlist_items;
drop policy if exists "items_owner_update" on public.wishlist_items;
drop policy if exists "items_owner_delete" on public.wishlist_items;
drop policy if exists "items_admin_update" on public.wishlist_items;
drop policy if exists "items_admin_delete" on public.wishlist_items;

create policy "items_owner_insert" on public.wishlist_items
  for insert to authenticated
  with check (public.is_wishlist_owner(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

create policy "items_owner_update" on public.wishlist_items
  for update to authenticated
  using (public.is_wishlist_owner(wishlist_id) and not public.wishlist_has_share_link(wishlist_id)
         and not public.wishlist_is_archived(wishlist_id))
  with check (public.is_wishlist_owner(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

create policy "items_owner_delete" on public.wishlist_items
  for delete to authenticated
  using (public.is_wishlist_owner(wishlist_id) and not public.wishlist_has_share_link(wishlist_id)
         and not public.wishlist_is_archived(wishlist_id));

create policy "items_admin_update" on public.wishlist_items
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

create policy "items_admin_delete" on public.wishlist_items
  for delete to authenticated
  using (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

-- Share links, invitations and claim removal: nothing new can be made or changed.
drop policy if exists "share_links_admin_insert" on public.share_links;
drop policy if exists "share_links_admin_update" on public.share_links;
drop policy if exists "invitations_owner_insert" on public.admin_invitations;
drop policy if exists "claims_admin_delete"      on public.item_claims;

create policy "share_links_admin_insert" on public.share_links
  for insert to authenticated
  with check (public.is_wishlist_admin(wishlist_id) and created_by = auth.uid()
              and not public.wishlist_is_archived(wishlist_id));

create policy "share_links_admin_update" on public.share_links
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

create policy "invitations_owner_insert" on public.admin_invitations
  for insert to authenticated
  with check (public.is_wishlist_owner(wishlist_id) and invited_by = auth.uid()
              and not public.wishlist_is_archived(wishlist_id));

create policy "claims_admin_delete" on public.item_claims
  for delete to authenticated
  using (public.is_wishlist_admin(public.item_wishlist_id(item_id))
         and not public.wishlist_is_archived(public.item_wishlist_id(item_id)));
```

- [ ] **Step 4: Apply and run the new test**

Run: `npx supabase db reset && npx supabase test db supabase/tests/23_archive_wishlists_test.sql`
Expected: `ok 1 … ok 35`, `Result: PASS`. If the `update … returning` style or an error code differs, fix the test or migration until each assertion states what its description says, and note the fix.

- [ ] **Step 5: Run the whole database suite**

Run: `npm run test:db`
Expected: all files pass (23 files). Earlier tests exercise the policies this migration replaced (items, share links, invitations); any failure is a regression in the new policies, so fix the migration, not the old test.

- [ ] **Step 6: Update the generated types**

In `src/integrations/supabase/types.ts` (hand-formatted; match the existing layout):
- `wishlists` `Row`: add `"archived_at": string | null,` before `"created_at"`; `Insert` and `Update`: add `"archived_at"?: string | null,` before `"created_at"?`.
- `Functions`: add, in alphabetical position, `"archive_wishlist": { Args: { "p_wishlist_id": string }; Returns: undefined },`, `"unarchive_wishlist": { Args: { "p_wishlist_id": string }; Returns: undefined },`, `"wishlist_is_archived": { Args: { "p_wishlist_id": string }; Returns: boolean }` (copy the line breaks of the neighbouring entries).

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20261023000023_archive_wishlists.sql supabase/tests/23_archive_wishlists_test.sql src/integrations/supabase/types.ts
git commit -m "feat(archive): archive_wishlist and unarchive_wishlist, read-only archived lists"
```

---

### Task 2: Pure logic (mode and Home rows)

**Files:**
- Modify: `src/Wishlist/lib/mode.ts`, `src/Wishlist/lib/mode.test.ts`, `src/Wishlist/types/index.ts`
- Modify: `src/Home/lib/homeRows.ts`, `src/Home/lib/homeRows.test.ts`, `src/Home/types/index.ts`

**Interfaces:**
- Produces: `Mode` gains `'archived'`; `resolveMode({ wishlist: { creator_id; is_self_managed; archived_at: string | null } | null, userId, isOrganizer })`: the creator of an archived list gets `'archived'`, anyone else `'none'`. `OwnedListRaw.archived_at: string | null`; `ArchivedRow { id: string; title: string; itemCount: number }`; `toOwnedRows` returns only lists with `archived_at === null`; `toArchivedRows(lists: OwnedListRaw[]): ArchivedRow[]`.

- [ ] **Step 1: Write failing tests**

In `src/Wishlist/lib/mode.test.ts` change the `list` helper to include `archived_at: null` (type `Partial<{ creator_id: string; is_self_managed: boolean; archived_at: string | null }>`) and append:

```ts
test('the creator of an archived list is in archived mode, normal or self-managed', () => {
  const archived = '2026-10-23T09:00:00Z';
  assert.equal(resolveMode({ wishlist: list({ archived_at: archived }), userId: 'owner', isOrganizer: false }), 'archived');
  assert.equal(
    resolveMode({ wishlist: list({ archived_at: archived, is_self_managed: true }), userId: 'owner', isOrganizer: true }),
    'archived',
  );
});

test('nobody but the creator has a mode on an archived list', () => {
  const archived = '2026-10-23T09:00:00Z';
  assert.equal(resolveMode({ wishlist: list({ archived_at: archived }), userId: 'erik', isOrganizer: true }), 'none');
});
```

Read `src/Home/lib/homeRows.test.ts` to see its existing fixtures (`OwnedListRaw` objects need `archived_at: null` added), then append:

```ts
test('archived lists are kept out of the owned rows and listed on their own', () => {
  const lists = [
    { ...owned('a', 'Aktiv'), archived_at: null },
    { ...owned('b', 'Gammal'), archived_at: '2026-10-23T09:00:00Z' },
  ];
  assert.deepEqual(toOwnedRows(lists).map((row) => row.id), ['a']);
  assert.deepEqual(toArchivedRows(lists), [{ id: 'b', title: 'Gammal', itemCount: 0 }]);
});
```
(`owned(id, title)` stands for the file's existing helper that builds an `OwnedListRaw`; if none exists, add one that returns `{ id, title, description: null, is_self_managed: false, created_at: '2026-10-01T00:00:00Z', itemCount: 0, organizer: null, archived_at: null }`.) Import `toArchivedRows`.

- [ ] **Step 2: Run to see failure**

Run: `npm run test:unit`
Expected: FAIL (type/runtime: `toArchivedRows` is not exported, `archived` mode missing).

- [ ] **Step 3: Implement**

`src/Wishlist/types/index.ts`: `export type Mode = 'owner' | 'organizer' | 'self' | 'archived' | 'none';` and add

```ts
export interface ArchivedData {
  wishlist: Wishlist;
  items: OwnerItem[];
}
```

`src/Wishlist/lib/mode.ts`:

```ts
interface ModeInput {
  wishlist: { creator_id: string; is_self_managed: boolean; archived_at: string | null } | null;
  userId: string | undefined;
  /** The viewer is the list's organizer (a wishlist_admins row). */
  isOrganizer: boolean;
}

export const resolveMode = ({ wishlist, userId, isOrganizer }: ModeInput): Mode => {
  if (!wishlist || !userId) return 'none';
  if (wishlist.creator_id === userId) {
    if (wishlist.archived_at) return 'archived';
    return wishlist.is_self_managed ? 'self' : 'owner';
  }
  return isOrganizer ? 'organizer' : 'none';
};
```

`src/Home/types/index.ts`: add `archived_at: string | null;` to `OwnedListRaw`, and

```ts
export interface ArchivedRow {
  id: string;
  title: string;
  itemCount: number;
}
```

`src/Home/lib/homeRows.ts`: import `ArchivedRow`; make `toOwnedRows` start with `lists.filter((list) => list.archived_at === null).map(…)` (keep the mapping body) and add

```ts
export const toArchivedRows = (lists: OwnedListRaw[]): ArchivedRow[] =>
  lists
    .filter((list) => list.archived_at !== null)
    .map((list) => ({ id: list.id, title: list.title, itemCount: list.itemCount }));
```

- [ ] **Step 4: Run to see pass**

Run: `npm run test:unit && npx tsc --noEmit -p tsconfig.app.json`
Expected: all unit tests pass (119 + 3); tsc reports errors only where `archived_at` is now required (HomeService `loadOwned`, next task) — if tsc fails there, that is expected and fixed in Task 3 step 3; the unit tests must pass now.

- [ ] **Step 5: Commit**

```bash
git add src/Wishlist/lib/mode.ts src/Wishlist/lib/mode.test.ts src/Wishlist/types/index.ts src/Home/lib/homeRows.ts src/Home/lib/homeRows.test.ts src/Home/types/index.ts
git commit -m "feat(archive): archived mode and archived Home rows"
```

---

### Task 3: Archived screen

**Files:**
- Create: `src/Wishlist/components/ArchivedWishlist.tsx`, `src/Wishlist/hooks/useArchivedWishlist.ts`
- Modify: `src/Wishlist/services/WishlistService.ts`, `src/Wishlist/components/index.ts`, `src/Wishlist/index.tsx`, `src/components/gh/ItemRow.tsx`, `src/Home/services/HomeService.ts`, `src/locales/en.json`, `src/locales/sv.json`

**Interfaces:**
- Consumes: `Mode` `'archived'`, `ArchivedData`, `resolveMode` (Task 2); RPCs and types (Task 1).
- Produces: `WishlistService.loadArchivedData(wishlistId): Promise<ArchivedData>`, `WishlistService.archiveList(wishlistId): Promise<void>`, `WishlistService.unarchiveList(wishlistId): Promise<void>`; `ArchivedWishlist({ wishlistId, onModeChange })`; the `Wishlist` index passes `onModeChange: () => void` (re-resolves the mode) to `ArchivedWishlist`, `OwnerWishlist` and `OrganizerWishlist`; locale keys `wishlist.archived.{title,text,restore}`, `wishlist.toast.{archived,archiveFailed,restored,restoreFailed}`.

- [ ] **Step 1: Service methods and Home select**

In `WishlistService` (before `deleteList`) add:

```ts
  /** An archived list: the owner reads the wishlist and its items, nothing else. */
  static async loadArchivedData(wishlistId: string): Promise<ArchivedData> {
    const wishlist = await WishlistService.loadWishlist(wishlistId);
    if (!wishlist) throw new Error('wishlist_not_found');
    return { wishlist, items: await WishlistService.loadItems(wishlistId) };
  }

  /** Removes the organizer, invitation and share link, and makes the list read-only. */
  static async archiveList(wishlistId: string): Promise<void> {
    const { error } = await supabase.rpc('archive_wishlist', { p_wishlist_id: wishlistId });
    if (error) throw error;
  }

  static async unarchiveList(wishlistId: string): Promise<void> {
    const { error } = await supabase.rpc('unarchive_wishlist', { p_wishlist_id: wishlistId });
    if (error) throw error;
  }
```
and add `ArchivedData` to the type imports. In `src/Home/services/HomeService.ts` `loadOwned`, add `archived_at` to the select string: `'id, title, description, is_self_managed, created_at, archived_at, admins:…'`.

- [ ] **Step 2: ItemRow without a click handler**

In `src/components/gh/ItemRow.tsx` make `onClick?: () => void;` and replace the root `<button type="button" onClick={onClick} className=…>` with

```tsx
const Root = onClick ? 'button' : 'div';
…
<Root
  {...(onClick ? { type: 'button' as const, onClick } : {})}
  className={cn(
    'relative flex min-h-[80px] w-full items-center gap-3 rounded-gh-lg border p-3 text-left text-gh-ink',
    onClick &&
      'transition-[transform,background-color] duration-[120ms] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
    taken
      ? 'border-transparent bg-gh-taken-bg'
      : cn('border-gh-line bg-gh-surface-200', onClick && 'hover:border-gh-line-strong hover:bg-gh-surface-100'),
  )}>
```
(closing tag `</Root>`; read the file and keep the rest of the markup unchanged; `Root` is declared before the `return`).

- [ ] **Step 3: Locale keys**

Add to `src/locales/en.json` under `wishlist`: 

```json
"archived": {
  "title": "This list is archived",
  "text": "Only you can see it, and it cannot be changed. No organizer and no share link are left. Restore the list to invite and share again.",
  "restore": "Restore the list"
},
```
and under `wishlist.toast`: `"archived": "The list is archived"`, `"archiveFailed": "Could not archive the list. Try again."`, `"restored": "The list is restored"`, `"restoreFailed": "Could not restore the list. Try again."`.
Swedish (`sv.json`, same places): `"title": "Listan är arkiverad"`, `"text": "Den syns bara för dig och kan inte ändras. Ingen arrangör och ingen delningslänk är kvar. Återställ listan för att bjuda in och dela på nytt."`, `"restore": "Återställ listan"`; toasts `"Listan är arkiverad"`, `"Det gick inte att arkivera listan. Försök igen."`, `"Listan är återställd"`, `"Det gick inte att återställa listan. Försök igen."`.

- [ ] **Step 4: The hook**

Create `src/Wishlist/hooks/useArchivedWishlist.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { WishlistService } from '../services/WishlistService';
import type { ArchivedData } from '../types';

export const useArchivedWishlist = (wishlistId: string, onModeChange: () => void) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<ArchivedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await WishlistService.loadArchivedData(wishlistId));
    } catch (error) {
      console.error('Load archived wishlist error:', error);
      toast.error(t('wishlist.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [wishlistId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const restore = async () => {
    setBusy(true);
    try {
      await WishlistService.unarchiveList(wishlistId);
      toast.success(t('wishlist.toast.restored'), 'wink');
      onModeChange();
    } catch (error) {
      console.error(error);
      toast.error(t('wishlist.toast.restoreFailed'));
    } finally {
      setBusy(false);
    }
  };

  const deleteList = async () => {
    setBusy(true);
    try {
      await WishlistService.deleteList(wishlistId);
      toast.success(t('wishlist.toast.listDeleted'), 'teary');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(t('wishlist.toast.deleteFailed'));
      setBusy(false);
    }
  };

  return {
    loading,
    data,
    busy,
    confirmingDelete,
    restore,
    deleteList,
    askDelete: () => setConfirmingDelete(true),
    cancelDelete: () => setConfirmingDelete(false),
  };
};
```

- [ ] **Step 5: The screen**

Create `src/Wishlist/components/ArchivedWishlist.tsx` (read `OwnerWishlist.tsx` first for imports; copy its `meta` helper pattern):

```tsx
import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { DangerButton } from '@/components/gh/DangerButton';
import { EmptyState } from '@/components/gh/EmptyState';
import { ItemRow } from '@/components/gh/ItemRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { useArchivedWishlist } from '../hooks/useArchivedWishlist';
import { priorityName } from '../lib/itemForm';
import { WishlistLoading } from './WishlistLoading';

interface ArchivedWishlistProps {
  wishlistId: string;
  onModeChange: () => void;
}

/** The owner's read-only view of an archived list: a banner with Restore, the wishes, Delete. */
export const ArchivedWishlist = ({ wishlistId, onModeChange }: ArchivedWishlistProps) => {
  const { t } = useTranslation();
  const archived = useArchivedWishlist(wishlistId, onModeChange);
  const { data, loading, busy } = archived;

  if (loading) return <WishlistLoading />;
  if (!data) {
    return (
      <div className="min-h-screen bg-gh-bg text-gh-ink">
        <AppHeader />
        <EmptyState pose="sad" size="screen" title={t('wishlist.toast.loadFailed')} />
      </div>
    );
  }

  const { wishlist, items } = data;
  const meta = (price: string | null, priority: number | null) => {
    const name = priorityName(priority);
    return [price, name ? t(`wishlist.prioShort.${name}`) : null].filter(Boolean).join(' · ');
  };

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader />
      <main className={cn(PAGE_COLUMN, 'flex flex-col gap-6 pb-10 pt-6 md:gap-8 md:pt-12')}>
        <h1 className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-gh-ink">{wishlist.title}</h1>

        <article className="flex flex-col gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4 md:max-w-[560px]">
          <div className="flex flex-col gap-1">
            <h2 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{t('wishlist.archived.title')}</h2>
            <p className="text-[14px] leading-5 text-gh-ink-2">{t('wishlist.archived.text')}</p>
          </div>
          <Button
            type="button"
            onClick={() => void archived.restore()}
            disabled={busy}
            className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('wishlist.archived.restore')}
          </Button>
        </article>

        <section className="flex flex-col gap-3">
          <SectionHeader title={t('wishlist.sectionItems')} count={items.length} />
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <ItemRow
                  title={item.title}
                  image={item.url}
                  meta={meta(item.price_range, item.priority)}
                  giftCardLabel={item.is_giftcard ? t('publicWishlist.giftCardBadge') : undefined}
                />
              </li>
            ))}
          </ul>
        </section>

        <DangerButton onClick={archived.askDelete}>{t('wishlist.settingsSheet.delete')}</DangerButton>
      </main>

      {archived.confirmingDelete && (
        <ResponsiveSheet
          open
          onOpenChange={(next) => {
            if (!next) archived.cancelDelete();
          }}
          title={t('wishlist.settingsSheet.delete')}
          subtitle={wishlist.title}
          closeLabel={t('wishlist.form.close')}
          showTitleOnMobile>
          <ConfirmBlock
            destructive
            question={t('wishlist.settingsSheet.deleteQuestion', { title: wishlist.title })}
            context={t('wishlist.settingsSheet.deleteContext')}
            confirmLabel={t('wishlist.settingsSheet.deleteAction')}
            cancelLabel={t('wishlist.confirm.cancel')}
            loading={busy}
            onConfirm={() => void archived.deleteList()}
            onCancel={archived.cancelDelete}
          />
        </ResponsiveSheet>
      )}
    </div>
  );
};
```
Export it from `src/Wishlist/components/index.ts`. Check `DangerButton`'s props in `src/components/gh/DangerButton.tsx` and adjust if its signature differs.

- [ ] **Step 6: Route the mode**

In `src/Wishlist/index.tsx`: add `const [version, setVersion] = useState(0);` and `const refreshMode = useCallback(() => { setMode(null); setVersion((v) => v + 1); }, []);` (import `useCallback`), add `version` to the effect's dependency array, and render:

```tsx
if (mode === 'archived') return <ArchivedWishlist wishlistId={id} onModeChange={refreshMode} />;
if (mode === 'owner') return <OwnerWishlist wishlistId={id} onModeChange={refreshMode} />;
if (mode === 'organizer' || mode === 'self')
  return <OrganizerWishlist wishlistId={id} mode={mode} onModeChange={refreshMode} />;
```
Add `onModeChange: () => void` to `OwnerWishlistProps` and `onModeChange?: () => void` to `OrganizerWishlistProps` (wired in Task 4).

- [ ] **Step 7: Check**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm run lint && npm run test:unit`
Expected: tsc 0 errors, lint no more than baseline (10 problems), unit tests pass. (The new `onModeChange` props are unused until Task 4: if lint flags unused props, destructure them in Task 4 and not here.)

- [ ] **Step 8: Commit**

```bash
git add src/Wishlist/components/ArchivedWishlist.tsx src/Wishlist/hooks/useArchivedWishlist.ts src/Wishlist/services/WishlistService.ts src/Wishlist/components/index.ts src/Wishlist/index.tsx src/Wishlist/components/OwnerWishlist.tsx src/Wishlist/components/OrganizerWishlist.tsx src/components/gh/ItemRow.tsx src/Home/services/HomeService.ts src/locales/en.json src/locales/sv.json
git commit -m "feat(archive): read-only archived list screen with Restore"
```

---

### Task 4: Archive action in Settings

**Files:**
- Modify: `src/Wishlist/components/SettingsSheet.tsx`, `src/Wishlist/components/OwnerWishlist.tsx`, `src/Wishlist/components/OrganizerWishlist.tsx`, `src/Wishlist/hooks/useOwnerWishlist.ts`, `src/Wishlist/hooks/useOrganizerWishlist.ts`, `src/locales/en.json`, `src/locales/sv.json`

**Interfaces:**
- Consumes: `WishlistService.archiveList` and the `onModeChange` props (Task 3).
- Produces: `useOwnerWishlist(wishlistId, onModeChange)` and `useOrganizerWishlist(wishlistId, onModeChange?)` return `archiveList: () => Promise<void>`; `SettingsSheet` takes `onArchive: () => void`.

- [ ] **Step 1: Locale keys**

Under `wishlist.settingsSheet` in `en.json` add:

```json
"archive": "Archive the list",
"archiveQuestion": "Archive {{title}}?",
"archiveContext": "The organizer and the link cannot be brought back.",
"archiveAction": "Archive the list",
"archiveOrganizer": "The organizer and any pending invitation are removed.",
"archiveLink": "The share link stops working and cannot come back.",
"archiveRequests": "Waiting change requests are dropped.",
"archiveKept": "Your wishes are kept. Find the list under Archived on the start page and restore it any time."
```
and in `sv.json`: `"Arkivera listan"`, `"Arkivera {{title}}?"`, `"Arrangören och länken går inte att få tillbaka."`, `"Arkivera listan"`, `"Arrangören och en väntande inbjudan tas bort."`, `"Delningslänken slutar fungera och kan inte komma tillbaka."`, `"Väntande ändringsförfrågningar tas bort."`, `"Önskningarna sparas. Du hittar listan under Arkiverade på Hem och kan återställa den när som helst."`.

- [ ] **Step 2: SettingsSheet**

In `SettingsSheet.tsx`: add `onArchive: () => void;` to props; replace `const [confirmingDelete, setConfirmingDelete] = useState(false);` with `const [confirming, setConfirming] = useState<'archive' | 'delete' | null>(null);` (import `Archive` from `lucide-react`); set the sheet `title` to `confirming === 'archive' ? t('wishlist.settingsSheet.archive') : t('wishlist.settingsSheet.title')`. Replace the bottom block with:

```tsx
        {confirming === 'archive' ? (
          <>
            <ul className="m-0 flex flex-col gap-2 pl-5 text-[16px] leading-6 text-gh-ink">
              {!wishlist.is_self_managed && <li>{t('wishlist.settingsSheet.archiveOrganizer')}</li>}
              <li>{t('wishlist.settingsSheet.archiveLink')}</li>
              <li>{t('wishlist.settingsSheet.archiveRequests')}</li>
            </ul>
            <p className="text-[14px] leading-5 text-gh-ink-2">{t('wishlist.settingsSheet.archiveKept')}</p>
            <ConfirmBlock
              question={t('wishlist.settingsSheet.archiveQuestion', { title: wishlist.title })}
              context={t('wishlist.settingsSheet.archiveContext')}
              confirmLabel={t('wishlist.settingsSheet.archiveAction')}
              cancelLabel={t('wishlist.confirm.cancel')}
              loading={busy}
              onConfirm={onArchive}
              onCancel={() => setConfirming(null)}
            />
          </>
        ) : confirming === 'delete' ? (
          <ConfirmBlock … existing delete block with onCancel={() => setConfirming(null)} />
        ) : (
          <>
            <Button type="submit" …existing save button… />
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming('archive')}
              className="h-12 w-full gap-2 rounded-gh-md text-[16px] font-semibold">
              <Archive aria-hidden="true" />
              {t('wishlist.settingsSheet.archive')}
            </Button>
            <DangerButton onClick={() => setConfirming('delete')}>{t('wishlist.settingsSheet.delete')}</DangerButton>
          </>
        )}
```
(keep the existing delete `ConfirmBlock` props exactly; only the cancel handler and the condition change). The form fields above the block stay mounted; hide them while confirming archive by wrapping the three field blocks (`TextField`, `TextArea`, the switches `div`) in `{confirming !== 'archive' && ( … )}`.

- [ ] **Step 3: Hooks**

`useOwnerWishlist.ts`: signature `(wishlistId: string | undefined, onModeChange: () => void)`; after `deleteList` add

```ts
  const archiveList = async () => {
    if (!wishlistId) return;
    const ok = await run(() => WishlistService.archiveList(wishlistId), 'wishlist.toast.archiveFailed');
    if (ok) {
      toast.success(t('wishlist.toast.archived'), 'sleep');
      closeSheet();
      onModeChange();
    }
  };
```
and return `archiveList`. Do the same in `useOrganizerWishlist.ts` (read it first; its signature is `(wishlistId: string)` — add `onModeChange?: () => void` and call `onModeChange?.()`). In `OwnerWishlist.tsx` pass `onModeChange` to `useOwnerWishlist(wishlistId, onModeChange)` and `onArchive={wishlist.archiveList}` to `SettingsSheet`; in `OrganizerWishlist.tsx` do the same (destructure `onModeChange` from props).

- [ ] **Step 4: Check**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm run lint && npm run test:unit`
Expected: tsc 0 errors, lint at most baseline, unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/Wishlist/components/SettingsSheet.tsx src/Wishlist/components/OwnerWishlist.tsx src/Wishlist/components/OrganizerWishlist.tsx src/Wishlist/hooks/useOwnerWishlist.ts src/Wishlist/hooks/useOrganizerWishlist.ts src/locales/en.json src/locales/sv.json
git commit -m "feat(archive): archive a list from its settings"
```

---

### Task 5: Home, Archived section

**Files:**
- Create: `src/Home/components/ArchivedSection.tsx`
- Modify: `src/Home/components/index.ts`, `src/Home/hooks/useHome.ts`, `src/Home/index.tsx`, `src/components/gh/ListRow.tsx`, `src/locales/en.json`, `src/locales/sv.json`

**Interfaces:**
- Consumes: `toArchivedRows`, `ArchivedRow` (Task 2).
- Produces: `useHome().archived: ArchivedRow[]`; `ListRow` prop `muted?: boolean`; locale keys `home.sectionArchived`, `home.archivedShow`, `home.archivedHide`, `home.archivedLabel`.

- [ ] **Step 1: Locale keys**

`home` in `en.json`: `"sectionArchived": "Archived"`, `"archivedShow": "Show"`, `"archivedHide": "Hide"`, `"archivedLabel": "Archived"`; `sv.json`: `"Arkiverade"`, `"Visa"`, `"Dölj"`, `"Arkiverad"`.

- [ ] **Step 2: ListRow muted**

In `ListRow.tsx` add `/** Quieter title, for rows that are no longer live. */ muted?: boolean;`, destructure it, and change the title class to `add ? 'text-gh-primary-strong' : muted ? 'text-gh-ink-2' : 'text-gh-ink'`.

- [ ] **Step 3: Hook and section**

In `useHome.ts`: import `toArchivedRows`; add `const archived = useMemo(() => toArchivedRows(data?.owned ?? []), [data]);` and return `archived`.

Create `src/Home/components/ArchivedSection.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/gh/ListRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import type { ArchivedRow } from '../types';

interface ArchivedSectionProps {
  rows: ArchivedRow[];
  onOpen: (id: string) => void;
}

/** The owner's archived lists, folded away until asked for. */
export const ArchivedSection = ({ rows, onOpen }: ArchivedSectionProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <SectionHeader title={t('home.sectionArchived')} count={rows.length} />
        <Button
          type="button"
          variant="ghost"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="h-11 gap-1 rounded-gh-md px-3 text-[15px] font-semibold text-gh-primary-strong">
          {open ? t('home.archivedHide') : t('home.archivedShow')}
          <Chevron aria-hidden="true" />
        </Button>
      </div>
      {open && (
        <ul className="m-0 flex list-none flex-col divide-y divide-gh-line overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200 p-0">
          {rows.map((row) => (
            <li key={row.id}>
              <ListRow
                muted
                icon={Archive}
                title={row.title}
                subtitle={[t('home.items', { count: row.itemCount }), t('home.archivedLabel')].join(' · ')}
                chevron
                onClick={() => onOpen(row.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
```
Export it in `components/index.ts`.

- [ ] **Step 4: Home page**

In `src/Home/index.tsx`: change `const noLists = owned.length === 0 && organized.length === 0;` to include `&& home.archived.length === 0`, and after the `organized` section inside the fragment add `{home.archived.length > 0 && <ArchivedSection rows={home.archived} onOpen={open} />}` (import it from `./components`).

- [ ] **Step 5: Check**

Run: `npx tsc --noEmit -p tsconfig.app.json && npm run lint && npm run test:unit && npm run build`
Expected: tsc 0 errors, lint at most baseline, unit tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/Home/components/ArchivedSection.tsx src/Home/components/index.ts src/Home/hooks/useHome.ts src/Home/index.tsx src/components/gh/ListRow.tsx src/locales/en.json src/locales/sv.json
git commit -m "feat(archive): collapsed Archived section on Home"
```

---

### Task 6: Docs and verification

**Files:**
- Modify: `CLAUDE.md`, `src/Home/README.md`, `src/Wishlist/README.md`

- [ ] **Step 1: Docs**

In `CLAUDE.md`: add to the `wishlists` row of the data model table `archived_at`, and under "Admin system rules" add: "An archived list (`archived_at` set) is read-only and visible only to its owner: `archive_wishlist` deletes the share link, invitations and organizer (the creator of a self-managed list keeps their own row), drops waiting change requests and keeps items and claims; `unarchive_wishlist` restores a plain list, so the owner invites and shares again. `archived_at` changes only through those two functions." Add the new `archived` mode to the `Wishlist` feature line. In `src/Home/README.md` document the collapsed Archived section; in `src/Wishlist/README.md` document the `archived` mode, the Archive action in Settings, and Restore.

- [ ] **Step 2: Full checks**

Run: `npm run test:unit && npx tsc --noEmit -p tsconfig.app.json && npm run lint && npm run build && npx supabase db reset && npm run test:db`
Expected: unit tests pass (122), tsc 0 errors, lint at most 10 problems (3 errors, 7 warnings), build succeeds, db tests pass (23 files).

- [ ] **Step 3: Browser verification against local Supabase**

Start the dev server from this worktree on port 8080 (stop any other), seed users with the existing `/tmp/p4c/t5_6.sh` recipe (anna/erik/stranger@e2e.se, password `Passw0rd!`) and a list with an organizer, an invitation and a share link. In Chrome (mobile 390 px and desktop 1280 px, light and dark, sv and en), compare with the board https://claude.ai/artifact/91EZJBocaReDBhk3k96QpZ:
1. Settings sheet shows Save, Archive, Delete; Archive opens the in-sheet confirm listing what goes away (no organizer line on a self-managed list); Cancel returns with edits kept.
2. Confirming archives: toast, then the list opens read-only with the banner and Restore; items are not tappable; Delete asks to confirm.
3. The organizer's Home no longer lists it and its URL goes Home; the old `/shared/<token>` shows the invalid-link state.
4. Home: Archived section is collapsed with the count, opens to muted rows that open the archived list; an account with only archived lists still sees the lists layout.
5. Restore returns a normal list with no organizer and no share link; Share offers invite and a new link.
6. Console has no errors; sheets and rows keep 44px targets; text does not wrap badly in sv.
Fix anything that differs from the board, and commit each fix with its own message.

- [ ] **Step 4: Commit docs**

```bash
git add CLAUDE.md src/Home/README.md src/Wishlist/README.md
git commit -m "docs(archive): archived lists in CLAUDE.md and the feature READMEs"
```
