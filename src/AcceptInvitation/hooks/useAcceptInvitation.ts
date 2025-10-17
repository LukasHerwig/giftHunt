import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AcceptInvitationService } from '../services/AcceptInvitationService';
import { AcceptInvitationState } from '../types';

export const useAcceptInvitation = (token: string | null) => {
  const navigate = useNavigate();
  
  const [state, setState] = useState<AcceptInvitationState>({
    loading: true,
    error: null,
    currentUser: null,
    invitationValid: false,
    invitationData: null,
  });

  useEffect(() => {
    if (!token) {
      setState(prev => ({
        ...prev,
        error: 'Invalid invitation link',
        loading: false,
      }));
      return;
    }

    const checkInvitation = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Get the basic invitation data
        const invitation = await AcceptInvitationService.getInvitationByToken(token);
        
        // Validate the invitation
        AcceptInvitationService.validateInvitation(invitation);

        // Get additional data in parallel
        const [inviterProfile, wishlistInfo, currentUser] = await Promise.all([
          AcceptInvitationService.getInviterProfile(invitation.invited_by),
          AcceptInvitationService.getWishlistInfo(invitation.wishlist_id),
          AcceptInvitationService.getCurrentUser(),
        ]);

        // Build complete invitation data
        const invitationData = AcceptInvitationService.buildInvitationData(
          invitation,
          inviterProfile,
          wishlistInfo
        );

        setState(prev => ({
          ...prev,
          invitationValid: true,
          invitationData,
          currentUser,
          loading: false,
        }));

        // If user is logged in, redirect to dashboard so they can see the invitation
        if (currentUser) {
          AcceptInvitationService.storeInvitationToken(token);
          navigate('/dashboard');
          return;
        }

      } catch (error) {
        console.error('Error checking invitation:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unable to verify invitation';
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      }
    };

    checkInvitation();
  }, [token, navigate]);

  const handleSignIn = () => {
    // Store the token so user can complete the invitation after signing in
    if (token) {
      AcceptInvitationService.storeInvitationToken(token);
    }
    navigate('/auth');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return {
    ...state,
    handleSignIn,
    handleGoHome,
  };
};