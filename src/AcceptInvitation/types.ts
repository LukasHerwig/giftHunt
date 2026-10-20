export interface InvitationData {
  email: string;
  wishlist_id: string;
  invited_by: string;
  inviterEmail?: string;
  wishlistTitle?: string;
  wishlistDescription?: string;
}

export interface CurrentUser {
  id: string;
  email?: string;
}

export interface AcceptInvitationState {
  loading: boolean;
  error: string | null;
  currentUser: CurrentUser | null;
  invitationValid: boolean;
  invitationData: InvitationData | null;
}

export interface InvitationQueryResult {
  id: string;
  email: string;
  accepted: boolean;
  expires_at: string;
  invited_by: string;
  wishlist_id: string;
  wishlist_title: string | null;
  wishlist_description: string | null;
  inviter_email: string | null;
  inviter_full_name: string | null;
}
