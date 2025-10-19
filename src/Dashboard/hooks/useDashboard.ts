import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/useAuth';
import { getBaseUrl } from '@/lib/urlUtils';
import { DashboardService } from '../services/DashboardService';
import { DashboardState, DashboardActions } from '../types';

export const useDashboard = (): DashboardState & DashboardActions => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [state, setState] = useState<DashboardState>({
    wishlists: [],
    adminWishlists: [],
    pendingInvitations: [],
    loading: true,
    createDialogOpen: false,
    newTitle: '',
    newDescription: '',
    enableLinks: true,
    enablePrice: false,
    enablePriority: false,
    creating: false,
  });

  const loadAllData = useCallback(
    async (userId: string) => {
      try {
        setState((prev) => ({ ...prev, loading: true }));

        const [ownedWishlists, adminWishlists, pendingInvitations] =
          await Promise.all([
            DashboardService.getOwnedWishlists(userId),
            DashboardService.getAdminWishlists(userId),
            DashboardService.getPendingInvitations(user?.email || ''),
          ]);

        setState((prev) => ({
          ...prev,
          wishlists: ownedWishlists,
          adminWishlists,
          pendingInvitations,
          loading: false,
        }));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error(t('messages.failedToLoadDashboard'));
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [user?.email, t]
  );

  const handleCreateWishlist = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!state.newTitle.trim()) {
        toast.error(t('messages.enterTitle'));
        return;
      }

      if (!user) return;

      setState((prev) => ({ ...prev, creating: true }));
      try {
        const newWishlist = await DashboardService.createWishlist(user.id, {
          title: state.newTitle,
          description: state.newDescription,
          enableLinks: state.enableLinks,
          enablePrice: state.enablePrice,
          enablePriority: state.enablePriority,
        });

        setState((prev) => ({
          ...prev,
          wishlists: [newWishlist, ...prev.wishlists],
          newTitle: '',
          newDescription: '',
          enableLinks: true,
          enablePrice: false,
          enablePriority: false,
          createDialogOpen: false,
          creating: false,
        }));

        toast.success(t('messages.wishlistCreated'));
      } catch (error) {
        console.error('Create wishlist error:', error);
        toast.error(t('messages.failedToCreate'));
        setState((prev) => ({ ...prev, creating: false }));
      }
    },
    [
      state.newTitle,
      state.newDescription,
      state.enableLinks,
      state.enablePrice,
      state.enablePriority,
      user,
      t,
    ]
  );

  const handleCopyLink = useCallback(
    (id: string) => {
      const url = `${getBaseUrl()}/wishlist/${id}`;
      navigator.clipboard.writeText(url);
      toast.success(t('messages.linkCopied'));
    },
    [t]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await DashboardService.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t('messages.failedToSignOut'));
    }
  }, [navigate, t]);

  const handleAcceptInvitation = useCallback(
    async (invitationId: string) => {
      if (!user) return;

      try {
        const invitation = state.pendingInvitations.find(
          (inv) => inv.id === invitationId
        );

        if (invitation) {
          await DashboardService.acceptInvitation(
            invitationId,
            user.id,
            invitation.wishlist_id,
            invitation.invited_by
          );

          // Reload data
          await loadAllData(user.id);
          toast.success(t('messages.invitationAccepted'));
        }
      } catch (error) {
        console.error('Accept invitation error:', error);
        toast.error(t('messages.failedToAcceptInvitation'));
      }
    },
    [user, state.pendingInvitations, loadAllData, t]
  );

  const setCreateDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, createDialogOpen: open }));
  }, []);

  const setNewTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, newTitle: title }));
  }, []);

  const setNewDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, newDescription: description }));
  }, []);

  const setEnableLinks = useCallback((enable: boolean) => {
    setState((prev) => ({ ...prev, enableLinks: enable }));
  }, []);

  const setEnablePrice = useCallback((enable: boolean) => {
    setState((prev) => ({ ...prev, enablePrice: enable }));
  }, []);

  const setEnablePriority = useCallback((enable: boolean) => {
    setState((prev) => ({ ...prev, enablePriority: enable }));
  }, []);

  useEffect(() => {
    if (user) {
      loadAllData(user.id);
    }
  }, [user, loadAllData]);

  return {
    ...state,
    loadAllData,
    handleCreateWishlist,
    handleCopyLink,
    handleSignOut,
    handleAcceptInvitation,
    setCreateDialogOpen,
    setNewTitle,
    setNewDescription,
    setEnableLinks,
    setEnablePrice,
    setEnablePriority,
  };
};
