# Phase 4c – Organizer wishlist screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One organizer screen at `/wishlist/:id` for an invited organizer and for the creator of a self-managed list: decide the owner's change requests, see who took what (Lediga · Tagna), make an item free again or remove one gift, edit an item, and create, copy and turn off the share link. The old `AdminWishlist` and `SelfManagedWishlist` screens are removed and `/admin`, `/self` redirect. The database stops an invited organizer from adding items.

**Architecture:** Extends `src/Wishlist/` (built in 4b). `index.tsx` renders `OwnerWishlist` for the owner and the new `OrganizerWishlist` for modes `organizer` and `self` (self adds "Lägg till önskning" and settings, and has no requests). Pure logic (taken/available split, claim names, request view-model, store URL) is plain TypeScript with `node:test`; Supabase access is in `OrganizerService` (organizer reads go through the `wishlist_items_admin` view from phase 4a); state in `useOrganizerWishlist`; UI in Tailwind components with the `gh-*` tokens reusing `ResponsiveSheet`, `ItemFormSheet` (edit/add), `SettingsSheet`, `ConfirmBlock`, `SwitchRow`. One migration removes the organizer's insert right on `wishlist_items`.

**Tech Stack:** React 18 + TypeScript, react-router-dom, react-i18next, sonner, Tailwind (`gh-*`), Supabase (RLS, pgTAP via `npm run test:db`), `node:test` (`npm run test:unit`).

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` section 3 (organizer mode). Approved design: https://claude.ai/artifact/7H54j1GKPXSCWqeEcBjor9 (17 boards: list, Tagna, requests, claims, untake, remove a gift, edit a taken item, share link states, self-managed list, desktop, dark). Decisions made while approving it: an invited organizer **cannot add items** (the owner decides what is on the list; self-managed creators can); an organizer **can edit and delete** existing items.

## Global Constraints

- Never hardcode user-facing strings: keys in `src/locales/en.json` and `sv.json` (Swedish copy per the canvas), through `useTranslation()`.
- Only `gh-*` Tailwind tokens; one primary button per screen (the first request's "Godkänn", or "Lägg till önskning" on a self-managed list, which has no requests); destructive actions confirm inline (`ConfirmBlock` in the same sheet, never a dialog on top of a sheet); touch targets ≥ 44px; focus ring 2px; text ≥ 12px.
- Components are defined at module top level. Use `ITEM_COLUMNS` for `wishlist_items` selects and `.select('id')` after writes; organizers read claim data only through the `wishlist_items_admin` view.
- Generated links use `getBaseUrl()`. Store links go through `toStoreUrl` (https only).
- Copy the owner sees never reveals claims; the organizer's answer defaults stay neutral (the message is the organizer's own words).
- An organizer cannot insert items (database-enforced, Task 1); the creator of a self-managed list is the owner and can.
- Pure logic imports types with `import type` and `.ts` extensions in relative imports so `node --test` runs it.
- Baselines: `tsc` 2 pre-existing errors (`src/AdminWishlist/hooks/useAdminWishlist.ts:218`, `src/Dashboard/components/index.ts:7`; the first disappears with the deleted file), `npm run lint` 12 problems (4 errors, 8 warnings) before this phase; both must not grow.

## Review Focus

- **An organizer inserting an item** (UI is gone, but the database must refuse it) while still editing, deleting, untaking. (Task 1 pgTAP)
- **Taken vs available** for the awkward cases: a gift card with claims below its cap is *available* (and shows progress); a gift card at its cap, a regular item with `is_taken`, and a regular item with a leftover claim row are *taken*; an unlimited gift card is never taken. (Task 2 tests)
- **Request resolution races:** the owner withdraws a request while the organizer is looking at it (`not_pending`), or the item is gone (`item_not_found`): a clear toast and a reload, never a stuck card. (Task 3 hook, Task 5 browser)
- **Neutral answers:** approving or keeping must leave the owner screen's wording neutral; the organizer's message is optional and capped at 500 characters. (Task 4, Task 5)
- **Share link:** creating twice does not make two links; turning off asks first; the link shown is built with `getBaseUrl()`; copy failure (no clipboard permission) shows an error instead of "copied". (Task 3, Task 4)
- **Redirects:** `/wishlist/:id/admin` and `/self` land on `/wishlist/:id`; an invited organizer sees no settings/delete-list; a stranger goes Home; SharedWishlists and Dashboard links point at `/wishlist/:id`. (Task 5)
- **Nothing still imports the deleted screens** and the locale keys the new code uses exist in both languages. (Task 5)

## File structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20261020000020_admin_cannot_insert_items.sql` (+ test 20, test 08 edit) | Organizer can select/update/delete items, not insert |
| `src/Wishlist/types/index.ts` | Organizer types appended |
| `src/Wishlist/lib/organizerItems.ts` (+test) | Taken/available split, who took what |
| `src/Wishlist/lib/organizerRequests.ts` (+test) | Pending requests with claim info |
| `src/Wishlist/lib/storeUrl.ts` (+test) | Safe https store URL |
| `src/Wishlist/lib/mode.ts` (+test) | Role → mode; organizer and self render in place |
| `src/Wishlist/services/OrganizerService.ts` | Organizer's Supabase calls |
| `src/Wishlist/hooks/useOrganizerWishlist.ts` | State and actions |
| `src/Wishlist/components/` | `OrganizerWishlist`, `OrganizerRequestCard`, `OrganizerItemSheet`, `ShareLinkSheet`, `ChangeList` (extracted from `RequestCard`) |
| `src/components/gh/Segmented.tsx` | Lediga · Tagna switch |
| `src/Wishlist/components/ItemFormSheet.tsx` | Optional `note` (taken warning) |
| `src/locales/{en,sv}.json` | `wishlist.org.*` |
| `src/integrations/supabase/types.ts` | `resolve_change_request` RPC type |
| `src/App.tsx`, `src/SharedWishlists/index.tsx`, `src/Dashboard/components/MyWishlistsSection.tsx`, `CLAUDE.md` | Routes, links, docs |
| `src/AdminWishlist/*`, `src/SelfManagedWishlist/*` | Removed |

---

### Task 1: Organizers cannot add items (database)

**Files:**
- Create: `supabase/migrations/20261020000020_admin_cannot_insert_items.sql`
- Create: `supabase/tests/20_admin_cannot_insert_items_test.sql`
- Modify: `supabase/tests/08_grants_test.sql` (policy name list)

**Interfaces:**
- Consumes: `public.is_wishlist_admin(uuid)`, policies `items_owner_*` (phase 4a), fixture `_seed.psql` (W1 organized by `u_admin` with an active link, item `i1` regular, `i2` gift card with a claim, `i3` taken; W3 self-managed by `u_self`).
- Produces: policies `items_admin_select`, `items_admin_update`, `items_admin_delete` on `wishlist_items` replacing `items_admin_all`. There is no admin insert policy; inserts remain possible only through `items_owner_insert` (the owner, including a self-managed creator).

- [ ] **Step 1: Write the failing test** `supabase/tests/20_admin_cannot_insert_items_test.sql`

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);
\ir _seed.psql

-- The organizer shares and keeps track; the owner decides what is on the list
:as_admin
select throws_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Smygdryck') $$,
  '42501', null, 'an organizer cannot add items to the owner''s list');
update wishlist_items set title = 'Bok (arrangör)' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
update wishlist_items set is_taken = false, taken_by_name = null, taken_at = null where id = 'bbbbbbbb-0000-0000-0000-000000000003';
delete from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000002';
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok (arrangör)', 'the organizer can still edit an item');
select ok(not (select is_taken from wishlist_items where id = :'i3'), 'the organizer can still make an item free');
select ok(not exists (select 1 from wishlist_items where id = :'i2'), 'the organizer can still delete an item');

-- The owner, including the creator of a self-managed list, still adds
:as_owner
select lives_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ägarens önskning') $$,
  'the owner can add items');
reset role;
:as_self
select lives_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000003', 'Egen önskning') $$,
  'the creator of a self-managed list can add items');
reset role;

:as_stranger
select throws_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Spam') $$,
  '42501', null, 'a stranger cannot add items');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase test db supabase/tests/20_admin_cannot_insert_items_test.sql 2>&1 | grep -E "Failed test|Result"`
Expected: FAIL: `an organizer cannot add items to the owner's list` (an organizer can insert today); the others pass. If the stack is down: `npx supabase start`.

- [ ] **Step 3: Write the migration** `supabase/migrations/20261020000020_admin_cannot_insert_items.sql`

```sql
-- The owner decides what is on a list. An organizer shares it, keeps track of who
-- took what, and fixes mistakes (edit, delete, make free), but cannot add items.
-- items_admin_all covered insert too; replace it with the three rights an organizer
-- keeps. The owner (including the creator of a self-managed list) inserts through
-- items_owner_insert.
drop policy if exists "items_admin_all" on public.wishlist_items;

create policy "items_admin_select" on public.wishlist_items
  for select to authenticated
  using (public.is_wishlist_admin(wishlist_id));

create policy "items_admin_update" on public.wishlist_items
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id));

create policy "items_admin_delete" on public.wishlist_items
  for delete to authenticated
  using (public.is_wishlist_admin(wishlist_id));
```

- [ ] **Step 4: Apply it and update the policy list in test 08**

Run: `npx supabase migration up 2>&1 | tail -2`
Then replace the line `    ('items_admin_all'),` in `supabase/tests/08_grants_test.sql` with:
```sql
    ('items_admin_select'),
    ('items_admin_update'),
    ('items_admin_delete'),
```
(keep the surrounding lines as they are).

- [ ] **Step 5: Run the whole suite**

Run: `npx supabase test db 2>&1 | grep -E "Failed|Result|Files="`
Expected: `Result: PASS`, 20 files, 206 tests.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261020000020_admin_cannot_insert_items.sql supabase/tests/20_admin_cannot_insert_items_test.sql supabase/tests/08_grants_test.sql
git commit -m "feat(db): an organizer cannot add items to the owner's list"
```

---

### Task 2: Pure logic with unit tests

**Files:**
- Modify: `src/Wishlist/types/index.ts` (append)
- Create: `src/Wishlist/lib/organizerItems.ts`, `organizerItems.test.ts`
- Create: `src/Wishlist/lib/organizerRequests.ts`, `organizerRequests.test.ts`
- Create: `src/Wishlist/lib/storeUrl.ts`, `storeUrl.test.ts`

**Interfaces:**
- Consumes: `OwnerItem`, `ChangeRequestRow`, `OwnerRequest`, `toOwnerRequests` (4b).
- Produces: types `OrganizerItem`, `ClaimRow`, `ShareLinkRow`, `OrganizerData`, `OrganizerSheet`, `OrganizerRequest`, `ItemWithClaims`; functions `isItemTaken(item, claimCount)`, `takerNames(item, claims)`, `hasClaims(item, claims)`, `splitItems(items, claims)` → `{ available: ItemWithClaims[]; taken: ItemWithClaims[] }`, `toOrganizerRequests(rows, items, claims, now)`, `toStoreUrl(link)`.

- [ ] **Step 1: Append the types** to `src/Wishlist/types/index.ts`

```ts
/** What an organizer reads of an item: the owner's columns plus who took it. */
export interface OrganizerItem extends OwnerItem {
  is_taken: boolean;
  taken_by_name: string | null;
  taken_at: string | null;
}

