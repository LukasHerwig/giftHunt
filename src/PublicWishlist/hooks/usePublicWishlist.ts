import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { PublicWishlistService } from '../services/PublicWishlistService';
import {
  loadClaimedItemIds,
  loadGiverName,
  rememberClaimedItem,
  saveGiverName,
} from '../lib/giverMemory';
import { PublicWishlistState } from '../types';

/** Errors after which the list on screen may be out of date. */
const CONFLICT_CODES = ['already_taken', 'claim_cap_reached', 'item_not_found', 'invalid_link'];
const KNOWN_CODES = [...CONFLICT_CODES, 'already_claimed', 'invalid_name'];

export const usePublicWishlist = (token?: string) => {
  const { t } = useTranslation();
  const [state, setState] = useState<PublicWishlistState>(() => ({
    wishlist: null,
    items: [],
    loading: true,
    shareLink: null,
    selectedItemId: null,
    receipt: null,
    buyerName: '',
    nameError: false,
    claiming: false,
    claimedIds: token ? loadClaimedItemIds(token) : [],
  }));

  const loadWishlistByToken = useCallback(async () => {
    if (!token) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { wishlist, items, shareLink } =
        await PublicWishlistService.loadWishlistByToken(token);
      setState((prev) => ({ ...prev, wishlist, items, shareLink, loading: false }));
    } catch (error) {
      console.error('Load wishlist error:', error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [token]);

  /** Reload the items quietly, e.g. after someone else took the one on screen. */
  const refreshItems = useCallback(async () => {
    if (!token) return;
    try {
      const { items } = await PublicWishlistService.loadWishlistByToken(token);
      setState((prev) => ({ ...prev, items }));
    } catch (error) {
      console.error('Refresh wishlist error:', error);
    }
  }, [token]);

  const openItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      selectedItemId: itemId,
      receipt: null,
      buyerName: loadGiverName(),
      nameError: false,
    }));
  }, []);

  const closeSheet = useCallback(() => {
    setState((prev) => ({ ...prev, selectedItemId: null, receipt: null, nameError: false }));
  }, []);

  const setBuyerName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, buyerName: name, nameError: false }));
  }, []);

  const claimItem = useCallback(async () => {
    const item = state.items.find((i) => i.id === state.selectedItemId);
    if (!token || !item || state.claiming) return;

    const name = state.buyerName.trim();
    if (name === '' || name.length > 100) {
      setState((prev) => ({ ...prev, nameError: true }));
      return;
    }

    setState((prev) => ({ ...prev, claiming: true }));
    try {
      await PublicWishlistService.claimItem({ token, itemId: item.id, buyerName: name });
      saveGiverName(name);
      rememberClaimedItem(token, item.id);
      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) => {
          if (i.id !== item.id) return i;
          return i.is_giftcard
            ? { ...i, claim_count: (i.claim_count ?? 0) + 1 }
            : { ...i, is_taken: true };
        }),
        claimedIds: prev.claimedIds.includes(item.id)
          ? prev.claimedIds
          : [...prev.claimedIds, item.id],
        receipt: {
          name,
          title: item.title,
          price: prev.wishlist?.enable_price ? item.price_range : null,
          link: prev.wishlist?.enable_links ? item.link : null,
        },
        claiming: false,
      }));
    } catch (error) {
      console.error('Claim item error:', error);
      const code = error instanceof Error ? error.message : '';
      toast.error(
        KNOWN_CODES.includes(code)
          ? t(`publicWishlist.claimErrors.${code}`)
          : t('publicWishlist.failedToClaim'),
      );
      setState((prev) => ({ ...prev, claiming: false }));
      if (CONFLICT_CODES.includes(code)) void refreshItems();
    }
  }, [token, state.items, state.selectedItemId, state.buyerName, state.claiming, t, refreshItems]);

  return {
    ...state,
    loadWishlistByToken,
    openItem,
    closeSheet,
    setBuyerName,
    claimItem,
  };
};
