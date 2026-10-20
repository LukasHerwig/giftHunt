import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadClaimedItemIds,
  loadGiverName,
  rememberClaimedItem,
  saveGiverName,
  type MemoryStore,
} from './giverMemory.ts';

const fakeStore = (): MemoryStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
};

const brokenStore: MemoryStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('full');
  },
};

test('the name is empty until it has been saved, then comes back', () => {
  const store = fakeStore();
  assert.equal(loadGiverName(store), '');
  saveGiverName('Maria', store);
  assert.equal(loadGiverName(store), 'Maria');
});

test('claimed items are remembered per token without duplicates', () => {
  const store = fakeStore();
  rememberClaimedItem('t1', 'a', store);
  rememberClaimedItem('t1', 'b', store);
  rememberClaimedItem('t1', 'a', store);
  rememberClaimedItem('t2', 'c', store);
  assert.deepEqual(loadClaimedItemIds('t1', store), ['a', 'b']);
  assert.deepEqual(loadClaimedItemIds('t2', store), ['c']);
  assert.deepEqual(loadClaimedItemIds('t3', store), []);
});

test('corrupted or unexpected stored data reads as empty', () => {
  const store = fakeStore();
  store.data.set('gifthunt.giver.claims.t1', '{not json');
  assert.deepEqual(loadClaimedItemIds('t1', store), []);
  store.data.set('gifthunt.giver.claims.t1', '{"a":1}');
  assert.deepEqual(loadClaimedItemIds('t1', store), []);
  store.data.set('gifthunt.giver.claims.t1', '["a", 3, null, "b"]');
  assert.deepEqual(loadClaimedItemIds('t1', store), ['a', 'b']);
});

test('a store that throws never throws out of the helpers', () => {
  assert.equal(loadGiverName(brokenStore), '');
  assert.doesNotThrow(() => saveGiverName('Maria', brokenStore));
  assert.deepEqual(loadClaimedItemIds('t1', brokenStore), []);
  assert.doesNotThrow(() => rememberClaimedItem('t1', 'a', brokenStore));
});

test('no storage at all (null) behaves as empty', () => {
  assert.equal(loadGiverName(null), '');
  assert.doesNotThrow(() => saveGiverName('Maria', null));
  assert.deepEqual(loadClaimedItemIds('t1', null), []);
  assert.doesNotThrow(() => rememberClaimedItem('t1', 'a', null));
});