export interface ClaimRow {
  id: string;
  item_id: string;
  claimer_name: string;
  claimed_at: string;
}

export interface ItemWithClaims {
  item: OrganizerItem;
  /** Oldest first. */
  claims: ClaimRow[];
}

export interface ShareLinkRow {
  token: string;
  is_active: boolean;
}

export interface OrganizerData {
  wishlist: Wishlist;
  /** The owner's name, for "Önskelista av Anna". */
  ownerName: string | null;
  items: OrganizerItem[];
  claims: ClaimRow[];
  /** Pending requests only. */
  requests: ChangeRequestRow[];
  shareLink: ShareLinkRow | null;
}

/** A pending request plus what only an organizer may know: is the item taken, and by whom. */
export interface OrganizerRequest extends OwnerRequest {
  claimed: boolean;
  claimedBy: string | null;
}

export type OrganizerSheet =
  | { type: 'add' }
  | { type: 'item'; itemId: string }
  | { type: 'edit'; itemId: string }
  | { type: 'share' }
  | { type: 'settings' }
  | null;
```

- [ ] **Step 2: Write the failing tests** `src/Wishlist/lib/organizerItems.test.ts`

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasClaims, isItemTaken, splitItems, takerNames } from './organizerItems.ts';
import type { ClaimRow, OrganizerItem } from '../types/index.ts';

const item = (over: Partial<OrganizerItem> = {}): OrganizerItem => ({
  id: 'i1',
  title: 'Sak',
  description: null,
  link: null,
  url: null,
  price_range: null,
  priority: null,
  is_giftcard: false,
  claim_cap: null,
  created_at: '2026-10-01T00:00:00Z',
  is_taken: false,
  taken_by_name: null,
  taken_at: null,
  ...over,
});

const claim = (id: string, itemId: string, name: string, at: string): ClaimRow => ({
  id,
  item_id: itemId,
  claimer_name: name,
  claimed_at: at,
});

test('a free regular item is available', () => {
  assert.equal(isItemTaken(item(), 0), false);
});

test('a regular item marked taken is taken', () => {
  assert.equal(isItemTaken(item({ is_taken: true, taken_by_name: 'Mormor' }), 0), true);
});

test('a regular item with a leftover claim row is taken', () => {
  assert.equal(isItemTaken(item(), 1), true);
});

test('a gift card below its cap is still available', () => {
  assert.equal(isItemTaken(item({ is_giftcard: true, claim_cap: 5 }), 2), false);
});

test('a gift card at its cap is taken', () => {
  assert.equal(isItemTaken(item({ is_giftcard: true, claim_cap: 3 }), 3), true);
});

test('an unlimited gift card is never taken by claims alone', () => {
  assert.equal(isItemTaken(item({ is_giftcard: true, claim_cap: null }), 40), false);
});

test('takerNames: a regular item uses taken_by_name', () => {
  assert.deepEqual(takerNames(item({ is_taken: true, taken_by_name: 'Mormor' }), []), ['Mormor']);
});

test('takerNames: a gift card lists its claimers oldest first', () => {
  const claims = [claim('c2', 'i1', 'Farfar', '2026-10-15'), claim('c1', 'i1', 'Kim', '2026-10-12')];
  assert.deepEqual(takerNames(item({ is_giftcard: true }), claims), ['Kim', 'Farfar']);
});

test('takerNames: nobody gives an empty list, and a name is not listed twice', () => {
  assert.deepEqual(takerNames(item(), []), []);
  const claims = [claim('c1', 'i1', 'Mormor', '2026-10-12')];
  assert.deepEqual(takerNames(item({ is_taken: true, taken_by_name: 'Mormor' }), claims), ['Mormor']);
});

test('hasClaims is true for a taken flag or any claim row', () => {
  assert.equal(hasClaims(item(), []), false);
  assert.equal(hasClaims(item({ is_taken: true }), []), true);
  assert.equal(hasClaims(item({ is_giftcard: true }), [claim('c1', 'i1', 'Kim', '2026-10-12')]), true);
});

test('splitItems separates available and taken, keeps item order and attaches sorted claims', () => {
  const items = [
    item({ id: 'a' }),
    item({ id: 'b', is_taken: true, taken_by_name: 'Lina' }),
    item({ id: 'c', is_giftcard: true, claim_cap: 2 }),
    item({ id: 'd', is_giftcard: true, claim_cap: 2 }),
  ];
  const claims = [
    claim('c3', 'd', 'Z', '2026-10-20'),
    claim('c1', 'c', 'X', '2026-10-10'),
    claim('c2', 'd', 'Y', '2026-10-11'),
  ];
  const { available, taken } = splitItems(items, claims);
  assert.deepEqual(available.map((e) => e.item.id), ['a', 'c']);
  assert.deepEqual(taken.map((e) => e.item.id), ['b', 'd']);
  assert.deepEqual(taken[1].claims.map((c) => c.id), ['c2', 'c3']);
  assert.deepEqual(available[1].claims.map((c) => c.id), ['c1']);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)|Cannot find module" | head -4`
Expected: FAIL `Cannot find module './organizerItems.ts'`.

- [ ] **Step 4: Implement** `src/Wishlist/lib/organizerItems.ts`

```ts
import type { ClaimRow, ItemWithClaims, OrganizerItem } from '../types/index.ts';

/**
 * Taken means there is nothing more to give. A gift card with claims below its cap
 * stays available (and shows its progress); an unlimited one never runs out.
 */
export const isItemTaken = (item: OrganizerItem, claimCount: number): boolean => {
  if (item.is_taken) return true;
  if (!item.is_giftcard) return claimCount > 0;
  return item.claim_cap != null && claimCount >= item.claim_cap;
};

/** The people who took or gave, oldest first, each once. */
export const takerNames = (item: OrganizerItem, claims: ClaimRow[]): string[] => {
  const names = [...claims]
    .sort((a, b) => a.claimed_at.localeCompare(b.claimed_at))
    .map((claim) => claim.claimer_name);
  const all = !item.is_giftcard && item.taken_by_name ? [item.taken_by_name, ...names] : names;
  return all.filter((name, index) => all.indexOf(name) === index);
};

/** Anyone has taken or given something. */
export const hasClaims = (item: OrganizerItem, claims: ClaimRow[]): boolean =>
  item.is_taken || claims.length > 0;

export const splitItems = (
  items: OrganizerItem[],
  claims: ClaimRow[],
): { available: ItemWithClaims[]; taken: ItemWithClaims[] } => {
  const byItem = new Map<string, ClaimRow[]>();
  for (const claim of claims) byItem.set(claim.item_id, [...(byItem.get(claim.item_id) ?? []), claim]);

  const available: ItemWithClaims[] = [];
  const taken: ItemWithClaims[] = [];
  for (const item of items) {
    const itemClaims = [...(byItem.get(item.id) ?? [])].sort((a, b) =>
      a.claimed_at.localeCompare(b.claimed_at),
    );
    (isItemTaken(item, itemClaims.length) ? taken : available).push({ item, claims: itemClaims });
  }
  return { available, taken };
};
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"`
Expected: 51 + 11 = 62 pass, 0 fail.

- [ ] **Step 6: Write the failing tests** `src/Wishlist/lib/organizerRequests.test.ts`

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toOrganizerRequests } from './organizerRequests.ts';
import type { ChangeRequestRow, ClaimRow, OrganizerItem } from '../types/index.ts';

const now = new Date('2026-10-21T12:00:00Z');

const item = (over: Partial<OrganizerItem> = {}): OrganizerItem => ({
  id: 'i1',
  title: 'Trädgårdssax',
  description: null,
  link: null,
  url: null,
  price_range: 'ca 250 kr',
  priority: 1,
  is_giftcard: false,
  claim_cap: null,
  created_at: '2026-10-01T00:00:00Z',
  is_taken: false,
  taken_by_name: null,
  taken_at: null,
  ...over,
});

const row = (over: Partial<ChangeRequestRow> = {}): ChangeRequestRow => ({
  id: 'r1',
  item_id: 'i1',
  item_title: 'Trädgårdssax',
  kind: 'edit',
  proposed: { price_range: 'ca 300 kr' },
  status: 'pending',
  message: null,
  created_at: '2026-10-21T08:00:00Z',
  resolved_at: null,
  ...over,
});

const claim = (name: string): ClaimRow => ({ id: 'c1', item_id: 'i1', claimer_name: name, claimed_at: '2026-10-12' });

test('only pending requests are listed', () => {
  const rows = [row({ id: 'a' }), row({ id: 'b', status: 'approved', resolved_at: '2026-10-20T00:00:00Z' })];
  assert.deepEqual(toOrganizerRequests(rows, [item()], [], now).map((r) => r.id), ['a']);
});

test('an untaken item gives claimed false and no names', () => {
  const [request] = toOrganizerRequests([row()], [item()], [], now);
  assert.equal(request.claimed, false);
  assert.equal(request.claimedBy, null);
});

test('a taken regular item shows who took it', () => {
  const [request] = toOrganizerRequests(
    [row({ kind: 'remove', proposed: null })],
    [item({ is_taken: true, taken_by_name: 'Mormor' })],
    [],
    now,
  );
  assert.equal(request.claimed, true);
  assert.equal(request.claimedBy, 'Mormor');
  assert.deepEqual(request.changes, []);
});

test('a gift card with claims lists everyone who gave', () => {
  const claims = [claim('Kim'), { ...claim('Farfar'), id: 'c2', claimed_at: '2026-10-15' }];
  const [request] = toOrganizerRequests([row()], [item({ is_giftcard: true })], claims, now);
  assert.equal(request.claimed, true);
  assert.equal(request.claimedBy, 'Kim, Farfar');
});

test('the before value of an edit comes from the current item', () => {
  const [request] = toOrganizerRequests([row()], [item()], [], now);
  assert.deepEqual(request.changes, [{ field: 'price', before: 'ca 250 kr', after: 'ca 300 kr' }]);
});

test('a request whose item is gone is not claimed', () => {
  const [request] = toOrganizerRequests([row({ item_id: null })], [], [], now);
  assert.equal(request.claimed, false);
  assert.equal(request.claimedBy, null);
});
```

- [ ] **Step 7: Run to verify it fails, then implement** `src/Wishlist/lib/organizerRequests.ts`

Run: `npm run test:unit 2>&1 | grep -E "Cannot find module" | head -2` — Expected: FAIL for `organizerRequests.ts`.

```ts
import { toOwnerRequests } from './changeRequests.ts';
import { hasClaims, takerNames } from './organizerItems.ts';
import type { ChangeRequestRow, ClaimRow, OrganizerItem, OrganizerRequest } from '../types/index.ts';

/**
 * The organizer's view of the owner's pending requests: what is asked, and whether
 * the item is taken (which the owner is never told).
 */
