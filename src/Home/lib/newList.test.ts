import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TITLE_MAX, toNewListRow, validateNewList } from './newList.ts';
import type { NewListForm } from '../types/index.ts';

const form = (over: Partial<NewListForm> = {}): NewListForm => ({
  kind: 'own',
  title: 'Jul 2026',
  description: '',
  ...over,
});

test('a title is required, whitespace does not count', () => {
  assert.equal(validateNewList(form({ title: '   ' })), 'title_required');
  assert.equal(validateNewList(form({ title: '' })), 'title_required');
});

test('a title over the limit is refused', () => {
  assert.equal(validateNewList(form({ title: 'a'.repeat(TITLE_MAX + 1) })), 'title_too_long');
  assert.equal(validateNewList(form({ title: 'a'.repeat(TITLE_MAX) })), null);
});

test('a normal form is valid', () => {
  assert.equal(validateNewList(form()), null);
});

test('the insert row trims, defaults to links on only, and is not self-managed for an own list', () => {
  assert.deepEqual(toNewListRow('u1', form({ title: '  Jul 2026 ', description: '  ' })), {
    creator_id: 'u1',
    title: 'Jul 2026',
    description: null,
    enable_links: true,
    enable_price: false,
    enable_priority: false,
    is_self_managed: false,
  });
});

test('a list for someone else is self-managed and keeps its description', () => {
  const row = toNewListRow('u1', form({ kind: 'other', title: 'Mormors 80-årsdag', description: ' Sju önskningar ' }));
  assert.equal(row.is_self_managed, true);
  assert.equal(row.description, 'Sju önskningar');
});
