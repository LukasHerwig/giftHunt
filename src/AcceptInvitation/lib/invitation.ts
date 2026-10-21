import type { InvitationData, InvitationQueryResult } from '../types.ts';

export type InvitationProblem = 'gone' | 'wrongAccount' | 'unconfirmed' | 'failed';

/** A missing, already accepted or expired invitation can no longer be used. */
export const tokenProblem = (
  invitation: Pick<InvitationQueryResult, 'accepted' | 'expires_at'> | null,
  now: Date,
): InvitationProblem | null => {
  if (!invitation) return 'gone';
  if (invitation.accepted) return 'gone';
  if (invitation.expires_at && new Date(invitation.expires_at) < now) return 'gone';
  return null;
};

/** `invitation_not_found` after the token resolved means it is addressed to someone else. */
export const acceptProblem = (code: string): InvitationProblem => {
  switch (code) {
    case 'invitation_not_found':
      return 'wrongAccount';
    case 'already_accepted':
    case 'invitation_expired':
    case 'admin_already_exists':
    case 'owner_cannot_be_admin':
      return 'gone';
    case 'email_not_confirmed':
      return 'unconfirmed';
    default:
      return 'failed';
  }
};

export const toInvitationData = (raw: InvitationQueryResult): InvitationData => ({
  id: raw.id,
  wishlistId: raw.wishlist_id,
  title: raw.wishlist_title?.trim() ?? '',
  inviterName: raw.inviter_full_name?.trim() || raw.inviter_email?.trim() || null,
});
