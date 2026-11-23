import { test } from 'node:test';
import assert from 'node:assert/strict';
import { helperNames, joinNames, ownedOrganizer, splitOrganized } from './helpers.ts';

const maja = { full_name: 'Maja Ek', email: 'm@x.se' };
const bo = { full_name: null, email: 'bo@x.se' };
const erik = { full_name: 'Erik Berg', email: 'e@x.se' };

test('a self-managed list has no organizer on its Home card, even with helpers', () => {
  const admins = [
    { admin_id: 'me', profile: erik },
    { admin_id: 'h1', profile: maja },
  ];
  assert.equal(ownedOrganizer({ is_self_managed: true, creator_id: 'me' }, admins), null);
});

test('an ordinary list shows its organizer', () => {
  assert.equal(ownedOrganizer({ is_self_managed: false, creator_id: 'me' }, [{ admin_id: 'o', profile: maja }]), maja);
  assert.equal(ownedOrganizer({ is_self_managed: false, creator_id: 'me' }, []), null);
});

test('helpers are the non-creator admins of a self-managed list, named by name or e-mail', () => {
  const admins = [
    { admin_id: 'me', profile: erik },
    { admin_id: 'h1', profile: maja },
    { admin_id: 'h2', profile: bo },
    { admin_id: 'h3', profile: null },
  ];
  assert.deepEqual(helperNames({ is_self_managed: true, creator_id: 'me' }, admins), ['Maja Ek', 'bo@x.se']);
});

test('an ordinary list has no helpers', () => {
  assert.deepEqual(helperNames({ is_self_managed: false, creator_id: 'me' }, [{ admin_id: 'o', profile: maja }]), []);
});

test('a self-managed list I did not create goes to the helped section', () => {
  const lists = [{ id: 'a', is_self_managed: true }];
  assert.deepEqual(splitOrganized(lists), { organized: [], helped: lists });
});

test('an ordinary list I organize stays in the organize section', () => {
  const lists = [
    { id: 'a', is_self_managed: false },
    { id: 'b', is_self_managed: true },
    { id: 'c', is_self_managed: false },
  ];
  const { organized, helped } = splitOrganized(lists);
  assert.deepEqual(organized.map((l) => l.id), ['a', 'c']);
  assert.deepEqual(helped.map((l) => l.id), ['b']);
});

test('names are joined the way people say them', () => {
  assert.equal(joinNames(['Maja'], 'sv'), 'Maja');
  assert.equal(joinNames(['Maja', 'Bo'], 'sv'), 'Maja och Bo');
  assert.equal(joinNames(['Maja', 'Bo', 'Eva'], 'sv'), 'Maja, Bo och Eva');
  assert.equal(joinNames(['Maja', 'Bo'], 'en'), 'Maja and Bo');
});
