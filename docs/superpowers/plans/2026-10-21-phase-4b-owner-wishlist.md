# Phase 4b – Owner wishlist screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new owner screen at `/wishlist/:id` (owner mode of the redesign): add, edit and delete items directly, invite and follow an organizer, settings, and – once the list is shared – change requests with neutral answers. The old `/wishlist/:id/manage` screen is removed and redirects.

**Architecture:** A new feature folder `src/Wishlist/`. `index.tsx` resolves the viewer's role for the list: owner → the new `OwnerWishlist`; organizer and self-managed owner are redirected to their existing screens (`/admin`, `/self`) until phase 4c replaces them. Pure logic (form → row, proposals, request view-model, role) is plain TypeScript with `node:test` unit tests; Supabase access is in `WishlistService`; state in `useOwnerWishlist`; UI in Tailwind components using the `gh-*` tokens and the existing `ResponsiveSheet`. Item edits go to the database directly while the list is unshared and through `request_item_change` once it is shared (the database enforces this since phase 4a).

**Tech Stack:** React 18 + TypeScript, react-router-dom, react-i18next, sonner, Tailwind (`gh-*` tokens), Supabase JS, `node:test` (`npm run test:unit`).

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` sections 1–3 (owner mode). Approved design: claude.ai artifact https://claude.ai/artifact/VEUdZk5qZ1d8iGL8s3Udkp (17 boards: list, add, edit, delete confirm, settings, Dela states, shared list with requests, empty, dark, desktop). Design system: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu.

## Global Constraints

- Never hardcode user-facing strings: every string is a key in `src/locales/en.json` and `sv.json` (Swedish copy per the canvas), used through `useTranslation()`.
- Use only `gh-*` Tailwind tokens (`bg-gh-surface-200`, `text-gh-muted`, `rounded-gh-lg`, `shadow-gh-sheet`, …). The one primary action per screen uses the shadcn `Button` default variant (pastel, dark text); destructive actions are full width at the bottom of a sheet and confirm inline (a `ConfirmBlock` in the same sheet, never a dialog on top of a sheet).
- Touch targets ≥ 44px, focus ring 2px, text never under 12px, headings in order.
- Define components at module top level (never inside another component's render) so inputs keep focus.
- Owner mode shows **no** claim information and **no** share link anywhere. Copy never hints that something is taken: answers are "Ändringen är gjord" / "Arrangören behöll önskningen som den var".
- Always use `ITEM_COLUMNS` (`src/lib/itemColumns.ts`) for `wishlist_items` reads and `.select(...)` after writes; never `select('*')` or a bare `.select()` on that table (claim columns are not readable, phase 4a).
- Generated links use `getBaseUrl()`.
- Items of a shared list (an active share link exists; `wishlist_has_share_link`): editing or removing an existing item is a change request; adding is direct. The database refuses direct updates and deletes in that state.
- Pure logic imports types with `import type` and `.ts` extensions in relative imports so `node --test` runs it.
- `npm run lint`, `tsc` and `npm run build` keep their baselines (tsc 2 pre-existing errors, lint 4 errors / 9 warnings).

## Review Focus

- **A request on an item that already has a pending request** (`request_pending`), a request after the organizer turned the link off (`edit_directly`), or an item that was removed meanwhile (`item_not_found`) → a clear toast and a reload, never a stuck sheet. (Task 2 hook, Task 5 verification)
- **Editing with no actual change** on a shared list sends nothing (the database rejects an empty proposal). (Task 1 `buildProposal` test)
- **Gift card toggled off** must send `claim_cap: null`; a non-gift-card never keeps a cap. (Task 1 tests)
- **Whitespace-only or very long title, non-integer claim cap** → inline error, no request. (Task 1 tests)
- **Answered requests** older than 7 days disappear; withdrawn ones never show; pending ones always show first. (Task 1 tests)
- **Organizer, self-managed owner and strangers** open `/wishlist/:id` and land on the right screen or Home, never on owner mode. (Task 1 `resolveMode` tests, Task 5 browser)
- **Old `/wishlist/:id/manage` bookmarks** redirect to `/wishlist/:id`. (Task 5)

## File structure

| File | Responsibility |
|---|---|
| `src/Wishlist/types/index.ts` | Types for owner data, form, requests, sheets |
| `src/Wishlist/lib/itemForm.ts` (+test) | Form defaults, validation, form → row, `buildProposal` |
| `src/Wishlist/lib/changeRequests.ts` (+test) | Request rows → owner view-model |
| `src/Wishlist/lib/mode.ts` (+test) | Role → mode, mode → redirect path |
| `src/Wishlist/services/WishlistService.ts` | All Supabase calls for owner mode |
| `src/Wishlist/hooks/useOwnerWishlist.ts` | State and actions for the owner screen |
| `src/Wishlist/components/*` | `OwnerWishlist`, `ItemFormSheet`, `ShareSheet`, `SettingsSheet`, `RequestCard`, `WishlistLoading` |
| `src/Wishlist/index.tsx` | Route entry: resolve mode, render or redirect |
| `src/components/gh/{Chip,SwitchRow,ConfirmBlock,TextArea}.tsx` | New design-system ports; `TextField` gets a `suffix` |
| `src/components/ResponsiveSheet.tsx` | `showTitleOnMobile` prop |
| `src/locales/{en,sv}.json` | New `wishlist` section |
| `src/integrations/supabase/types.ts` | Types for `item_change_requests` and the request RPCs |
| `src/App.tsx`, `src/Dashboard/components/MyWishlistsSection.tsx` | Routes and links |
| `src/ManageWishlist/*` | Removed (AddItemDialog moves to `SelfManagedWishlist`) |

---

### Task 1: Pure logic with unit tests

**Files:**
- Create: `src/Wishlist/types/index.ts`
- Create: `src/Wishlist/lib/itemForm.ts`, `src/Wishlist/lib/itemForm.test.ts`
- Create: `src/Wishlist/lib/changeRequests.ts`, `src/Wishlist/lib/changeRequests.test.ts`
- Create: `src/Wishlist/lib/mode.ts`, `src/Wishlist/lib/mode.test.ts`

**Interfaces:**
- Produces (types, used by every later task):
  `OwnerItem`, `ItemFormData`, `ItemFormError`, `ChangeRequestRow`, `ChangedField`, `FieldChange`, `OwnerRequest`, `OrganizerState`, `OwnerData`, `Sheet`, `Mode`.
- Produces (functions): `emptyItemForm()`, `formFromItem(item)`, `validateItemForm(form)`, `toItemRow(form)`, `buildProposal(item, form)`, `ANSWER_VISIBLE_DAYS`, `toOwnerRequests(rows, items, now)`, `resolveMode(input)`, `modePath(mode, id)`.

- [ ] **Step 1: Write the types** `src/Wishlist/types/index.ts`

```ts
import type { Database } from '@/integrations/supabase/types';

export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
type ItemRow = Database['public']['Tables']['wishlist_items']['Row'];

/** What an owner may read of an item: never the claim columns. */
export type OwnerItem = Pick<
  ItemRow,
  | 'id'
  | 'title'
  | 'description'
  | 'link'
  | 'url'
  | 'price_range'
  | 'priority'
  | 'is_giftcard'
  | 'claim_cap'
  | 'created_at'
>;

export interface ItemFormData {
  title: string;
  description: string;
  link: string;
  /** Image address, filled from the link's metadata. */
  url: string;
  priceRange: string;
  /** 1 low, 2 medium, 3 high, null none. */
  priority: number | null;
  isGiftcard: boolean;
  claimCap: number | null;
}

export type ItemFormError = 'title_required' | 'title_too_long' | 'claim_cap_invalid';

export type RequestKind = 'edit' | 'remove';

export interface ChangeRequestRow {
  id: string;
  item_id: string | null;
  item_title: string;
  kind: RequestKind;
  proposed: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'declined' | 'withdrawn';
  message: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type ChangedField =
  | 'title'
  | 'description'
  | 'link'
  | 'image'
  | 'price'
  | 'priority'
  | 'giftcard'
  | 'claimCap';

export type FieldValue = string | number | boolean | null;

export interface FieldChange {
  field: ChangedField;
  /** Undefined once the change has been applied: the old value is gone. */
  before?: FieldValue;
  after: FieldValue;
}

export interface OwnerRequest {
  id: string;
  itemId: string | null;
  itemTitle: string;
  kind: RequestKind;
  /** applied = approved, kept = declined. Neutral on purpose. */
  state: 'pending' | 'applied' | 'kept';
  changes: FieldChange[];
  message: string | null;
  /** When it was sent (pending) or answered. ISO string. */
  when: string;
}

export type OrganizerState =
  | { kind: 'none' }
  | { kind: 'pending'; email: string; invitationId: string }
  | { kind: 'accepted'; name: string; email: string | null };

export interface OwnerData {
  wishlist: Wishlist;
  items: OwnerItem[];
  requests: ChangeRequestRow[];
  /** An active share link exists (the owner never sees the link itself). */
  shared: boolean;
  organizer: OrganizerState;
}

export type Sheet =
  | { type: 'add' }
  | { type: 'item'; itemId: string }
  | { type: 'share' }
  | { type: 'settings' }
  | null;

export type Mode = 'owner' | 'organizer' | 'self' | 'none';
```

- [ ] **Step 2: Write the failing tests** `src/Wishlist/lib/itemForm.test.ts`

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProposal,
  emptyItemForm,
  formFromItem,
  toItemRow,
  validateItemForm,
} from './itemForm.ts';
import type { OwnerItem } from '../types/index.ts';

const item: OwnerItem = {
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
};

test('validate: a whitespace-only title is refused', () => {
  assert.equal(validateItemForm({ ...emptyItemForm(), title: '   ' }), 'title_required');
});

test('validate: a title over 200 characters is refused', () => {
  assert.equal(validateItemForm({ ...emptyItemForm(), title: 'a'.repeat(201) }), 'title_too_long');
});

test('validate: a gift card cap must be a whole number from 1', () => {
  const base = { ...emptyItemForm(), title: 'Presentkort', isGiftcard: true };
  assert.equal(validateItemForm({ ...base, claimCap: 0 }), 'claim_cap_invalid');
  assert.equal(validateItemForm({ ...base, claimCap: 2.5 }), 'claim_cap_invalid');
  assert.equal(validateItemForm({ ...base, claimCap: 5 }), null);
  assert.equal(validateItemForm({ ...base, claimCap: null }), null);
});

test('validate: a cap on a non-gift-card is ignored, not an error', () => {
  assert.equal(validateItemForm({ ...emptyItemForm(), title: 'Bok', claimCap: 0 }), null);
});

test('toItemRow trims, turns empty strings into null and drops the cap of a non-gift-card', () => {
  const row = toItemRow({
    ...emptyItemForm(),
    title: '  Bok  ',
    description: '   ',
    link: ' lekia.se ',
    priceRange: '',
    claimCap: 3,
  });
  assert.deepEqual(row, {
    title: 'Bok',
    description: null,
    link: 'lekia.se',
    url: null,
    price_range: null,
    priority: null,
    is_giftcard: false,
    claim_cap: null,
  });
});

test('toItemRow keeps the cap of a gift card', () => {
  assert.equal(toItemRow({ ...emptyItemForm(), title: 'K', isGiftcard: true, claimCap: 4 }).claim_cap, 4);
});

test('formFromItem fills empty strings for missing values', () => {
  const form = formFromItem(item);
  assert.equal(form.description, '');
  assert.equal(form.link, '');
  assert.equal(form.priceRange, 'ca 250 kr');
  assert.equal(form.priority, 1);
  assert.equal(form.isGiftcard, false);
});

test('buildProposal: only the changed fields', () => {
  const form = { ...formFromItem(item), priceRange: 'ca 300 kr' };
  assert.deepEqual(buildProposal(item, form), { price_range: 'ca 300 kr' });
});

test('buildProposal: nothing changed gives an empty proposal', () => {
  assert.deepEqual(buildProposal(item, formFromItem(item)), {});
});

test('buildProposal: whitespace-only edits are not changes', () => {
  const form = { ...formFromItem(item), title: '  Trädgårdssax ', description: '  ' };
  assert.deepEqual(buildProposal(item, form), {});
});

test('buildProposal: turning gift card off sends claim_cap null', () => {
  const card: OwnerItem = { ...item, is_giftcard: true, claim_cap: 5 };
  const form = { ...formFromItem(card), isGiftcard: false };
  assert.deepEqual(buildProposal(card, form), { is_giftcard: false, claim_cap: null });
});

test('buildProposal: clearing a priority sends null', () => {
  const form = { ...formFromItem(item), priority: null };
  assert.deepEqual(buildProposal(item, form), { priority: null });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm run test:unit 2>&1 | tail -12`
Expected: FAIL: `Cannot find module './itemForm.ts'`.

- [ ] **Step 4: Implement** `src/Wishlist/lib/itemForm.ts`

```ts
import type { ItemFormData, ItemFormError, OwnerItem } from '../types/index.ts';

export const TITLE_MAX = 200;

export const emptyItemForm = (): ItemFormData => ({
  title: '',
  description: '',
  link: '',
  url: '',
  priceRange: '',
  priority: null,
  isGiftcard: false,
  claimCap: null,
});

export const formFromItem = (item: OwnerItem): ItemFormData => ({
  title: item.title,
  description: item.description ?? '',
  link: item.link ?? '',
  url: item.url ?? '',
  priceRange: item.price_range ?? '',
  priority: item.priority ?? null,
  isGiftcard: item.is_giftcard ?? false,
  claimCap: item.claim_cap ?? null,
});

export const validateItemForm = (form: ItemFormData): ItemFormError | null => {
  const title = form.title.trim();
  if (title === '') return 'title_required';
  if (title.length > TITLE_MAX) return 'title_too_long';
  if (
    form.isGiftcard &&
    form.claimCap != null &&
    (!Number.isInteger(form.claimCap) || form.claimCap < 1)
  ) {
    return 'claim_cap_invalid';
  }
  return null;
};

const clean = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** The columns of wishlist_items an owner writes. */
export const toItemRow = (form: ItemFormData) => ({
  title: form.title.trim(),
  description: clean(form.description),
  link: clean(form.link),
  url: clean(form.url),
  price_range: clean(form.priceRange),
  priority: form.priority,
  is_giftcard: form.isGiftcard,
  claim_cap: form.isGiftcard ? form.claimCap : null,
});

export type ItemRowValues = ReturnType<typeof toItemRow>;

/** Only the fields that differ from the item: what `request_item_change` accepts. */
export const buildProposal = (item: OwnerItem, form: ItemFormData): Partial<ItemRowValues> => {
  const next = toItemRow(form);
  const current: ItemRowValues = {
    title: item.title,
    description: item.description ?? null,
    link: item.link ?? null,
    url: item.url ?? null,
    price_range: item.price_range ?? null,
    priority: item.priority ?? null,
    is_giftcard: item.is_giftcard ?? false,
    claim_cap: item.is_giftcard ? (item.claim_cap ?? null) : null,
  };
  const proposal: Record<string, unknown> = {};
  for (const key of Object.keys(next) as (keyof ItemRowValues)[]) {
    if (next[key] !== current[key]) proposal[key] = next[key];
  }
  return proposal as Partial<ItemRowValues>;
};
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"`
Expected: all pass (21 previous + 12 new = 33).

- [ ] **Step 6: Write the failing tests** `src/Wishlist/lib/changeRequests.test.ts`

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANSWER_VISIBLE_DAYS, toOwnerRequests } from './changeRequests.ts';
import type { ChangeRequestRow, OwnerItem } from '../types/index.ts';