export const toOrganizerRequests = (
  rows: ChangeRequestRow[],
  items: OrganizerItem[],
  claims: ClaimRow[],
  now: Date,
): OrganizerRequest[] => {
  const byId = new Map(items.map((item) => [item.id, item]));
  return toOwnerRequests(
    rows.filter((row) => row.status === 'pending'),
    items,
    now,
  ).map((request): OrganizerRequest => {
    const item = request.itemId ? byId.get(request.itemId) : undefined;
    const itemClaims = item ? claims.filter((claim) => claim.item_id === item.id) : [];
    const names = item ? takerNames(item, itemClaims) : [];
    return {
      ...request,
      claimed: item ? hasClaims(item, itemClaims) : false,
      claimedBy: names.length > 0 ? names.join(', ') : null,
    };
  });
};
```

- [ ] **Step 8: Store URL: failing test, then implement**

`src/Wishlist/lib/storeUrl.test.ts`
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toStoreUrl } from './storeUrl.ts';

test('a bare domain becomes https', () => {
  assert.equal(toStoreUrl('lekia.se'), 'https://lekia.se');
});

test('an http or https address is kept, whatever its case', () => {
  assert.equal(toStoreUrl('http://lekia.se/x'), 'http://lekia.se/x');
  assert.equal(toStoreUrl('HTTPS://LEKIA.SE'), 'HTTPS://LEKIA.SE');
});

test('other schemes are never executed: they are treated as part of an https address', () => {
  assert.equal(toStoreUrl('javascript:alert(1)'), 'https://javascript:alert(1)');
  assert.equal(toStoreUrl('data:text/html,x'), 'https://data:text/html,x');
});

test('whitespace is trimmed', () => {
  assert.equal(toStoreUrl('  lekia.se  '), 'https://lekia.se');
});
```

Run `npm run test:unit 2>&1 | grep -E "Cannot find module" | head -2` — Expected: FAIL for `storeUrl.ts`. Then `src/Wishlist/lib/storeUrl.ts`:

```ts
/** Store links come from the list owner: always open them as an https URL. */
export const toStoreUrl = (link: string): string => {
  const trimmed = link.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
```

- [ ] **Step 9: Run everything and commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: 72 pass, 0 fail (51 + 11 + 6 + 4); tsc still 2.

```bash
git add src/Wishlist
git commit -m "feat(wishlist): organizer logic (taken split, claim names, request view-model, store url)"
```

---

### Task 3: Service and hook

**Files:**
- Modify: `src/integrations/supabase/types.ts` (`resolve_change_request`)
- Modify: `src/Wishlist/services/WishlistService.ts` (export `REQUEST_COLUMNS`)
- Create: `src/Wishlist/services/OrganizerService.ts`
- Create: `src/Wishlist/hooks/useOrganizerWishlist.ts`

**Interfaces:**
- Consumes: Task 2 types and functions, `WishlistService` (`loadWishlist`, `addItem`, `updateItem`, `deleteItem`, `updateSettings`, `deleteList`), `errorCode`, `validateItemForm`.
- Produces: `OrganizerService` (static: `loadOrganizerData`, `untake`, `removeClaim`, `resolveRequest`, `createShareLink`, `setShareLinkActive`), `shareUrl(token)`, and `useOrganizerWishlist(wishlistId)` returning the object in Step 4. Error codes carried in `error.message`: `not_pending`, `request_not_found`, `item_not_found`, `edit_locked`, `claim_not_found`, `share_link_not_found`.

- [ ] **Step 1: Type the RPC** in `src/integrations/supabase/types.ts`

In the `public` schema's `Functions`, insert immediately before `"remove_wishlist_admin":`:

```ts
"resolve_change_request":
{ Args: { "p_request_id": string,"p_approve": boolean,"p_message"?: string }; Returns: undefined
                           },
```

In `src/Wishlist/services/WishlistService.ts` change `const REQUEST_COLUMNS =` to `export const REQUEST_COLUMNS =`.

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"` — Expected: `2`.

- [ ] **Step 2: Write the service** `src/Wishlist/services/OrganizerService.ts`

