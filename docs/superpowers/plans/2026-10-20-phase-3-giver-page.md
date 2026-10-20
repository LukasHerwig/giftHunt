# Phase 3 – Giver page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public share page (`/shared/:token`) to the approved design: a calm list for givers with no account, a claim sheet (bottom sheet on mobile, side panel on desktop), a receipt, read-only taken items, a "Det här har du tagit" section remembered on the device, and the new empty / loading / inactive-link states.

**Architecture:** The page keeps its feature folder `src/PublicWishlist/`. Reusable pieces that later phases also need go in `src/components/gh/` (Tailwind ports of the GiftHunt design-system components: StatusPill, ClaimProgress, SectionHeader, ItemRow, TextField, EmptyState, ItemImage, GiftCardBadge) and `src/components/ResponsiveSheet.tsx`. Pure logic (grouping items, formatting, device memory in localStorage) lives in `src/PublicWishlist/lib/` and is developed test-first with Node's built-in test runner (`node --test`, TypeScript runs natively on Node 22.18+). The only backend change is one additive migration: `get_shared_wishlist` also returns the organizer's name, which the receipt needs ("Hör av dig till Erik").

**Tech Stack:** React 18, TypeScript, Tailwind 3 (`gh-*` tokens from phase 2), react-i18next, `react-modal-sheet` (mobile sheet, already a dependency), Radix Dialog (desktop panel), lucide-react, Supabase RPC `get_shared_wishlist` / `claim_shared_item`, pgTAP, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` (section 4 "Giver page", section 7 phase 3). Approved design canvas: https://claude.ai/artifact/6tVsedsaGbYMx5yKpyzY2b (12 boards: list, claim sheet light/dark, gift card, receipt, name error, taken item, inactive link, empty list, loading, desktop list, desktop panel). Design system: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu.

## Global Constraints

- Colours, radii and shadows only through the `gh-*` Tailwind names from phase 2 (`bg-gh-surface-200`, `text-gh-muted`, `rounded-gh-lg`, `shadow-gh-sheet`…). No hex, no `ios-*` classes in new code.
- The pastel `primary` (shadcn `Button` default variant) fills only the ONE primary action per screen; its text is dark (`text-primary-foreground` = on-primary), never white. Links use `text-gh-primary-strong`.
- Item status is always a word plus a pill ("Ledig", "Tagen", "Tagen av dig"); taken is neutral, not red.
- Touch targets ≥ 44px; text never under 12px (descriptions ≥ 13px); keyboard focus is the global 2px focus ring (do not remove outlines except on the field wrapper, which draws its own).
- UI text through react-i18next, keys in BOTH `src/locales/en.json` and `src/locales/sv.json`. Swedish copy is exactly the approved canvas copy where the canvas has it.
- No login and no app chrome on the page. The share page never links to `/` (logged-out visitors would land on the login screen); the footer link "Skapa din egen önskelista" goes to `/auth`.
- Privacy: nothing about who took what is shown; the page only knows `is_taken`, `claim_count`, and what this device remembered.
- `localStorage` access is always inside try/catch and the page works without it.
- Use `getBaseUrl()` for generated links (none are generated here).
- Verification after every task: `npm run build`; `npx tsc --noEmit -p tsconfig.app.json` shows only the 2 errors that also exist on `main` (`src/AdminWishlist/hooks/useAdminWishlist.ts:218`, `src/Dashboard/components/index.ts:7`); `npm run lint` shows only the 4 errors that exist on `main`.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Two givers claim the same item at once** → the second gets the "Någon hann före" message and the open sheet flips to the read-only "taken" view. Pinned by Task 6 step 7 (two browser contexts).
- **The organizer untakes an item the giver's device remembers** → it is available again, not listed under "Det här har du tagit". Pinned by `groupItems` tests in Task 2.
- **Browser storage blocked or full** (private mode) → the page still loads and claims; name isn't prefilled; no "Det här har du tagit" section. Pinned by `giverMemory` tests (Task 2) and Task 6 step 8.
- **Store link without a scheme or with an odd scheme** (`lekia.se`, `javascript:alert(1)`) → opens as an `https://` URL and never executes. Pinned by `toStoreUrl` tests (Task 2).
- **Name of only spaces or 101 characters** → inline error under the field, no request sent. Pinned by Task 6 step 7.
- **A list whose items are all taken, or all available** → the empty section's heading is not rendered. Pinned by Task 6 step 7.

## File structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20261020000017_shared_organizer_name.sql` | `get_shared_wishlist` also returns `wishlist.organizer_name` |
| `supabase/tests/17_shared_organizer_name_test.sql` | pgTAP for it |
| `src/PublicWishlist/lib/groupItems.ts` + `.test.ts` | `isItemTaken`, `classifyItem`, `groupItems` |
| `src/PublicWishlist/lib/itemFormat.ts` + `.test.ts` | `toStoreUrl`, `priorityKey`, `buildMeta`, `claimLabel` |
| `src/PublicWishlist/lib/giverMemory.ts` + `.test.ts` | name and claimed items remembered per device |
| `src/components/gh/StatusPill.tsx`, `GiftCardBadge.tsx`, `ClaimProgress.tsx`, `SectionHeader.tsx`, `ItemImage.tsx`, `ItemRow.tsx`, `TextField.tsx`, `EmptyState.tsx` | design-system ports |
| `src/components/ResponsiveSheet.tsx` | bottom sheet (mobile) / side panel (desktop) |
| `src/PublicWishlist/components/GiverItemRow.tsx`, `ItemDetail.tsx`, `ClaimForm.tsx`, `ClaimReceipt.tsx`, `ItemSheet.tsx` | giver page pieces |
| `src/PublicWishlist/components/LoadingState.tsx`, `AccessDeniedState.tsx`, `EmptyWishlistState.tsx` | rewritten states |
| `src/PublicWishlist/components/WishlistItemCard.tsx`, `ClaimItemDialog.tsx`, `InfoSection.tsx` | deleted |
| `src/PublicWishlist/types/index.ts`, `hooks/usePublicWishlist.ts`, `index.tsx`, `README.md`, `components/index.ts` | rewritten |
| `src/locales/en.json`, `sv.json` | `publicWishlist` section replaced |
| `package.json`, `CLAUDE.md` | `test:unit` script and docs |

## How to run things

- Database tests: `npx supabase start` once, then `npx supabase db reset && npm run test:db` (expected tail `Result: PASS`).
- Unit tests: `npm run test:unit` (Node ≥ 22.18; expected `# fail 0`).
- App against local Supabase: `npm run dev:local` (port 8080); the worktree needs `.env.local` copied from the main checkout.
- Browser checks use the Chrome DevTools MCP tools at 390×844 and 1280×900, light and dark.

---

### Task 1: The organizer's name in `get_shared_wishlist`

**Files:**
- Create: `supabase/tests/17_shared_organizer_name_test.sql`
- Create: `supabase/migrations/20261020000017_shared_organizer_name.sql`

**Interfaces:**
- Produces: `get_shared_wishlist(p_token)` JSON `wishlist` object gains `organizer_name` (text, the full name of the list's organizer, or `null` when the list has no organizer). Everything else is unchanged.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/17_shared_organizer_name_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
\ir _seed.psql

-- W3 is self-managed by Siri, W2 has no organizer
insert into share_links (wishlist_id, token, created_by) values
  (:'w3', 'tok-w3', :'u_self'),
  (:'w2', 'tok-w2', :'u_owner');

:as_anon
select is(
  public.get_shared_wishlist('tok-w1') -> 'wishlist' ->> 'organizer_name',
  'Ada Admin', 'the organizer''s name is returned');
select is(
  public.get_shared_wishlist('tok-w3') -> 'wishlist' ->> 'organizer_name',
  'Siri Self', 'on a self-managed list the creator is the organizer');
select is(
  public.get_shared_wishlist('tok-w2') -> 'wishlist' ->> 'organizer_name',
  null::text, 'a list without an organizer returns null');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase db reset && npm run test:db`
Expected: FAIL in `17_shared_organizer_name_test.sql` – the first two checks get `NULL` instead of the names.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261020000017_shared_organizer_name.sql`:

```sql
-- The receipt on the share page says who to contact to undo a claim, so the page
-- needs the organizer's name. It is the person who shared the list, and the
-- visitor already holds their link; the owner's name was already returned.
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
        'creator_name', p.full_name,
        'organizer_name', (
          select pa.full_name
          from wishlist_admins wa
          join profiles pa on pa.id = wa.admin_id
          where wa.wishlist_id = w.id))
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
```

`create or replace` keeps the existing execute grants (anon, authenticated, service_role).

- [ ] **Step 4: Run all database tests**

Run: `npx supabase db reset && npm run test:db`
Expected: all files ok including `17_…` and `05_shared_rpc_test.sql`, `09_share_link_active_test.sql`; `Result: PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/17_shared_organizer_name_test.sql supabase/migrations/20261020000017_shared_organizer_name.sql
git commit -m "feat(db): return the organizer's name on the share page

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Pure logic with unit tests (grouping, formatting, device memory)

**Files:**
- Create: `src/PublicWishlist/lib/groupItems.ts`, `groupItems.test.ts`
- Create: `src/PublicWishlist/lib/itemFormat.ts`, `itemFormat.test.ts`
- Create: `src/PublicWishlist/lib/giverMemory.ts`, `giverMemory.test.ts`
- Modify: `package.json` (scripts), `CLAUDE.md` (commands block), `src/PublicWishlist/types/index.ts` (add `organizer_name`)

**Interfaces:**
- Produces:
  - `type ItemKind = 'mine' | 'available' | 'taken'`
  - `isItemTaken(item: WishlistItem): boolean`
  - `classifyItem(item: WishlistItem, claimedIds: ReadonlySet<string>): ItemKind`
  - `groupItems(items: WishlistItem[], claimedIds: ReadonlySet<string>): { mine: WishlistItem[]; available: WishlistItem[]; taken: WishlistItem[] }`
  - `toStoreUrl(link: string): string`, `priorityKey(priority: number): 'high' | 'medium' | 'low' | null`
  - `type Translate = (key: string, options?: Record<string, unknown>) => string`
  - `buildMeta(item: WishlistItem, wishlist: Wishlist, t: Translate): string`, `claimLabel(count: number, cap: number | null, t: Translate): string`
  - `loadGiverName(store?): string`, `saveGiverName(name, store?)`, `loadClaimedItemIds(token, store?): string[]`, `rememberClaimedItem(token, itemId, store?)`; `store` is a `MemoryStore | null` (defaults to `localStorage`, `null` = unavailable).

Rules (from the spec and design): a regular item is taken when `is_taken` or it has any claim; a gift card is taken only when its `claim_cap` is reached (no cap = never taken). An item is "mine" only when this device remembers claiming it AND the item is still claimed (regular: taken; gift card: `claim_count > 0`) — so an organizer who untakes it makes it available again.

- [ ] **Step 1: Add the `test:unit` script and the type field**

In `package.json` `"scripts"`, after `"test:db": "supabase test db"` (add a comma), add:

```json
    "test:unit": "node --test \"src/**/*.test.ts\""
```

In `CLAUDE.md`, in the Commands code block after the `npm run lint` line add:

```
npm run test:unit    # Unit tests for pure logic (node:test, needs Node 22.18+)
```

In `src/PublicWishlist/types/index.ts`, in `interface Wishlist` add `organizer_name: string | null;` after `creator_name: string | null;`.

- [ ] **Step 2: Write the failing tests**

Create `src/PublicWishlist/lib/groupItems.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyItem, groupItems, isItemTaken } from './groupItems.ts';
import type { WishlistItem } from '../types/index.ts';

