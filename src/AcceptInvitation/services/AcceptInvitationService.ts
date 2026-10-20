import { supabase } from '@/integrations/supabase/client';
import { InvitationQueryResult, InvitationData, CurrentUser } from '../types';

export class AcceptInvitationService {
  /**
   * Get invitation, wishlist and inviter data by token
   */
  static async getInvitationByToken(
    token: string
  ): Promise<InvitationQueryResult> {
    const { data, error } = await supabase.rpc('get_invitation_by_token', {
      p_token: token,
    });

    if (error || !data) {
      console.error('Invitation error:', error);
      throw new Error('Invalid or expired invitation');
    }

    return data as unknown as InvitationQueryResult;
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
   * Build complete invitation data from the RPC result
   */
  static buildInvitationData(invitation: InvitationQueryResult): InvitationData {
    const inviterEmail = invitation.inviter_email || 'Someone';
    const wishlistTitle = invitation.wishlist_title || 'Untitled Wishlist';
    const wishlistDescription = invitation.wishlist_description || '';

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
