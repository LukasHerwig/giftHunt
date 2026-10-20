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
