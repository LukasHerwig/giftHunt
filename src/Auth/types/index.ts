import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  checking: boolean;
}

export interface AuthActions {
  checkSession: () => Promise<void>;
  handleAuthStateChange: (session: Session | null) => void;
}

export interface PendingInvitation {
  token: string;
}

export interface SessionData {
  session: Session | null;
  user: User | null;
}