```ts
import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/lib/urlUtils';
import { REQUEST_COLUMNS, WishlistService } from './WishlistService';
import type {
  ChangeRequestRow,
  ClaimRow,
  OrganizerData,
  OrganizerItem,
  ShareLinkRow,
} from '../types';

export const shareUrl = (token: string): string => `${getBaseUrl()}/shared/${token}`;

/** Everything an organizer (or the creator of a self-managed list) reads and does. */
export class OrganizerService {
  static async loadOrganizerData(wishlistId: string): Promise<OrganizerData> {
    const wishlist = await WishlistService.loadWishlist(wishlistId);
    if (!wishlist) throw new Error('wishlist_not_found');
    const [items, requests, shareLink, ownerName] = await Promise.all([
      OrganizerService.loadItems(wishlistId),
      OrganizerService.loadRequests(wishlistId),
      OrganizerService.loadShareLink(wishlistId),
      OrganizerService.loadOwnerName(wishlist.creator_id),
    ]);
    const claims = await OrganizerService.loadClaims(items.map((item) => item.id));
    return { wishlist, ownerName, items, claims, requests, shareLink };
  }

  /** Through the view: claim columns are not readable from the table. */
  private static async loadItems(wishlistId: string): Promise<OrganizerItem[]> {
    const { data, error } = await supabase
      .from('wishlist_items_admin')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as OrganizerItem[];
  }

  private static async loadClaims(itemIds: string[]): Promise<ClaimRow[]> {
    if (itemIds.length === 0) return [];
    const { data, error } = await supabase
      .from('item_claims')
      .select('id, item_id, claimer_name, claimed_at')
      .in('item_id', itemIds)
      .order('claimed_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ClaimRow[];
  }

  private static async loadRequests(wishlistId: string): Promise<ChangeRequestRow[]> {
    const { data, error } = await supabase
      .from('item_change_requests')
      .select(REQUEST_COLUMNS)
      .eq('wishlist_id', wishlistId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ChangeRequestRow[];
  }

  private static async loadShareLink(wishlistId: string): Promise<ShareLinkRow | null> {
    const { data, error } = await supabase
      .from('share_links')
      .select('token, is_active')
      .eq('wishlist_id', wishlistId)
      .maybeSingle();
    if (error) throw error;
    return data ? { token: data.token, is_active: data.is_active } : null;
  }

  private static async loadOwnerName(ownerId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', ownerId)
      .maybeSingle();
    if (error) throw error;
    return data?.full_name ?? null;
  }

  /** Makes a regular item free again. */
  static async untake(itemId: string): Promise<void> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .update({ is_taken: false, taken_by_name: null, taken_at: null })
      .eq('id', itemId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('item_not_found');
  }

  /** Removes one person's gift from a gift card. */
  static async removeClaim(claimId: string): Promise<void> {
    const { data, error } = await supabase
      .from('item_claims')
      .delete()
      .eq('id', claimId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('claim_not_found');
  }

  /** Approve applies the change to the item in the same transaction; keep leaves it. */
  static async resolveRequest(requestId: string, approve: boolean, message: string): Promise<void> {
    const text = message.trim();
    const { error } = await supabase.rpc('resolve_change_request', {
      p_request_id: requestId,
      p_approve: approve,
      p_message: text === '' ? undefined : text,
    });
    if (error) throw error;
  }

  /** One link per list: an existing one is returned, not duplicated. */
  static async createShareLink(wishlistId: string): Promise<ShareLinkRow> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('not_authenticated');

    const existing = await OrganizerService.loadShareLink(wishlistId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('share_links')
      .insert({ wishlist_id: wishlistId, created_by: user.id, token: crypto.randomUUID() })
      .select('token, is_active')
      .single();
    if (error) throw error;
    return { token: data.token, is_active: data.is_active };
  }

  /** Turning the link off stops claims and opens; turning it on again restores the same link. */
  static async setShareLinkActive(wishlistId: string, active: boolean): Promise<ShareLinkRow> {
    const { data, error } = await supabase
      .from('share_links')
      .update({ is_active: active })
      .eq('wishlist_id', wishlistId)
      .select('token, is_active');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('share_link_not_found');
    return { token: data[0].token, is_active: data[0].is_active };
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200`
Expected: only the 2 baseline errors. (If `wishlist_items_admin` or `share_links.is_active` is missing from the generated types, add the column to the `share_links` entry in `types.ts` in the file's existing style: `"is_active": boolean` in Row and `"is_active"?: boolean` in Insert/Update.)

- [ ] **Step 4: Write the hook** `src/Wishlist/hooks/useOrganizerWishlist.ts`

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { errorCode } from '../lib/errorCode';
import { validateItemForm } from '../lib/itemForm';
import { splitItems } from '../lib/organizerItems';
import { toOrganizerRequests } from '../lib/organizerRequests';
import { OrganizerService, shareUrl } from '../services/OrganizerService';
import { WishlistService } from '../services/WishlistService';
import type {
  ClaimRow,
  ItemFormData,
  ItemFormError,
  OrganizerData,
  OrganizerItem,
  OrganizerRequest,
  OrganizerSheet,
  SettingsValues,
} from '../types';

export type Segment = 'available' | 'taken';

export const useOrganizerWishlist = (wishlistId: string | undefined) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<OrganizerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<OrganizerSheet>(null);
  const [segment, setSegment] = useState<Segment>('available');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!wishlistId) {
      setLoading(false);
      return;
    }
    try {
      setData(await OrganizerService.loadOrganizerData(wishlistId));
    } catch (error) {
      console.error('Load organizer wishlist error:', error);
      toast.error(t('wishlist.org.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [wishlistId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(
    () => (data ? splitItems(data.items, data.claims) : { available: [], taken: [] }),
    [data],
  );
  const requests = useMemo(
    () => (data ? toOrganizerRequests(data.requests, data.items, data.claims, new Date()) : []),
    [data],
  );

  /** Runs an action; known error codes become a clear toast and, where the list changed under us, a reload. */
  const run = useCallback(
    async (action: () => Promise<void>, errorKey: string): Promise<boolean> => {
      setBusy(true);
      try {
        await action();
        return true;
      } catch (error) {
        console.error(error);
        const code = errorCode(error);
        if (code === 'not_pending' || code === 'request_not_found') {
          toast.error(t('wishlist.org.toast.requestAnswered'));
          await load();
        } else if (code === 'item_not_found' || code === 'edit_locked') {
          toast.error(t('wishlist.org.toast.itemGone'));
          setSheet(null);
          await load();
        } else if (code === 'claim_not_found') {
          toast.error(t('wishlist.org.toast.claimGone'));
          await load();
        } else if (code === 'share_link_not_found') {
          toast.error(t('wishlist.org.toast.linkGone'));
          await load();
        } else {
          toast.error(t(errorKey));
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [t, load],
  );

  const closeSheet = useCallback(() => setSheet(null), []);

  /** Self-managed lists only: an invited organizer cannot add items (the database refuses it). */
  const addItem = async (form: ItemFormData): Promise<ItemFormError | null> => {
    const invalid = validateItemForm(form);
    if (invalid) return invalid;
    if (!wishlistId) return null;
    const ok = await run(() => WishlistService.addItem(wishlistId, form), 'wishlist.toast.addFailed');
    if (ok) {
      toast.success(t('wishlist.toast.added'));
      closeSheet();
      await load();
    }
    return null;
  };

  const saveItem = async (item: OrganizerItem, form: ItemFormData): Promise<ItemFormError | null> => {
    const invalid = validateItemForm(form);
    if (invalid) return invalid;
    const ok = await run(() => WishlistService.updateItem(item.id, form), 'wishlist.toast.saveFailed');
    if (ok) {
      toast.success(t('wishlist.toast.saved'));
      closeSheet();
      await load();
    }
    return null;
  };

  const removeItem = async (item: OrganizerItem) => {
    const ok = await run(() => WishlistService.deleteItem(item.id), 'wishlist.toast.removeFailed');
    if (ok) {
      toast.success(t('wishlist.toast.removed'));
      closeSheet();
      await load();
    }
  };

  const untake = async (item: OrganizerItem) => {
    const ok = await run(() => OrganizerService.untake(item.id), 'wishlist.org.toast.untakeFailed');
    if (ok) {
      toast.success(t('wishlist.org.toast.madeFree'));
      closeSheet();
      await load();
    }
  };

  const removeClaim = async (claim: ClaimRow) => {
    const ok = await run(
      () => OrganizerService.removeClaim(claim.id),
      'wishlist.org.toast.removeClaimFailed',
    );
    if (ok) {
      toast.success(t('wishlist.org.toast.claimRemoved'));
      await load();
    }
  };

  const resolveRequest = async (request: OrganizerRequest, approve: boolean, message: string) => {
    const ok = await run(
      () => OrganizerService.resolveRequest(request.id, approve, message),
      'wishlist.org.toast.resolveFailed',
    );
    if (ok) {
      toast.success(t(approve ? 'wishlist.org.toast.approved' : 'wishlist.org.toast.kept'));
      await load();
    }
  };

  const createLink = async () => {
    if (!wishlistId) return;
    const ok = await run(() => OrganizerService.createShareLink(wishlistId).then(() => undefined), 'wishlist.org.toast.linkFailed');
    if (ok) await load();
  };

  const setLinkActive = async (active: boolean) => {
    if (!wishlistId) return;
    const ok = await run(
      () => OrganizerService.setShareLinkActive(wishlistId, active).then(() => undefined),
      'wishlist.org.toast.linkFailed',
    );
    if (ok) {
      toast.success(t(active ? 'wishlist.org.toast.linkOn' : 'wishlist.org.toast.linkOff'));
      await load();
    }
  };

  /** Never says "copied" unless the browser really copied it. */
  const copyLink = async () => {
    if (!data?.shareLink) return;
    try {
      await navigator.clipboard.writeText(shareUrl(data.shareLink.token));
      setCopied(true);
      toast.success(t('wishlist.org.toast.linkCopied'));
      window.setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Copy link error:', error);
      toast.error(t('wishlist.org.toast.copyFailed'));
    }
  };

  /** Settings and deleting the list: self-managed lists only. */
  const saveSettings = async (values: SettingsValues): Promise<'title_required' | null> => {
    if (!wishlistId) return null;
    if (values.title.trim() === '') return 'title_required';
    const ok = await run(
      () => WishlistService.updateSettings(wishlistId, values),
      'wishlist.toast.settingsFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.settingsSaved'));
      closeSheet();
      await load();
    }
    return null;
  };

  const deleteList = async () => {
    if (!wishlistId) return;
    const ok = await run(() => WishlistService.deleteList(wishlistId), 'wishlist.toast.deleteFailed');
    if (ok) {
      toast.success(t('wishlist.toast.listDeleted'));
      navigate('/');
    }
  };

  return {
    loading,
    data,
    groups,
    requests,
    sheet,
    segment,
    busy,
    copied,
    setSegment,
    openAdd: () => setSheet({ type: 'add' }),
    openItem: (itemId: string) => setSheet({ type: 'item', itemId }),
    openEdit: (itemId: string) => setSheet({ type: 'edit', itemId }),
    openShare: () => setSheet({ type: 'share' }),
    openSettings: () => setSheet({ type: 'settings' }),
    closeSheet,
    addItem,
    saveItem,
    removeItem,
    untake,
    removeClaim,
    resolveRequest,
    createLink,
    setLinkActive,
    copyLink,
    saveSettings,
    deleteList,
  };
};
```

- [ ] **Step 5: Typecheck, lint and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/Wishlist|problems"`
Expected: only the 2 baseline tsc errors; no new lint problem under `src/Wishlist` (totals 12 problems).

```bash
git add src/integrations/supabase/types.ts src/Wishlist
git commit -m "feat(wishlist): organizer service and hook (requests, claims, untake, share link)"
```

---

### Task 4: Organizer components and copy

**Files:**
- Create: `src/components/gh/Segmented.tsx`
- Create: `src/Wishlist/components/ChangeList.tsx`; Modify (full replace): `src/Wishlist/components/RequestCard.tsx`
- Create: `src/Wishlist/components/OrganizerRequestCard.tsx`, `OrganizerItemSheet.tsx`, `ShareLinkSheet.tsx`, `OrganizerWishlist.tsx`
- Modify: `src/Wishlist/components/ItemFormSheet.tsx` (optional `note`), `src/Wishlist/components/index.ts`
- Modify: `src/locales/en.json`, `src/locales/sv.json` (`wishlist.org`)

**Interfaces:**
- Consumes: Tasks 2–3 (`useOrganizerWishlist`, `splitItems`, `takerNames`, `hasClaims`, `toStoreUrl`, `shareUrl`, types), 4b components (`ItemFormSheet`, `SettingsSheet`, `WishlistLoading`), `ResponsiveSheet`, `ConfirmBlock`, `SwitchRow`, `DangerButton`, `TextArea`, `StatusPill`, `ClaimProgress`, `ItemRow`, `SectionHeader`, `EmptyState`.
- Produces: `Segmented({ options, value, onChange, ariaLabel })`, `ChangeList({ changes })`, `OrganizerWishlist({ wishlistId, mode })` with `mode: 'organizer' | 'self'`.

There is no component test harness: the logic these lean on is covered in Task 2 and Task 5 verifies the screens in a browser. `tsc` stays at baseline after each step.

- [ ] **Step 1: `Segmented`** `src/components/gh/Segmented.tsx`

```tsx
import { cn } from '@/lib/utils';

interface SegmentedOption {
  value: string;
  label: string;
  count?: number;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

/** Two or three views side by side, e.g. "Lediga · Tagna", with counts in the segment. */
export const Segmented = ({ options, value, onChange, ariaLabel }: SegmentedProps) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className="flex w-full gap-1 rounded-gh-md bg-gh-surface-300 p-1">
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-gh-sm border px-3 text-[15px] font-semibold leading-5',
            'transition-colors motion-reduce:transition-none',
            selected
              ? 'border-gh-line bg-gh-surface-200 text-gh-ink'
              : 'border-transparent text-gh-ink-2 hover:text-gh-ink',
          )}>
          {option.label}
          {option.count != null && (
            <span className={cn('text-[13px]', selected ? 'text-gh-primary-strong' : 'text-gh-muted')}>
              {option.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
```

- [ ] **Step 2: Share the change list between the owner's and the organizer's card**

`src/Wishlist/components/ChangeList.tsx`
```tsx
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { priorityName } from '../lib/itemForm';
import type { ChangedField, FieldChange, FieldValue } from '../types';

/** "Pris  ca 250 kr → ca 300 kr", one row per changed field. */
export const ChangeList = ({ changes }: { changes: FieldChange[] }) => {
  const { t } = useTranslation();

  const formatValue = (field: ChangedField, value: FieldValue | undefined): string => {
    if (value === null || value === undefined || value === '') return t('wishlist.request.emptyValue');
    if (field === 'image') return t('wishlist.request.imageChanged');
    if (field === 'giftcard') return value ? t('wishlist.request.yes') : t('wishlist.request.no');
    if (field === 'priority') {
      const name = priorityName(Number(value));
      return name ? t(`wishlist.form.prio.${name}`) : t('wishlist.request.emptyValue');
    }
    return String(value);
  };

  return (
    <dl className="flex flex-col gap-1">
      {changes.map((change) => (
        <div key={change.field} className="flex flex-wrap items-baseline gap-x-2 text-[14px] leading-5">
          <dt className="text-gh-muted">{t(`wishlist.request.field.${change.field}`)}</dt>
          <dd className="flex flex-wrap items-center gap-x-2 text-gh-ink">
            {change.before !== undefined && (
              <>
                <span className="text-gh-muted line-through">{formatValue(change.field, change.before)}</span>
                <ArrowRight className="h-4 w-4 text-gh-muted" aria-hidden="true" />
              </>
            )}
            <span className="font-semibold">{formatValue(change.field, change.after)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
```

Replace the whole of `src/Wishlist/components/RequestCard.tsx` with:

```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/gh/StatusPill';
import { ChangeList } from './ChangeList';
import type { OwnerRequest } from '../types';

interface RequestCardProps {
  request: OwnerRequest;
  organizerName: string;
  busy: boolean;
  onWithdraw: (requestId: string) => void;
}

/** The owner's view of a change request: what was asked, then a neutral answer. */
export const RequestCard = ({ request, organizerName, busy, onWithdraw }: RequestCardProps) => {
  const { t, i18n } = useTranslation();

  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
    new Date(request.when),
  );
  const lead = request.kind === 'remove' ? t('wishlist.request.removeLead') : t('wishlist.request.editLead');
  const when =
    request.state === 'pending'
      ? t('wishlist.request.sent', { date })
      : t('wishlist.request.answered', { date });

  return (
    <article className="flex flex-col gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{request.itemTitle}</h3>
        <p className="text-[13px] leading-[18px] text-gh-muted">
          {lead} · {when}
        </p>
      </header>

      {request.changes.length > 0 && <ChangeList changes={request.changes} />}

      {request.state === 'pending' ? (
        <div className="flex flex-col items-start gap-3">
          <StatusPill status="pending">{t('wishlist.request.pending')}</StatusPill>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onWithdraw(request.id)}
            className="h-11 rounded-gh-md px-4 text-[15px] font-semibold">
            {t('wishlist.request.withdraw')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[16px] font-semibold leading-6 text-gh-ink">
            {request.state === 'applied'
              ? t('wishlist.request.applied')
              : t('wishlist.request.kept', { name: organizerName })}
          </p>
          {request.message && (
            <div className="rounded-gh-md bg-gh-surface-300 p-3">
              <p className="text-[12px] font-semibold leading-4 text-gh-muted">
                {t('wishlist.request.messageFrom', { name: organizerName })}
              </p>
              <p className="text-[15px] leading-[22px] text-gh-ink">{request.message}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
};
```

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"` — Expected: `2`.

- [ ] **Step 3: `OrganizerRequestCard`** `src/Wishlist/components/OrganizerRequestCard.tsx`

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/gh/StatusPill';
import { TextArea } from '@/components/gh/TextArea';
import { ChangeList } from './ChangeList';
import type { OrganizerRequest } from '../types';

interface OrganizerRequestCardProps {
  request: OrganizerRequest;
  ownerName: string;
  /** Only the first card's "Godkänn" is the page's primary action. */
  primary: boolean;
  busy: boolean;
  onResolve: (request: OrganizerRequest, approve: boolean, message: string) => void;
}

/** The owner's change as the organizer decides it: before → after, is it taken, answer with an optional message. */
export const OrganizerRequestCard = ({ request, ownerName, primary, busy, onResolve }: OrganizerRequestCardProps) => {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState('');

  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
    new Date(request.when),
  );
  const lead =
    request.kind === 'remove'
      ? t('wishlist.org.request.removeLead', { name: ownerName })
      : t('wishlist.org.request.editLead', { name: ownerName });
  const pill = request.claimed
    ? request.claimedBy
      ? t('wishlist.org.takenBy', { name: request.claimedBy })
      : t('wishlist.org.pillTaken')
    : t('publicWishlist.statusAvailable');

  return (
    <article className="flex flex-col gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{request.itemTitle}</h3>
        <p className="text-[13px] leading-[18px] text-gh-muted">
          {lead} · {t('wishlist.request.sent', { date })}
        </p>
      </header>

      <div>
        <StatusPill status={request.claimed ? 'taken' : 'available'}>{pill}</StatusPill>
      </div>

      {request.changes.length > 0 ? (
        <ChangeList changes={request.changes} />
      ) : (
        <p className="text-[14px] leading-5 text-gh-ink-2">{t('wishlist.org.request.removeNote')}</p>
      )}

      <TextArea
        label={`${t('wishlist.org.request.messageLabel', { name: ownerName })} ${t('wishlist.form.optional')}`}
        help={t('wishlist.org.request.messageHelp', { name: ownerName })}
        rows={2}
        maxLength={500}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => onResolve(request, false, message)}
          className="h-12 flex-1 rounded-gh-md px-3 text-[15px] font-semibold">
          {t('wishlist.org.request.keep')}
        </Button>
        <Button
          type="button"
          variant={primary ? 'default' : 'outline'}
          disabled={busy}
          onClick={() => onResolve(request, true, message)}
          className="h-12 flex-1 rounded-gh-md px-3 text-[15px] font-semibold">
          {t('wishlist.org.request.approve')}
        </Button>
      </div>
    </article>
  );
};
```

- [ ] **Step 4: `OrganizerItemSheet`** `src/Wishlist/components/OrganizerItemSheet.tsx`

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClaimProgress } from '@/components/gh/ClaimProgress';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { StatusPill } from '@/components/gh/StatusPill';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { priorityName } from '../lib/itemForm';
import { isItemTaken, takerNames } from '../lib/organizerItems';
import { toStoreUrl } from '../lib/storeUrl';
import type { ClaimRow, OrganizerItem } from '../types';

type Confirm = { type: 'untake' } | { type: 'claim'; claim: ClaimRow } | null;

interface OrganizerItemSheetProps {
  item: OrganizerItem;
  claims: ClaimRow[];
  listTitle: string;
  busy: boolean;
  onEdit: () => void;
  onUntake: () => void;
  onRemoveClaim: (claim: ClaimRow) => void;
  onClose: () => void;
}

/** One item for the organizer: its status, who took or gave, and the fixes (make free, remove a gift, edit). */
export const OrganizerItemSheet = ({
  item,
  claims,
  listTitle,
  busy,
  onEdit,
  onUntake,
  onRemoveClaim,
  onClose,
}: OrganizerItemSheetProps) => {
  const { t, i18n } = useTranslation();
  const [confirm, setConfirm] = useState<Confirm>(null);

  const taken = isItemTaken(item, claims.length);
  const names = takerNames(item, claims);
  const date = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(new Date(iso));
  const prio = priorityName(item.priority);
  const meta = [item.price_range, prio ? t(`wishlist.prioShort.${prio}`) : null].filter(Boolean).join(' · ');
  const pill = taken
    ? item.is_giftcard
      ? t('wishlist.org.allGave')
      : names.length > 0
        ? t('wishlist.org.takenBy', { name: names.join(', ') })
        : t('wishlist.org.pillTaken')
    : t('publicWishlist.statusAvailable');
  const canUntake = !item.is_giftcard && taken;

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={item.title}
      subtitle={listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={taken ? 'taken' : 'available'}>{pill}</StatusPill>
        {item.is_giftcard && (
          <ClaimProgress
            count={claims.length}
            cap={item.claim_cap}
            label={
              item.claim_cap != null
                ? t('publicWishlist.claimsOfCap', { count: claims.length, cap: item.claim_cap })
                : t('publicWishlist.claimsCount', { count: claims.length })
            }
          />
        )}
      </div>
      {meta && <p className="text-[14px] leading-5 text-gh-muted">{meta}</p>}
      {item.description && <p className="text-[16px] leading-6 text-gh-ink-2">{item.description}</p>}
      {item.link && (
        <Button asChild variant="outline" className="h-11 w-full rounded-gh-md text-[15px] font-semibold">
          <a href={toStoreUrl(item.link)} target="_blank" rel="noopener noreferrer">
            {t('wishlist.org.sheet.openStore')}
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      )}

      {claims.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-[15px] font-semibold leading-5 text-gh-ink">{t('wishlist.org.sheet.givenBy')}</h3>
          <ul className="m-0 flex list-none flex-col overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200 p-0">
            {claims.map((claim) => (
              <li
                key={claim.id}
                className="flex min-h-[56px] items-center gap-3 border-t border-gh-line py-1 pl-4 pr-2 first:border-t-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold leading-6 text-gh-ink">{claim.claimer_name}</p>
                  <p className="text-[13px] leading-[18px] text-gh-muted">{date(claim.claimed_at)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirm({ type: 'claim', claim })}
                  className="h-11 rounded-gh-md px-3 text-[14px] font-semibold text-gh-ink">
                  {t('wishlist.org.sheet.removeClaim')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canUntake && item.taken_at && (
        <p className="text-[13px] leading-[18px] text-gh-muted">
          {t('wishlist.org.sheet.takenOn', { date: date(item.taken_at) })}
        </p>
      )}

      {confirm?.type === 'untake' ? (
        <ConfirmBlock
          destructive
          question={t('wishlist.org.sheet.untakeQuestion', { title: item.title })}
          context={
            names.length > 0
              ? t('wishlist.org.sheet.untakeContext', { name: names.join(', ') })
              : t('wishlist.org.sheet.untakeContextNoName')
          }
          confirmLabel={t('wishlist.org.sheet.untakeAction')}
          cancelLabel={t('wishlist.confirm.cancel')}
          loading={busy}
          onConfirm={onUntake}
          onCancel={() => setConfirm(null)}
        />
      ) : confirm?.type === 'claim' ? (
        <ConfirmBlock
          destructive
          question={t('wishlist.org.sheet.removeClaimQuestion', { name: confirm.claim.claimer_name })}
          context={t('wishlist.org.sheet.removeClaimContext', { name: confirm.claim.claimer_name })}
          confirmLabel={t('wishlist.org.sheet.removeClaimAction')}
          cancelLabel={t('wishlist.confirm.cancel')}
          loading={busy}
          onConfirm={() => {
            onRemoveClaim(confirm.claim);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            className="h-12 w-full gap-2 rounded-gh-md text-[16px] font-semibold">
            <Pencil aria-hidden="true" />
            {t('wishlist.org.sheet.edit')}
          </Button>
          {canUntake && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirm({ type: 'untake' })}
              className="h-12 w-full rounded-gh-md text-[16px] font-semibold">
              {t('wishlist.org.sheet.untake')}
            </Button>
          )}
        </div>
      )}
    </ResponsiveSheet>
  );
};
```

