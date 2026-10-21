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
