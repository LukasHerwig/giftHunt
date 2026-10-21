import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProposal,
  emptyItemForm,
  formFromItem,
  priorityName,
  toItemRow,
  validateItemForm,
} from './itemForm.ts';
import type { OwnerItem } from '../types/index.ts';

const item: OwnerItem = {
  id: 'i1',
  title: 'Trädgårdssax',
  description: null,
  link: null,
  url: null,
  price_range: 'ca 250 kr',
  priority: 1,
  is_giftcard: false,
  claim_cap: null,
  created_at: '2026-10-01T00:00:00Z',
};

test('validate: a whitespace-only title is refused', () => {
  assert.equal(validateItemForm({ ...emptyItemForm(), title: '   ' }), 'title_required');
});

test('validate: a title over 200 characters is refused', () => {
  assert.equal(validateItemForm({ ...emptyItemForm(), title: 'a'.repeat(201) }), 'title_too_long');
});

test('validate: a gift card cap must be a whole number from 1', () => {
  const base = { ...emptyItemForm(), title: 'Presentkort', isGiftcard: true };
  assert.equal(validateItemForm({ ...base, claimCap: 0 }), 'claim_cap_invalid');
  assert.equal(validateItemForm({ ...base, claimCap: 2.5 }), 'claim_cap_invalid');
  assert.equal(validateItemForm({ ...base, claimCap: 5 }), null);
  assert.equal(validateItemForm({ ...base, claimCap: null }), null);
});

test('validate: a cap on a non-gift-card is ignored, not an error', () => {
  assert.equal(validateItemForm({ ...emptyItemForm(), title: 'Bok', claimCap: 0 }), null);
});

test('toItemRow trims, turns empty strings into null and drops the cap of a non-gift-card', () => {
  const row = toItemRow({
    ...emptyItemForm(),
    title: '  Bok  ',
    description: '   ',
    link: ' lekia.se ',
    priceRange: '',
    claimCap: 3,
  });
  assert.deepEqual(row, {
    title: 'Bok',
    description: null,
    link: 'lekia.se',
    url: null,
    price_range: null,
    priority: null,
    is_giftcard: false,
    claim_cap: null,
  });
});

test('toItemRow keeps the cap of a gift card', () => {
  assert.equal(toItemRow({ ...emptyItemForm(), title: 'K', isGiftcard: true, claimCap: 4 }).claim_cap, 4);
});

test('formFromItem fills empty strings for missing values', () => {
  const form = formFromItem(item);
  assert.equal(form.description, '');
  assert.equal(form.link, '');
  assert.equal(form.priceRange, 'ca 250 kr');
  assert.equal(form.priority, 1);
  assert.equal(form.isGiftcard, false);
});

test('buildProposal: only the changed fields', () => {
  const form = { ...formFromItem(item), priceRange: 'ca 300 kr' };
  assert.deepEqual(buildProposal(item, form), { price_range: 'ca 300 kr' });
});

test('buildProposal: nothing changed gives an empty proposal', () => {
  assert.deepEqual(buildProposal(item, formFromItem(item)), {});
});

test('buildProposal: whitespace-only edits are not changes', () => {
  const form = { ...formFromItem(item), title: '  Trädgårdssax ', description: '  ' };
  assert.deepEqual(buildProposal(item, form), {});
});

test('buildProposal: turning gift card off sends claim_cap null', () => {
  const card: OwnerItem = { ...item, is_giftcard: true, claim_cap: 5 };
  const form = { ...formFromItem(card), isGiftcard: false };
  assert.deepEqual(buildProposal(card, form), { is_giftcard: false, claim_cap: null });
});

test('buildProposal: clearing a priority sends null', () => {
  const form = { ...formFromItem(item), priority: null };
  assert.deepEqual(buildProposal(item, form), { priority: null });
});

test('priorityName maps 1-3 to low, medium, high and anything else to null', () => {
  assert.equal(priorityName(1), 'low');
  assert.equal(priorityName(2), 'medium');
  assert.equal(priorityName(3), 'high');
  assert.equal(priorityName(null), null);
  assert.equal(priorityName(0), null);
});
