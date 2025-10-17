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
}

export interface InviterProfile {
  email: string | null;
  full_name: string | null;
}

export interface WishlistInfo {
  title: string | null;
  description: string | null;
}