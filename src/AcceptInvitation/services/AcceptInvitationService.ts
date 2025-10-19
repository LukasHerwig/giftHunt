import { supabase } from '@/integrations/supabase/client';
import {
  InvitationQueryResult,
  InviterProfile,
  WishlistInfo,
  InvitationData,
  CurrentUser,
} from '../types';

export class AcceptInvitationService {
  /**
   * Get invitation data by token
   */
  static async getInvitationByToken(
    token: string
  ): Promise<InvitationQueryResult> {
    const { data: inviteData, error: inviteError } = await supabase
      .from('admin_invitations')
      .select('id, email, accepted, expires_at, invited_by, wishlist_id')
      .eq('invitation_token', token)
      .single();

    if (inviteError || !inviteData) {
      console.error('Invitation error:', inviteError);
      throw new Error('Invalid or expired invitation');
    }

    return inviteData;
  }

  /**
   * Get inviter profile information
   */
  static async getInviterProfile(invitedBy: string): Promise<InviterProfile> {
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', invitedBy)
      .single();

    return inviterProfile || { email: null, full_name: null };
  }

  /**
   * Get wishlist information
   */
  static async getWishlistInfo(wishlistId: string): Promise<WishlistInfo> {
    const { data: wishlistData, error: wishlistError } = await supabase
      .from('wishlists')
      .select('title, description')
      .eq('id', wishlistId)
      .single();

    return wishlistData || { title: null, description: null };
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<CurrentUser | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Validate invitation (check if accepted or expired)
   */
  static validateInvitation(invitation: InvitationQueryResult): void {
    if (invitation.accepted) {
      throw new Error('This invitation has already been accepted');
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new Error('This invitation has expired');
    }
  }

  /**
   * Build complete invitation data from separate queries
   */
  static buildInvitationData(
    invitation: InvitationQueryResult,
    inviterProfile: InviterProfile,
    wishlistInfo: WishlistInfo
  ): InvitationData {
    const inviterEmail = inviterProfile?.email || 'Someone';
    const wishlistTitle = wishlistInfo?.title || 'Untitled Wishlist';
    const wishlistDescription = wishlistInfo?.description || '';

    const invitationData = {
      email: invitation.email,
      wishlist_id: invitation.wishlist_id,
      invited_by: invitation.invited_by,
      inviterEmail,
      wishlistTitle,
      wishlistDescription,
    };

    return invitationData;
  }

  /**
   * Store invitation token for later processing
   */
  static storeInvitationToken(token: string): void {
    sessionStorage.setItem('pendingInvitationToken', token);
  }
}
