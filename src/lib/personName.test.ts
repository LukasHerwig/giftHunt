import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NAME_MAX, initials, nameChanged, validateName } from './personName.ts';

test('a name is required, whitespace does not count', () => {
  assert.equal(validateName(''), 'required');
  assert.equal(validateName('   '), 'required');
});

test('a name over the limit is refused', () => {
  assert.equal(validateName('a'.repeat(NAME_MAX + 1)), 'tooLong');
  assert.equal(validateName('a'.repeat(NAME_MAX)), null);
});

test('a normal name is valid, surrounding spaces ignored', () => {
  assert.equal(validateName(' Erik Berg '), null);
});

test('nameChanged compares the trimmed name with the saved one', () => {
  assert.equal(nameChanged(null, ''), false);
  assert.equal(nameChanged('Erik', 'Erik '), false);
  assert.equal(nameChanged('Erik', 'Erika'), true);
  assert.equal(nameChanged(null, 'Erik'), true);
});

test('initials come from the first two words of the name', () => {
  assert.equal(initials('Erik Berg', 'e@x.se'), 'EB');
  assert.equal(initials('Anna Lind Ek', null), 'AL');
  assert.equal(initials('  maria  ', 'm@x.se'), 'M');
});

test('initials fall back to the e-mail, then to nothing', () => {
  assert.equal(initials(null, 'e@x.se'), 'E');
  assert.equal(initials('', '  z@x.se'), 'Z');
  assert.equal(initials(undefined, undefined), '');
});
