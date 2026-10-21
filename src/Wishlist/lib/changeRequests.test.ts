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