const item = (overrides: Partial<WishlistItem> & { id: string }): WishlistItem => ({
  title: overrides.id,
  description: null,
  link: null,
  url: null,
  price_range: null,
  priority: 2,
  is_taken: false,
  is_giftcard: false,
  claim_cap: null,
  claim_count: 0,
  ...overrides,
});

const none = new Set<string>();

test('a regular item is available until it is taken', () => {
  assert.equal(isItemTaken(item({ id: 'a' })), false);
  assert.equal(isItemTaken(item({ id: 'a', is_taken: true })), true);
});

test('a regular item with a claim row counts as taken', () => {
  assert.equal(isItemTaken(item({ id: 'a', claim_count: 1 })), true);
});

test('a gift card stays available while it has room', () => {
  assert.equal(isItemTaken(item({ id: 'g', is_giftcard: true, claim_cap: 5, claim_count: 2 })), false);
});

test('a gift card at its cap is taken', () => {
  assert.equal(isItemTaken(item({ id: 'g', is_giftcard: true, claim_cap: 2, claim_count: 2 })), true);
});

test('a gift card without a cap is never taken', () => {
  assert.equal(isItemTaken(item({ id: 'g', is_giftcard: true, claim_cap: null, claim_count: 50 })), false);
});

test('an item this device took is mine, not just taken', () => {
  const taken = item({ id: 'a', is_taken: true });
  assert.equal(classifyItem(taken, new Set(['a'])), 'mine');
  assert.equal(classifyItem(taken, none), 'taken');
});

test('if the organizer untook it, it is available again even though the device remembers it', () => {
  assert.equal(classifyItem(item({ id: 'a', is_taken: false }), new Set(['a'])), 'available');
});

test('a gift card is mine only while it has claims', () => {
  const card = (count: number) => item({ id: 'g', is_giftcard: true, claim_cap: 5, claim_count: count });
  assert.equal(classifyItem(card(0), new Set(['g'])), 'available');
  assert.equal(classifyItem(card(1), new Set(['g'])), 'mine');
});

test('remembered ids that are not on the list are ignored', () => {
  const grouped = groupItems([item({ id: 'a' })], new Set(['gone']));
  assert.deepEqual(grouped.mine, []);
  assert.equal(grouped.available.length, 1);
});

test('groupItems splits the list and keeps the original order inside each group', () => {
  const items = [
    item({ id: '1' }),
    item({ id: '2', is_taken: true }),
    item({ id: '3', is_taken: true }),
    item({ id: '4' }),
    item({ id: '5', is_taken: true }),
  ];
  const grouped = groupItems(items, new Set(['3']));
  assert.deepEqual(grouped.available.map((i) => i.id), ['1', '4']);
  assert.deepEqual(grouped.taken.map((i) => i.id), ['2', '5']);
  assert.deepEqual(grouped.mine.map((i) => i.id), ['3']);
});
```

Create `src/PublicWishlist/lib/itemFormat.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMeta, claimLabel, priorityKey, toStoreUrl } from './itemFormat.ts';
import type { Wishlist, WishlistItem } from '../types/index.ts';

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key;

const wishlist = (overrides: Partial<Wishlist> = {}): Wishlist => ({
  title: 'L',
  description: null,
  enable_links: true,
  enable_price: true,
  enable_priority: true,
  creator_name: null,
  organizer_name: null,
  ...overrides,
});

const item = (overrides: Partial<WishlistItem> = {}): WishlistItem => ({
  id: 'a',
  title: 'T',
  description: null,
  link: null,
  url: null,
  price_range: 'ca 400 kr',
  priority: 3,
  is_taken: false,
  is_giftcard: false,
  claim_cap: null,
  claim_count: 0,
  ...overrides,
});

test('toStoreUrl keeps http(s) links and adds https to bare domains', () => {
  assert.equal(toStoreUrl('https://lekia.se/x'), 'https://lekia.se/x');
  assert.equal(toStoreUrl('HTTP://lekia.se'), 'HTTP://lekia.se');
  assert.equal(toStoreUrl('lekia.se/x'), 'https://lekia.se/x');
  assert.equal(toStoreUrl('  lekia.se  '), 'https://lekia.se');
});

test('toStoreUrl never produces a script URL', () => {
  assert.equal(toStoreUrl('javascript:alert(1)'), 'https://javascript:alert(1)');
  assert.equal(toStoreUrl('httpfoo.com'), 'https://httpfoo.com');
});

test('priorityKey maps 3, 2 and 1 and ignores the rest', () => {
  assert.equal(priorityKey(3), 'high');
  assert.equal(priorityKey(2), 'medium');
  assert.equal(priorityKey(1), 'low');
  assert.equal(priorityKey(0), null);
  assert.equal(priorityKey(9), null);
});

test('buildMeta joins price and priority when the list shows them', () => {
  assert.equal(buildMeta(item(), wishlist(), t), 'ca 400 kr · publicWishlist.prio.high');
});

test('buildMeta respects the list switches', () => {
  assert.equal(buildMeta(item(), wishlist({ enable_priority: false }), t), 'ca 400 kr');
  assert.equal(buildMeta(item(), wishlist({ enable_price: false }), t), 'publicWishlist.prio.high');
  assert.equal(buildMeta(item({ price_range: null, priority: 0 }), wishlist(), t), '');
});

test('claimLabel uses the cap when there is one', () => {
  assert.equal(claimLabel(2, 5, t), 'publicWishlist.claimsOfCap:{"count":2,"cap":5}');
  assert.equal(claimLabel(2, null, t), 'publicWishlist.claimsCount:{"count":2}');
});
```

Create `src/PublicWishlist/lib/giverMemory.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadClaimedItemIds,
  loadGiverName,
  rememberClaimedItem,
  saveGiverName,
  type MemoryStore,
} from './giverMemory.ts';

const fakeStore = (): MemoryStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
};

const brokenStore: MemoryStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('full');
  },
};

test('the name is empty until it has been saved, then comes back', () => {
  const store = fakeStore();
  assert.equal(loadGiverName(store), '');
  saveGiverName('Maria', store);
  assert.equal(loadGiverName(store), 'Maria');
});

test('claimed items are remembered per token without duplicates', () => {
  const store = fakeStore();
  rememberClaimedItem('t1', 'a', store);
  rememberClaimedItem('t1', 'b', store);
  rememberClaimedItem('t1', 'a', store);
  rememberClaimedItem('t2', 'c', store);
  assert.deepEqual(loadClaimedItemIds('t1', store), ['a', 'b']);
  assert.deepEqual(loadClaimedItemIds('t2', store), ['c']);
  assert.deepEqual(loadClaimedItemIds('t3', store), []);
});

test('corrupted or unexpected stored data reads as empty', () => {
  const store = fakeStore();
  store.data.set('gifthunt.giver.claims.t1', '{not json');
  assert.deepEqual(loadClaimedItemIds('t1', store), []);
  store.data.set('gifthunt.giver.claims.t1', '{"a":1}');
  assert.deepEqual(loadClaimedItemIds('t1', store), []);
  store.data.set('gifthunt.giver.claims.t1', '["a", 3, null, "b"]');
  assert.deepEqual(loadClaimedItemIds('t1', store), ['a', 'b']);
});

test('a store that throws never throws out of the helpers', () => {
  assert.equal(loadGiverName(brokenStore), '');
  assert.doesNotThrow(() => saveGiverName('Maria', brokenStore));
  assert.deepEqual(loadClaimedItemIds('t1', brokenStore), []);
  assert.doesNotThrow(() => rememberClaimedItem('t1', 'a', brokenStore));
});

