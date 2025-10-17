import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export class AuthService {
  static async getCurrentSession(): Promise<Session | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  static getPendingInvitationToken(): string | null {
    return sessionStorage.getItem('pendingInvitationToken');
  }

  static removePendingInvitationToken(): void {
    sessionStorage.removeItem('pendingInvitationToken');
  }

  static createAuthStateChangeListener(
    callback: (event: string, session: Session | null) => void
  ) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
}
