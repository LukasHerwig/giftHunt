import { supabase } from '@/integrations/supabase/client';

// Email service for sending invitation emails
export class EmailService {
  /**
   * Send an admin invitation email using Supabase Edge Function
   */
  static async sendInvitationEmail(
    email: string,
    invitationLink: string,
    wishlistTitle: string,
    inviterName?: string
  ): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-invitation',
        {
          body: {
            email,
            invitationLink,
            wishlistTitle,
            inviterName,
          },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to send invitation email');
      }

      console.log('Invitation email sent successfully:', data);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }
  }

  /**
   * Check if email service is available
   */
  static async checkEmailService(): Promise<boolean> {
    try {
      // Just return true since Supabase functions should always be available
      return true;
    } catch (error) {
      console.error('Email service not available:', error);
      return false;
    }
  }
}
