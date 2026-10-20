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