test('no storage at all (null) behaves as empty', () => {
  assert.equal(loadGiverName(null), '');
  assert.doesNotThrow(() => saveGiverName('Maria', null));
  assert.deepEqual(loadClaimedItemIds('t1', null), []);
  assert.doesNotThrow(() => rememberClaimedItem('t1', 'a', null));
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL – all three files error with `ERR_MODULE_NOT_FOUND` (the `.ts` modules don't exist yet).

- [ ] **Step 4: Implement the three modules**

Create `src/PublicWishlist/lib/groupItems.ts`:

```ts
import type { WishlistItem } from '../types/index.ts';

export type ItemKind = 'mine' | 'available' | 'taken';

export interface GroupedItems {
  mine: WishlistItem[];
  available: WishlistItem[];
  taken: WishlistItem[];
}

const claimCount = (item: WishlistItem) => item.claim_count ?? 0;

/** A gift card is taken only when its cap is reached; a regular item once it has any claim. */
export const isItemTaken = (item: WishlistItem): boolean => {
  if (item.is_giftcard) {
    return item.claim_cap != null && claimCount(item) >= item.claim_cap;
  }
  return item.is_taken || claimCount(item) > 0;
};

/** True while the item still carries at least one claim. */
const isStillClaimed = (item: WishlistItem): boolean =>
  item.is_giftcard ? claimCount(item) > 0 : item.is_taken || claimCount(item) > 0;

/**
 * "Mine" needs both this device's memory and a live claim: if the organizer
 * untakes the item it goes back to available even though the device remembers it.
 */
export const classifyItem = (
  item: WishlistItem,
  claimedIds: ReadonlySet<string>,
): ItemKind => {
  if (claimedIds.has(item.id) && isStillClaimed(item)) return 'mine';
  return isItemTaken(item) ? 'taken' : 'available';
};

export const groupItems = (
  items: WishlistItem[],
  claimedIds: ReadonlySet<string>,
): GroupedItems => {
  const grouped: GroupedItems = { mine: [], available: [], taken: [] };
  for (const item of items) {
    grouped[classifyItem(item, claimedIds)].push(item);
  }
  return grouped;
};
```

Create `src/PublicWishlist/lib/itemFormat.ts`:

```ts
import type { Wishlist, WishlistItem } from '../types/index.ts';

export type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Store links come from the list owner: always open them as an https URL. */
export const toStoreUrl = (link: string): string => {
  const trimmed = link.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const priorityKey = (priority: number): 'high' | 'medium' | 'low' | null => {
  if (priority === 3) return 'high';
  if (priority === 2) return 'medium';
  if (priority === 1) return 'low';
  return null;
};

/** "ca 400 kr · Prio hög", honouring the list's price and priority switches. */
export const buildMeta = (item: WishlistItem, wishlist: Wishlist, t: Translate): string => {
  const parts: string[] = [];
  if (wishlist.enable_price && item.price_range) parts.push(item.price_range);
  const prio = wishlist.enable_priority ? priorityKey(item.priority) : null;
  if (prio) parts.push(t(`publicWishlist.prio.${prio}`));
  return parts.join(' · ');
};

export const claimLabel = (count: number, cap: number | null, t: Translate): string =>
  cap != null && cap > 0
    ? t('publicWishlist.claimsOfCap', { count, cap })
    : t('publicWishlist.claimsCount', { count });
```

Create `src/PublicWishlist/lib/giverMemory.ts`:

```ts
/** What this device remembers about the giver: their name and what they took. */
export interface MemoryStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const NAME_KEY = 'gifthunt.giver.name';
const claimsKey = (token: string) => `gifthunt.giver.claims.${token}`;

const defaultStore = (): MemoryStore | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage blocked: the page works without it
  }
};

export const loadGiverName = (store: MemoryStore | null = defaultStore()): string => {
  try {
    return store?.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};

export const saveGiverName = (name: string, store: MemoryStore | null = defaultStore()): void => {
  try {
    store?.setItem(NAME_KEY, name);
  } catch {
    // storage full or blocked: nothing to do
  }
};

export const loadClaimedItemIds = (
  token: string,
  store: MemoryStore | null = defaultStore(),
): string[] => {
  try {
    const raw = store?.getItem(claimsKey(token));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
};

export const rememberClaimedItem = (
  token: string,
  itemId: string,
  store: MemoryStore | null = defaultStore(),
): void => {
  try {
    const ids = loadClaimedItemIds(token, store);
    if (!ids.includes(itemId)) {
      store?.setItem(claimsKey(token), JSON.stringify([...ids, itemId]));
    }
  } catch {
    // storage full or blocked: nothing to do
  }
};
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: `# pass 21`, `# fail 0` (10 in groupItems, 6 in itemFormat, 5 in giverMemory).

Run: `npx tsc --noEmit -p tsconfig.app.json; npm run lint`
Expected: as in Global Constraints (the `types/index.ts` change doesn't break `PublicWishlistService` — it only casts the RPC result).

- [ ] **Step 6: Commit**

```bash
git add package.json CLAUDE.md src/PublicWishlist/types/index.ts src/PublicWishlist/lib
git commit -m "feat(giver): grouping, formatting and device memory with unit tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Shared UI building blocks (`src/components/gh/`, `ResponsiveSheet`)

**Files:**
- Create: `src/components/gh/StatusPill.tsx`, `GiftCardBadge.tsx`, `ClaimProgress.tsx`, `SectionHeader.tsx`, `ItemImage.tsx`, `ItemRow.tsx`, `TextField.tsx`, `EmptyState.tsx`
- Create: `src/components/ResponsiveSheet.tsx`

**Interfaces:**
- Produces (all named exports):
  - `StatusPill({ status: 'available' | 'taken' | 'pending', children, className? })`
  - `GiftCardBadge({ label })`
  - `ClaimProgress({ count, cap: number | null, label, className? })`
  - `SectionHeader({ title, count?, description?, className? })` (renders an `h2`)
  - `ItemImage({ src, alt?, className?, iconClassName? })` (image with gift-icon fallback; the caller sizes it)
  - `ItemRow({ title, image, meta, status?: { kind, label }, giftCardLabel?, claim?: { count, cap, label }, taken?, onClick })`
  - `TextField({ label, help?, error?, ...inputProps })` (generates its own id)
  - `EmptyState({ icon: LucideIcon, title, text?, action?, size?: 'inline' | 'screen', headingAs?: 'h1' | 'h2' })`
  - `ResponsiveSheet({ open, onOpenChange, title, subtitle?, closeLabel, children })`

These are visual ports of the design-system components of the same names; there are no unit tests (no UI test suite), they are verified in Task 6.

- [ ] **Step 1: Status pill, gift-card badge, claim progress, section header**

Create `src/components/gh/StatusPill.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ItemStatus = 'available' | 'taken' | 'pending';

const TONE: Record<ItemStatus, string> = {
  available: 'bg-gh-available-bg text-gh-available',
  taken: 'bg-gh-taken-bg text-gh-taken',
  pending: 'bg-gh-primary-tint text-gh-primary-strong',
};

interface StatusPillProps {
  status: ItemStatus;
  children: ReactNode;
  className?: string;
}

/** Item status is always a word plus a pill, never colour alone. */
export const StatusPill = ({ status, children, className }: StatusPillProps) => (
  <span
    className={cn(
      'inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded-gh-pill px-2 text-[12px] font-semibold leading-4 tracking-[0.2px]',
      TONE[status],
      className,
    )}>
    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-gh-pill bg-current" />
    {children}
  </span>
);
```

Create `src/components/gh/GiftCardBadge.tsx`:

```tsx
import { Users } from 'lucide-react';

export const GiftCardBadge = ({ label }: { label: string }) => (
  <span className="inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded-gh-pill border border-gh-line-strong px-2 text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
    <Users className="h-3.5 w-3.5" aria-hidden="true" />
    {label}
  </span>
);
```

Create `src/components/gh/ClaimProgress.tsx`:

```tsx
import { cn } from '@/lib/utils';

interface ClaimProgressProps {
  count: number;
  /** The gift card's claim_cap; null = unlimited (label only, no meter). */
  cap: number | null;
  label: string;
  className?: string;
}

export const ClaimProgress = ({ count, cap, label, className }: ClaimProgressProps) => {
  const limited = cap != null && cap > 0;
  const shown = limited ? Math.min(count, cap) : 0;
  const full = limited && count >= cap;
  const fill = full ? 'bg-gh-taken' : 'bg-gh-primary-strong';

  return (
    <span className={cn('inline-flex min-w-[120px] flex-col gap-1', className)}>
      <span className="text-[13px] leading-[18px] text-gh-muted">{label}</span>
      {limited && cap <= 10 && (
        <span
          role="meter"
          aria-valuemin={0}
          aria-valuemax={cap}
          aria-valuenow={shown}
          aria-label={label}
          className="flex h-1.5 w-full max-w-[160px] gap-1">
          {Array.from({ length: cap }, (_, i) => (
            <span
              key={i}
              className={cn('flex-1 rounded-gh-pill bg-gh-surface-400', i < shown && fill)}
            />
          ))}
        </span>
      )}
      {limited && cap > 10 && (
        <span
          role="meter"
          aria-valuemin={0}
          aria-valuemax={cap}
          aria-valuenow={shown}
          aria-label={label}
          className="block h-1.5 w-full max-w-[160px] overflow-hidden rounded-gh-pill bg-gh-surface-400">
          <span
            className={cn('block h-full rounded-gh-pill', fill)}
            style={{ width: `${(shown / cap) * 100}%` }}
          />
        </span>
      )}
    </span>
  );
};
```

Create `src/components/gh/SectionHeader.tsx`:

```tsx
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  count?: number;
  description?: string;
  className?: string;
}

export const SectionHeader = ({ title, count, description, className }: SectionHeaderProps) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <div className="flex items-baseline gap-2">
      <h2 className="text-[18px] font-bold leading-6 text-gh-ink">{title}</h2>
      {count != null && <span className="text-[13px] leading-[18px] text-gh-muted">{count}</span>}
    </div>
    {description && <p className="text-[13px] leading-[18px] text-gh-muted">{description}</p>}
  </div>
);
```

- [ ] **Step 2: Item image, item row**

Create `src/components/gh/ItemImage.tsx`:

```tsx
import { useState } from 'react';
import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemImageProps {
  src?: string | null;
  alt?: string;
  /** Sizes and shapes the box, e.g. "h-14 w-14 rounded-gh-sm". */
  className?: string;
  iconClassName?: string;
}

/** The item's picture, or a gift icon when it has none or fails to load. */
export const ItemImage = ({ src, alt = '', className, iconClassName = 'h-6 w-6' }: ItemImageProps) => {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn(
        'relative flex flex-none items-center justify-center overflow-hidden bg-gh-surface-300 text-gh-muted',
        className,
      )}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Gift className={iconClassName} aria-hidden="true" />
      )}
    </span>
  );
};
```

Create `src/components/gh/ItemRow.tsx`:

```tsx
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClaimProgress } from './ClaimProgress';
import { GiftCardBadge } from './GiftCardBadge';
import { ItemImage } from './ItemImage';
import { StatusPill, type ItemStatus } from './StatusPill';

