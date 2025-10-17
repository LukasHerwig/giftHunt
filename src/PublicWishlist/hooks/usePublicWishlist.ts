import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PublicWishlistService } from '../services/PublicWishlistService';
import { PublicWishlistState, WishlistItem } from '../types';

export const usePublicWishlist = (token?: string) => {
  const { t } = useTranslation();
  const [state, setState] = useState<PublicWishlistState>({
    wishlist: null,
    items: [],
    loading: true,
    shareLink: null,
    selectedItem: null,
    buyerName: '',
    claiming: false,
    dialogOpen: false,
  });

  const loadWishlistByToken = useCallback(async () => {
    if (!token) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { wishlist, items, shareLink } =
        await PublicWishlistService.loadWishlistByToken(token);
      setState((prev) => ({
        ...prev,
        wishlist,
        items,
        shareLink,
        loading: false,
      }));
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('publicWishlist.failedToLoad')
      );
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [token, t]);

  const claimItem = useCallback(async () => {
    if (!state.selectedItem || !state.shareLink) return;

    if (!state.buyerName.trim()) {
      toast.error(t('publicWishlist.nameRequired'));
      return;
    }

    setState((prev) => ({ ...prev, claiming: true }));
    try {
      await PublicWishlistService.claimItem({
        itemId: state.selectedItem,
        buyerName: state.buyerName,
      });

      // Update local state
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === state.selectedItem ? { ...item, is_taken: true } : item
        ),
        buyerName: '',
        dialogOpen: false,
        selectedItem: null,
        claiming: false,
      }));

      toast.success(t('publicWishlist.itemClaimed'));
    } catch (error) {
      console.error('Claim item error:', error);
      toast.error(t('publicWishlist.failedToClaim'));
      setState((prev) => ({ ...prev, claiming: false }));
    }
  }, [state.selectedItem, state.shareLink, state.buyerName, t]);

  const openClaimDialog = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      selectedItem: itemId,
      dialogOpen: true,
    }));
  }, []);

  const closeClaimDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dialogOpen: false,
      selectedItem: null,
      buyerName: '',
    }));
  }, []);

  const setBuyerName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, buyerName: name }));
  }, []);

  return {
    ...state,
    loadWishlistByToken,
    claimItem,
    openClaimDialog,
    closeClaimDialog,
    setBuyerName,
  };
};