- [ ] **Step 5: `ShareLinkSheet`** `src/Wishlist/components/ShareLinkSheet.tsx`

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { SwitchRow } from '@/components/gh/SwitchRow';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { cn } from '@/lib/utils';
import { shareUrl } from '../services/OrganizerService';
import type { ShareLinkRow } from '../types';

interface ShareLinkSheetProps {
  shareLink: ShareLinkRow | null;
  listTitle: string;
  busy: boolean;
  copied: boolean;
  onCreate: () => void;
  onCopy: () => void;
  onSetActive: (active: boolean) => void;
  onClose: () => void;
}

/** Only the organizer sees the link: it shows what is taken. Create, copy, turn off, turn on again. */
export const ShareLinkSheet = ({
  shareLink,
  listTitle,
  busy,
  copied,
  onCreate,
  onCopy,
  onSetActive,
  onClose,
}: ShareLinkSheetProps) => {
  const { t } = useTranslation();
  const [confirmingOff, setConfirmingOff] = useState(false);

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('wishlist.org.share.title')}
      subtitle={listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      {!shareLink ? (
        <>
          <div className="flex flex-col gap-1">
            <h3 className="text-[18px] font-bold leading-6 text-gh-ink">{t('wishlist.org.share.noneTitle')}</h3>
            <p className="text-[16px] leading-6 text-gh-ink-2">{t('wishlist.org.share.noneLead')}</p>
          </div>
          <Button
            type="button"
            onClick={onCreate}
            disabled={busy}
            className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Link2 aria-hidden="true" />}
            {t('wishlist.org.share.create')}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
              {t('wishlist.org.share.urlLabel')}
            </span>
            <div className="flex flex-col gap-2 rounded-gh-md border border-gh-line-strong bg-gh-surface-300 p-3">
              <p
                className={cn(
                  'break-all text-[15px] leading-[22px]',
                  shareLink.is_active ? 'text-gh-ink' : 'text-gh-muted line-through',
                )}>
                {shareUrl(shareLink.token)}
              </p>
              {!shareLink.is_active && (
                <p className="text-[13px] font-semibold leading-[18px] text-gh-muted">
                  {t('wishlist.org.share.inactiveBadge')}
                </p>
              )}
            </div>
          </div>

          {shareLink.is_active && (
            <Button
              type="button"
              onClick={onCopy}
              className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? t('wishlist.org.share.copied') : t('wishlist.org.share.copy')}
            </Button>
          )}

          {confirmingOff ? (
            <ConfirmBlock
              destructive
              question={t('wishlist.org.share.offQuestion')}
              context={t('wishlist.org.share.offContext')}
              confirmLabel={t('wishlist.org.share.offAction')}
              cancelLabel={t('wishlist.confirm.cancel')}
              loading={busy}
              onConfirm={() => {
                setConfirmingOff(false);
                onSetActive(false);
              }}
              onCancel={() => setConfirmingOff(false)}
            />
          ) : (
            <div className="overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200">
              <SwitchRow
                label={t('wishlist.org.share.active')}
                description={
                  shareLink.is_active ? t('wishlist.org.share.activeHelp') : t('wishlist.org.share.inactiveHelp')
                }
                checked={shareLink.is_active}
                onChange={(checked) => (checked ? onSetActive(true) : setConfirmingOff(true))}
              />
            </div>
          )}
        </>
      )}
    </ResponsiveSheet>
  );
};
```

- [ ] **Step 6: `ItemFormSheet` accepts an optional warning note**

```bash
python3 -I - <<'EOF'
p = 'src/Wishlist/components/ItemFormSheet.tsx'
s = open(p).read()
def swap(old, new):
    global s
    assert s.count(old) == 1, old
    s = s.replace(old, new)
swap("  listTitle: string;\n  busy: boolean;", "  listTitle: string;\n  /** A warning above the fields, e.g. \"Mormor has taken this\". */\n  note?: string;\n  busy: boolean;")
swap("  listTitle,\n  busy,\n  onSubmit,", "  listTitle,\n  note,\n  busy,\n  onSubmit,")
swap('        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>\n          <ItemFormFields',
     '        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>\n          {note && (\n            <p className="rounded-gh-md bg-gh-warning-bg p-3 text-[14px] leading-5 text-gh-ink">{note}</p>\n          )}\n          <ItemFormFields')
