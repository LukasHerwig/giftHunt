import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstName, initials } from './initials.ts';

test('initials are the first letters of the first and last name', () => {
  assert.equal(initials('Maja Herwig'), 'MH');
  assert.equal(initials('bo herwig'), 'BH');
  assert.equal(initials('Maja Karin Herwig'), 'MH');
});

test('a one-word name gives one letter; an e-mail uses its local part', () => {
  assert.equal(initials('Maja'), 'M');
  assert.equal(initials('bo@x.se'), 'B');
  assert.equal(initials('  '), '');
});

test('first name is the first word, or the e-mail local part', () => {
  assert.equal(firstName('Maja Herwig'), 'Maja');
  assert.equal(firstName('Bo'), 'Bo');
  assert.equal(firstName('bo@x.se'), 'bo');
  assert.equal(firstName(''), '');
});
