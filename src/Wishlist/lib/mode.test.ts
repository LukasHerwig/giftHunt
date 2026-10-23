import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMode } from './mode.ts';

const list = (over: Partial<{ creator_id: string; is_self_managed: boolean; archived_at: string | null }> = {}) => ({
  creator_id: 'owner',
  is_self_managed: false,
  archived_at: null,
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

test('the creator of an archived list is in archived mode, normal or self-managed', () => {
  const archived = '2026-10-23T09:00:00Z';
  assert.equal(resolveMode({ wishlist: list({ archived_at: archived }), userId: 'owner', isOrganizer: false }), 'archived');
  assert.equal(
    resolveMode({ wishlist: list({ archived_at: archived, is_self_managed: true }), userId: 'owner', isOrganizer: true }),
    'archived',
  );
});

test('nobody but the creator has a mode on an archived list', () => {
  const archived = '2026-10-23T09:00:00Z';
  assert.equal(resolveMode({ wishlist: list({ archived_at: archived }), userId: 'erik', isOrganizer: true }), 'none');
});
