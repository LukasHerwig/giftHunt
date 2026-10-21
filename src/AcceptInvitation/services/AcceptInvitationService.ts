import { supabase } from '@/integrations/supabase/client';
import type { InvitationQueryResult } from '../types';

export class AcceptInvitationService {
  /** The invitation behind a token, or null when no invitation has it. */
  static async getInvitationByToken(token: string): Promise<InvitationQueryResult | null> {
    const { data, error } = await supabase.rpc('get_invitation_by_token', { p_token: token });
    if (error) throw error;
    return (data as unknown as InvitationQueryResult | null) ?? null;
  }

  static async acceptInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase.rpc('accept_invitation', { p_invitation_id: invitationId });
    if (error) throw error;
  }
}
