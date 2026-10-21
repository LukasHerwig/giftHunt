import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toStoreUrl } from './storeUrl.ts';

test('a bare domain becomes https', () => {
  assert.equal(toStoreUrl('lekia.se'), 'https://lekia.se');
});

test('an http or https address is kept, whatever its case', () => {
  assert.equal(toStoreUrl('http://lekia.se/x'), 'http://lekia.se/x');
  assert.equal(toStoreUrl('HTTPS://LEKIA.SE'), 'HTTPS://LEKIA.SE');
});

test('other schemes are never executed: they are treated as part of an https address', () => {
  assert.equal(toStoreUrl('javascript:alert(1)'), 'https://javascript:alert(1)');
  assert.equal(toStoreUrl('data:text/html,x'), 'https://data:text/html,x');
});

test('whitespace is trimmed', () => {
  assert.equal(toStoreUrl('  lekia.se  '), 'https://lekia.se');
});
