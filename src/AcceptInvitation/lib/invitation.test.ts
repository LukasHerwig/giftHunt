import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptProblem, toInvitationData, tokenProblem } from './invitation.ts';
import type { InvitationQueryResult } from './invitation.ts';

const raw = (over: Partial<InvitationQueryResult> = {}): InvitationQueryResult => ({
  id: 'i1',
  email: 'e@x.se',
  accepted: false,
  expires_at: null,
  invited_by: 'u1',
  wishlist_id: 'w1',
  wishlist_title: ' Annas jul ',
  wishlist_description: null,
  inviter_email: 'anna@x.se',
  inviter_full_name: 'Anna Lind',
  ...over,
});

const now = new Date('2026-10-21T12:00:00Z');

test('a missing, accepted or expired invitation is gone', () => {
  assert.equal(tokenProblem(null, now), 'gone');
  assert.equal(tokenProblem(raw({ accepted: true }), now), 'gone');
  assert.equal(tokenProblem(raw({ expires_at: '2026-10-20T00:00:00Z' }), now), 'gone');
});

test('an open invitation has no problem, with or without an expiry', () => {
  assert.equal(tokenProblem(raw(), now), null);
  assert.equal(tokenProblem(raw({ expires_at: '2026-10-28T00:00:00Z' }), now), null);
});

test('accept errors map to what the person sees', () => {
  assert.equal(acceptProblem('invitation_not_found'), 'wrongAccount');
  for (const code of ['already_accepted', 'invitation_expired', 'admin_already_exists', 'owner_cannot_be_admin']) {
    assert.equal(acceptProblem(code), 'gone');
  }
  assert.equal(acceptProblem('email_not_confirmed'), 'unconfirmed');
  assert.equal(acceptProblem(''), 'failed');
  assert.equal(acceptProblem('something else'), 'failed');
});

test('invitation data names the inviter by full name, trimmed title', () => {
  assert.deepEqual(toInvitationData(raw()), { id: 'i1', wishlistId: 'w1', title: 'Annas jul', inviterName: 'Anna Lind' });
});

test('the inviter falls back to the e-mail, then to nobody', () => {
  assert.equal(toInvitationData(raw({ inviter_full_name: ' ' })).inviterName, 'anna@x.se');
  assert.equal(toInvitationData(raw({ inviter_full_name: null, inviter_email: null })).inviterName, null);
  assert.equal(toInvitationData(raw({ wishlist_title: null })).title, '');
});
