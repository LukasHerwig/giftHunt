/** What `get_invitation_by_token` returns (null when no invitation has the token). */
export interface InvitationQueryResult {
  id: string;
  email: string;
  accepted: boolean;
  expires_at: string | null;
  invited_by: string;
  wishlist_id: string;
  wishlist_title: string | null;
  wishlist_description: string | null;
  inviter_email: string | null;
  inviter_full_name: string | null;
}

export interface InvitationData {
  id: string;
  wishlistId: string;
  title: string;
  inviterName: string | null;
}
