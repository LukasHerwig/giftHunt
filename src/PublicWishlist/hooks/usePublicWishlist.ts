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
          : t('publicWishlist.failedToLoad'),
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

    // Find the item to check if it's a gift card
    const selectedItemData = state.items.find(
      (item) => item.id === state.selectedItem,
    );
    const isGiftcard = selectedItemData?.is_giftcard || false;

    setState((prev) => ({ ...prev, claiming: true }));
    try {
      await PublicWishlistService.claimItem({
        itemId: state.selectedItem,
        buyerName: state.buyerName,
        isGiftcard,
      });

      // Update local state
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === state.selectedItem
            ? {
                ...item,
                // For regular items, mark as taken
                // For gift card items, increment claim count but don't mark as taken
                is_taken: isGiftcard ? item.is_taken : true,
                claim_count: isGiftcard
                  ? (item.claim_count || 0) + 1
                  : item.claim_count,
              }
            : item,
        ),
        buyerName: '',
        dialogOpen: false,
        selectedItem: null,
        claiming: false,
      }));

      toast.success(t('publicWishlist.itemClaimed'));
    } catch (error) {
      console.error('Claim item error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('publicWishlist.failedToClaim');
      toast.error(errorMessage);
      setState((prev) => ({ ...prev, claiming: false }));
    }
  }, [state.selectedItem, state.shareLink, state.buyerName, state.items, t]);

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
