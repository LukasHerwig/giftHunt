import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { useAuth } from '@/components/auth/useAuth';
import { AuthService } from '@/Auth/services';
import { errorCode } from '@/Wishlist/lib/errorCode';
import { AcceptInvitationService } from '../services/AcceptInvitationService';
import { acceptProblem, toInvitationData, tokenProblem, type InvitationProblem } from '../lib/invitation';
import type { InvitationData } from '../types';

type Phase = 'loading' | 'prompt' | 'problem';

interface FlowState {
  phase: Phase;
  problem: InvitationProblem | null;
  invitation: InvitationData | null;
}

const LOADING: FlowState = { phase: 'loading', problem: null, invitation: null };

/**
 * Opens an invitation link: shows who invited when signed out; accepts straight away when
 * signed in and opens the list. The pending token is kept until the invitation is accepted
 * or found no longer valid, so signing in (or switching account) comes back here.
 */
export const useAcceptInvitation = (token: string | null) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<FlowState>(LOADING);
  // The effect runs twice under StrictMode and again when `t` changes; accept only once per key.
  const started = useRef<string | null>(null);
  // The accept can finish after the person was sent elsewhere (onboarding): then do not navigate or set state.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!token) {
      AuthService.removePendingInvitationToken();
      setState({ phase: 'problem', problem: 'gone', invitation: null });
      return;
    }
    setState(LOADING);

    let raw;
    try {
      raw = await AcceptInvitationService.getInvitationByToken(token);
    } catch (error) {
      console.error('Error loading invitation:', error);
      setState({ phase: 'problem', problem: 'failed', invitation: null });
      return;
    }
    if (tokenProblem(raw, new Date()) || !raw) {
      AuthService.removePendingInvitationToken();
      setState({ phase: 'problem', problem: 'gone', invitation: null });
      return;
    }

    const invitation = toInvitationData(raw);
    if (!userId) {
      setState({ phase: 'prompt', problem: null, invitation });
      return;
    }

    try {
      await AcceptInvitationService.acceptInvitation(raw.id);
      AuthService.removePendingInvitationToken();
      toast.success(t('acceptInvitation.accepted'), 'love');
      if (alive.current) navigate(`/wishlist/${raw.wishlist_id}`, { replace: true });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      const problem = acceptProblem(errorCode(error));
      if (problem === 'gone') AuthService.removePendingInvitationToken();
      if (alive.current) setState({ phase: 'problem', problem, invitation });
    }
  }, [token, userId, t, navigate]);

  useEffect(() => {
    const key = `${token ?? ''}:${userId ?? ''}`;
    if (started.current === key) return;
    started.current = key;
    void run();
  }, [token, userId, run]);

  const retry = () => {
    started.current = null;
    void run();
  };

  const rememberToken = () => {
    if (token) AuthService.setPendingInvitationToken(token);
  };

  return {
    ...state,
    goSignIn: () => {
      rememberToken();
      navigate('/auth');
    },
    goSignUp: () => {
      rememberToken();
      navigate('/auth?mode=signup');
    },
    goHome: () => navigate('/'),
    /** Wrong account: sign out and come back to this invitation after signing in. */
    leave: async () => {
      rememberToken();
      await signOut();
    },
    retry,
  };
};
