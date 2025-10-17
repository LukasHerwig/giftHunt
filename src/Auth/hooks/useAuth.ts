import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { AuthService } from '../services/AuthService';
import { AuthState, AuthActions } from '../types';

export const useAuth = (): AuthState & AuthActions => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  const handleAuthStateChange = useCallback(
    (session: Session | null) => {
      if (session) {
        // Check if there's a pending invitation token
        const pendingToken = AuthService.getPendingInvitationToken();
        if (pendingToken) {
          AuthService.removePendingInvitationToken();
          navigate(`/accept-invitation?token=${pendingToken}`);
        } else {
          navigate('/');
        }
      }
    },
    [navigate]
  );

  const checkSession = useCallback(async () => {
    try {
      const session = await AuthService.getCurrentSession();
      if (session) {
        handleAuthStateChange(session);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setChecking(false);
    }
  }, [handleAuthStateChange]);

  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const subscription = AuthService.createAuthStateChangeListener(
      (event, session) => {
        handleAuthStateChange(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkSession, handleAuthStateChange]);

  return {
    checking,
    checkSession,
    handleAuthStateChange,
  };
};