const now = new Date('2026-10-21T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

const item: OwnerItem = {
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
};

const row = (over: Partial<ChangeRequestRow>): ChangeRequestRow => ({
  id: 'r1',
  item_id: 'i1',
  item_title: 'Trädgårdssax',
  kind: 'edit',
  proposed: { price_range: 'ca 300 kr' },
  status: 'pending',
  message: null,
  created_at: daysAgo(0),
  resolved_at: null,
  ...over,
});

test('a pending edit shows before and after from the current item', () => {
  const [request] = toOwnerRequests([row({})], [item], now);
  assert.equal(request.state, 'pending');
  assert.deepEqual(request.changes, [{ field: 'price', before: 'ca 250 kr', after: 'ca 300 kr' }]);
});

test('an applied edit has no before value (the old value is gone)', () => {
  const [request] = toOwnerRequests(
    [row({ status: 'approved', resolved_at: daysAgo(1) })],
    [{ ...item, price_range: 'ca 300 kr' }],
    now,
  );
  assert.equal(request.state, 'applied');
  assert.deepEqual(request.changes, [{ field: 'price', after: 'ca 300 kr' }]);
});

test('a declined request is "kept" and keeps its message', () => {
  const [request] = toOwnerRequests(
    [row({ status: 'declined', resolved_at: daysAgo(1), message: 'Behåller den.' })],
    [item],
    now,
  );
  assert.equal(request.state, 'kept');
  assert.equal(request.message, 'Behåller den.');
  assert.equal(request.changes[0].before, 'ca 250 kr');
});

test('a remove request has no field changes', () => {
  const [request] = toOwnerRequests([row({ kind: 'remove', proposed: null })], [item], now);
  assert.equal(request.kind, 'remove');
  assert.deepEqual(request.changes, []);
});

test('withdrawn requests never show', () => {
  assert.deepEqual(toOwnerRequests([row({ status: 'withdrawn', resolved_at: daysAgo(0) })], [item], now), []);
});

test('answers older than the visible window disappear, pending ones never do', () => {
  const rows = [
    row({ id: 'old', status: 'approved', resolved_at: daysAgo(ANSWER_VISIBLE_DAYS + 1) }),
    row({ id: 'recent', status: 'approved', resolved_at: daysAgo(ANSWER_VISIBLE_DAYS - 1) }),
    row({ id: 'oldPending', status: 'pending', created_at: daysAgo(60) }),
  ];
  assert.deepEqual(toOwnerRequests(rows, [item], now).map((r) => r.id).sort(), ['oldPending', 'recent']);
});

test('pending first, then answered, newest first in each group', () => {
  const rows = [
    row({ id: 'a1', status: 'approved', resolved_at: daysAgo(3) }),
    row({ id: 'p1', created_at: daysAgo(2) }),
    row({ id: 'a2', status: 'declined', resolved_at: daysAgo(1) }),
    row({ id: 'p2', created_at: daysAgo(0) }),
  ];
  assert.deepEqual(toOwnerRequests(rows, [item], now).map((r) => r.id), ['p2', 'p1', 'a2', 'a1']);
});

test('a request whose item is gone still shows, without before values', () => {
  const [request] = toOwnerRequests([row({ item_id: null })], [], now);
  assert.equal(request.itemId, null);
  assert.equal(request.changes[0].before, undefined);
});

test('turning a gift card off lists both the flag and the cap', () => {
  const card: OwnerItem = { ...item, is_giftcard: true, claim_cap: 5 };
  const [request] = toOwnerRequests(
    [row({ proposed: { is_giftcard: false, claim_cap: null } })],
    [card],
    now,
  );
  assert.deepEqual(request.changes, [
    { field: 'giftcard', before: true, after: false },
    { field: 'claimCap', before: 5, after: null },
  ]);
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `npm run test:unit 2>&1 | tail -8`
Expected: FAIL: `Cannot find module './changeRequests.ts'`.

- [ ] **Step 8: Implement** `src/Wishlist/lib/changeRequests.ts`

```ts
import type {
  ChangeRequestRow,
  ChangedField,
  FieldChange,
  FieldValue,
  OwnerItem,
  OwnerRequest,
} from '../types/index.ts';

/** Answered requests stay visible this long, then they are history. */
export const ANSWER_VISIBLE_DAYS = 7;

const FIELD: Record<string, ChangedField> = {
  title: 'title',
  description: 'description',
  link: 'link',
  url: 'image',
  price_range: 'price',
  priority: 'priority',
  is_giftcard: 'giftcard',
  claim_cap: 'claimCap',
};

const currentValue = (item: OwnerItem, key: string): unknown =>
  (item as unknown as Record<string, unknown>)[key];

const normalise = (value: unknown): FieldValue => {
  if (value === undefined || value === null || value === '') return null;
  return value as FieldValue;
};

const changesFor = (row: ChangeRequestRow, item: OwnerItem | undefined, applied: boolean): FieldChange[] => {
  if (row.kind !== 'edit' || !row.proposed) return [];
  return Object.entries(row.proposed)
    .filter(([key]) => key in FIELD)
    .map(([key, value]): FieldChange => {
      const change: FieldChange = { field: FIELD[key], after: normalise(value) };
      if (!applied && item) change.before = normalise(currentValue(item, key));
      return change;
    });
};

export const toOwnerRequests = (
  rows: ChangeRequestRow[],
  items: OwnerItem[],
  now: Date,
): OwnerRequest[] => {
  const cutoff = now.getTime() - ANSWER_VISIBLE_DAYS * 86_400_000;
  const byId = new Map(items.map((item) => [item.id, item]));

  const mapped = rows.flatMap((row): OwnerRequest[] => {
    if (row.status === 'withdrawn') return [];
    const item = row.item_id ? byId.get(row.item_id) : undefined;
    const base = { id: row.id, itemId: row.item_id, itemTitle: row.item_title, kind: row.kind, message: row.message };
    if (row.status === 'pending') {
      return [{ ...base, state: 'pending', changes: changesFor(row, item, false), when: row.created_at }];
    }
    const answeredAt = row.resolved_at ?? row.created_at;
    if (new Date(answeredAt).getTime() < cutoff) return [];
    const applied = row.status === 'approved';
    return [
      {
        ...base,
        state: applied ? 'applied' : 'kept',
        changes: changesFor(row, item, applied),
        when: answeredAt,
      },
    ];
  });

  const rank = (request: OwnerRequest) => (request.state === 'pending' ? 0 : 1);
  return mapped.sort(
    (a, b) => rank(a) - rank(b) || new Date(b.when).getTime() - new Date(a.when).getTime(),
  );
};
```

- [ ] **Step 9: Run to verify it passes**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"`
Expected: all pass (42).

- [ ] **Step 10: Write the failing tests** `src/Wishlist/lib/mode.test.ts`

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modePath, resolveMode } from './mode.ts';

const list = (over: Partial<{ creator_id: string; is_self_managed: boolean }> = {}) => ({
  creator_id: 'owner',
  is_self_managed: false,
  ...over,
});

test('the creator of a normal list is the owner', () => {
  assert.equal(resolveMode({ wishlist: list(), userId: 'owner', isOrganizer: false }), 'owner');
});

test('the creator of a self-managed list is in self mode', () => {
  assert.equal(
    resolveMode({ wishlist: list({ is_self_managed: true }), userId: 'owner', isOrganizer: true }),
    'self',
  );
});

test('an organizer who is not the creator is in organizer mode', () => {
  assert.equal(resolveMode({ wishlist: list(), userId: 'erik', isOrganizer: true }), 'organizer');
});

test('anyone else, or nobody signed in, has no mode', () => {
  assert.equal(resolveMode({ wishlist: list(), userId: 'stranger', isOrganizer: false }), 'none');
  assert.equal(resolveMode({ wishlist: list(), userId: undefined, isOrganizer: false }), 'none');
  assert.equal(resolveMode({ wishlist: null, userId: 'owner', isOrganizer: false }), 'none');
});

test('modePath sends each mode to the screen that serves it', () => {
  assert.equal(modePath('organizer', 'w1'), '/wishlist/w1/admin');
  assert.equal(modePath('self', 'w1'), '/wishlist/w1/self');
  assert.equal(modePath('none', 'w1'), '/');
  assert.equal(modePath('owner', 'w1'), '/wishlist/w1');
});
```

- [ ] **Step 11: Run to verify it fails, then implement** `src/Wishlist/lib/mode.ts`

Run: `npm run test:unit 2>&1 | tail -6` — Expected: FAIL `Cannot find module './mode.ts'`.

```ts
import type { Mode } from '../types/index.ts';

interface ModeInput {
  wishlist: { creator_id: string; is_self_managed: boolean } | null;
  userId: string | undefined;
  /** The viewer is the list's organizer (a wishlist_admins row). */
  isOrganizer: boolean;
}

export const resolveMode = ({ wishlist, userId, isOrganizer }: ModeInput): Mode => {
  if (!wishlist || !userId) return 'none';
  if (wishlist.creator_id === userId) return wishlist.is_self_managed ? 'self' : 'owner';
  return isOrganizer ? 'organizer' : 'none';
};

/**
 * Until phase 4c, organizers and self-managed owners keep their existing
 * screens; only the owner mode lives on /wishlist/:id.
 */
export const modePath = (mode: Mode, wishlistId: string): string => {
  switch (mode) {
    case 'owner':
      return `/wishlist/${wishlistId}`;
    case 'organizer':
      return `/wishlist/${wishlistId}/admin`;
    case 'self':
      return `/wishlist/${wishlistId}/self`;
    default:
      return '/';
  }
};
```

- [ ] **Step 12: Run everything, then commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: 47 pass, 0 fail; tsc still reports 2 (the baseline).

```bash
git add src/Wishlist
git commit -m "feat(wishlist): pure logic for the owner screen (form, requests, mode)"
```

---

### Task 2: Service and hook

**Files:**
- Modify: `src/integrations/supabase/types.ts` (table and two functions)
- Modify: `src/Wishlist/types/index.ts` (append `SettingsValues`)
- Create: `src/Wishlist/services/WishlistService.ts`
- Create: `src/Wishlist/hooks/useOwnerWishlist.ts`

**Interfaces:**
- Consumes: Task 1 types and functions (`toItemRow`, `buildProposal`, `validateItemForm`, `toOwnerRequests`), `ITEM_COLUMNS`, `EmailService`, `getBaseUrl`, `fetchLinkMetadata`.
- Produces: `WishlistService` (static methods below) and `useOwnerWishlist(wishlistId)` returning the object listed in Step 4. Service errors carry a code in `error.message`: `edit_locked` (a direct write matched no row because the list got shared), `edit_directly`, `request_pending`, `item_not_found` (from the RPCs), `invite_pending`.

- [ ] **Step 1: Type the request table and RPCs** in `src/integrations/supabase/types.ts`

The generated file predates phase 1b. In the `public` schema's `Tables`, insert this entry immediately before `"item_claims": {` (same comma style as its neighbours):

```ts
"item_change_requests": {
  Row: {
    "created_at": string,"created_by": string,"id": string,"item_id": string | null,"item_title": string,"kind": string,"message": string | null,"proposed": Json | null,"resolved_at": string | null,"resolved_by": string | null,"status": string,"wishlist_id": string
  }
  ComputedFields: never
  Insert: {
    "created_at"?: string,"created_by": string,"id"?: string,"item_id"?: string | null,"item_title": string,"kind": string,"message"?: string | null,"proposed"?: Json | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string,"wishlist_id": string
  }
  Update: {
    "created_at"?: string,"created_by"?: string,"id"?: string,"item_id"?: string | null,"item_title"?: string,"kind"?: string,"message"?: string | null,"proposed"?: Json | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string,"wishlist_id"?: string
  }
  Relationships: []
},
```

In `Functions`, insert before `"remove_wishlist_admin":`:

```ts
"request_item_change":
{ Args: { "p_item_id": string,"p_kind": string,"p_proposed"?: Json }; Returns: string
                           },
"withdraw_change_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
```

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"` — Expected: 2 (baseline).

- [ ] **Step 2: Append `SettingsValues`** to `src/Wishlist/types/index.ts`

```ts
export interface SettingsValues {
  title: string;
  description: string;
  enableLinks: boolean;
  enablePrice: boolean;
  enablePriority: boolean;
}
```

- [ ] **Step 3: Write the service** `src/Wishlist/services/WishlistService.ts`

```ts
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { EmailService } from '@/lib/EmailService';
import { ITEM_COLUMNS } from '@/lib/itemColumns';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import { getBaseUrl } from '@/lib/urlUtils';
import { toItemRow, type ItemRowValues } from '../lib/itemForm';
import type {
  ChangeRequestRow,
  ItemFormData,
  OrganizerState,
  OwnerData,
  OwnerItem,
  SettingsValues,
  Wishlist,
} from '../types';

const REQUEST_COLUMNS =
  'id, item_id, item_title, kind, proposed, status, message, created_at, resolved_at';

export class WishlistService {
  static async loadWishlist(wishlistId: string): Promise<Wishlist | null> {
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('id', wishlistId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async isOrganizer(wishlistId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('wishlist_admins')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('admin_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  }

  static async loadOwnerData(wishlistId: string): Promise<OwnerData> {
    const wishlist = await WishlistService.loadWishlist(wishlistId);
    if (!wishlist) throw new Error('wishlist_not_found');
    const [items, requests, shared, organizer] = await Promise.all([
      WishlistService.loadItems(wishlistId),
      WishlistService.loadRequests(wishlistId),
      WishlistService.loadShared(wishlistId),
      WishlistService.loadOrganizer(wishlistId),
    ]);
    return { wishlist, items, requests, shared, organizer };
  }

  private static async loadItems(wishlistId: string): Promise<OwnerItem[]> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select(ITEM_COLUMNS)
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as OwnerItem[];
  }

  private static async loadRequests(wishlistId: string): Promise<ChangeRequestRow[]> {
    const { data, error } = await supabase
      .from('item_change_requests')
      .select(REQUEST_COLUMNS)
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ChangeRequestRow[];
  }

  /** The owner may know the list is shared, never the link itself. */
  private static async loadShared(wishlistId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('wishlist_has_share_link', {
      p_wishlist_id: wishlistId,
    });
    if (error) {
      console.error('Error checking share link:', error);
      return false;
    }
    return data === true;
  }

  private static async loadOrganizer(wishlistId: string): Promise<OrganizerState> {
    const { data: admins, error: adminError } = await supabase
      .from('wishlist_admins')
      .select('id, profiles!admin_id(email, full_name)')
      .eq('wishlist_id', wishlistId);
    if (adminError) throw adminError;

    const admin = admins?.[0] as unknown as
      | { profiles: { email: string | null; full_name: string | null } | null }
      | undefined;
    if (admin) {
      return {
        kind: 'accepted',
        name: admin.profiles?.full_name || admin.profiles?.email || '',
        email: admin.profiles?.email ?? null,
      };
    }

    const { data: invites, error: inviteError } = await supabase
      .from('admin_invitations')
      .select('id, email')
      .eq('wishlist_id', wishlistId)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1);
    if (inviteError) throw inviteError;

    const invite = invites?.[0];
    if (invite) return { kind: 'pending', email: invite.email, invitationId: invite.id };
    return { kind: 'none' };
  }

  /** Pasting a link fills the picture from the link's metadata. */
  static async withLinkImage(form: ItemFormData): Promise<ItemFormData> {
    if (!form.link.trim() || form.url.trim()) return form;
    const metadata = await fetchLinkMetadata(form.link);
    return metadata?.image ? { ...form, url: metadata.image } : form;
  }

  static async addItem(wishlistId: string, form: ItemFormData): Promise<void> {
    const ready = await WishlistService.withLinkImage(form);
    const { error } = await supabase
      .from('wishlist_items')
      .insert({ wishlist_id: wishlistId, ...toItemRow(ready) });
    if (error) throw error;
  }

  /** A direct update. If the list was shared meanwhile RLS matches no row. */
  static async updateItem(itemId: string, form: ItemFormData): Promise<void> {
    const ready = await WishlistService.withLinkImage(form);
    const { data, error } = await supabase
      .from('wishlist_items')
      .update(toItemRow(ready))
      .eq('id', itemId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('edit_locked');
  }

  static async deleteItem(itemId: string): Promise<void> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', itemId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('edit_locked');
  }

  static async requestEdit(itemId: string, proposal: Partial<ItemRowValues>): Promise<void> {
    const { error } = await supabase.rpc('request_item_change', {
      p_item_id: itemId,
      p_kind: 'edit',
      p_proposed: proposal as Json,
    });
    if (error) throw error;
  }

  static async requestRemove(itemId: string): Promise<void> {
    const { error } = await supabase.rpc('request_item_change', {
      p_item_id: itemId,
      p_kind: 'remove',
    });
    if (error) throw error;
  }

  static async withdrawRequest(requestId: string): Promise<void> {
    const { error } = await supabase.rpc('withdraw_change_request', {
      p_request_id: requestId,
    });
    if (error) throw error;
  }

  static async invite(wishlistId: string, email: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('not_authenticated');

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase.from('admin_invitations').insert({
      wishlist_id: wishlistId,
      email: email.trim(),
      invitation_token: token,
      expires_at: expiresAt.toISOString(),
      invited_by: user.id,
    });
    if (error) {
      if (error.code === '23505') throw new Error('invite_pending');
      throw error;
    }

    // The invitation exists even if the mail fails; the owner can retry later.
    try {
      const { data: list } = await supabase
        .from('wishlists')
        .select('title')
        .eq('id', wishlistId)
        .single();
      const { data: inviter } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      await EmailService.sendInvitationEmail(
        email.trim(),
        `${getBaseUrl()}/accept-invitation?token=${token}`,
        list?.title || 'Wishlist',
        inviter?.full_name || undefined,
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }
  }

  static async revokeInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase.from('admin_invitations').delete().eq('id', invitationId);
    if (error) throw error;
  }

  /** Removes the organizer, their link and their invitation in one transaction. */
  static async removeOrganizer(wishlistId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_wishlist_admin', { p_wishlist_id: wishlistId });
    if (error) throw error;
  }

  static async updateSettings(wishlistId: string, values: SettingsValues): Promise<void> {
    const { error } = await supabase
      .from('wishlists')
      .update({
        title: values.title.trim(),
        description: values.description.trim() || null,
        enable_links: values.enableLinks,
        enable_price: values.enablePrice,
        enable_priority: values.enablePriority,
      })
      .eq('id', wishlistId);
    if (error) throw error;
  }

  static async deleteList(wishlistId: string): Promise<void> {
    const { error } = await supabase.from('wishlists').delete().eq('id', wishlistId);
    if (error) throw error;
  }
}
```

- [ ] **Step 4: Write the hook** `src/Wishlist/hooks/useOwnerWishlist.ts`

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { WishlistService } from '../services/WishlistService';
import { toOwnerRequests } from '../lib/changeRequests';
import { buildProposal, validateItemForm } from '../lib/itemForm';
import type {
  ItemFormData,
  ItemFormError,
  OwnerData,
  OwnerItem,
  SettingsValues,
  Sheet,
} from '../types';

export const useOwnerWishlist = (wishlistId: string | undefined) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const [inviteSentTo, setInviteSentTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!wishlistId) {
      setLoading(false);
      return;
    }
    try {
      setData(await WishlistService.loadOwnerData(wishlistId));
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error(t('wishlist.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [wishlistId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const requests = useMemo(
    () => (data ? toOwnerRequests(data.requests, data.items, new Date()) : []),
    [data],
  );
  const pendingItemIds = useMemo(
    () =>
      new Set(
        requests.filter((r) => r.state === 'pending' && r.itemId).map((r) => r.itemId as string),
      ),
    [requests],
  );
  const organizerName =
    data?.organizer.kind === 'accepted'
      ? data.organizer.name || t('wishlist.organizerFallback')
      : null;

  /** Runs an action; maps the known error codes to a toast and reloads when the list changed under us. */
  const run = useCallback(
    async (action: () => Promise<void>, errorKey: string): Promise<boolean> => {
      setBusy(true);
      try {
        await action();
        return true;
      } catch (error) {
        console.error(error);
        const code = error instanceof Error ? error.message : '';
        if (code === 'edit_locked') {
          toast.error(t('wishlist.toast.listShared'));
          setSheet(null);
          await load();
        } else if (code === 'edit_directly') {
          toast.error(t('wishlist.toast.listChanged'));
          setSheet(null);
          await load();
        } else if (code === 'request_pending') {
          toast.error(t('wishlist.toast.requestPending'));
          await load();
        } else if (code === 'item_not_found') {
          toast.error(t('wishlist.toast.itemGone'));
          setSheet(null);
          await load();
        } else if (code === 'invite_pending') {
          toast.error(t('wishlist.toast.invitePending'));
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

  const closeSheet = useCallback(() => {
    setSheet(null);
    setInviteSentTo(null);
  }, []);

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

  /** Direct while the list is unshared, a change request once it is shared. */
  const saveItem = async (item: OwnerItem, form: ItemFormData): Promise<ItemFormError | null> => {
    const invalid = validateItemForm(form);
    if (invalid) return invalid;
    if (!data) return null;

    if (data.shared) {
      const ready = await WishlistService.withLinkImage(form);
      const proposal = buildProposal(item, ready);
      if (Object.keys(proposal).length === 0) {
        closeSheet();
        return null;
      }
      const ok = await run(
        () => WishlistService.requestEdit(item.id, proposal),
        'wishlist.toast.requestFailed',
      );
      if (ok) {
        toast.success(t('wishlist.toast.requestSent'));
        closeSheet();
        await load();
      }
      return null;
    }

    const ok = await run(() => WishlistService.updateItem(item.id, form), 'wishlist.toast.saveFailed');
    if (ok) {
      toast.success(t('wishlist.toast.saved'));
      closeSheet();
      await load();
    }
    return null;
  };

  const removeItem = async (item: OwnerItem) => {
    if (!data) return;
    const shared = data.shared;
    const ok = await run(
      () => (shared ? WishlistService.requestRemove(item.id) : WishlistService.deleteItem(item.id)),
      shared ? 'wishlist.toast.requestFailed' : 'wishlist.toast.removeFailed',
    );
    if (ok) {
      toast.success(t(shared ? 'wishlist.toast.requestRemoveSent' : 'wishlist.toast.removed'));
      closeSheet();
      await load();
    }
  };

  const withdrawRequest = async (requestId: string) => {
    const ok = await run(
      () => WishlistService.withdrawRequest(requestId),
      'wishlist.toast.withdrawFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.requestWithdrawn'));
      await load();
    }
  };

  const invite = async (email: string): Promise<'invalid_email' | null> => {
    const trimmed = email.trim();
    if (!wishlistId) return null;
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return 'invalid_email';
    const ok = await run(() => WishlistService.invite(wishlistId, trimmed), 'wishlist.toast.inviteFailed');
    if (ok) {
      setInviteSentTo(trimmed);
      await load();
    }
    return null;
  };

  const revokeInvitation = async (invitationId: string) => {
    const ok = await run(
      () => WishlistService.revokeInvitation(invitationId),
      'wishlist.toast.revokeFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.inviteRevoked'));
      await load();
    }
  };

  const removeOrganizer = async () => {
    if (!wishlistId) return;
    const ok = await run(
      () => WishlistService.removeOrganizer(wishlistId),
      'wishlist.toast.organizerRemoveFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.organizerRemoved'));
      await load();
    }
  };

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
    requests,
    pendingItemIds,
    organizerName,
    sheet,
    busy,
    inviteSentTo,
    openAdd: () => setSheet({ type: 'add' }),
    openItem: (itemId: string) => setSheet({ type: 'item', itemId }),
    openShare: () => setSheet({ type: 'share' }),
    openSettings: () => setSheet({ type: 'settings' }),
    closeSheet,
    addItem,
    saveItem,
    removeItem,
    withdrawRequest,
    invite,
    revokeInvitation,
    removeOrganizer,
    saveSettings,
    deleteList,
  };
};
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/Wishlist|problems"`
Expected: only the 2 baseline tsc errors; lint reports no new problem in `src/Wishlist` (the totals stay 4 errors / 9 warnings). If a `.select(...)` generic type complains about `GenericStringError`, keep the `as unknown as` casts shown; do not weaken other types.

- [ ] **Step 6: Commit**

```bash
git add src/integrations/supabase/types.ts src/Wishlist
git commit -m "feat(wishlist): owner service and hook (direct edits, requests, organizer)"
```

---

### Task 3: Shared components and copy

**Files:**
- Create: `src/components/gh/Chip.tsx`, `SwitchRow.tsx`, `ConfirmBlock.tsx`, `DangerButton.tsx`, `TextArea.tsx`
- Modify: `src/components/ResponsiveSheet.tsx` (add `showTitleOnMobile`)
- Modify: `src/locales/en.json`, `src/locales/sv.json` (new `wishlist` section)

**Interfaces:**
- Produces: `Chip({ selected?, onClick, children })`, `SwitchRow({ label, description?, checked, onChange })`, `ConfirmBlock({ question, context?, confirmLabel, cancelLabel, destructive?, loading?, onConfirm, onCancel })`, `DangerButton({ icon?, loading?, ...button props })`, `TextArea` (props like `TextField` plus `rows`), `ResponsiveSheet` with `showTitleOnMobile?: boolean`, and every `wishlist.*` translation key used by Tasks 4 and 5.

- [ ] **Step 1: Create the small components**

`src/components/gh/Chip.tsx`
```tsx
import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipProps {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** A rounded toggle for picking one value among a few. Selected = tint + check + aria-pressed. */
export const Chip = ({ selected = false, onClick, children }: ChipProps) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      'inline-flex min-h-[44px] items-center gap-1 rounded-gh-pill border px-4 text-[14px] font-semibold leading-5',
      'transition-colors active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
      selected
        ? 'border-transparent bg-gh-primary-tint text-gh-primary-strong'
        : 'border-gh-line-strong bg-gh-surface-200 text-gh-ink hover:bg-gh-surface-300',
    )}>
    {selected && <Check className="h-4 w-4" aria-hidden="true" />}
    {children}
  </button>
);
```

`src/components/gh/SwitchRow.tsx`
```tsx
import { cn } from '@/lib/utils';

interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** A full-width row that toggles as a whole. */
export const SwitchRow = ({ label, description, checked, onChange }: SwitchRowProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left">
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="text-[16px] font-semibold leading-6 text-gh-ink">{label}</span>
      {description && <span className="text-[13px] leading-[18px] text-gh-muted">{description}</span>}
    </span>
    <span
      aria-hidden="true"
      className={cn(
        'relative h-7 w-12 flex-none rounded-gh-pill transition-colors motion-reduce:transition-none',
        checked ? 'bg-gh-primary-strong' : 'bg-gh-line-strong',
      )}>
      <span
        className={cn(
          'absolute top-0.5 h-6 w-6 rounded-gh-pill bg-white shadow transition-transform motion-reduce:transition-none',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </span>
  </button>
);
```

`src/components/gh/DangerButton.tsx`
```tsx
import type { ButtonHTMLAttributes } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DangerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/** Destructive actions are rust, never the pastel accent: full width, at the bottom of a sheet. */
export const DangerButton = ({ loading, children, className, disabled, ...props }: DangerButtonProps) => (
  <Button
    type="button"
    variant="outline"
    disabled={disabled || loading}
    className={cn(
      'h-12 w-full gap-2 rounded-gh-md border-gh-danger bg-transparent text-[16px] font-semibold text-gh-danger hover:bg-gh-danger-bg hover:text-gh-danger',
      className,
    )}
    {...props}>
    {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
    {children}
  </Button>
);
```

`src/components/gh/ConfirmBlock.tsx`
```tsx
import { useId } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmBlockProps {
  question: string;
  context?: string;
  /** Names what happens: "Ta bort önskningen", never "OK". */
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** An inline confirming question at the bottom of a sheet, replacing its action row. */
export const ConfirmBlock = ({
  question,
  context,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmBlockProps) => {
  const questionId = useId();
  return (
    <div
      role="group"
      aria-labelledby={questionId}
      className={cn(
        'flex flex-col gap-3 rounded-gh-lg border p-4',
        destructive ? 'border-transparent bg-gh-danger-bg' : 'border-gh-line bg-gh-surface-300',
      )}>
      <div className="flex flex-col gap-1">
        <p id={questionId} className="text-[17px] font-semibold leading-[22px] text-gh-ink">
          {question}
        </p>
        {context && <p className="text-[14px] leading-5 text-gh-ink-2">{context}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          variant={destructive ? 'outline' : 'default'}
          className={cn(
            'h-12 w-full gap-2 rounded-gh-md text-[16px] font-semibold',
            destructive && 'border-gh-danger bg-gh-surface-200 text-gh-danger hover:bg-gh-surface-100 hover:text-gh-danger',
          )}>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="h-12 w-full rounded-gh-md text-[16px] font-semibold text-gh-ink">
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
};
```

`src/components/gh/TextArea.tsx`
```tsx
import { useId, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  help?: string;
  error?: string;
}

export const TextArea = ({ label, help, error, rows = 3, className, ...input }: TextAreaProps) => {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || help ? messageId : undefined}
        className={cn(
          'min-h-[48px] w-full resize-y rounded-gh-md border bg-gh-surface-300 px-3 py-3 text-[16px] leading-6 text-gh-ink outline-none',
          'placeholder:text-gh-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gh-focus-ring',
          error ? 'border-gh-danger' : 'border-gh-line-strong',
        )}
        {...input}
      />
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

- [ ] **Step 2: `ResponsiveSheet` shows its title on mobile when asked** (`src/components/ResponsiveSheet.tsx`)

The mobile sheet has no header; forms need a heading there. The giver page keeps its look (default `false`).

```bash
python3 -I - <<'EOF'
p='src/components/ResponsiveSheet.tsx'; s=open(p).read()
def swap(old,new):
    global s
    assert s.count(old)==1, old
    s=s.replace(old,new)
swap("  closeLabel: string;\n  children: ReactNode;\n}","  closeLabel: string;\n  /** Mobile has no header; forms show the title as a heading above the content. */\n  showTitleOnMobile?: boolean;\n  children: ReactNode;\n}")
swap("  closeLabel,\n  children,\n}: ResponsiveSheetProps)","  closeLabel,\n  showTitleOnMobile = false,\n  children,\n}: ResponsiveSheetProps)")
swap('            <div className="flex flex-col gap-4 px-4 pb-6 pt-2">{children}</div>',
'''            <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
              {showTitleOnMobile && (
                <div className="flex flex-col gap-1">
                  <h2 className="text-[22px] font-bold leading-7 text-gh-ink">{title}</h2>
                  {subtitle && <p className="text-[13px] leading-[18px] text-gh-muted">{subtitle}</p>}
                </div>
              )}
              {children}
            </div>''')
open(p,'w').write(s)
EOF
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"
```
Expected: `2` (baseline).

- [ ] **Step 3: Add the translations**

Write this script to the scratchpad and run it from the repo root (it replaces the `wishlist` key if it exists and keeps everything else):

```python
import json

en = {
  "loading": "Loading your wishlist",
  "organizerFallback": "the organizer",
  "shareButton": "Share",
  "settingsButton": "Settings",
  "addItem": "Add a wish",
  "sectionItems": "Wishes",
  "sectionRequests": "Your requests",
  "organizerLine": "{{name}} shares the list",
  "organizerLineHint": "{{name}} approves changes to your wishes",
  "organizerLinePending": "The invitation to {{email}} is waiting for an answer",
  "emptyTitle": "No wishes yet",
  "emptyText": "Add the first thing you wish for. If you paste a link we fill in the title and picture.",
  "pendingChip": "Waiting for approval",
  "prioShort": {"low": "Low priority", "medium": "Medium priority", "high": "High priority"},
  "form": {
    "addTitle": "Add a wish",
    "editTitle": "Change wish",
    "requestContext": "Sent to {{name}} for approval",
    "title": "Title",
    "titleAsk": "What do you wish for?",
    "titlePlaceholder": "For example a cast iron pan",
    "link": "Link",
    "linkHelp": "We fetch the title and picture from the link.",
    "linkLoading": "Fetching title and picture",
    "price": "Price",
    "description": "Description",
    "priority": "Priority",
    "optional": "(optional)",
    "prio": {"none": "None", "low": "Low", "medium": "Medium", "high": "High"},
    "giftCard": "Gift card or group gift",
    "giftCardHelp": "Several people can give, for example a gift card.",
    "claimCap": "Most people who can give",
    "claimCapHelp": "Leave empty for no limit.",
    "add": "Add wish",
    "save": "Save the change",
    "sendRequest": "Send the change to {{name}}",
    "remove": "Remove the wish",
    "requestRemove": "Ask {{name}} to remove the wish",
    "pendingNote": "You already asked for a change to this wish. Withdraw that request on the list to change it again.",
    "close": "Close",
    "errors": {
      "title_required": "Write what you wish for.",
      "title_too_long": "The title can be at most 200 characters.",
      "claim_cap_invalid": "Write a whole number from 1, or leave it empty."
    }
  },
  "confirm": {
    "removeQuestion": "Remove {{title}}?",
    "removeContext": "The wish disappears from the list.",
    "removeAction": "Remove the wish",
    "requestRemoveQuestion": "Ask {{name}} to remove {{title}}?",
    "requestRemoveContext": "It stays on the list until {{name}} has answered.",
    "requestRemoveAction": "Send the request",
    "cancel": "Cancel"
  },
  "request": {
    "editLead": "You asked for a change",
    "removeLead": "You asked to remove the wish",
    "pending": "Waiting for approval",
    "withdraw": "Withdraw the request",
    "applied": "The change is done",
    "kept": "{{name}} kept the wish as it was",
    "messageFrom": "Message from {{name}}",
    "emptyValue": "empty",
    "yes": "yes",
    "no": "no",
    "imageChanged": "new picture",
    "sent": "Sent {{date}}",
    "answered": "Answered {{date}}",
    "field": {
      "title": "Title",
      "description": "Description",
      "link": "Link",
      "image": "Picture",
      "price": "Price",
      "priority": "Priority",
      "giftcard": "Gift card",
      "claimCap": "Most who can give"
    }
  },
  "share": {
    "title": "Share the list",
    "inviteTitle": "Invite an organizer",
    "inviteLead": "An organizer shares the list for you and keeps track of who buys what. You don't see it, so the surprise stays.",
    "email": "The organizer's e-mail",
    "invite": "Invite an organizer",
    "sentTitle": "Invitation sent",
    "sentLead": "An e-mail with a link is on its way to {{email}}.",
    "sentNote": "Changed your mind? You can withdraw the invitation until it has been answered.",
    "done": "Done",
    "pendingTitle": "Waiting for an answer",
    "pendingText": "{{email}} has not answered yet.",
    "revoke": "Withdraw the invitation",
    "acceptedTitle": "{{name}} shares the list",
    "acceptedText": "{{name}} has the link and keeps track of the list. You never see the link or what is taken.",
    "removeOrganizer": "Remove the organizer",
    "removeQuestion": "Remove {{name}} as organizer?",
    "removeContext": "The link is turned off and the list stops being shared.",
    "removeAction": "Remove the organizer",
    "errors": {"invalid_email": "That does not look like an e-mail address. Write the whole address."}
  },
  "settingsSheet": {
    "title": "Settings",
    "listTitle": "Name of the list",
    "listDescription": "Description",
    "links": "Show links",
    "linksHelp": "Givers see the link to the shop.",
    "price": "Show price",
    "priceHelp": "Givers see the approximate price.",
    "priority": "Show priority",
    "priorityHelp": "Givers see what you want most.",
    "save": "Save the settings",
    "delete": "Delete the list",
    "deleteQuestion": "Delete {{title}}?",
    "deleteContext": "All wishes disappear. This cannot be undone.",
    "deleteAction": "Delete the list",
    "errors": {"title_required": "The list needs a name."}
  },
  "toast": {
    "loadFailed": "Could not load the list. Try again.",
    "listShared": "The list has been shared, so changes now go to the organizer. Try again.",
    "listChanged": "The list is no longer shared. Try again.",
    "requestPending": "You already have a request about this wish.",
    "itemGone": "That wish is gone.",
    "invitePending": "There is already an invitation for this list.",
    "addFailed": "Could not add the wish. Try again.",
    "added": "The wish is added",
    "requestFailed": "Could not send the request. Try again.",
    "requestSent": "The change is sent",
    "saveFailed": "Could not save the change. Try again.",
    "saved": "The change is saved",
    "removeFailed": "Could not remove the wish. Try again.",
    "requestRemoveSent": "The request is sent",
    "removed": "The wish is removed",
    "withdrawFailed": "Could not withdraw the request. Try again.",
    "requestWithdrawn": "The request is withdrawn",
    "inviteFailed": "Could not send the invitation. Try again.",
    "revokeFailed": "Could not withdraw the invitation. Try again.",
    "inviteRevoked": "The invitation is withdrawn",
    "organizerRemoveFailed": "Could not remove the organizer. Try again.",
    "organizerRemoved": "The organizer is removed",
    "settingsFailed": "Could not save the settings. Try again.",
    "settingsSaved": "The settings are saved",
    "deleteFailed": "Could not delete the list. Try again.",
    "listDeleted": "The list is deleted"
  }
}

sv = {
  "loading": "Laddar din önskelista",
  "organizerFallback": "arrangören",
  "shareButton": "Dela",
  "settingsButton": "Inställningar",
  "addItem": "Lägg till önskning",
  "sectionItems": "Önskningar",
  "sectionRequests": "Dina förfrågningar",
  "organizerLine": "{{name}} delar listan",
  "organizerLineHint": "Ändringar av dina önskningar godkänns av {{name}}",
  "organizerLinePending": "Inbjudan till {{email}} väntar på svar",
  "emptyTitle": "Inga önskningar än",
  "emptyText": "Lägg till det första du önskar dig. Klistrar du in en länk fyller vi i titel och bild.",
  "pendingChip": "Väntar på godkännande",
  "prioShort": {"low": "Prio låg", "medium": "Prio medel", "high": "Prio hög"},
  "form": {
    "addTitle": "Lägg till önskning",
    "editTitle": "Ändra önskning",
    "requestContext": "Skickas till {{name}} för godkännande",
    "title": "Titel",
    "titleAsk": "Vad önskar du dig?",
    "titlePlaceholder": "Till exempel en stekpanna",
    "link": "Länk",
    "linkHelp": "Vi hämtar titel och bild från länken.",
    "linkLoading": "Hämtar titel och bild",
    "price": "Pris",
    "description": "Beskrivning",
    "priority": "Prioritet",
    "optional": "(valfritt)",
    "prio": {"none": "Ingen", "low": "Låg", "medium": "Medel", "high": "Hög"},
    "giftCard": "Presentkort eller gruppresent",
    "giftCardHelp": "Flera kan ge, till exempel ett presentkort.",
    "claimCap": "Max antal som kan ge",
    "claimCapHelp": "Lämna tomt för ingen gräns.",
    "add": "Lägg till önskning",
    "save": "Spara ändringen",
    "sendRequest": "Skicka ändringen till {{name}}",
    "remove": "Ta bort önskningen",
    "requestRemove": "Be {{name}} ta bort önskningen",
    "pendingNote": "Du har redan bett om en ändring av den här önskningen. Ångra förfrågan på listan för att ändra igen.",
    "close": "Stäng",
    "errors": {
      "title_required": "Skriv vad du önskar dig.",
      "title_too_long": "Titeln får vara högst 200 tecken.",
      "claim_cap_invalid": "Skriv ett heltal från 1, eller lämna tomt."
    }
  },
  "confirm": {
    "removeQuestion": "Ta bort {{title}}?",
    "removeContext": "Önskningen försvinner från listan.",
    "removeAction": "Ta bort önskningen",
    "requestRemoveQuestion": "Be {{name}} ta bort {{title}}?",
    "requestRemoveContext": "Den ligger kvar på listan tills {{name}} har svarat.",
    "requestRemoveAction": "Skicka förfrågan",
    "cancel": "Avbryt"
  },
  "request": {
    "editLead": "Du har bett om en ändring",
    "removeLead": "Du har bett om att ta bort önskningen",
    "pending": "Väntar på godkännande",
    "withdraw": "Ångra förfrågan",
    "applied": "Ändringen är gjord",
    "kept": "{{name}} behöll önskningen som den var",
    "messageFrom": "Svar från {{name}}",
    "emptyValue": "tomt",
    "yes": "ja",
    "no": "nej",
    "imageChanged": "ny bild",
    "sent": "Skickad {{date}}",
    "answered": "Besvarad {{date}}",
    "field": {
      "title": "Titel",
      "description": "Beskrivning",
      "link": "Länk",
      "image": "Bild",
      "price": "Pris",
      "priority": "Prioritet",
      "giftcard": "Presentkort",
      "claimCap": "Max som kan ge"
    }
  },
  "share": {
    "title": "Dela listan",
    "inviteTitle": "Bjud in en arrangör",
    "inviteLead": "En arrangör delar listan åt dig och håller koll på vem som köper vad. Du slipper se det, så överraskningen finns kvar.",
    "email": "Arrangörens e-post",
    "invite": "Bjud in en arrangör",
    "sentTitle": "Inbjudan skickad",
    "sentLead": "Ett mejl med en länk är på väg till {{email}}.",
    "sentNote": "Ångrar du dig? Du kan dra tillbaka inbjudan tills den är besvarad.",
    "done": "Klar",
    "pendingTitle": "Väntar på svar",
    "pendingText": "{{email}} har inte svarat än.",
    "revoke": "Dra tillbaka inbjudan",
    "acceptedTitle": "{{name}} delar listan",
    "acceptedText": "{{name}} har länken och håller koll på listan. Du ser aldrig länken eller vad som är taget.",
    "removeOrganizer": "Ta bort arrangören",
    "removeQuestion": "Ta bort {{name}} som arrangör?",
    "removeContext": "Länken stängs av och listan slutar delas.",
    "removeAction": "Ta bort arrangören",
    "errors": {"invalid_email": "Det ser inte ut som en e-postadress. Skriv hela adressen."}
  },
  "settingsSheet": {
    "title": "Inställningar",
    "listTitle": "Namn på listan",
    "listDescription": "Beskrivning",
    "links": "Visa länkar",
    "linksHelp": "Givarna ser länken till butiken.",
    "price": "Visa pris",
    "priceHelp": "Givarna ser ungefärligt pris.",
    "priority": "Visa prioritet",
    "priorityHelp": "Givarna ser vad du vill ha mest.",
    "save": "Spara inställningarna",
    "delete": "Radera listan",
    "deleteQuestion": "Radera {{title}}?",
    "deleteContext": "Alla önskningar försvinner. Det går inte att ångra.",
    "deleteAction": "Radera listan",
    "errors": {"title_required": "Listan behöver ett namn."}
  },
  "toast": {
    "loadFailed": "Det gick inte att ladda listan. Försök igen.",
    "listShared": "Listan har delats, så ändringar går nu till arrangören. Försök igen.",
    "listChanged": "Listan delas inte längre. Försök igen.",
    "requestPending": "Du har redan en förfrågan om den här önskningen.",
    "itemGone": "Den önskningen finns inte längre.",
    "invitePending": "Det finns redan en inbjudan till den här listan.",
    "addFailed": "Det gick inte att lägga till önskningen. Försök igen.",
    "added": "Önskningen är tillagd",
    "requestFailed": "Det gick inte att skicka förfrågan. Försök igen.",
    "requestSent": "Ändringen är skickad",
    "saveFailed": "Det gick inte att spara ändringen. Försök igen.",
    "saved": "Ändringen är sparad",
    "removeFailed": "Det gick inte att ta bort önskningen. Försök igen.",
    "requestRemoveSent": "Förfrågan är skickad",
    "removed": "Önskningen är borttagen",
    "withdrawFailed": "Det gick inte att dra tillbaka förfrågan. Försök igen.",
    "requestWithdrawn": "Förfrågan är tillbakadragen",
    "inviteFailed": "Det gick inte att skicka inbjudan. Försök igen.",
    "revokeFailed": "Det gick inte att dra tillbaka inbjudan. Försök igen.",
    "inviteRevoked": "Inbjudan är tillbakadragen",
    "organizerRemoveFailed": "Det gick inte att ta bort arrangören. Försök igen.",
    "organizerRemoved": "Arrangören är borttagen",
    "settingsFailed": "Det gick inte att spara inställningarna. Försök igen.",
    "settingsSaved": "Inställningarna är sparade",
    "deleteFailed": "Det gick inte att radera listan. Försök igen.",
    "listDeleted": "Listan är raderad"
  }
}

for path, section in (("src/locales/en.json", en), ("src/locales/sv.json", sv)):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    data["wishlist"] = section
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
print("ok")
```

Run: `python3 -I /private/tmp/.../scratchpad/p4b-i18n.py` (write the script above to a file in the scratchpad first), then `git diff --stat src/locales` — Expected: only these two files, with additions only (a few hundred lines each) and no deletions. If `git diff` shows reformatting of untouched keys, restore the files and instead insert the section text by hand.

- [ ] **Step 4: Check key parity and static checks**

```bash
python3 -I - <<'EOF'
import json
def keys(d, p=''):
    out=set()
    for k,v in d.items():
        out |= keys(v,p+k+'.') if isinstance(v,dict) else {p+k}
    return out
en=json.load(open('src/locales/en.json'))['wishlist']; sv=json.load(open('src/locales/sv.json'))['wishlist']
print('only en:', sorted(keys(en)-keys(sv))); print('only sv:', sorted(keys(sv)-keys(en)))
EOF
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run build 2>&1 | tail -1
```
Expected: both "only" lists empty; `2`; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components src/locales
git commit -m "feat(ui): chip, switch row, confirm block, danger button, text area; wishlist copy"
```

---

### Task 4: Owner components

**Files:**
- Create: `src/Wishlist/components/WishlistLoading.tsx`, `RequestCard.tsx`, `ItemFormFields.tsx`, `ItemFormSheet.tsx`, `ShareSheet.tsx`, `SettingsSheet.tsx`, `OwnerWishlist.tsx`, `index.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–3 (`useOwnerWishlist` return value, `ResponsiveSheet` with `showTitleOnMobile`, `Chip`, `SwitchRow`, `ConfirmBlock`, `DangerButton`, `TextArea`, `TextField`, `EmptyState`, `ItemRow`, `SectionHeader`, `StatusPill`, `AppHeader`, `priorityName`).
- Produces: `OwnerWishlist({ wishlistId })` and `WishlistLoading` (exported from `components/index.ts`).

There is no component test harness in this repo: the logic these components lean on is covered in Task 1, and Task 5 verifies the screens in a browser. After each file, `tsc` must stay at its baseline.

- [ ] **Step 1: `WishlistLoading`** `src/Wishlist/components/WishlistLoading.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const WishlistLoading = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gh-bg">
      <div
        role="status"
        aria-label={t('wishlist.loading')}
        className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 pb-10 pt-8 md:px-8 md:pt-12">
        <div className="flex flex-col gap-3">
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

- [ ] **Step 2: `priorityName`** — add to `src/Wishlist/lib/itemForm.ts` (and its test, written first)

Append to `src/Wishlist/lib/itemForm.test.ts` (and add `priorityName` to its import list):

```ts
test('priorityName maps 1-3 to low, medium, high and anything else to null', () => {
  assert.equal(priorityName(1), 'low');
  assert.equal(priorityName(2), 'medium');
  assert.equal(priorityName(3), 'high');
  assert.equal(priorityName(null), null);
  assert.equal(priorityName(0), null);
});
```

Run `npm run test:unit 2>&1 | tail -6` — Expected: FAIL (`priorityName` is not exported). Then append to `src/Wishlist/lib/itemForm.ts`:

```ts
export const priorityName = (priority: number | null): 'low' | 'medium' | 'high' | null => {
  if (priority === 1) return 'low';
  if (priority === 2) return 'medium';
  if (priority === 3) return 'high';
  return null;
};
```

Run `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"` — Expected: all pass (48).

- [ ] **Step 3: `RequestCard`** `src/Wishlist/components/RequestCard.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/gh/StatusPill';
import { priorityName } from '../lib/itemForm';
import type { ChangedField, FieldValue, OwnerRequest } from '../types';

interface RequestCardProps {
  request: OwnerRequest;
  organizerName: string;
  busy: boolean;
  onWithdraw: (requestId: string) => void;
}

/** The owner's view of a change request: what was asked, then a neutral answer. */
export const RequestCard = ({ request, organizerName, busy, onWithdraw }: RequestCardProps) => {
  const { t, i18n } = useTranslation();

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

      {request.changes.length > 0 && (
        <dl className="flex flex-col gap-1">
          {request.changes.map((change) => (
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
      )}

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

- [ ] **Step 4: `ItemFormFields`** `src/Wishlist/components/ItemFormFields.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/gh/Chip';
import { SwitchRow } from '@/components/gh/SwitchRow';
import { TextArea } from '@/components/gh/TextArea';
import { TextField } from '@/components/gh/TextField';
import type { ItemFormData, ItemFormError } from '../types';

const PRIORITIES: { value: number | null; key: 'none' | 'low' | 'medium' | 'high' }[] = [
  { value: null, key: 'none' },
  { value: 1, key: 'low' },
  { value: 2, key: 'medium' },
  { value: 3, key: 'high' },
];

interface ItemFormFieldsProps {
  form: ItemFormData;
  mode: 'add' | 'edit';
  error: ItemFormError | null;
  resolving: boolean;
  onChange: (patch: Partial<ItemFormData>) => void;
  onLinkBlur: () => void;
}

/** Title first, everything else optional. Shared by adding and editing. */
export const ItemFormFields = ({ form, mode, error, resolving, onChange, onLinkBlur }: ItemFormFieldsProps) => {
  const { t } = useTranslation();
  const optional = t('wishlist.form.optional');
  const titleError =
    error === 'title_required' || error === 'title_too_long'
      ? t(`wishlist.form.errors.${error}`)
      : undefined;
  const capError = error === 'claim_cap_invalid' ? t('wishlist.form.errors.claim_cap_invalid') : undefined;

  return (
    <>
      <TextField
        label={mode === 'add' ? t('wishlist.form.titleAsk') : t('wishlist.form.title')}
        placeholder={mode === 'add' ? t('wishlist.form.titlePlaceholder') : undefined}
        value={form.title}
        onChange={(e) => onChange({ title: e.target.value })}
        error={titleError}
        autoComplete="off"
      />
      <TextField
        label={`${t('wishlist.form.link')} ${optional}`}
        inputMode="url"
        autoCapitalize="none"
        autoComplete="off"
        value={form.link}
        // A new link means a new picture: clear the old one so it is fetched again.
        onChange={(e) => onChange({ link: e.target.value, url: '' })}
        onBlur={onLinkBlur}
        help={resolving ? t('wishlist.form.linkLoading') : t('wishlist.form.linkHelp')}
      />
      <TextField
        label={`${t('wishlist.form.price')} ${optional}`}
        value={form.priceRange}
        onChange={(e) => onChange({ priceRange: e.target.value })}
        autoComplete="off"
      />
      <TextArea
        label={`${t('wishlist.form.description')} ${optional}`}
        value={form.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
          {t('wishlist.form.priority')} <span className="font-normal text-gh-muted">{optional}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map(({ value, key }) => (
            <Chip key={key} selected={form.priority === value} onClick={() => onChange({ priority: value })}>
              {t(`wishlist.form.prio.${key}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200">
        <SwitchRow
          label={t('wishlist.form.giftCard')}
          description={t('wishlist.form.giftCardHelp')}
          checked={form.isGiftcard}
          onChange={(checked) => onChange({ isGiftcard: checked, claimCap: checked ? form.claimCap : null })}
        />
      </div>
      {form.isGiftcard && (
        <TextField
          label={`${t('wishlist.form.claimCap')} ${optional}`}
          type="number"
          min={1}
          inputMode="numeric"
          value={form.claimCap ?? ''}
          onChange={(e) => onChange({ claimCap: e.target.value === '' ? null : Number(e.target.value) })}
          help={t('wishlist.form.claimCapHelp')}
          error={capError}
        />
      )}
    </>
  );
};
```

- [ ] **Step 5: `ItemFormSheet`** `src/Wishlist/components/ItemFormSheet.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { DangerButton } from '@/components/gh/DangerButton';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import { emptyItemForm, formFromItem } from '../lib/itemForm';
import { ItemFormFields } from './ItemFormFields';
import type { ItemFormData, ItemFormError, OwnerItem } from '../types';

interface ItemFormSheetProps {
  mode: 'add' | 'edit';
  /** The item being edited. */
  item?: OwnerItem;
  /** The list is shared: edits and removals become requests. */
  shared: boolean;
  organizerName: string | null;
  /** This item already has an open request. */
  pending: boolean;
  listTitle: string;
  busy: boolean;
  onSubmit: (form: ItemFormData) => Promise<ItemFormError | null>;
  onRemove: () => void;
  onClose: () => void;
}

/** Mount with a `key` so every open starts from a fresh form. */
export const ItemFormSheet = ({
  mode,
  item,
  shared,
  organizerName,
  pending,
  listTitle,
  busy,
  onSubmit,
  onRemove,
  onClose,
}: ItemFormSheetProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<ItemFormData>(() =>
    mode === 'edit' && item ? formFromItem(item) : emptyItemForm(),
  );
  const [error, setError] = useState<ItemFormError | null>(null);
  const [resolving, setResolving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const asking = shared && mode === 'edit';
  const name = organizerName ?? t('wishlist.organizerFallback');

  const change = (patch: Partial<ItemFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  /** Pasting a link fills the title (if empty) and the picture. */
  const resolveLink = async () => {
    const link = form.link.trim();
    if (!link || form.url) return;
    setResolving(true);
    const metadata = await fetchLinkMetadata(link);
    setResolving(false);
    if (!metadata) return;
    setForm((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : (metadata.title ?? prev.title),
      url: prev.url || (metadata.image ?? ''),
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(await onSubmit(form));
  };

  const primaryLabel =
    mode === 'add'
      ? t('wishlist.form.add')
      : asking
        ? t('wishlist.form.sendRequest', { name })
        : t('wishlist.form.save');

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={mode === 'add' ? t('wishlist.form.addTitle') : t('wishlist.form.editTitle')}
      subtitle={asking ? t('wishlist.form.requestContext', { name }) : listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      {pending ? (
        <>
          <p className="text-[16px] leading-6 text-gh-ink-2">{t('wishlist.form.pendingNote')}</p>
          <Button type="button" variant="outline" onClick={onClose} className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
            {t('wishlist.form.close')}
          </Button>
        </>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <ItemFormFields
            form={form}
            mode={mode}
            error={error}
            resolving={resolving}
            onChange={change}
            onLinkBlur={resolveLink}
          />
          {confirmingRemove ? (
            <ConfirmBlock
              destructive
              question={
                shared
                  ? t('wishlist.confirm.requestRemoveQuestion', { name, title: item?.title })
                  : t('wishlist.confirm.removeQuestion', { title: item?.title })
              }
              context={
                shared
                  ? t('wishlist.confirm.requestRemoveContext', { name })
                  : t('wishlist.confirm.removeContext')
              }
              confirmLabel={shared ? t('wishlist.confirm.requestRemoveAction') : t('wishlist.confirm.removeAction')}
              cancelLabel={t('wishlist.confirm.cancel')}
              loading={busy}
              onConfirm={onRemove}
              onCancel={() => setConfirmingRemove(false)}
            />
          ) : (
            <>
              <Button type="submit" disabled={busy} className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
                {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
                {primaryLabel}
              </Button>
              {mode === 'edit' && (
                <DangerButton onClick={() => setConfirmingRemove(true)}>
                  {shared ? t('wishlist.form.requestRemove', { name }) : t('wishlist.form.remove')}
                </DangerButton>
              )}
            </>
          )}
        </form>
      )}
    </ResponsiveSheet>
  );
};
```

- [ ] **Step 6: `ShareSheet`** `src/Wishlist/components/ShareSheet.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Loader2, MailCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { DangerButton } from '@/components/gh/DangerButton';
import { TextField } from '@/components/gh/TextField';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import type { OrganizerState } from '../types';

interface ShareSheetProps {
  organizer: OrganizerState;
  organizerName: string | null;
  inviteSentTo: string | null;
  listTitle: string;
  busy: boolean;
  onInvite: (email: string) => Promise<'invalid_email' | null>;
  onRevoke: (invitationId: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

/** Dela means: invite an organizer who shares the list for you. The owner never sees a link. */
export const ShareSheet = ({
  organizer,
  organizerName,
  inviteSentTo,
  listTitle,
  busy,
  onInvite,
  onRevoke,
  onRemove,
  onClose,
}: ShareSheetProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setEmailError((await onInvite(email)) === 'invalid_email');
  };

  const done = (
    <Button type="button" variant="outline" onClick={onClose} className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
      {t('wishlist.share.done')}
    </Button>
  );

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('wishlist.share.title')}
      subtitle={listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      {inviteSentTo ? (
        <>
          <div className="flex flex-col items-center gap-2 py-4 text-center text-gh-ink">
            <MailCheck
              className="h-12 w-12 text-gh-primary-strong duration-300 animate-in zoom-in-90 motion-reduce:animate-none"
              aria-hidden="true"
            />
            <h3 className="mt-2 text-[22px] font-bold leading-7">{t('wishlist.share.sentTitle')}</h3>
            <p className="text-[16px] leading-6 text-gh-ink-2">
              {t('wishlist.share.sentLead', { email: inviteSentTo })}
            </p>
            <p className="text-[13px] leading-[18px] text-gh-muted">{t('wishlist.share.sentNote')}</p>
          </div>
          {done}
        </>
      ) : organizer.kind === 'none' ? (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <h3 className="text-[18px] font-bold leading-6 text-gh-ink">{t('wishlist.share.inviteTitle')}</h3>
            <p className="text-[16px] leading-6 text-gh-ink-2">{t('wishlist.share.inviteLead')}</p>
          </div>
          <TextField
            label={t('wishlist.share.email')}
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(false);
            }}
            error={emailError ? t('wishlist.share.errors.invalid_email') : undefined}
          />
          <Button type="submit" disabled={busy} className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('wishlist.share.invite')}
          </Button>
        </form>
      ) : organizer.kind === 'pending' ? (
        <>
          <div className="flex items-start gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
            <Clock className="mt-0.5 h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{t('wishlist.share.pendingTitle')}</h3>
              <p className="text-[14px] leading-5 text-gh-ink-2">
                {t('wishlist.share.pendingText', { email: organizer.email })}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onRevoke(organizer.invitationId)}
            className="h-12 w-full rounded-gh-md text-[16px] font-semibold">
            {t('wishlist.share.revoke')}
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
            <Users className="mt-0.5 h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">
                {t('wishlist.share.acceptedTitle', { name: organizerName })}
              </h3>
              <p className="text-[14px] leading-5 text-gh-ink-2">
                {t('wishlist.share.acceptedText', { name: organizerName })}
              </p>
            </div>
          </div>
          {confirmingRemove ? (
            <ConfirmBlock
              destructive
              question={t('wishlist.share.removeQuestion', { name: organizerName })}
              context={t('wishlist.share.removeContext')}
              confirmLabel={t('wishlist.share.removeAction')}
              cancelLabel={t('wishlist.confirm.cancel')}
              loading={busy}
              onConfirm={onRemove}
              onCancel={() => setConfirmingRemove(false)}
            />
          ) : (
            <DangerButton onClick={() => setConfirmingRemove(true)}>
              {t('wishlist.share.removeOrganizer')}
            </DangerButton>
          )}
        </>
      )}
    </ResponsiveSheet>
  );
};
```

- [ ] **Step 7: `SettingsSheet`** `src/Wishlist/components/SettingsSheet.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { DangerButton } from '@/components/gh/DangerButton';
import { SwitchRow } from '@/components/gh/SwitchRow';
import { TextArea } from '@/components/gh/TextArea';
import { TextField } from '@/components/gh/TextField';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import type { SettingsValues, Wishlist } from '../types';

interface SettingsSheetProps {
  wishlist: Wishlist;
  busy: boolean;
  onSave: (values: SettingsValues) => Promise<'title_required' | null>;
  onDelete: () => void;
  onClose: () => void;
}

export const SettingsSheet = ({ wishlist, busy, onSave, onDelete, onClose }: SettingsSheetProps) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<SettingsValues>({
    title: wishlist.title,
    description: wishlist.description ?? '',
    enableLinks: wishlist.enable_links,
    enablePrice: wishlist.enable_price,
    enablePriority: wishlist.enable_priority,
  });
  const [titleError, setTitleError] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTitleError((await onSave(values)) === 'title_required');
  };

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('wishlist.settingsSheet.title')}
      subtitle={wishlist.title}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField
          label={t('wishlist.settingsSheet.listTitle')}
          value={values.title}
          onChange={(e) => {
            setValues({ ...values, title: e.target.value });
            setTitleError(false);
          }}
          error={titleError ? t('wishlist.settingsSheet.errors.title_required') : undefined}
          autoComplete="off"
        />
        <TextArea
          label={`${t('wishlist.settingsSheet.listDescription')} ${t('wishlist.form.optional')}`}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
        />
        <div className="divide-y divide-gh-line overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200">
          <SwitchRow
            label={t('wishlist.settingsSheet.links')}
            description={t('wishlist.settingsSheet.linksHelp')}
            checked={values.enableLinks}
            onChange={(enableLinks) => setValues({ ...values, enableLinks })}
          />
          <SwitchRow
            label={t('wishlist.settingsSheet.price')}
            description={t('wishlist.settingsSheet.priceHelp')}
            checked={values.enablePrice}
            onChange={(enablePrice) => setValues({ ...values, enablePrice })}
          />
          <SwitchRow
            label={t('wishlist.settingsSheet.priority')}
            description={t('wishlist.settingsSheet.priorityHelp')}
            checked={values.enablePriority}
            onChange={(enablePriority) => setValues({ ...values, enablePriority })}
          />
        </div>
        {confirmingDelete ? (
          <ConfirmBlock
            destructive
            question={t('wishlist.settingsSheet.deleteQuestion', { title: wishlist.title })}
            context={t('wishlist.settingsSheet.deleteContext')}
            confirmLabel={t('wishlist.settingsSheet.deleteAction')}
            cancelLabel={t('wishlist.confirm.cancel')}
            loading={busy}
            onConfirm={onDelete}
            onCancel={() => setConfirmingDelete(false)}
          />
        ) : (
          <>
            <Button type="submit" disabled={busy} className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
              {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
              {t('wishlist.settingsSheet.save')}
            </Button>
            <DangerButton onClick={() => setConfirmingDelete(true)}>{t('wishlist.settingsSheet.delete')}</DangerButton>
          </>
        )}
      </form>
    </ResponsiveSheet>
  );
};
```

- [ ] **Step 8: `OwnerWishlist`** `src/Wishlist/components/OwnerWishlist.tsx` and `src/Wishlist/components/index.ts`

```tsx
import { useTranslation } from 'react-i18next';
import { Gift, Plus, Settings, Share2, Users } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import { ItemRow } from '@/components/gh/ItemRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { useOwnerWishlist } from '../hooks/useOwnerWishlist';
import { priorityName } from '../lib/itemForm';
import { ItemFormSheet } from './ItemFormSheet';
import { RequestCard } from './RequestCard';
import { SettingsSheet } from './SettingsSheet';
import { ShareSheet } from './ShareSheet';
import { WishlistLoading } from './WishlistLoading';

interface OwnerWishlistProps {
  wishlistId: string;
}

export const OwnerWishlist = ({ wishlistId }: OwnerWishlistProps) => {
  const { t } = useTranslation();
  const wishlist = useOwnerWishlist(wishlistId);
  const { data, loading, sheet, busy } = wishlist;

  if (loading) return <WishlistLoading />;
  if (!data) {
    return (
      <div className="min-h-screen bg-gh-bg text-gh-ink">
        <AppHeader />
        <EmptyState icon={Gift} size="screen" title={t('wishlist.toast.loadFailed')} />
      </div>
    );
  }

  const { items, organizer, shared } = data;
  const list = data.wishlist;
  const selectedItem = sheet?.type === 'item' ? items.find((i) => i.id === sheet.itemId) : undefined;
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
          </div>
        </header>

        {organizer.kind !== 'none' && (
          <div className="flex items-start gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
            <Users className="mt-0.5 h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              {organizer.kind === 'accepted' ? (
                <>
                  <p className="text-[16px] font-semibold leading-6 text-gh-ink">
                    {t('wishlist.organizerLine', { name: wishlist.organizerName })}
                  </p>
                  <p className="text-[13px] leading-[18px] text-gh-muted">
                    {t('wishlist.organizerLineHint', { name: wishlist.organizerName })}
                  </p>
                </>
              ) : (
                <p className="text-[16px] leading-6 text-gh-ink">
                  {t('wishlist.organizerLinePending', { email: organizer.email })}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="md:hidden">{addButton('w-full')}</div>

        {wishlist.requests.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeader title={t('wishlist.sectionRequests')} count={wishlist.requests.length} />
            <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
              {wishlist.requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  organizerName={wishlist.organizerName ?? t('wishlist.organizerFallback')}
                  busy={busy}
                  onWithdraw={wishlist.withdrawRequest}
                />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <SectionHeader title={t('wishlist.sectionItems')} count={items.length} />
          {items.length === 0 ? (
            <EmptyState
              icon={Gift}
              title={t('wishlist.emptyTitle')}
              text={t('wishlist.emptyText')}
              action={addButton('')}
            />
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
              {items.map((item) => (
                <li key={item.id}>
                  <ItemRow
                    title={item.title}
                    image={item.url}
                    meta={meta(item.price_range, item.priority)}
                    status={
                      wishlist.pendingItemIds.has(item.id)
                        ? { kind: 'pending', label: t('wishlist.pendingChip') }
                        : undefined
                    }
                    giftCardLabel={item.is_giftcard ? t('publicWishlist.giftCardBadge') : undefined}
                    onClick={() => wishlist.openItem(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {sheet?.type === 'add' && (
        <ItemFormSheet
          key="add"
          mode="add"
          shared={shared}
          organizerName={wishlist.organizerName}
          pending={false}
          listTitle={list.title}
          busy={busy}
          onSubmit={wishlist.addItem}
          onRemove={() => undefined}
          onClose={wishlist.closeSheet}
        />
      )}
      {selectedItem && (
        <ItemFormSheet
          key={selectedItem.id}
          mode="edit"
          item={selectedItem}
          shared={shared}
          organizerName={wishlist.organizerName}
          pending={wishlist.pendingItemIds.has(selectedItem.id)}
          listTitle={list.title}
          busy={busy}
          onSubmit={(form) => wishlist.saveItem(selectedItem, form)}
          onRemove={() => wishlist.removeItem(selectedItem)}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'share' && (
        <ShareSheet
          organizer={organizer}
          organizerName={wishlist.organizerName}
          inviteSentTo={wishlist.inviteSentTo}
          listTitle={list.title}
          busy={busy}
          onInvite={wishlist.invite}
          onRevoke={wishlist.revokeInvitation}
          onRemove={wishlist.removeOrganizer}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'settings' && (
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

`src/Wishlist/components/index.ts`
```ts
export { OwnerWishlist } from './OwnerWishlist';
export { WishlistLoading } from './WishlistLoading';
```

- [ ] **Step 9: Static checks and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/Wishlist|problems"; npm run build 2>&1 | tail -1`
Expected: only the 2 baseline tsc errors; no new lint problem in `src/Wishlist` (totals stay 4/9); build succeeds. Fix anything new that shows (typical: an unused import, a `GenericStringError` cast).

```bash
git add src/Wishlist
git commit -m "feat(wishlist): owner screen components (list, item form, share, settings, requests)"
```

---

### Task 5: Route, redirects, cleanup and browser verification

**Files:**
- Create: `src/Wishlist/index.tsx`, `src/Wishlist/README.md`
- Modify: `src/App.tsx`, `src/Dashboard/components/MyWishlistsSection.tsx`, `src/SelfManagedWishlist/index.tsx`, `CLAUDE.md`, `src/Dashboard/README.md` (if it names the old route)
- Move: `src/ManageWishlist/components/AddItemDialog.tsx` → `src/SelfManagedWishlist/components/AddItemDialog.tsx`
- Delete: the rest of `src/ManageWishlist/`

**Interfaces:**
- Consumes: `OwnerWishlist`, `WishlistLoading` (Task 4), `WishlistService.loadWishlist` / `isOrganizer`, `resolveMode`, `modePath` (Tasks 1–2).
- Produces: default export `Wishlist` (the `/wishlist/:id` route) and named export `ManageRedirect` (the `/wishlist/:id/manage` route).

- [ ] **Step 1: The route entry** `src/Wishlist/index.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/useAuth';
import { OwnerWishlist, WishlistLoading } from './components';
import { modePath, resolveMode } from './lib/mode';
import { WishlistService } from './services/WishlistService';
import type { Mode } from './types';

/**
 * One address for a wishlist, whoever opens it. Owners get the owner screen;
 * until phase 4c organizers and self-managed owners are sent on to the screens
 * that still serve them, and everyone else goes Home.
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
  return <Navigate to={modePath(mode, id)} replace />;
};

/** Old bookmarks of /wishlist/:id/manage land on the new address. */
export const ManageRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/wishlist/${id}` : '/'} replace />;
};

export default Wishlist;
```

`src/Wishlist/README.md`
```markdown
# Wishlist

The wishlist screen at `/wishlist/:id` (spec: `docs/superpowers/specs/2026-10-20-ui-redesign-design.md`).

## What it does
- `index.tsx` finds the viewer's role (`lib/mode.ts`). **Owner** gets `components/OwnerWishlist`. Organizers and self-managed owners are redirected to `/wishlist/:id/admin` and `/wishlist/:id/self` until phase 4c; everyone else goes Home.
- Owner mode: add, edit and delete items; invite and follow an organizer (the owner never sees the share link or anything about what is taken); list settings; and, once the list is shared, change requests.
- While the list is unshared, item edits go straight to the database. Once an active share link exists the database refuses direct updates and deletes (phase 4a), so edits and removals are sent through `request_item_change` and answered by the organizer (neutral answers: "Ändringen är gjord" / "behöll önskningen som den var").

## Structure
- `lib/` – pure logic with unit tests (`npm run test:unit`): form → row, proposals, request view-model, role → mode
- `services/WishlistService.ts` – all Supabase calls
- `hooks/useOwnerWishlist.ts` – state and actions
- `components/` – the screen, the item form sheet, share (invite organizer) sheet, settings sheet, request card

## Design
Approved canvas: https://claude.ai/artifact/VEUdZk5qZ1d8iGL8s3Udkp. Design system: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu.
```

- [ ] **Step 2: Routes and the Dashboard link**

```bash
python3 -I - <<'EOF'
def edit(path, pairs):
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (path, old)
        s = s.replace(old, new)
    open(path, 'w').write(s)

edit('src/App.tsx', [
    ("import ManageWishlist from './ManageWishlist';", "import Wishlist, { ManageRedirect } from './Wishlist';"),
    ("""                <Route
                  path="/wishlist/:id/manage"
                  element={<ManageWishlist />}
                />""",
     """                <Route path="/wishlist/:id" element={<Wishlist />} />
                <Route path="/wishlist/:id/manage" element={<ManageRedirect />} />"""),
])
edit('src/Dashboard/components/MyWishlistsSection.tsx', [
    (": `/wishlist/${wishlist.id}/manage`", ": `/wishlist/${wishlist.id}`"),
])
EOF
git diff --stat src/App.tsx src/Dashboard/components/MyWishlistsSection.tsx
```
Expected: both files changed by a few lines.

- [ ] **Step 3: Retire `ManageWishlist`** (keep what `SelfManagedWishlist` still imports)

`SelfManagedWishlist` reuses `AddItemDialog`. Move it, then delete the rest:

```bash
mkdir -p src/SelfManagedWishlist/components
git mv src/ManageWishlist/components/AddItemDialog.tsx src/SelfManagedWishlist/components/AddItemDialog.tsx
grep -n "from '\.\|from '@/ManageWishlist" src/SelfManagedWishlist/components/AddItemDialog.tsx
grep -n "AddItemDialog" src/SelfManagedWishlist/index.tsx
```
Then:
1. In `src/SelfManagedWishlist/index.tsx` change the import (line ~19) to `import { AddItemDialog } from './components/AddItemDialog';` and drop the comment above it that says it is reused from ManageWishlist.
2. In the moved `AddItemDialog.tsx`, every import that pointed into `ManageWishlist` (typically `ItemFormData` from `'../types'`) must point at a type in `src/SelfManagedWishlist/types/index.ts`. If `ItemFormData` is not already exported there, add exactly the interface the dialog and `SelfManagedWishlist` pass around (copy it from `src/ManageWishlist/types.ts`: `title, description, link, url?, priceRange, priority: number | null, isGiftcard, claimCap: number | null`) and import it from there.
3. `git rm -r src/ManageWishlist` (everything that is left).
4. `grep -rn "ManageWishlist" src` must now show nothing except `src/locales` keys and READMEs; fix any import it finds.

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200; npm run build 2>&1 | tail -1`
Expected: only the 2 baseline tsc errors; build succeeds. Locale keys of the old dialogs (`manageWishlist.*`, `addItemDialog.*`, `editLimitedDialog.*`, …) stay: some are still used by the old admin and self-managed screens; pruning them is a later cleanup.

- [ ] **Step 4: Docs**

```bash
python3 -I - <<'EOF'
p = 'CLAUDE.md'
s = open(p).read()
old = "`ManageWishlist` (owner editing items)"
assert s.count(old) == 1
s = s.replace(old, "`Wishlist` (`/wishlist/:id`, owner mode; organizer mode follows in phase 4c)")
open(p, 'w').write(s)
EOF
grep -n "manage" src/Dashboard/README.md
```
If the Dashboard README names `/wishlist/:id/manage`, change it to `/wishlist/:id`.

- [ ] **Step 5: Commit the integration**

```bash
git add -A src CLAUDE.md
git status --short | head -20
git commit -m "feat(wishlist): /wishlist/:id owner screen, redirects, retire ManageWishlist"
```
(`git add -A src CLAUDE.md` is deliberate here: it stages the deletions and the move. `git status` must show nothing outside `src/`, `CLAUDE.md`.)

- [ ] **Step 6: Seed the local database** (it is empty after the last `db reset`)

```bash
npx supabase status >/dev/null 2>&1 || npx supabase start
KEY=$(npx supabase status -o env 2>/dev/null | grep '^SERVICE_ROLE_KEY=' | cut -d'"' -f2)
for u in anna erik stranger; do
  curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H 'Content-Type: application/json' -d "{\"email\":\"$u@e2e.se\",\"password\":\"Passw0rd!\",\"email_confirm\":true}" | head -c 60; echo
done
docker exec -i supabase_db_pjiofxvhzcengexymoms psql -U postgres <<'SQL'
update profiles set full_name = case email when 'anna@e2e.se' then 'Anna Lind' when 'erik@e2e.se' then 'Erik Berg' else 'Sam Främling' end;
-- A shared list (active link) organized by Erik
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
         ('Ullsockor, storlek 38–40',null,'ca 150 kr',2,null,false,null)) v(t,d,p,pr,l,g,c)
where w.title = 'Annas 35-årsdag';
insert into share_links (wishlist_id, token, created_by)
select w.id, 'e2e-token', p.id from wishlists w, profiles p where w.title = 'Annas 35-årsdag' and p.email = 'erik@e2e.se';
-- An unshared list
with o as (select id from profiles where email='anna@e2e.se'),
     w as (insert into wishlists (title, description, creator_id) select 'Annas jul', 'Julklappar', id from o returning id)
insert into wishlist_items (wishlist_id, title, price_range, priority)
select w.id, v.t, v.p, v.pr from w, (values ('Pepparkaksform','ca 80 kr',1),('Adventsljusstake','ca 300 kr',2)) v(t,p,pr);
-- A self-managed list of Erik's
with e as (select id from profiles where email='erik@e2e.se'),
     w as (insert into wishlists (title, creator_id, is_self_managed) select 'Eriks egen lista', id, true from e returning id, creator_id)
insert into wishlist_admins (wishlist_id, admin_id, invited_by) select id, creator_id, creator_id from w;
select id, title, is_self_managed from wishlists order by title;
SQL
```
Expected: three user JSON snippets, then three list rows. Keep the ids for the next step.

- [ ] **Step 7: Browser verification** (Chrome DevTools MCP, local Supabase, `npm run dev` in this worktree; one isolated context per user; password `Passw0rd!`)

Check each, reading the result, and screenshot at 390×844 light, 390×844 dark, 1280×900 light for items 1, 2 and 6, comparing with the approved canvas:

1. **Unshared list as Anna** (`/wishlist/<Annas jul id>`): header, "Dela", gear, full-width primary "Lägg till önskning" on mobile (in the header on desktop), two rows with price · priority, no "Dina förfrågningar", no organizer line.
2. **Add**: open "Lägg till önskning", submit empty → inline "Skriv vad du önskar dig." and no network request; write a title, press the button → toast "Önskningen är tillagd", the sheet closes, the row is there. Add one with a link to a made-up shop (e.g. `lekia.se/x`): it saves (the picture may not resolve locally; the page must not break).
3. **Edit and delete** on the unshared list: edit a price → saved; open an item → "Ta bort önskningen" → the inline "Ta bort …?" block replaces the buttons → confirm → the row is gone. Gift card switch on, cap `0` → inline cap error; cap `3` → saves; switch off again → saves with no cap (check with `select title, is_giftcard, claim_cap from wishlist_items`).
4. **Settings**: toggle "Visa pris", edit the title, save → the heading changes. "Radera listan" → inline confirm → Cancel keeps the list. (Do not delete.)
5. **Dela** on the unshared list: invalid e-mail → inline error; `erik@e2e.se` → "Inbjudan skickad" receipt → "Klar" → reopen Dela → "Väntar på svar" with the address and the page shows "Inbjudan till … väntar på svar" → "Dra tillbaka inbjudan" → back to the invite form.
6. **Shared list as Anna** (`Annas 35-årsdag`; its active link makes it shared): the organizer line "Erik Berg delar listan"; edit Trädgårdssax price to `ca 300 kr` → the sheet's primary reads "Skicka ändringen till Erik Berg", subtitle "Skickas till Erik Berg för godkännande"; submit → toast "Ändringen är skickad", the row shows "Väntar på godkännande", "Dina förfrågningar" shows the card `Pris  ca 250 kr → ca 300 kr`. Open the same item again → the pending note and only "Stäng". Withdraw the request on the card → chip and card gone. Submit an edit with no real change → the sheet just closes, no request row (`select count(*) from item_change_requests`). Ask to remove Stekpanna → inline "Be Erik Berg ta bort …?" → "Skicka förfrågan" → the card says "Du har bett om att ta bort önskningen".
7. **Direct write is refused, and a stale sheet recovers**: in Anna's context run a `fetch` PATCH on a shared item (as in phase 4a) → `[]`, and the DB row is unchanged. Then open the edit sheet of a shared item, turn the link off in SQL (`update share_links set is_active=false`), submit a changed price → toast "Listan delas inte längre. Försök igen." and the screen reloads into direct mode; turn the link on again (`is_active=true`).
8. **Neutral answers**: as Erik (psql, rolled in one transaction each):
   ```bash
   ERIK=$(docker exec supabase_db_pjiofxvhzcengexymoms psql -U postgres -Atc "select id from profiles where email='erik@e2e.se'")
   docker exec -i supabase_db_pjiofxvhzcengexymoms psql -U postgres <<SQL
   begin;
   set local request.jwt.claims = '{"sub":"$ERIK","email":"erik@e2e.se","role":"authenticated"}';
   set local role authenticated;
   select public.resolve_change_request(id, true, null) from item_change_requests where status='pending' and kind='edit';
   select public.resolve_change_request(id, false, 'Jag behåller den tills vidare.') from item_change_requests where status='pending' and kind='remove';
   commit;
   SQL
   ```
   (Create one pending edit and one pending remove first.) Reload as Anna: the edit card says "Ändringen är gjord" and the item has the new price; the remove card says "Erik Berg behöll önskningen som den var" with "Svar från Erik Berg" and the message; the item is still on the list. Nothing anywhere says taken or claimed.
9. **Roles and redirects**: Erik opens `/wishlist/<shared id>` → lands on `/wishlist/<id>/admin`. Erik opens `/wishlist/<his self-managed id>` → `/self`. Stranger opens either → Home (`/`). Anna opens `/wishlist/<shared id>/manage` → `/wishlist/<shared id>`. Anna on the Dashboard clicks her list → `/wishlist/<id>` (the self-managed list still goes to `/self`).
10. **English and dark**: switch language to English: every string on the screen and in each sheet is English (no raw `wishlist.…` keys); dark theme looks like the canvas.
11. **Keyboard and focus**: Tab through the list page, open a sheet with Enter, Escape closes it, focus returns to the row (desktop panel).
12. **Console and network**: no console errors (a Radix `DialogTitle` warning from old dialogs elsewhere is not from this screen); no 4xx on `wishlist_items`, `item_change_requests` or RPC calls other than the deliberate direct-write probe.

Record anything that does not match as a defect and fix it (TDD where the defect is in `lib/`) before moving on.

- [ ] **Step 8: Full checks**

```bash
npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"
npm run lint 2>&1 | grep problems
npm run build 2>&1 | tail -1
npm run test:db 2>&1 | grep -E "Failed|Result|Files="
```
Expected: 48 unit tests pass; `2`; `13 problems (4 errors, 9 warnings)`; build succeeds; db tests pass (19 files, 199 tests — no database change in this phase).

- [ ] **Step 9: Commit any fixes**

```bash
git add -A src
git commit -m "fix(wishlist): defects found in browser verification"
```
(Skip when there were none.)
