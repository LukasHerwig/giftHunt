import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toHelperEntries } from './helpers.ts';

const now = new Date('2026-11-23T12:00:00Z');
const admin = (adminId: string, fullName: string | null, email: string | null) => ({
  admin_id: adminId,
  profiles: { full_name: fullName, email },
});
const invite = (id: string, email: string, expiresAt = '2026-11-30T12:00:00Z', accepted = false) => ({
  id,
  email,
  accepted,
  expires_at: expiresAt,
});

test('the creator is not listed as a helper', () => {
  const entries = toHelperEntries('me', [admin('me', 'Jag', 'me@x.se'), admin('a', 'Maja', 'maja@x.se')], [], now);
  assert.deepEqual(entries, [{ kind: 'helper', adminId: 'a', name: 'Maja', email: 'maja@x.se' }]);
});

test('expired invitations are left out', () => {
  const entries = toHelperEntries(
    'me',
    [],
    [invite('1', 'old@x.se', '2026-11-20T12:00:00Z'), invite('2', 'new@x.se')],
    now,
  );
  assert.deepEqual(entries, [{ kind: 'pending', invitationId: '2', email: 'new@x.se' }]);
});

test('accepted invitations are left out (the helper is listed instead)', () => {
  assert.deepEqual(toHelperEntries('me', [], [invite('1', 'a@x.se', '2026-11-30T12:00:00Z', true)], now), []);
});

test('helpers come first, sorted by name, then pending invitations', () => {
  const entries = toHelperEntries(
    'me',
    [admin('b', 'Bo', 'bo@x.se'), admin('a', 'Åsa', 'asa@x.se'), admin('c', 'Maja', 'maja@x.se')],
    [invite('2', 'z@x.se'), invite('1', 'a@x.se')],
    now,
  );
  assert.deepEqual(
    entries.map((e) => (e.kind === 'helper' ? e.name : e.email)),
    ['Bo', 'Maja', 'Åsa', 'a@x.se', 'z@x.se'],
  );
});

test('a helper without a name shows their email', () => {
  const [entry] = toHelperEntries('me', [admin('a', null, 'maja@x.se')], [], now);
  assert.equal(entry.kind === 'helper' && entry.name, 'maja@x.se');
});
