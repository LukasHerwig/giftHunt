import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PEEK,
  RUN,
  canPeek,
  canRun,
  emptyState,
  loadState,
  mischiefRoute,
  recordPeek,
  recordRun,
  peekLeft,
  saveState,
} from './mischief.ts';

test('mischief is allowed on the calm screens only', () => {
  for (const path of ['/', '/profile', '/auth', '/onboarding', '/accept-invitation']) {
    assert.equal(mischiefRoute(path), true, path);
  }
  for (const path of ['/wishlist/abc', '/wishlist/abc/manage', '/shared/tok', '/shared/', '/nope']) {
    assert.equal(mischiefRoute(path), false, path);
  }
});

test('a peek needs luck, a cooldown and room under the cap', () => {
  const s = emptyState();
  assert.equal(canPeek(s, 1000, () => 0.1), true);
  assert.equal(canPeek(s, 1000, () => PEEK.chance + 0.01), false);
  const after = recordPeek(s, 1000);
  assert.equal(canPeek(after, 1000 + PEEK.cooldownMs - 1, () => 0), false);
  assert.equal(canPeek(after, 1000 + PEEK.cooldownMs, () => 0), true);
});

test('peeks stop at the session cap', () => {
  let s = emptyState();
  for (let i = 0; i < PEEK.cap; i += 1) s = recordPeek(s, i * PEEK.cooldownMs);
  assert.equal(canPeek(s, 10 * PEEK.cooldownMs, () => 0), false);
});

test('the runner waits for a page to be old enough, then for its cooldown and cap', () => {
  const s = emptyState();
  assert.equal(canRun(s, 0, RUN.minPageAgeMs - 1), false);
  assert.equal(canRun(s, 0, RUN.minPageAgeMs), true);
  const once = recordRun(s, 100);
  assert.equal(canRun(once, 100 + RUN.cooldownMs - 1, RUN.minPageAgeMs), false);
  assert.equal(canRun(once, 100 + RUN.cooldownMs, RUN.minPageAgeMs), true);
  const twice = recordRun(once, 100 + RUN.cooldownMs);
  assert.equal(canRun(twice, 100 + 10 * RUN.cooldownMs, RUN.minPageAgeMs), false);
});

test('state survives a reload through storage and ignores broken data', () => {
  const data = new Map<string, string>();
  const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  assert.deepEqual(loadState(storage), emptyState());
  saveState(storage, recordRun(recordPeek(emptyState(), 5), 6));
  assert.deepEqual(loadState(storage), { peeks: 1, runs: 1, lastPeekAt: 5, lastRunAt: 6 });
  storage.setItem('gifthunt-mischief', '{not json');
  assert.deepEqual(loadState(storage), emptyState());
});

test('a peek stays in the right part of the card, past the section title', () => {
  assert.equal(peekLeft(0), 55);
  assert.equal(peekLeft(1), 90);
  assert.ok(peekLeft(0.5) > 55 && peekLeft(0.5) < 90);
});
