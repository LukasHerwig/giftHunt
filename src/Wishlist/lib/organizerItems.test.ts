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

test('a gift card with a stale taken flag follows its claims, like the giver page does', () => {
  assert.equal(isItemTaken(item({ is_giftcard: true, claim_cap: 5, is_taken: true }), 2), false);
  assert.equal(isItemTaken(item({ is_giftcard: true, claim_cap: 2, is_taken: true }), 2), true);
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