interface ItemRowProps {
  title: string;
  image?: string | null;
  /** "ca 400 kr · Prio hög" */
  meta?: string;
  status?: { kind: ItemStatus; label: string };
  giftCardLabel?: string;
  claim?: { count: number; cap: number | null; label: string };
  /** Muted ground for items that can no longer be taken. */
  taken?: boolean;
  onClick: () => void;
}

export const ItemRow = ({ title, image, meta, status, giftCardLabel, claim, taken, onClick }: ItemRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative flex min-h-[80px] w-full items-center gap-3 rounded-gh-lg border p-3 text-left text-gh-ink',
      'transition-[transform,background-color] duration-[120ms] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
      taken
        ? 'border-transparent bg-gh-taken-bg'
        : 'border-gh-line bg-gh-surface-200 hover:border-gh-line-strong hover:bg-gh-surface-100',
    )}>
    <ItemImage
      src={image}
      className={cn('h-14 w-14 rounded-gh-sm', taken && 'opacity-60')}
    />
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span
        className={cn(
          'line-clamp-2 text-[17px] font-semibold leading-[22px]',
          taken ? 'text-gh-ink-2' : 'text-gh-ink',
        )}>
        {title}
      </span>
      {meta && <span className="text-[13px] leading-[18px] text-gh-muted">{meta}</span>}
      {(status || giftCardLabel || claim) && (
        <span className="mt-1 flex flex-wrap items-center gap-2">
          {status && (
            <StatusPill
              status={status.kind}
              className={taken && status.kind === 'taken' ? 'bg-gh-surface-200' : undefined}>
              {status.label}
            </StatusPill>
          )}
          {giftCardLabel && <GiftCardBadge label={giftCardLabel} />}
          {claim && <ClaimProgress count={claim.count} cap={claim.cap} label={claim.label} />}
        </span>
      )}
    </span>
    <ChevronRight className="h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />
  </button>
);
```

- [ ] **Step 3: Text field, empty state**

Create `src/components/gh/TextField.tsx`:

```tsx
import { useId, type InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  help?: string;
  /** Replaces help; says what went wrong and what to do. */
  error?: string;
}

export const TextField = ({ label, help, error, className, ...input }: TextFieldProps) => {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
        {label}
      </label>
      <div
        className={cn(
          'flex min-h-[48px] items-center rounded-gh-md border bg-gh-surface-300 px-3',
          'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gh-focus-ring',
          error ? 'border-gh-danger' : 'border-gh-line-strong',
        )}>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || help ? messageId : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 text-[16px] leading-6 text-gh-ink outline-none placeholder:text-gh-subtle"
          {...input}
        />
      </div>
      {(error || help) && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={cn(
            'flex items-start gap-1 text-[13px] leading-[18px]',
            error ? 'text-gh-danger' : 'text-gh-muted',
          )}>
          {error && <AlertCircle className="mt-px h-4 w-4 flex-none" aria-hidden="true" />}
          <span>{error ?? help}</span>
        </p>
      )}
    </div>
  );
};
```

Create `src/components/gh/EmptyState.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
  size?: 'inline' | 'screen';
  headingAs?: 'h1' | 'h2';
}

/** Heading, one line, one action. Never just a grey line. */
export const EmptyState = ({
  icon: Icon,
  title,
  text,
  action,
  size = 'inline',
  headingAs: Heading = 'h2',
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center gap-2 px-4 text-center',
      size === 'screen' ? 'py-10' : 'py-8',
    )}>
    <Icon className="h-10 w-10 text-gh-muted" aria-hidden="true" />
    <Heading
      className={cn(
        'mt-3 font-bold text-gh-ink',
        size === 'screen' ? 'text-[22px] leading-7' : 'text-[18px] leading-6',
      )}>
      {title}
    </Heading>
    {text && <p className="max-w-[340px] text-[16px] leading-6 text-gh-ink-2">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
```

- [ ] **Step 4: ResponsiveSheet**

Create `src/components/ResponsiveSheet.tsx`:

```tsx
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Sheet } from 'react-modal-sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heading of the desktop panel (the mobile sheet has none). */
  title: string;
  /** Muted line under the desktop heading. */
  subtitle?: string;
  closeLabel: string;
  children: ReactNode;
}

/**
 * Content, choices and input open as a bottom sheet on mobile and a side panel
 * on desktop (the GiftHunt BottomSheet / SidePanel).
 */
