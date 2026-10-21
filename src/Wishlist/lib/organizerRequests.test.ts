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
