import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMemberSince } from './memberSince.ts';

test('the date is written in the chosen language', () => {
  assert.equal(formatMemberSince('2026-10-12T10:00:00Z', 'sv'), '12 oktober 2026');
  assert.equal(formatMemberSince('2026-10-12T10:00:00Z', 'en'), 'October 12, 2026');
});

test('the day does not depend on the time zone of the machine', () => {
  assert.equal(formatMemberSince('2026-10-12T00:30:00Z', 'sv'), '12 oktober 2026');
  assert.equal(formatMemberSince('2026-10-12T23:30:00Z', 'sv'), '12 oktober 2026');
});