export const ResponsiveSheet = ({
  open,
  onOpenChange,
  title,
  subtitle,
  closeLabel,
  children,
}: ResponsiveSheetProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet
        isOpen={open}
        onClose={() => onOpenChange(false)}
        detent="content"
        avoidKeyboard={true}
        modalEffectRootId="app-root">
        <Sheet.Container className="!rounded-t-gh-sheet !bg-gh-surface-200 !shadow-gh-sheet">
          <Sheet.Header className="pb-0">
            <div className="mx-auto mb-2 mt-3 h-1.5 w-9 rounded-gh-pill bg-gh-line-strong" />
          </Sheet.Header>
          <Sheet.Content scrollClassName="pb-safe">
            <div className="flex flex-col gap-4 px-4 pb-6 pt-2">{children}</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => onOpenChange(false)} className="!bg-gh-scrim" />
      </Sheet>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gh-scrim data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-gh-surface-100 shadow-gh-panel duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right motion-reduce:animate-none">
          <div className="flex min-h-[64px] shrink-0 items-center gap-2 border-b border-gh-line px-3">
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="flex h-11 w-11 items-center justify-center rounded-gh-md text-gh-ink hover:bg-gh-surface-400 active:scale-[0.97]">
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-[22px] font-bold leading-7 text-gh-ink">
                {title}
              </DialogPrimitive.Title>
              {subtitle && (
                <p className="truncate text-[13px] leading-[18px] text-gh-muted">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
```

- [ ] **Step 5: Verify**

Run: `npm run build; npx tsc --noEmit -p tsconfig.app.json; npm run lint`
Expected: as in Global Constraints (nothing imports the new files yet; this checks they compile and lint clean).

- [ ] **Step 6: Commit**

```bash
git add src/components/gh src/components/ResponsiveSheet.tsx
git commit -m "feat(ui): add design-system ports and a responsive sheet

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Giver page pieces and translations

**Files:**
- Create: `src/PublicWishlist/components/GiverItemRow.tsx`, `ItemDetail.tsx`, `ClaimForm.tsx`, `ClaimReceipt.tsx`, `ItemSheet.tsx`
- Modify (rewrite): `src/PublicWishlist/components/LoadingState.tsx`, `AccessDeniedState.tsx`, `EmptyWishlistState.tsx`, `index.ts`
- Modify: `src/PublicWishlist/types/index.ts` (state and receipt types)
- Modify: `src/locales/en.json`, `src/locales/sv.json` (replace the `publicWishlist` object)

**Interfaces:**
- Consumes: Task 2 `ItemKind`, `buildMeta`, `claimLabel`, `toStoreUrl`; Task 3 components.
- Produces:
  - types: `Receipt = { name: string; title: string; price: string | null; link: string | null }`; `PublicWishlistState` with `selectedItemId`, `receipt`, `buyerName`, `nameError`, `claiming`, `claimedIds` (replaces `selectedItem`, `dialogOpen`).
  - `GiverItemRow({ item, kind, wishlist, onOpen(itemId) })`
  - `ItemDetail({ item, kind, wishlist })`
  - `ClaimForm({ item, wishlist, buyerName, nameError, claiming, onBuyerNameChange, onSubmit })`
  - `ClaimReceipt({ receipt, wishlist, onDone })`
  - `ItemSheet({ open, item, kind, wishlist, receipt, buyerName, nameError, claiming, onBuyerNameChange, onClaim, onClose })`
  - `LoadingState()`, `AccessDeniedState()`, `EmptyWishlistState({ creatorName })`

- [ ] **Step 1: Replace the translations**

Run this script (the locale files round-trip exactly through `json.dumps(indent=2, ensure_ascii=False)`):

```bash
python3 -I - <<'EOF'
import json

EN = {
  "claimErrors": {
    "already_taken": "Someone got there first – this item is already taken.",
    "claim_cap_reached": "This item already has enough givers.",
    "already_claimed": "You have already claimed this item.",
    "invalid_link": "This link is invalid or has expired.",
    "invalid_name": "Enter your name (at most 100 characters).",
    "item_not_found": "This item is no longer on the list."
  },
  "failedToClaim": "Failed to claim item",
  "failedToLoad": "Failed to load wishlist",
  "invalidOrExpiredLink": "Invalid or expired share link",
  "linkExpired": "This share link has expired",
  "fromName": "Wishlist from {{name}}",
  "sectionMine": "What you have taken",
  "sectionMineHint": "Only you see this, on this device.",
  "sectionAvailable": "Available",
  "sectionTaken": "Already taken",
  "statusAvailable": "Available",
  "taken": "Taken",
  "statusMine": "Taken by you",
  "giftCardBadge": "Several can give",
  "claimsOfCap_one": "{{count}} of {{cap}} has given",
  "claimsOfCap_other": "{{count}} of {{cap}} have given",
  "claimsCount_one": "{{count}} has given",
  "claimsCount_other": "{{count}} have given",
  "prio": { "high": "High priority", "medium": "Medium priority", "low": "Low priority" },
  "sheetTitle": "Wish",
  "closeSheet": "Close",
  "close": "Close",
  "openStore": "Open in the shop",
  "yourName": "Your name",
  "nameHelp": "Only {{name}}, who keeps track of the list, sees the name.",
  "nameHelpNoOrganizer": "Only the person who keeps track of the list sees the name.",
  "nameError": "Enter your name so {{name}} knows who is buying it. At most 100 characters.",
  "nameErrorNoOrganizer": "Enter your name so the list keeper knows who is buying it. At most 100 characters.",
  "giftCardHelpLeft_one": "There is room for {{count}} more. The same name can't give twice.",
  "giftCardHelpLeft_other": "There is room for {{count}} more. The same name can't give twice.",
  "giftCardHelpUnlimited": "Several people can give this. The same name can't give twice.",
  "claimButton": "I'll buy this",
  "claimButtonGiftCard": "I'll give a gift card",
  "claiming": "Taking it…",
  "takenNote": "This one is already taken. You can still see what it is and open the link to the shop.",
  "mineNote": "You took this one. Changed your mind? Contact {{name}}.",
  "mineNoteNoOrganizer": "You took this one. Changed your mind? Contact the person who shared the list.",
  "receiptTitle": "You took {{title}}",
  "receiptLead": "It is now marked as taken in {{name}}'s list.",
  "receiptLeadNoName": "It is now marked as taken in the list.",
  "receiptUndo": "Changed your mind? Contact {{name}}.",
  "receiptUndoNoOrganizer": "Changed your mind? Contact the person who shared the list.",
  "receiptItem": "Wish",
  "receiptPrice": "Price",
  "done": "Done",
  "inactiveTitle": "This link is no longer active",
  "inactiveText": "Ask the person who shared the list for a new link.",
  "emptyTitle": "No wishes yet",
  "emptyText": "{{name}} hasn't added anything yet. Check back a little later.",
  "emptyTextNoName": "Nothing has been added yet. Check back a little later.",
  "loadingList": "Loading the wishlist",
  "createOwn": "Want your own wishlist?",
  "createOwnLink": "Create your own wishlist"
}

SV = {
  "claimErrors": {
    "already_taken": "Någon hann före – den här önskningen är redan tagen.",
    "claim_cap_reached": "Den här önskningen har redan tillräckligt många givare.",
    "already_claimed": "Du har redan reserverat den här önskningen.",
    "invalid_link": "Länken är ogiltig eller har gått ut.",
    "invalid_name": "Skriv ditt namn (högst 100 tecken).",
    "item_not_found": "Den här önskningen finns inte längre på listan."
  },
  "failedToClaim": "Misslyckades att reservera önskning",
  "failedToLoad": "Misslyckades att ladda önskelista",
  "invalidOrExpiredLink": "Ogiltig eller utgången delningslänk",
  "linkExpired": "Denna delningslänk har gått ut",
  "fromName": "Önskelista från {{name}}",
  "sectionMine": "Det här har du tagit",
  "sectionMineHint": "Bara du ser det här, på den här enheten.",
  "sectionAvailable": "Lediga",
  "sectionTaken": "Redan tagna",
  "statusAvailable": "Ledig",
  "taken": "Tagen",
  "statusMine": "Tagen av dig",
  "giftCardBadge": "Flera kan ge",
  "claimsOfCap_one": "{{count}} av {{cap}} har gett",
  "claimsOfCap_other": "{{count}} av {{cap}} har gett",
  "claimsCount_one": "{{count}} har gett",
  "claimsCount_other": "{{count}} har gett",
  "prio": { "high": "Prio hög", "medium": "Prio medel", "low": "Prio låg" },
  "sheetTitle": "Önskning",
  "closeSheet": "Stäng",
  "close": "Stäng",
  "openStore": "Öppna i butiken",
  "yourName": "Ditt namn",
  "nameHelp": "Namnet ser bara {{name}}, som håller koll på listan.",
  "nameHelpNoOrganizer": "Namnet ser bara den som håller koll på listan.",
  "nameError": "Skriv ditt namn så att {{name}} vet vem som köper den. Högst 100 tecken.",
  "nameErrorNoOrganizer": "Skriv ditt namn så att den som håller koll på listan vet vem som köper den. Högst 100 tecken.",
  "giftCardHelpLeft_one": "Det finns plats för {{count}} till. Samma namn kan inte ge två gånger.",
  "giftCardHelpLeft_other": "Det finns plats för {{count}} till. Samma namn kan inte ge två gånger.",
  "giftCardHelpUnlimited": "Flera kan ge den här. Samma namn kan inte ge två gånger.",
  "claimButton": "Jag köper den här",
  "claimButtonGiftCard": "Jag ger ett presentkort",
  "claiming": "Tar den…",
  "takenNote": "Den här är redan tagen. Du kan fortfarande se vad det är och öppna länken till butiken.",
  "mineNote": "Du har tagit den här. Ångrar du dig? Hör av dig till {{name}}.",
  "mineNoteNoOrganizer": "Du har tagit den här. Ångrar du dig? Hör av dig till den som delade listan.",
  "receiptTitle": "Du har tagit {{title}}",
  "receiptLead": "Den är nu markerad som tagen i {{name}}s lista.",
  "receiptLeadNoName": "Den är nu markerad som tagen i listan.",
  "receiptUndo": "Ångrar du dig? Hör av dig till {{name}}.",
  "receiptUndoNoOrganizer": "Ångrar du dig? Hör av dig till den som delade listan.",
  "receiptItem": "Önskning",
  "receiptPrice": "Pris",
  "done": "Klar",
  "inactiveTitle": "Den här länken är inte längre aktiv",
  "inactiveText": "Be den som delade listan om en ny länk.",
  "emptyTitle": "Inga önskningar än",
  "emptyText": "{{name}} har inte lagt till något ännu. Titta in igen lite senare.",
  "emptyTextNoName": "Inget har lagts till ännu. Titta in igen lite senare.",
  "loadingList": "Laddar önskelistan",
  "createOwn": "Vill du ha en egen önskelista?",
  "createOwnLink": "Skapa din egen önskelista"
}

for lang, section in (("en", EN), ("sv", SV)):
    path = f"src/locales/{lang}.json"
    data = json.load(open(path))
    data["publicWishlist"] = section
    with open(path, "w") as f:
        f.write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
print("ok")
EOF
python3 -I -c "import json; [json.load(open(f'src/locales/{l}.json')) for l in ('en','sv')]; print('valid')"
```

Expected: `ok` then `valid`. (Keys such as `howItWorks*`, `claimItem`, `yourNameRequired`, `itemClaimed`, `createdBy`, `accessNotAvailable` are intentionally dropped: their components are deleted in Task 5.)

- [ ] **Step 2: Update the state types**

In `src/PublicWishlist/types/index.ts` replace `PublicWishlistState` with:

```ts
export interface Receipt {
  name: string;
  title: string;
  price: string | null;
  link: string | null;
}

export interface PublicWishlistState {
  wishlist: Wishlist | null;
  items: WishlistItem[];
  loading: boolean;
  shareLink: ShareLink | null;
  selectedItemId: string | null;
  receipt: Receipt | null;
  buyerName: string;
  nameError: boolean;
  claiming: boolean;
  /** Item ids this device claimed on this list (from localStorage). */
  claimedIds: string[];
}
```

- [ ] **Step 3: Item row, item detail**

Create `src/PublicWishlist/components/GiverItemRow.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { ItemRow } from '@/components/gh/ItemRow';
import { buildMeta, claimLabel } from '../lib/itemFormat';
import type { ItemKind } from '../lib/groupItems';
import type { Wishlist, WishlistItem } from '../types';

interface GiverItemRowProps {
  item: WishlistItem;
  kind: ItemKind;
  wishlist: Wishlist;
  onOpen: (itemId: string) => void;
}

export const GiverItemRow = ({ item, kind, wishlist, onOpen }: GiverItemRowProps) => {
  const { t } = useTranslation();
  const count = item.claim_count ?? 0;
  const showClaims = item.is_giftcard && (count > 0 || item.claim_cap != null);

  return (
    <ItemRow
      title={item.title}
      image={item.url}
      meta={buildMeta(item, wishlist, t)}
      status={
        kind === 'available'
          ? { kind: 'available', label: t('publicWishlist.statusAvailable') }
          : {
              kind: 'taken',
              label: kind === 'mine' ? t('publicWishlist.statusMine') : t('publicWishlist.taken'),
            }
      }
      taken={kind !== 'available'}
      giftCardLabel={item.is_giftcard ? t('publicWishlist.giftCardBadge') : undefined}
      claim={
        showClaims
          ? { count, cap: item.claim_cap, label: claimLabel(count, item.claim_cap, t) }
          : undefined
      }
      onClick={() => onOpen(item.id)}
    />
  );
};
```

Create `src/PublicWishlist/components/ItemDetail.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { ClaimProgress } from '@/components/gh/ClaimProgress';
import { GiftCardBadge } from '@/components/gh/GiftCardBadge';
import { ItemImage } from '@/components/gh/ItemImage';
import { StatusPill } from '@/components/gh/StatusPill';
import { buildMeta, claimLabel, toStoreUrl } from '../lib/itemFormat';
import type { ItemKind } from '../lib/groupItems';
import type { Wishlist, WishlistItem } from '../types';

interface ItemDetailProps {
  item: WishlistItem;
  kind: ItemKind;
  wishlist: Wishlist;
}

export const ItemDetail = ({ item, kind, wishlist }: ItemDetailProps) => {
  const { t } = useTranslation();
  const organizer = wishlist.organizer_name;
  const meta = buildMeta(item, wishlist, t);
  const count = item.claim_count ?? 0;
  const showClaims = item.is_giftcard && (count > 0 || item.claim_cap != null);
  const note =
    kind === 'taken'
      ? t('publicWishlist.takenNote')
      : kind === 'mine'
        ? organizer
          ? t('publicWishlist.mineNote', { name: organizer })
          : t('publicWishlist.mineNoteNoOrganizer')
        : null;

  return (
    <div className="flex flex-col gap-4 text-gh-ink">
      <ItemImage
        src={item.url}
        alt=""
        className={`aspect-[4/3] max-h-[280px] w-full rounded-gh-lg ${kind !== 'available' ? 'opacity-70' : ''}`}
        iconClassName="h-10 w-10"
      />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <StatusPill status={kind === 'available' ? 'available' : 'taken'}>
            {kind === 'available'
              ? t('publicWishlist.statusAvailable')
              : kind === 'mine'
                ? t('publicWishlist.statusMine')
                : t('publicWishlist.taken')}
          </StatusPill>
          {item.is_giftcard && <GiftCardBadge label={t('publicWishlist.giftCardBadge')} />}
        </div>
        <h2 className="text-[22px] font-bold leading-7">{item.title}</h2>
        {meta && <p className="text-[13px] leading-[18px] text-gh-muted">{meta}</p>}
      </div>
      {showClaims && (
        <ClaimProgress
          count={count}
          cap={item.claim_cap}
          label={claimLabel(count, item.claim_cap, t)}
        />
      )}
      {item.description && (
        <p className="text-[16px] leading-6 text-gh-ink-2">{item.description}</p>
      )}
      {wishlist.enable_links && item.link && (
        <a
          href={toStoreUrl(item.link)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] w-fit items-center gap-2 text-[16px] font-semibold text-gh-primary-strong underline underline-offset-4">
          {t('publicWishlist.openStore')}
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" />
        </a>
      )}
      {note && <p className="text-[13px] leading-[18px] text-gh-muted">{note}</p>}
    </div>
  );
};
```

- [ ] **Step 4: Claim form, receipt, sheet**

Create `src/PublicWishlist/components/ClaimForm.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/gh/TextField';
import type { Wishlist, WishlistItem } from '../types';

interface ClaimFormProps {
  item: WishlistItem;
  wishlist: Wishlist;
  buyerName: string;
  nameError: boolean;
  claiming: boolean;
  onBuyerNameChange: (name: string) => void;
  onSubmit: () => void;
}

export const ClaimForm = ({
  item,
  wishlist,
  buyerName,
  nameError,
  claiming,
  onBuyerNameChange,
  onSubmit,
}: ClaimFormProps) => {
  const { t } = useTranslation();
  const organizer = wishlist.organizer_name;

  let help: string;
  if (item.is_giftcard) {
    help =
      item.claim_cap != null
        ? t('publicWishlist.giftCardHelpLeft', {
            count: Math.max(item.claim_cap - (item.claim_count ?? 0), 0),
          })
        : t('publicWishlist.giftCardHelpUnlimited');
  } else {
    help = organizer
      ? t('publicWishlist.nameHelp', { name: organizer })
      : t('publicWishlist.nameHelpNoOrganizer');
  }

  const error = nameError
    ? organizer
      ? t('publicWishlist.nameError', { name: organizer })
      : t('publicWishlist.nameErrorNoOrganizer')
    : undefined;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}>
      <TextField
        label={t('publicWishlist.yourName')}
        value={buyerName}
        onChange={(event) => onBuyerNameChange(event.target.value)}
        autoComplete="name"
        enterKeyHint="done"
        disabled={claiming}
        help={help}
        error={error}
      />
      <Button
        type="submit"
        disabled={claiming}
        className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
        {claiming ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            {t('publicWishlist.claiming')}
          </>
        ) : item.is_giftcard ? (
          t('publicWishlist.claimButtonGiftCard')
        ) : (
          t('publicWishlist.claimButton')
        )}
      </Button>
    </form>
  );
};
```

Create `src/PublicWishlist/components/ClaimReceipt.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { ExternalLink, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toStoreUrl } from '../lib/itemFormat';
import type { Receipt, Wishlist } from '../types';

interface ClaimReceiptProps {
  receipt: Receipt;
  wishlist: Wishlist;
  onDone: () => void;
}

/** What the sheet turns into after a claim: a receipt, never a toast. */
export const ClaimReceipt = ({ receipt, wishlist, onDone }: ClaimReceiptProps) => {
  const { t } = useTranslation();
  const organizer = wishlist.organizer_name;
  const owner = wishlist.creator_name;
  const rows = [
    { label: t('publicWishlist.receiptItem'), value: receipt.title },
    ...(receipt.price ? [{ label: t('publicWishlist.receiptPrice'), value: receipt.price }] : []),
  ];

  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center text-gh-ink">
      <Gift
        className="h-12 w-12 text-gh-primary-strong duration-300 animate-in zoom-in-90 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <h2 className="mt-2 text-[22px] font-bold leading-7">
        {t('publicWishlist.receiptTitle', { title: receipt.title })}
      </h2>
      <p className="text-[16px] leading-6 text-gh-ink-2">
        {owner
          ? t('publicWishlist.receiptLead', { name: owner })
          : t('publicWishlist.receiptLeadNoName')}
      </p>
      <span className="inline-flex min-h-[32px] items-center rounded-gh-pill border border-gh-line-strong bg-gh-surface-300 px-3 text-[16px] font-semibold leading-6">
        {receipt.name}
      </span>
      <dl className="mt-2 w-full">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-t border-gh-line py-2 text-left">
            <dt className="text-[13px] leading-[18px] text-gh-muted">{row.label}</dt>
            <dd className="min-w-0 text-right text-[16px] leading-6">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[13px] leading-[18px] text-gh-muted">
        {organizer
          ? t('publicWishlist.receiptUndo', { name: organizer })
          : t('publicWishlist.receiptUndoNoOrganizer')}
      </p>
      <div className="mt-4 flex w-full flex-col gap-3">
        {receipt.link && (
          <Button asChild variant="outline" className="h-12 w-full rounded-gh-md text-base font-semibold">
            <a href={toStoreUrl(receipt.link)} target="_blank" rel="noopener noreferrer">
              {t('publicWishlist.openStore')}
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        )}
        <Button
          type="button"
          onClick={onDone}
          className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
          {t('publicWishlist.done')}
        </Button>
      </div>
    </div>
  );
};
```

Create `src/PublicWishlist/components/ItemSheet.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { ClaimForm } from './ClaimForm';
import { ClaimReceipt } from './ClaimReceipt';
import { ItemDetail } from './ItemDetail';
import type { ItemKind } from '../lib/groupItems';
import type { Receipt, Wishlist, WishlistItem } from '../types';

interface ItemSheetProps {
  open: boolean;
  item: WishlistItem | null;
  kind: ItemKind;
  wishlist: Wishlist;
  receipt: Receipt | null;
  buyerName: string;
  nameError: boolean;
  claiming: boolean;
  onBuyerNameChange: (name: string) => void;
  onClaim: () => void;
  onClose: () => void;
}

/**
 * One surface for every item: a claim form while it is available, a read-only
 * view once it is taken (so a returning giver still finds the store link), and
 * a receipt right after the giver claimed it.
 */
export const ItemSheet = ({
  open,
  item,
  kind,
  wishlist,
  receipt,
  buyerName,
  nameError,
  claiming,
  onBuyerNameChange,
  onClaim,
  onClose,
}: ItemSheetProps) => {
  const { t } = useTranslation();

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('publicWishlist.sheetTitle')}
      subtitle={wishlist.title}
      closeLabel={t('publicWishlist.closeSheet')}>
      {receipt ? (
        <ClaimReceipt receipt={receipt} wishlist={wishlist} onDone={onClose} />
      ) : item ? (
        <>
          <ItemDetail item={item} kind={kind} wishlist={wishlist} />
          {kind === 'available' ? (
            <ClaimForm
              item={item}
              wishlist={wishlist}
              buyerName={buyerName}
              nameError={nameError}
              claiming={claiming}
              onBuyerNameChange={onBuyerNameChange}
              onSubmit={onClaim}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
              {t('publicWishlist.close')}
            </Button>
          )}
        </>
      ) : null}
    </ResponsiveSheet>
  );
};
```

- [ ] **Step 5: Loading, inactive-link and empty states**

Replace `src/PublicWishlist/components/LoadingState.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gh-bg">
      <div
        role="status"
        aria-label={t('publicWishlist.loadingList')}
        className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 pb-10 pt-8 md:px-8 md:pt-16">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32 bg-gh-surface-300" />
          <Skeleton className="h-9 w-3/4 bg-gh-surface-300" />
          <Skeleton className="h-5 w-full max-w-[420px] bg-gh-surface-300" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-gh-lg bg-gh-surface-300" />
          ))}
        </div>
      </div>
    </div>
  );
};
```

Replace `src/PublicWishlist/components/AccessDeniedState.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';

/** Unknown, expired or turned-off share link. */
export const AccessDeniedState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gh-bg p-4">
      <EmptyState
        size="screen"
        headingAs="h1"
        icon={Link2Off}
        title={t('publicWishlist.inactiveTitle')}
        text={t('publicWishlist.inactiveText')}
        action={
          <Button asChild variant="outline" className="h-12 rounded-gh-md px-5 text-base font-semibold">
            <Link to="/auth">{t('publicWishlist.createOwnLink')}</Link>
          </Button>
        }
      />
    </div>
  );
};
```

Replace `src/PublicWishlist/components/EmptyWishlistState.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { EmptyState } from '@/components/gh/EmptyState';

export const EmptyWishlistState = ({ creatorName }: { creatorName: string | null }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={Gift}
      title={t('publicWishlist.emptyTitle')}
      text={
        creatorName
          ? t('publicWishlist.emptyText', { name: creatorName })
          : t('publicWishlist.emptyTextNoName')
      }
    />
  );
};
```

Replace `src/PublicWishlist/components/index.ts`:

```ts
export { LoadingState } from './LoadingState';
export { AccessDeniedState } from './AccessDeniedState';
export { EmptyWishlistState } from './EmptyWishlistState';
export { GiverItemRow } from './GiverItemRow';
export { ItemSheet } from './ItemSheet';
```

- [ ] **Step 6: Verify the new files compile**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -v "useAdminWishlist.ts(218\|Dashboard/components/index.ts(7"`
Expected: errors only about the not-yet-rewritten `index.tsx` / `hooks/usePublicWishlist.ts` / old component files (`WishlistItemCard`, `ClaimItemDialog`, `InfoSection`) — they still reference removed state fields and translation keys. Task 5 removes them. If `types/index.ts` itself reports an error, fix it now.

- [ ] **Step 7: Commit**

```bash
git add src/PublicWishlist src/locales
git commit -m "feat(giver): item sheet, receipt and new states for the share page

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Hook and page; remove the old components

**Files:**
- Modify (rewrite): `src/PublicWishlist/hooks/usePublicWishlist.ts`, `src/PublicWishlist/index.tsx`, `src/PublicWishlist/README.md`
- Delete: `src/PublicWishlist/components/WishlistItemCard.tsx`, `ClaimItemDialog.tsx`, `InfoSection.tsx`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces: `usePublicWishlist(token)` returning `{ wishlist, items, loading, shareLink, selectedItemId, receipt, buyerName, nameError, claiming, claimedIds, loadWishlistByToken(), openItem(itemId), closeSheet(), setBuyerName(name), claimItem() }`.

- [ ] **Step 1: Rewrite the hook**

Replace `src/PublicWishlist/hooks/usePublicWishlist.ts`:

```ts
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PublicWishlistService } from '../services/PublicWishlistService';
import {
  loadClaimedItemIds,
  loadGiverName,
  rememberClaimedItem,
  saveGiverName,
} from '../lib/giverMemory';
import { PublicWishlistState } from '../types';

/** Errors after which the list on screen may be out of date. */
const CONFLICT_CODES = ['already_taken', 'claim_cap_reached', 'item_not_found', 'invalid_link'];
const KNOWN_CODES = [...CONFLICT_CODES, 'already_claimed', 'invalid_name'];

export const usePublicWishlist = (token?: string) => {
  const { t } = useTranslation();
  const [state, setState] = useState<PublicWishlistState>(() => ({
    wishlist: null,
    items: [],
    loading: true,
    shareLink: null,
    selectedItemId: null,
    receipt: null,
    buyerName: '',
    nameError: false,
    claiming: false,
    claimedIds: token ? loadClaimedItemIds(token) : [],
  }));

  const loadWishlistByToken = useCallback(async () => {
    if (!token) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { wishlist, items, shareLink } =
        await PublicWishlistService.loadWishlistByToken(token);
      setState((prev) => ({ ...prev, wishlist, items, shareLink, loading: false }));
    } catch (error) {
      console.error('Load wishlist error:', error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [token]);

  /** Reload the items quietly, e.g. after someone else took the one on screen. */
  const refreshItems = useCallback(async () => {
    if (!token) return;
    try {
      const { items } = await PublicWishlistService.loadWishlistByToken(token);
      setState((prev) => ({ ...prev, items }));
    } catch (error) {
      console.error('Refresh wishlist error:', error);
    }
  }, [token]);

  const openItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      selectedItemId: itemId,
      receipt: null,
      buyerName: loadGiverName(),
      nameError: false,
    }));
  }, []);

  const closeSheet = useCallback(() => {
    setState((prev) => ({ ...prev, selectedItemId: null, receipt: null, nameError: false }));
  }, []);

  const setBuyerName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, buyerName: name, nameError: false }));
  }, []);

  const claimItem = useCallback(async () => {
    const item = state.items.find((i) => i.id === state.selectedItemId);
    if (!token || !item || state.claiming) return;

    const name = state.buyerName.trim();
    if (name === '' || name.length > 100) {
      setState((prev) => ({ ...prev, nameError: true }));
      return;
    }

    setState((prev) => ({ ...prev, claiming: true }));
    try {
      await PublicWishlistService.claimItem({ token, itemId: item.id, buyerName: name });
      saveGiverName(name);
      rememberClaimedItem(token, item.id);
      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) => {
          if (i.id !== item.id) return i;
          return i.is_giftcard
            ? { ...i, claim_count: (i.claim_count ?? 0) + 1 }
            : { ...i, is_taken: true };
        }),
        claimedIds: prev.claimedIds.includes(item.id)
          ? prev.claimedIds
          : [...prev.claimedIds, item.id],
        receipt: {
          name,
          title: item.title,
          price: prev.wishlist?.enable_price ? item.price_range : null,
          link: prev.wishlist?.enable_links ? item.link : null,
        },
        claiming: false,
      }));
    } catch (error) {
      console.error('Claim item error:', error);
      const code = error instanceof Error ? error.message : '';
      toast.error(
        KNOWN_CODES.includes(code)
          ? t(`publicWishlist.claimErrors.${code}`)
          : t('publicWishlist.failedToClaim'),
      );
      setState((prev) => ({ ...prev, claiming: false }));
      if (CONFLICT_CODES.includes(code)) void refreshItems();
    }
  }, [token, state.items, state.selectedItemId, state.buyerName, state.claiming, t, refreshItems]);

  return {
    ...state,
    loadWishlistByToken,
    openItem,
    closeSheet,
    setBuyerName,
    claimItem,
  };
};
```

- [ ] **Step 2: Rewrite the page**

Replace `src/PublicWishlist/index.tsx`:

```tsx
import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { usePublicWishlist } from './hooks/usePublicWishlist';
import { classifyItem, groupItems } from './lib/groupItems';
import {
  LoadingState,
  AccessDeniedState,
  EmptyWishlistState,
  GiverItemRow,
  ItemSheet,
} from './components';
import type { WishlistItem } from './types';

const PublicWishlist = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const {
    wishlist,
    items,
    loading,
    shareLink,
    selectedItemId,
    receipt,
    buyerName,
    nameError,
    claiming,
    claimedIds,
    loadWishlistByToken,
    openItem,
    closeSheet,
    setBuyerName,
    claimItem,
  } = usePublicWishlist(token);

  useEffect(() => {
    loadWishlistByToken();
  }, [loadWishlistByToken]);

  const claimedSet = useMemo(() => new Set(claimedIds), [claimedIds]);
  const groups = useMemo(() => groupItems(items, claimedSet), [items, claimedSet]);

  if (loading) {
    return <LoadingState />;
  }

  if (!wishlist || !shareLink) {
    return <AccessDeniedState />;
  }

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null;
  const selectedKind = selectedItem ? classifyItem(selectedItem, claimedSet) : 'available';

  const renderSection = (
    title: string,
    list: WishlistItem[],
    kind: 'mine' | 'available' | 'taken',
    description?: string,
  ) =>
    list.length > 0 && (
      <section className="flex flex-col gap-3">
        <SectionHeader title={title} count={list.length} description={description} />
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
          {list.map((item) => (
            <li key={item.id}>
              <GiverItemRow item={item} kind={kind} wishlist={wishlist} onOpen={openItem} />
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 pb-10 pt-8 md:gap-8 md:px-8 md:pt-16">
        <header className="flex flex-col gap-2">
          {wishlist.creator_name && (
            <p className="text-[13px] leading-[18px] text-gh-muted">
              {t('publicWishlist.fromName', { name: wishlist.creator_name })}
            </p>
          )}
          <h1 className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-gh-ink">
            {wishlist.title}
          </h1>
          {wishlist.description && (
            <p className="max-w-[640px] text-[16px] leading-6 text-gh-ink-2">
              {wishlist.description}
            </p>
          )}
        </header>

        {items.length === 0 ? (
          <EmptyWishlistState creatorName={wishlist.creator_name} />
        ) : (
          <>
            {renderSection(
              t('publicWishlist.sectionMine'),
              groups.mine,
              'mine',
              t('publicWishlist.sectionMineHint'),
            )}
            {renderSection(t('publicWishlist.sectionAvailable'), groups.available, 'available')}
            {renderSection(t('publicWishlist.sectionTaken'), groups.taken, 'taken')}
          </>
        )}

        <footer className="flex flex-col items-center gap-4 pt-4 text-center">
          <p className="text-[14px] leading-5 text-gh-muted">
            {t('publicWishlist.createOwn')}{' '}
            <Link
              to="/auth"
              className="font-semibold text-gh-primary-strong underline underline-offset-4">
              {t('publicWishlist.createOwnLink')}
            </Link>
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </footer>
      </main>

      <ItemSheet
        open={selectedItemId !== null}
        item={selectedItem}
        kind={selectedKind}
        wishlist={wishlist}
        receipt={receipt}
        buyerName={buyerName}
        nameError={nameError}
        claiming={claiming}
        onBuyerNameChange={setBuyerName}
        onClaim={claimItem}
        onClose={closeSheet}
      />
    </div>
  );
};

export default PublicWishlist;
```

- [ ] **Step 3: Delete the old components and update the README**

Run: `git rm src/PublicWishlist/components/WishlistItemCard.tsx src/PublicWishlist/components/ClaimItemDialog.tsx src/PublicWishlist/components/InfoSection.tsx`

Run: `grep -rn "WishlistItemCard\|ClaimItemDialog\|InfoSection\|publicWishlist\.\(howItWorks\|changeOfMind\|claimItem\|claimDescription\|yourNameRequired\|yourNameOptional\|illGetThis\|createdBy\|noItemsYet\|itemClaimed\|accessNotAvailable\|requiresShareLink\|invalidShareLink\)" src`
Expected: no output (README mentions are handled next).

Replace `src/PublicWishlist/README.md` with:

```markdown
# PublicWishlist

The page givers open from a share link (`/shared/:token`). No login and no app chrome.

## What it does
- Loads the list through the `get_shared_wishlist` RPC and claims through `claim_shared_item` (`services/PublicWishlistService.ts`). Anonymous users have no table access.
- Splits the items into **Det här har du tagit** (what this device claimed), **Lediga** and **Redan tagna** (`lib/groupItems.ts`).
- Every item opens in one sheet (`components/ItemSheet.tsx`): a claim form while it is available, a read-only view once it is taken, and a receipt right after claiming.
- The device remembers the giver's name and the items they took in `localStorage` (`lib/giverMemory.ts`). The page works without storage.

## Structure
- `index.tsx` – layout and sections
- `hooks/usePublicWishlist.ts` – load, claim, sheet state
- `lib/` – pure logic with unit tests (`npm run test:unit`)
- `components/` – row, sheet, detail, form, receipt, loading / inactive-link / empty states
- Shared UI: `src/components/gh/` and `src/components/ResponsiveSheet.tsx`

## Design
Design canvas: https://claude.ai/artifact/6tVsedsaGbYMx5yKpyzY2b. Design system: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu.
```

- [ ] **Step 4: Verify**

Run: `npm run test:unit && npm run build && npx tsc --noEmit -p tsconfig.app.json; npm run lint`
Expected: `# fail 0`; build passes; only the 2 pre-existing type errors and 4 pre-existing lint errors.

- [ ] **Step 5: Commit**

```bash
git add -A src/PublicWishlist
git commit -m "feat(giver): rebuild the share page to the approved design

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Verify in the browser, then open the PR

**Files:** none (verification, then PR).

- [ ] **Step 1: Seed local data and start the app**

Run `npx supabase start` if it isn't running, then `npx supabase db reset`. Copy `.env.local` from the main checkout into the worktree. Create two users and a shared list (the SQL uses the service-role key printed by `npx supabase status -o env`):

```bash
SK=$(npx supabase status -o env 2>/dev/null | grep -E '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')
for pair in "anna@e2e.se:Anna Lind" "erik@e2e.se:Erik Berg"; do
  curl -s -o /dev/null -X POST http://127.0.0.1:54321/auth/v1/admin/users \
    -H "apikey: $SK" -H "Authorization: Bearer $SK" -H "Content-Type: application/json" \
    -d "{\"email\":\"${pair%%:*}\",\"password\":\"Passw0rd!\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"${pair#*:}\"}}"
done
docker exec -i supabase_db_pjiofxvhzcengexymoms psql -U postgres -d postgres -q <<'SQL'
update profiles set full_name = case email when 'anna@e2e.se' then 'Anna Lind' else 'Erik Berg' end where email in ('anna@e2e.se','erik@e2e.se');
with o as (select id from profiles where email='anna@e2e.se'),
     a as (select id from profiles where email='erik@e2e.se'),
     w as (insert into wishlists (title, description, creator_id, enable_links, enable_price, enable_priority)
           select 'Annas 35-årsdag', 'Saker jag önskar mig i år. Ta det som passar, och hör av dig till Erik om något är oklart.', o.id, true, true, true from o returning id)
insert into wishlist_admins (wishlist_id, admin_id, invited_by) select w.id, a.id, (select id from o) from w, a;
insert into wishlist_items (wishlist_id, title, description, price_range, priority, link, is_giftcard, claim_cap, is_taken, taken_by_name)
select w.id, v.t, v.d, v.p, v.pr, v.l, v.g, v.c, v.tk, v.tb from wishlists w,
 (values ('Lego Botanicals – Bonsai','Den gröna, inte den rosa. Finns på Lekia och Amazon.','ca 400 kr',3,'lekia.se',false,null::int,false,null),
         ('Presentkort Akademibokhandeln','Flera kan ge, så ta det belopp du vill.','valfritt belopp',2,null,true,5,false,null),
         ('Stekpanna i gjutjärn',null,'ca 600 kr',2,null,false,null,false,null),
         ('Trädgårdssax',null,'ca 250 kr',1,null,false,null,false,null),
         ('Ullsockor, storlek 38–40','Gärna i ull och i mörkgrått.','ca 150 kr',2,'kjell.com',false,null,true,'Mormor')) v(t,d,p,pr,l,g,c,tk,tb)
where w.title = 'Annas 35-årsdag';
insert into share_links (wishlist_id, token, created_by)
select w.id, 'e2e-token', p.id from wishlists w, profiles p where w.title = 'Annas 35-årsdag' and p.email = 'erik@e2e.se';
SQL
npm run dev:local
```

Expected: the dev server prints `http://localhost:8080/`. Open `http://localhost:8080/shared/e2e-token` in a browser context with no login.

- [ ] **Step 2: The list at 390×844 and 1280×900, light and dark, Swedish and English**

Check against the canvas boards "Lista" and "Lista, dator":
- eyebrow "Önskelista från Anna", the title, the description;
- no "Det här har du tagit" section yet; "Lediga" shows 4 rows (Bonsai, Presentkort with "Flera kan ge" and "0 av 5 har gett", Stekpanna, Trädgårdssax); "Redan tagna" shows Ullsockor muted with "Tagen";
- Bonsai row meta reads "ca 400 kr · Prio hög"; Trädgårdssax "ca 250 kr · Prio låg";
- desktop: two columns of rows, max width 960px, no horizontal scroll at 390px;
- footer: link "Skapa din egen önskelista" (→ `/auth`), theme and language buttons;
- switch to dark (footer theme menu) and English; save screenshots under the scratchpad.

- [ ] **Step 3: Claim flow (mobile)**

1. Tap Bonsai → bottom sheet with image placeholder, "Ledig", title, meta, description, link "Öppna i butiken" (opens `https://lekia.se` in a new tab), "Ditt namn" with the help text naming Erik, button "Jag köper den här".
2. Tap the button with the name empty → inline error under the field, no network request (check `list_network_requests` for no `claim_shared_item`). Enter 101 characters → same error. Enter spaces only → same error.
3. Enter "Maria" and submit → the sheet turns into the receipt: "Du har tagit Bonsai", chip "Maria", rows Önskning/Pris, "Ångrar du dig? Hör av dig till Erik.", buttons "Öppna i butiken" and "Klar".
4. Tap "Klar" → the list now has the section "Det här har du tagit" with Bonsai ("Tagen av dig") and "Lediga" has 3 rows.
5. Reload the page → the section is still there (localStorage); open another item → "Ditt namn" is prefilled with "Maria".
6. Open Ullsockor → read-only: "Tagen", the note about still seeing the link, "Öppna i butiken", button "Stäng", no name field.
7. Open Bonsai (mine) → read-only with "Tagen av dig" and the note naming Erik.

- [ ] **Step 4: Gift card**

Open Presentkort → "Flera kan ge", "0 av 5 har gett" meter, help "Det finns plats för 5 till. Samma namn kan inte ge två gånger.", button "Jag ger ett presentkort". Claim as "Maria" → receipt; after "Klar" it is under "Det här har du tagit" showing "1 av 5 har gett". Open it again → read-only (mine). In SQL raise it to the cap (`insert into item_claims … ` until 5) and reload in a fresh context → it moves to "Redan tagna".

- [ ] **Step 5: Desktop panel**

At 1280×900 tap an item → a side panel slides in from the right (440px) with a close button top-left, title "Önskning", the list name as subtitle, the same content; Escape and the close button and a click on the dimmed area close it; focus returns to the row.

- [ ] **Step 6: States**

- Inactive link: `update share_links set is_active = false where token = 'e2e-token';` → reload shows "Den här länken är inte längre aktiv", "Be den som delade listan om en ny länk." and a "Skapa din egen önskelista" button (→ `/auth`). Set it back to true afterwards.
- Unknown link `/shared/nope` → the same state.
- Empty list: `delete from wishlist_items where wishlist_id = (select id from wishlists where title='Annas 35-årsdag');` → "Inga önskningar än" with Anna's name. (Re-run the item insert from step 1 to restore.)
- All taken / all available: with every item taken, the "Lediga" heading is not rendered; with none taken, "Redan tagna" is not rendered.
- Loading: throttle the network (Slow 3G) and reload → skeleton rows, no flash of the inactive-link state.

- [ ] **Step 7: Two givers at once**

Open the page in two isolated browser contexts. In both open Stekpanna. Claim in the first ("Maria"). In the second, claim as "Per" → toast "Någon hann före – den här önskningen är redan tagen.", the sheet flips to the read-only "Tagen" view, and the list behind it shows Stekpanna under "Redan tagna".

- [ ] **Step 8: Storage blocked, keyboard, a11y**

- Blocked storage: in the console run `Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } })` before the app loads (use the navigate tool's `initScript`). The page loads, a claim works and shows the receipt, no "Det här har du tagit" section appears, the name is not prefilled, and the console shows no unhandled error.
- Keyboard: Tab reaches rows, opens with Enter/Space, the field, the button; Escape closes the sheet; the focus ring is visible (2px) on rows, buttons, links.
- Console: no errors and no a11y warnings (e.g. Radix "DialogContent requires a DialogTitle") at either width.

- [ ] **Step 9: Full checks**

Run: `npm run test:unit && npx supabase db reset && npm run test:db && npm run build && npx tsc --noEmit -p tsconfig.app.json; npm run lint`
Expected: unit `# fail 0`; db `Result: PASS`; build passes; only the pre-existing type and lint errors.

- [ ] **Step 10: Open the PR (after the user agrees)**

Push the branch and open a PR with the before/after screenshots. The PR description says: merging runs `supabase db push` (one additive migration: `organizer_name` in `get_shared_wishlist`; the old frontend ignores it) and deploys the frontend. After merging: open a production share link in a private window, claim nothing, check the page loads in light and dark.
