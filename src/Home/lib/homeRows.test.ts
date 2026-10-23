import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  displayName,
  firstName,
  toArchivedRows,
  toInvitationRows,
  toOrganizedRows,
  toOwnedRows,
  withoutOwnLists,
} from './homeRows.ts';
import type { InvitationRaw, OrganizedListRaw, OwnedListRaw } from '../types/index.ts';

test('displayName prefers the full name, falls back to the e-mail, then null', () => {
  assert.equal(displayName({ full_name: ' Erik Berg ', email: 'e@x.se' }), 'Erik Berg');
  assert.equal(displayName({ full_name: '  ', email: 'e@x.se' }), 'e@x.se');
  assert.equal(displayName({ full_name: null, email: null }), null);
  assert.equal(displayName(null), null);
});

test('firstName is the first word of the full name', () => {
  assert.equal(firstName('Erik Berg'), 'Erik');
  assert.equal(firstName('  Maria  '), 'Maria');
  assert.equal(firstName(''), null);
  assert.equal(firstName(undefined), null);
});

const owned = (over: Partial<OwnedListRaw> = {}): OwnedListRaw => ({
  id: 'w1',
  title: 'Eriks födelsedag',
  description: null,
  is_self_managed: false,
  created_at: '2026-10-01T00:00:00Z',
  itemCount: 8,
  organizer: null,
  archived_at: null,
  ...over,
});

test('an owned list names its organizer', () => {
  const [row] = toOwnedRows([owned({ organizer: { full_name: 'Lina Ek', email: 'l@x.se' } })]);
  assert.deepEqual(row, { id: 'w1', title: 'Eriks födelsedag', itemCount: 8, organizerName: 'Lina Ek', selfManaged: false });
});

test('a self-managed list never names an organizer (it is the viewer)', () => {
  const [row] = toOwnedRows([
    owned({ is_self_managed: true, organizer: { full_name: 'Erik Berg', email: 'e@x.se' } }),
  ]);
  assert.equal(row.selfManaged, true);
  assert.equal(row.organizerName, null);
});

test('owned lists keep their order', () => {
  const rows = toOwnedRows([owned({ id: 'a' }), owned({ id: 'b' })]);
  assert.deepEqual(rows.map((r) => r.id), ['a', 'b']);
});

const organized = (over: Partial<OrganizedListRaw> = {}): OrganizedListRaw => ({
  id: 'w2',
  title: 'Kajsas bebisshower',
  description: null,
  itemCount: 12,
  owner: { full_name: 'Kajsa Ek', email: 'k@x.se' },
  requestCount: 2,
  ...over,
});

test('an organized list shows its owner, size and waiting requests', () => {
  const [row] = toOrganizedRows([organized()]);
  assert.deepEqual(row, { id: 'w2', title: 'Kajsas bebisshower', ownerName: 'Kajsa Ek', itemCount: 12, requestCount: 2 });
});

test('an organized list whose owner is unknown still shows', () => {
  const [row] = toOrganizedRows([organized({ owner: null })]);
  assert.equal(row.ownerName, null);
});

const invitation = (over: Partial<InvitationRaw> = {}): InvitationRaw => ({
  id: 'i1',
  wishlistId: 'w3',
  title: 'Annas 35-årsdag',
  description: null,
  inviter: { full_name: 'Anna Lind', email: 'a@x.se' },
  ...over,
});

test('an invitation shows the list and who invited', () => {
  assert.deepEqual(toInvitationRows([invitation()]), [{ id: 'i1', title: 'Annas 35-årsdag', inviterName: 'Anna Lind' }]);
  assert.equal(toInvitationRows([invitation({ inviter: null })])[0].inviterName, null);
});

test('an invitation to a list the user made themselves is not shown', () => {
  const mine = invitation({ id: 'i2', wishlistId: 'own' });
  const theirs = invitation({ id: 'i3', wishlistId: 'other' });
  assert.deepEqual(withoutOwnLists([mine, theirs], ['own']).map((i) => i.id), ['i3']);
});

test('archived lists are kept out of the owned rows and listed on their own', () => {
  const lists = [
    owned({ id: 'a', title: 'Aktiv' }),
    owned({ id: 'b', title: 'Gammal', itemCount: 2, archived_at: '2026-10-23T09:00:00Z' }),
  ];
  assert.deepEqual(toOwnedRows(lists).map((row) => row.id), ['a']);
  assert.deepEqual(toArchivedRows(lists), [{ id: 'b', title: 'Gammal', itemCount: 2 }]);
});