open(p, 'w').write(s)
EOF
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"
```
Expected: `2`.

- [ ] **Step 7: The page** `src/Wishlist/components/OrganizerWishlist.tsx` and its export

```tsx
import { useTranslation } from 'react-i18next';
import { Gift, Plus, Settings, Share2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import { ItemRow } from '@/components/gh/ItemRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { Segmented } from '@/components/gh/Segmented';
import { useOrganizerWishlist } from '../hooks/useOrganizerWishlist';
import { priorityName } from '../lib/itemForm';
import { hasClaims, takerNames } from '../lib/organizerItems';
import type { ItemWithClaims } from '../types';
import { ItemFormSheet } from './ItemFormSheet';
import { OrganizerItemSheet } from './OrganizerItemSheet';
import { OrganizerRequestCard } from './OrganizerRequestCard';
import { SettingsSheet } from './SettingsSheet';
import { ShareLinkSheet } from './ShareLinkSheet';
import { WishlistLoading } from './WishlistLoading';

interface OrganizerWishlistProps {
  wishlistId: string;
  /** self = the creator of a self-managed list: also adds items and has settings, never requests. */
  mode: 'organizer' | 'self';
}

export const OrganizerWishlist = ({ wishlistId, mode }: OrganizerWishlistProps) => {
  const { t } = useTranslation();
  const wishlist = useOrganizerWishlist(wishlistId);
  const { data, loading, sheet, busy, segment, groups } = wishlist;

  if (loading) return <WishlistLoading />;
  if (!data) {
    return (
      <div className="min-h-screen bg-gh-bg text-gh-ink">
        <AppHeader />
        <EmptyState icon={Gift} size="screen" title={t('wishlist.org.toast.loadFailed')} />
      </div>
    );
  }

  const self = mode === 'self';
  const list = data.wishlist;
  const ownerName = data.ownerName ?? t('wishlist.org.ownerFallback');
  const shown = segment === 'available' ? groups.available : groups.taken;
  const entry = (itemId: string): ItemWithClaims | undefined =>
    [...groups.available, ...groups.taken].find((e) => e.item.id === itemId);
  const selected = sheet && 'itemId' in sheet ? entry(sheet.itemId) : undefined;

  const rowStatus = ({ item, claims }: ItemWithClaims) => {
    if (segment === 'available') return { kind: 'available' as const, label: t('publicWishlist.statusAvailable') };
    if (item.is_giftcard) return { kind: 'taken' as const, label: t('wishlist.org.allGave') };
    const names = takerNames(item, claims);
    return {
      kind: 'taken' as const,
      label: names.length > 0 ? t('wishlist.org.takenBy', { name: names.join(', ') }) : t('wishlist.org.pillTaken'),
    };
  };
  const meta = (price: string | null, priority: number | null) => {
    const name = priorityName(priority);
    return [price, name ? t(`wishlist.prioShort.${name}`) : null].filter(Boolean).join(' · ');
  };

  const addButton = (extra: string) => (
    <Button
      type="button"
      onClick={wishlist.openAdd}
      className={`h-[52px] gap-2 rounded-gh-md px-6 text-[17px] font-semibold ${extra}`}>
      <Plus aria-hidden="true" />
      {t('wishlist.addItem')}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="flex max-w-[560px] flex-col gap-2">
            {!self && (
              <p className="text-[13px] leading-[18px] text-gh-muted">
                {t('wishlist.org.eyebrow', { name: ownerName })}
              </p>
            )}
            <h1 className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-gh-ink">{list.title}</h1>
            {list.description && <p className="text-[16px] leading-6 text-gh-ink-2">{list.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={wishlist.openShare}
              className="h-12 gap-2 rounded-gh-md px-4 text-[16px] font-semibold">
              <Share2 aria-hidden="true" />
              {t('wishlist.shareButton')}
            </Button>
            {self && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={wishlist.openSettings}
                  aria-label={t('wishlist.settingsButton')}
                  className="h-12 w-12 rounded-gh-md text-gh-ink">
                  <Settings className="!size-5" aria-hidden="true" />
                </Button>
                <span className="hidden md:inline-flex">{addButton('')}</span>
              </>
            )}
          </div>
        </header>

        {self && <div className="md:hidden">{addButton('w-full')}</div>}

        {!self && wishlist.requests.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeader title={t('wishlist.org.sectionRequests')} count={wishlist.requests.length} />
            <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
              {wishlist.requests.map((request, index) => (
                <OrganizerRequestCard
                  key={request.id}
                  request={request}
                  ownerName={ownerName}
                  primary={index === 0}
                  busy={busy}
                  onResolve={wishlist.resolveRequest}
                />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <div className="md:max-w-[360px]">
            <Segmented
              ariaLabel={t('wishlist.org.segmentLabel')}
              value={segment}
              onChange={(value) => wishlist.setSegment(value as 'available' | 'taken')}
              options={[
                { value: 'available', label: t('wishlist.org.segment.available'), count: groups.available.length },
                { value: 'taken', label: t('wishlist.org.segment.taken'), count: groups.taken.length },
              ]}
            />
          </div>
          {shown.length === 0 ? (
            <EmptyState
              icon={Gift}
              title={t(segment === 'available' ? 'wishlist.org.empty.availableTitle' : 'wishlist.org.empty.takenTitle')}
              text={t(segment === 'available' ? 'wishlist.org.empty.availableText' : 'wishlist.org.empty.takenText')}
            />
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
              {shown.map((e) => {
                const count = e.claims.length;
                const showClaims = e.item.is_giftcard && (count > 0 || e.item.claim_cap != null);
                return (
                  <li key={e.item.id}>
                    <ItemRow
                      title={e.item.title}
                      image={e.item.url}
                      meta={meta(e.item.price_range, e.item.priority)}
                      status={rowStatus(e)}
                      taken={segment === 'taken'}
                      giftCardLabel={e.item.is_giftcard ? t('publicWishlist.giftCardBadge') : undefined}
                      claim={
                        showClaims
                          ? {
                              count,
                              cap: e.item.claim_cap,
                              label:
                                e.item.claim_cap != null
                                  ? t('publicWishlist.claimsOfCap', { count, cap: e.item.claim_cap })
                                  : t('publicWishlist.claimsCount', { count }),
                            }
                          : undefined
                      }
                      onClick={() => wishlist.openItem(e.item.id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {sheet?.type === 'add' && self && (
        <ItemFormSheet
          key="add"
          mode="add"
          shared={false}
          organizerName={null}
          pending={false}
          listTitle={list.title}
          busy={busy}
          onSubmit={wishlist.addItem}
          onRemove={() => undefined}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'item' && selected && (
        <OrganizerItemSheet
          key={selected.item.id}
          item={selected.item}
          claims={selected.claims}
          listTitle={list.title}
          busy={busy}
          onEdit={() => wishlist.openEdit(selected.item.id)}
          onUntake={() => wishlist.untake(selected.item)}
          onRemoveClaim={wishlist.removeClaim}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'edit' && selected && (
        <ItemFormSheet
          key={`edit-${selected.item.id}`}
          mode="edit"
          item={selected.item}
          shared={false}
          organizerName={null}
          pending={false}
          listTitle={list.title}
          note={
            hasClaims(selected.item, selected.claims)
              ? t('wishlist.org.editNote', { names: takerNames(selected.item, selected.claims).join(', ') })
              : undefined
          }
          busy={busy}
          onSubmit={(form) => wishlist.saveItem(selected.item, form)}
          onRemove={() => wishlist.removeItem(selected.item)}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'share' && (
        <ShareLinkSheet
          shareLink={data.shareLink}
          listTitle={list.title}
          busy={busy}
          copied={wishlist.copied}
          onCreate={wishlist.createLink}
          onCopy={wishlist.copyLink}
          onSetActive={wishlist.setLinkActive}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'settings' && self && (
        <SettingsSheet
          wishlist={list}
          busy={busy}
          onSave={wishlist.saveSettings}
          onDelete={wishlist.deleteList}
          onClose={wishlist.closeSheet}
        />
      )}
    </div>
  );
};
```

Append to `src/Wishlist/components/index.ts`: `export { OrganizerWishlist } from './OrganizerWishlist';`

- [ ] **Step 8: Add the copy**

Write this script to the scratchpad and run it from the repo root (it adds `wishlist.org` and keeps everything else):

```python
import json

en = {
  "eyebrow": "Wishlist by {{name}}",
  "ownerFallback": "the owner",
  "sectionRequests": "Requests",
  "segmentLabel": "Show",
  "segment": {"available": "Available", "taken": "Taken"},
  "empty": {
    "availableTitle": "Nothing available",
    "availableText": "Everything on the list is taken.",
    "takenTitle": "Nothing taken yet",
    "takenText": "When someone takes a wish, it shows up here."
  },
  "pillTaken": "Taken",
  "takenBy": "Taken by {{name}}",
  "allGave": "Everyone has given",
  "editNote": "{{names}} has already taken this. Get in touch if you change something that affects the purchase.",
  "request": {
    "editLead": "{{name}} wants to change the wish",
    "removeLead": "{{name}} wants to remove the wish",
    "removeNote": "If you approve, the wish disappears from the list.",
    "messageLabel": "Message to {{name}}",
    "messageHelp": "{{name}} only sees that the change is done or that you kept the wish, plus your message. {{name}} never sees that it is taken.",
    "approve": "Approve",
    "keep": "Keep as it is"
  },
  "sheet": {
    "givenBy": "Who has given",
    "takenOn": "Taken {{date}}",
    "edit": "Change the wish",
    "untake": "Make available",
    "removeClaim": "Remove",
    "openStore": "Open in the shop",
    "untakeQuestion": "Make {{title}} available again?",
    "untakeContext": "{{name}}'s name is removed and others can take the wish. Get in touch with them first.",
    "untakeContextNoName": "Others can take the wish. Get in touch with whoever took it first.",
    "untakeAction": "Make available",
    "removeClaimQuestion": "Remove {{name}}'s gift?",
    "removeClaimContext": "There is room for one more. Get in touch with {{name}} first.",
    "removeClaimAction": "Remove the gift"
  },
  "share": {
    "title": "Share the list",
    "noneTitle": "Create a link",
    "noneLead": "Anyone who gets the link can pick a wish without an account. Only you see who took what.",
    "create": "Create link",
    "urlLabel": "Link",
    "copy": "Copy link",
    "copied": "The link is copied",
    "active": "The link is on",
    "activeHelp": "Anyone with the link can pick a wish.",
    "inactiveBadge": "Turned off",
    "inactiveHelp": "Turn it on and the same link works again.",
    "offQuestion": "Turn off the link?",
    "offContext": "Whoever opens the link sees a message that it is not active. You can turn the same link on again.",
    "offAction": "Turn off the link"
  },
  "toast": {
    "loadFailed": "Could not load the list. Try again.",
    "requestAnswered": "That request has already been answered or withdrawn.",
    "itemGone": "That wish is gone.",
    "claimGone": "That gift is already removed.",
    "linkGone": "There is no link for this list any more.",
    "untakeFailed": "Could not make the wish available. Try again.",
    "madeFree": "The wish is available again",
    "removeClaimFailed": "Could not remove the gift. Try again.",
    "claimRemoved": "The gift is removed",
    "resolveFailed": "Could not answer the request. Try again.",
    "approved": "The change is done",
    "kept": "The wish is kept as it was",
    "linkFailed": "Could not change the link. Try again.",
    "linkOn": "The link is on",
    "linkOff": "The link is turned off",
    "linkCopied": "The link is copied",
    "copyFailed": "Could not copy the link. Copy it by hand from the box."
  }
}

sv = {
  "eyebrow": "Önskelista av {{name}}",
  "ownerFallback": "ägaren",
  "sectionRequests": "Förfrågningar",
  "segmentLabel": "Visa",
  "segment": {"available": "Lediga", "taken": "Tagna"},
  "empty": {
    "availableTitle": "Inga lediga önskningar",
    "availableText": "Allt på listan är taget.",
    "takenTitle": "Inget taget än",
    "takenText": "När någon tar en önskning syns det här."
  },
  "pillTaken": "Tagen",
  "takenBy": "Tagen av {{name}}",
  "allGave": "Alla har gett",
  "editNote": "{{names}} har redan tagit den här. Hör av dig om du ändrar något som påverkar köpet.",
  "request": {
    "editLead": "{{name}} vill ändra önskningen",
    "removeLead": "{{name}} vill ta bort önskningen",
    "removeNote": "Om du godkänner försvinner önskningen från listan.",
    "messageLabel": "Meddelande till {{name}}",
    "messageHelp": "{{name}} ser bara att ändringen är gjord eller att du behöll önskningen, plus ditt meddelande. {{name}} ser aldrig att den är tagen.",
    "approve": "Godkänn",
    "keep": "Behåll som den är"
  },
  "sheet": {
    "givenBy": "Dessa har gett",
    "takenOn": "Tagen {{date}}",
    "edit": "Ändra önskningen",
    "untake": "Gör ledig",
    "removeClaim": "Ta bort",
    "openStore": "Öppna i butiken",
    "untakeQuestion": "Göra {{title}} ledig igen?",
    "untakeContext": "{{name}}s namn tas bort och andra kan ta önskningen. Hör gärna av dig först.",
    "untakeContextNoName": "Andra kan ta önskningen. Hör gärna av dig till den som tagit den först.",
    "untakeAction": "Gör ledig",
    "removeClaimQuestion": "Ta bort {{name}}s gåva?",
    "removeClaimContext": "Det blir plats för en till. Hör gärna av dig till {{name}} först.",
    "removeClaimAction": "Ta bort gåvan"
  },
  "share": {
    "title": "Dela listan",
    "noneTitle": "Skapa en länk",
    "noneLead": "Den som får länken kan välja en önskning utan konto. Bara du ser vem som tagit vad.",
    "create": "Skapa länk",
    "urlLabel": "Länk",
    "copy": "Kopiera länk",
    "copied": "Länken är kopierad",
    "active": "Länken är aktiv",
    "activeHelp": "Den som har länken kan välja en önskning.",
    "inactiveBadge": "Avstängd",
    "inactiveHelp": "Slå på så fungerar samma länk igen.",
    "offQuestion": "Stänga av länken?",
    "offContext": "Den som öppnar länken ser då ett meddelande om att den inte är aktiv. Du kan slå på samma länk igen.",
    "offAction": "Stäng av länken"
  },
  "toast": {
    "loadFailed": "Det gick inte att ladda listan. Försök igen.",
    "requestAnswered": "Den förfrågan är redan besvarad eller tillbakadragen.",
    "itemGone": "Den önskningen finns inte längre.",
    "claimGone": "Den gåvan är redan borttagen.",
    "linkGone": "Det finns ingen länk för listan längre.",
    "untakeFailed": "Det gick inte att göra önskningen ledig. Försök igen.",
    "madeFree": "Önskningen är ledig igen",
    "removeClaimFailed": "Det gick inte att ta bort gåvan. Försök igen.",
    "claimRemoved": "Gåvan är borttagen",
    "resolveFailed": "Det gick inte att svara på förfrågan. Försök igen.",
    "approved": "Ändringen är gjord",
    "kept": "Önskningen behölls som den var",
    "linkFailed": "Det gick inte att ändra länken. Försök igen.",
    "linkOn": "Länken är på",
    "linkOff": "Länken är avstängd",
    "linkCopied": "Länken är kopierad",
    "copyFailed": "Det gick inte att kopiera länken. Kopiera den för hand från rutan."
  }
}

for path, section in (("src/locales/en.json", en), ("src/locales/sv.json", sv)):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    data["wishlist"]["org"] = section
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
print("ok")
```

Run it, then check parity and the diff:

```bash
python3 -I - <<'EOF'
import json
def keys(d, p=''):
    out=set()
    for k,v in d.items():
        out |= keys(v,p+k+'.') if isinstance(v,dict) else {p+k}
    return out
en=json.load(open('src/locales/en.json'))['wishlist']['org']; sv=json.load(open('src/locales/sv.json'))['wishlist']['org']
print('only en:', sorted(keys(en)-keys(sv))); print('only sv:', sorted(keys(sv)-keys(en)))
EOF
git diff --stat src/locales
```
Expected: both lists empty; only additions in the two locale files.

- [ ] **Step 9: Static checks and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/Wishlist|src/components/gh|problems"; npm run build 2>&1 | tail -1`
Expected: only the 2 baseline tsc errors; no new lint problem (12 total); build succeeds. If the `ItemRow` `status` prop type rejects `'available'`/`'taken'` literals, the object literals above already use `as const`; do not widen the component.

```bash
git add src
git commit -m "feat(wishlist): organizer screen components (requests, Lediga/Tagna, claims, share link)"
```

---

### Task 5: Route, redirects, cleanup and browser verification

**Files:**
- Modify: `src/Wishlist/index.tsx`, `src/Wishlist/lib/mode.ts`, `src/Wishlist/lib/mode.test.ts`
- Modify: `src/App.tsx`, `src/SharedWishlists/index.tsx`, `src/Dashboard/components/MyWishlistsSection.tsx`, `src/Dashboard/README.md`, `CLAUDE.md`
- Delete: `src/AdminWishlist/`, `src/SelfManagedWishlist/`

**Interfaces:**
- Consumes: `OwnerWishlist`, `OrganizerWishlist` (4b, Task 4), `resolveMode`.
- Produces: default export `Wishlist` and named export `WishlistRedirect` (used for `/manage`, `/admin`, `/self`). `modePath` is removed: organizer and self-managed render in place.

- [ ] **Step 1: Mode no longer needs a redirect path** (TDD: change the test first)

```bash
python3 -I - <<'EOF'
p = 'src/Wishlist/lib/mode.test.ts'
s = open(p).read()
assert s.count("import { modePath, resolveMode } from './mode.ts';") == 1
s = s.replace("import { modePath, resolveMode } from './mode.ts';", "import { resolveMode } from './mode.ts';")
i = s.index("test('modePath sends each mode")
s = s[:i].rstrip() + "\n"
open(p, 'w').write(s)
EOF
npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"
```
Expected: still all pass (the removed test no longer runs): 71 pass. Then remove `modePath` from `src/Wishlist/lib/mode.ts`:

```bash
python3 -I - <<'EOF'
p = 'src/Wishlist/lib/mode.ts'
s = open(p).read()
i = s.index("/**\n * Until phase 4c")
open(p, 'w').write(s[:i].rstrip() + "\n")
EOF
tail -8 src/Wishlist/lib/mode.ts
```
Expected: the file ends after `resolveMode`. (`tsc` complains about `index.tsx` importing `modePath` until Step 2.)

- [ ] **Step 2: The route entry** (full replacement) `src/Wishlist/index.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/useAuth';
import { OrganizerWishlist, OwnerWishlist, WishlistLoading } from './components';
import { resolveMode } from './lib/mode';
import { WishlistService } from './services/WishlistService';
import type { Mode } from './types';

/**
 * One address for a wishlist, whoever opens it: the owner, the invited organizer
 * and the creator of a self-managed list each get their own mode; anyone else goes Home.
 */
const Wishlist = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const userId = user?.id;
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!id || !userId) {
        if (!cancelled) setMode('none');
        return;
      }
      try {
        const wishlist = await WishlistService.loadWishlist(id);
        const isOrganizer = wishlist ? await WishlistService.isOrganizer(id, userId) : false;
        if (!cancelled) setMode(resolveMode({ wishlist, userId, isOrganizer }));
      } catch (error) {
        console.error('Resolve wishlist mode error:', error);
        if (!cancelled) setMode('none');
      }
    };
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  if (!id || mode === null) return <WishlistLoading />;
  if (mode === 'owner') return <OwnerWishlist wishlistId={id} />;
  if (mode === 'organizer' || mode === 'self') return <OrganizerWishlist wishlistId={id} mode={mode} />;
  return <Navigate to="/" replace />;
};

/** Old addresses (/manage, /admin, /self) land on the new one. */
export const WishlistRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/wishlist/${id}` : '/'} replace />;
};

export default Wishlist;
```

- [ ] **Step 3: Routes and links**

```bash
python3 -I - <<'EOF'
def edit(path, pairs):
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (path, old)
        s = s.replace(old, new)
    open(path, 'w').write(s)

edit('src/App.tsx', [
    ("import Wishlist, { ManageRedirect } from './Wishlist';", "import Wishlist, { WishlistRedirect } from './Wishlist';"),
    ("import AdminWishlist from './AdminWishlist';\n", ""),
    ("import SelfManagedWishlist from './SelfManagedWishlist';\n", ""),
    ('<Route path="/wishlist/:id/manage" element={<ManageRedirect />} />', '<Route path="/wishlist/:id/manage" element={<WishlistRedirect />} />'),
    ('<Route path="/wishlist/:id/admin" element={<AdminWishlist />} />', '<Route path="/wishlist/:id/admin" element={<WishlistRedirect />} />'),
    ('<Route path="/wishlist/:id/self" element={<SelfManagedWishlist />} />', '<Route path="/wishlist/:id/self" element={<WishlistRedirect />} />'),
])
edit('src/SharedWishlists/index.tsx', [
    ("navigate(`/wishlist/${wishlist.id}/admin`)", "navigate(`/wishlist/${wishlist.id}`)"),
])
edit('src/Dashboard/components/MyWishlistsSection.tsx', [
    ("""                navigate(
                  wishlist.is_self_managed
                    ? `/wishlist/${wishlist.id}/self`
                    : `/wishlist/${wishlist.id}`
                )""", "                navigate(`/wishlist/${wishlist.id}`)"),
])
EOF
git diff --stat src/App.tsx src/SharedWishlists src/Dashboard | tail -4
```
Expected: three files changed by a few lines.

- [ ] **Step 4: Remove the old screens**

```bash
git rm -rq src/AdminWishlist src/SelfManagedWishlist
grep -rn "AdminWishlist/\|SelfManagedWishlist/\|from './AdminWishlist'\|from './SelfManagedWishlist'\|@/AdminWishlist\|@/SelfManagedWishlist" src | cut -c1-140
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200
npm run build 2>&1 | tail -1
```
Expected: the `grep` prints nothing; tsc reports exactly one error (`src/Dashboard/components/index.ts(7,39)`, pre-existing: the other baseline error lived in the deleted file); build succeeds. If something still imports a deleted file, move only what it needs; do not restore the screens. The old locale keys (`adminWishlist.*`, `editLimitedDialog.*`, …) stay: pruning them is a later cleanup.

- [ ] **Step 5: Docs**

```bash
python3 -I - <<'EOF'
p = 'CLAUDE.md'
lines = open(p).read().split('\n')
def swap(prefix, new):
    idx = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(idx) == 1, prefix
    lines[idx[0]] = new
swap("Features: `Dashboard`", "Features: `Dashboard`, `Wishlist` (`/wishlist/:id`: one screen that adapts to the viewer: the owner, an invited organizer, or the creator of a self-managed list), `Auth`, `Onboarding`, `Profile`, `SharedWishlists`, `AcceptInvitation`, `PublicWishlist` (share-link view for anonymous users).")
swap("- **Admin / self-managed view**", "- **Organizer / self-managed view**: a gift card moves to Tagna when its cap is reached; the organizer removes individual gifts one by one in the item sheet (inline `ConfirmBlock`).")
swap("- `SelfManagedWishlist` (`is_self_managed", "- A self-managed list (`is_self_managed = true`) lets the creator act as their own organizer on the same screen: add items, settings, share link, make free, remove a gift; no change requests.\n- An invited organizer cannot add items (the database refuses it): the owner decides what is on the list. The organizer can still edit, delete, make an item free and answer change requests.")
open(p, 'w').write('\n'.join(lines))
EOF
git diff --stat CLAUDE.md | tail -1
sed -i '' 's/Routes to the Wishlist (owner), AdminWishlist and SelfManagedWishlist screens/Routes to the Wishlist screen (`\/wishlist\/:id`)/' src/Dashboard/README.md
grep -n "Routes to" src/Dashboard/README.md
```
Expected: CLAUDE.md changed; the Dashboard README line now mentions only `/wishlist/:id`. Also update `src/Wishlist/README.md`: replace the bullet that says organizers are redirected until phase 4c with "- Organizer mode (`components/OrganizerWishlist`): decide the owner's change requests, Lediga · Tagna, who took what, make free, remove a gift, edit, share link. A self-managed creator gets the same screen plus add and settings." and add `OrganizerService` / `useOrganizerWishlist` to the Structure list.

- [ ] **Step 6: Static checks and commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1`
Expected: 71 pass; lint no worse than 12 problems; build succeeds.

```bash
git add -A src CLAUDE.md
git status --short | grep -v "^[AMDR] " | head
git commit -m "feat(wishlist): organizer mode at /wishlist/:id; retire AdminWishlist and SelfManagedWishlist"
```

- [ ] **Step 7: Seed the local database**

Check what exists first: `docker exec supabase_db_pjiofxvhzcengexymoms psql -U postgres -Atc "select email from auth.users"`. If `anna@e2e.se`, `erik@e2e.se` and `stranger@e2e.se` are missing (after a `db reset`), create them and the lists:

```bash
npx supabase status >/dev/null 2>&1 || npx supabase start
KEY=$(npx supabase status -o env 2>/dev/null | grep '^SERVICE_ROLE_KEY=' | cut -d'"' -f2)
for u in anna erik stranger; do
  curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H 'Content-Type: application/json' -d "{\"email\":\"$u@e2e.se\",\"password\":\"Passw0rd!\",\"email_confirm\":true}" | head -c 60; echo
done
docker exec -i supabase_db_pjiofxvhzcengexymoms psql -U postgres <<'SQL'
update profiles set full_name = case email when 'anna@e2e.se' then 'Anna Lind' when 'erik@e2e.se' then 'Erik Berg' else 'Sam Främling' end;
with o as (select id from profiles where email='anna@e2e.se'),
     a as (select id from profiles where email='erik@e2e.se'),
     w as (insert into wishlists (title, description, creator_id, enable_links, enable_price, enable_priority)
           select 'Annas 35-årsdag', 'Saker jag önskar mig i år. Ta det som passar.', o.id, true, true, true from o returning id)
insert into wishlist_admins (wishlist_id, admin_id, invited_by) select w.id, a.id, (select id from o) from w, a;
insert into wishlist_items (wishlist_id, title, description, price_range, priority, link, is_giftcard, claim_cap)
select w.id, v.t, v.d, v.p, v.pr, v.l, v.g, v.c from wishlists w,
 (values ('Lego Botanicals – Bonsai','Den gröna, inte den rosa.','ca 400 kr',3,'lekia.se',false,null::int),
         ('Presentkort Akademibokhandeln','Flera kan ge.','valfritt belopp',2,null,true,5),
         ('Stekpanna i gjutjärn',null,'ca 600 kr',2,null,false,null),
         ('Trädgårdssax',null,'ca 250 kr',1,null,false,null),
         ('Ullsockor, storlek 38–40',null,'ca 150 kr',2,null,false,null),
         ('Termos 1 liter',null,'ca 350 kr',1,null,false,null)) v(t,d,p,pr,l,g,c)
where w.title = 'Annas 35-årsdag';
insert into share_links (wishlist_id, token, created_by)
select w.id, 'e2e-token', p.id from wishlists w, profiles p where w.title = 'Annas 35-årsdag' and p.email = 'erik@e2e.se';
with e as (select id from profiles where email='erik@e2e.se'),
     w as (insert into wishlists (title, creator_id, is_self_managed) select 'Eriks egen lista', id, true from e returning id, creator_id)
insert into wishlist_admins (wishlist_id, admin_id, invited_by) select id, creator_id, creator_id from w;
SQL
```

Then, in every case, add what this phase needs (takes and requests):

```bash
docker exec -i supabase_db_pjiofxvhzcengexymoms psql -U postgres <<'SQL'
-- Givers take items through the same RPC the public page uses
select public.claim_shared_item('e2e-token', id, 'Mormor') from wishlist_items where title = 'Ullsockor, storlek 38–40' and not is_taken;
select public.claim_shared_item('e2e-token', id, 'Lina') from wishlist_items where title = 'Termos 1 liter' and not is_taken;
select public.claim_shared_item('e2e-token', id, 'Kim') from wishlist_items where title like 'Presentkort Akademi%';
select public.claim_shared_item('e2e-token', id, 'Farfar') from wishlist_items where title like 'Presentkort Akademi%';
-- Two items for the self-managed list
insert into wishlist_items (wishlist_id, title, price_range, priority)
select w.id, v.t, v.p, v.pr from wishlists w, (values ('Kaffekvarn','ca 700 kr',2),('Cykelhjälm','ca 900 kr',3)) v(t,p,pr)
where w.title = 'Eriks egen lista' and not exists (select 1 from wishlist_items i where i.wishlist_id = w.id);
select id, title, is_self_managed from wishlists order by title;
SQL
ANNA=$(docker exec supabase_db_pjiofxvhzcengexymoms psql -U postgres -Atc "select id from profiles where email='anna@e2e.se'")
docker exec -i supabase_db_pjiofxvhzcengexymoms psql -U postgres <<SQL
begin;
set local request.jwt.claims = '{"sub":"$ANNA","email":"anna@e2e.se","role":"authenticated"}';
set local role authenticated;
select public.request_item_change(id, 'edit', '{"price_range":"ca 300 kr"}'::jsonb) from wishlist_items where title = 'Trädgårdssax';
select public.request_item_change(id, 'remove') from wishlist_items where title = 'Ullsockor, storlek 38–40';
commit;
SQL
```
Expected: the list ids printed (note them), and two request ids (skip the requests if they already exist).

- [ ] **Step 8: Browser verification** (Chrome DevTools MCP, local Supabase, `npm run dev` in this worktree; one isolated context per user, password `Passw0rd!`; Erik is organizer of "Annas 35-årsdag" and creator of "Eriks egen lista", Anna is its owner)

Check each, reading the result; screenshots at 390×844 light, 390×844 dark and 1280×900 light for items 1–3, compared with the approved canvas:

1. **Erik on the shared list** (`/wishlist/<Annas 35-årsdag>`): stays on that address (no redirect); eyebrow "Önskelista av Anna Lind"; only "Dela" in the header (no gear, no add button).
2. **Requests**: two cards. The edit shows `Pris  ca 250 kr → ca 300 kr` with the pill "Ledig"; the removal says "Önskningen försvinner…" with the pill "Tagen av Mormor". Only the first card's "Godkänn" is the pastel primary. Approve the edit (toast "Ändringen är gjord"; the item shows `ca 300 kr`; the card is gone). Keep the removal with the message "Mormor har redan köpt dem." (toast; the item is still on the list; the card is gone).
3. **Segments**: "Lediga" with a count and "Tagna" with a count; Tagna lists Ullsockor "Tagen av Mormor" and Termos "Tagen av Lina"; the gift card (2 of 5) is in Lediga with "2 av 5 har gett".
4. **Make free**: open Ullsockor → "Tagen av Mormor", "Gör ledig" → the inline "Göra Ullsockor ledig igen?" replaces the buttons → "Avbryt" keeps it taken → confirm → toast, the item moves to Lediga (`select is_taken from wishlist_items where title like 'Ullsockor%'` is `f`).
5. **Gift card**: open the gift card → "Dessa har gett": Kim and Farfar with "Ta bort" → confirm for Kim → "1 av 5 har gett" and only Farfar remains (`select claimer_name from item_claims`).
6. **Edit and delete**: open Termos → "Ändra önskningen" → the warning "Lina har redan tagit den här…" → change the price → saved. Open Stekpanna → edit → "Ta bort önskningen" → inline confirm → gone.
7. **No adding as organizer**: in Erik's context, `fetch` POST `/rest/v1/wishlist_items` with a title for the shared list's id → status 403 / code `42501`. Erik's own self-managed list still allows adding (item 9).
8. **Share link**: on the shared list "Dela" shows the link, "Kopiera länk" and the switch. Copy: the button says "Länken är kopierad" only when the clipboard write succeeded (in a headless run it may fail: then the toast says it could not copy). Turn the link off: the inline "Stänga av länken?" → "Avbryt" keeps it on → confirm → the URL is struck through with "Avstängd", no copy button. `/shared/e2e-token` in another context shows the inactive page. Turn it on again: same link works. On the self-managed list, "Dela" shows "Skapa en länk" → "Skapa länk" creates exactly one link (`select count(*) from share_links` for that list is 1), click twice quickly: still 1.
9. **Self-managed list** (`/wishlist/<Eriks egen lista>`): gear, "Dela" and the primary "Lägg till önskning"; no requests section; add an item (appears in Lediga), open settings, change the title, save; "Radera listan" → inline confirm → Avbryt.
10. **Redirects and roles**: Erik opens `/wishlist/<id>/admin` and `/self` for his lists → they land on `/wishlist/<id>` (the same screens). Anna opens the shared list → the owner screen from 4b (not the organizer one), including the neutral answers for item 2 ("Ändringen är gjord", "Erik Berg behöll önskningen som den var", the message). The stranger opens either list → Home. The Dashboard and the organizer list on Home link to `/wishlist/<id>`.
11. **Race**: Anna sends a new request (edit Termos price) and Erik's page is already open; Anna withdraws it; Erik presses "Godkänn" on his stale card → toast "Den förfrågan är redan besvarad eller tillbakadragen." and the card disappears after the reload.
12. **English, dark, keyboard, console**: switch to English (no raw `wishlist.org…` keys), dark theme looks like the canvas, Tab reaches the segments and the sheet buttons, Escape closes a sheet and focus returns to the row (desktop), no console errors, no 4xx other than the deliberate probe in item 7.

Record anything that does not match as a defect and fix it (TDD where it is in `lib/`) before moving on.

- [ ] **Step 9: Full checks and final commit**

```bash
npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"
npm run lint 2>&1 | grep problems
npm run build 2>&1 | tail -1
npx supabase db reset 2>&1 | tail -1 && npm run test:db 2>&1 | grep -E "Failed|Result|Files="
```
Expected: 71 unit tests pass; tsc `1`; lint no worse than 12 problems; build succeeds; db tests pass (20 files, 206 tests). `db reset` wipes the local seed (fine at the end).

```bash
git add -A src
git commit -m "fix(wishlist): defects found in browser verification"
```
(Skip when there were none.)
