import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorCode } from './errorCode.ts';

test('reads the message of an Error', () => {
  assert.equal(errorCode(new Error('edit_locked')), 'edit_locked');
});

test('reads the message of a plain error object (Supabase errors are not Error instances)', () => {
  assert.equal(errorCode({ message: 'edit_directly', code: 'P0001', details: null }), 'edit_directly');
});

test('anything else has no code', () => {
  assert.equal(errorCode(null), '');
  assert.equal(errorCode(undefined), '');
  assert.equal(errorCode('boom'), '');
  assert.equal(errorCode({ message: 42 }), '');
});
