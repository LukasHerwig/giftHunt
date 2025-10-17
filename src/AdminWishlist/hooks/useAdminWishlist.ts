import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminWishlistService } from '../services/AdminWishlistService';
import {
  AdminWishlistState,
  AdminWishlistActions,
  WishlistItem,
} from '../types';

export const useAdminWishlist = (
  id: string | undefined
): AdminWishlistState & AdminWishlistActions => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [state, setState] = useState<AdminWishlistState>({
    wishlist: null,
    items: [],
    loading: true,
    isAdmin: false,
    shareLink: null,
    generatingLink: false,
    untakeDialogOpen: false,
    selectedUntakeItem: null,
    untaking: false,
  });

  const checkAdminAccess = useCallback(async () => {
    if (!id) return;

    try {
      const isAdmin = await AdminWishlistService.checkAdminAccess(id);

      if (isAdmin) {
        setState((prev) => ({ ...prev, isAdmin: true }));
      } else {
        toast.error(t('messages.noAdminAccess'));
        navigate('/');
      }
    } catch (error) {
      console.error('Admin access check error:', error);
      toast.error(t('messages.failedToVerifyAccess'));
      navigate('/');
    }
  }, [id, navigate, t]);

  const loadWishlist = useCallback(async () => {
    if (!id) return;

    try {
      const wishlist = await AdminWishlistService.getWishlist(id);
      setState((prev) => ({ ...prev, wishlist }));
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error(t('messages.failedToLoadWishlist'));
    }
  }, [id, t]);

  const loadItems = useCallback(async () => {
    if (!id) return;

    try {
      const items = await AdminWishlistService.getWishlistItems(id);
      setState((prev) => ({ ...prev, items, loading: false }));
    } catch (error) {
      console.error('Load items error:', error);
      toast.error(t('messages.failedToLoadItems'));
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [id, t]);

  const loadShareLink = useCallback(async () => {
    if (!id) return;

    try {
      const shareLink = await AdminWishlistService.getShareLink(id);
      setState((prev) => ({ ...prev, shareLink }));
    } catch (error) {
      console.error('Load share link error:', error);
    }
  }, [id]);

  const generateShareLink = useCallback(async () => {
    if (!id) return null;

    setState((prev) => ({ ...prev, generatingLink: true }));
    try {
      const url = await AdminWishlistService.createShareLink(id);
      setState((prev) => ({ ...prev, shareLink: url }));
      return url;
    } catch (error) {
      console.error('Generate share link error:', error);
      toast.error(t('messages.failedToGenerateShareLink'));
      return null;
    } finally {
      setState((prev) => ({ ...prev, generatingLink: false }));
    }
  }, [id, t]);

  const handleCopyShareLink = useCallback(async () => {
    let linkToCopy = state.shareLink;

    if (!linkToCopy) {
      linkToCopy = await generateShareLink();
    }

    if (linkToCopy) {
      await navigator.clipboard.writeText(linkToCopy);
      toast.success(t('messages.shareLinkCopied'));
    }
  }, [state.shareLink, generateShareLink, t]);

  const handleUntakeItem = useCallback(async () => {
    if (!state.selectedUntakeItem) return;

    setState((prev) => ({ ...prev, untaking: true }));
    try {
      await AdminWishlistService.untakeItem(state.selectedUntakeItem.id);

      // Update local state
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === state.selectedUntakeItem!.id
            ? { ...item, is_taken: false, taken_by_name: null, taken_at: null }
            : item
        ),
        untakeDialogOpen: false,
        selectedUntakeItem: null,
        untaking: false,
      }));

      toast.success(t('messages.itemUntaken'));
    } catch (error) {
      console.error('Untake item error:', error);
      toast.error(t('messages.failedToUntakeItem'));
      setState((prev) => ({ ...prev, untaking: false }));
    }
  }, [state.selectedUntakeItem, t]);

  const openUntakeDialog = useCallback((item: WishlistItem) => {
    setState((prev) => ({
      ...prev,
      selectedUntakeItem: item,
      untakeDialogOpen: true,
    }));
  }, []);

  const setUntakeDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      untakeDialogOpen: open,
      ...(open ? {} : { selectedUntakeItem: null }),
    }));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        checkAdminAccess();
        loadWishlist();
        loadItems();
        loadShareLink();
      }
    });
  }, [navigate, checkAdminAccess, loadWishlist, loadItems, loadShareLink]);

  return {
    ...state,
    checkAdminAccess,
    loadWishlist,
    loadItems,
    loadShareLink,
    generateShareLink,
    handleCopyShareLink,
    handleUntakeItem,
    openUntakeDialog,
    setUntakeDialogOpen,
  };
};
