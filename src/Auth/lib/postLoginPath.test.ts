import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postLoginPath } from './postLoginPath.ts';

test('without a pending invitation the person goes Home', () => {
  assert.equal(postLoginPath(null), '/');
});

test('with a pending invitation the person goes back to it, token encoded', () => {
  assert.equal(postLoginPath('abc'), '/accept-invitation?token=abc');
  assert.equal(postLoginPath('a b&c'), '/accept-invitation?token=a%20b%26c');
});
