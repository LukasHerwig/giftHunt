import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import { SelfManagedWishlistService } from '../services/SelfManagedWishlistService';
import {
  SelfManagedWishlistState,
  SelfManagedWishlistActions,
  WishlistItem,
  ItemFormData,
} from '../types';

const EMPTY_FORM: ItemFormData = {
  title: '',
  description: '',
  link: '',
  url: '',
  priceRange: '',
  priority: null,
  isGiftcard: false,
  claimCap: null,
};

export const useSelfManagedWishlist = (
  id: string | undefined,
): SelfManagedWishlistState & SelfManagedWishlistActions => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [state, setState] = useState<SelfManagedWishlistState>({
    wishlist: null,
    items: [],
    loading: true,
    shareLink: null,
    generatingLink: false,
    addDialogOpen: false,
    newItem: { ...EMPTY_FORM },
    adding: false,
    editDialogOpen: false,
    selectedEditItem: null,
    editFormData: { ...EMPTY_FORM },
    updating: false,
    deleteDialogOpen: false,
    selectedDeleteItem: null,
    deleting: false,
    untakeDialogOpen: false,
    selectedUntakeItem: null,
    untaking: false,
    deleteClaimDialogOpen: false,
    pendingDeleteClaim: null,
  });

  // Auto-fetch link metadata for new item
  useEffect(() => {
    if (!state.newItem.link?.trim()) return;
    const timer = setTimeout(async () => {
      const metadata = await fetchLinkMetadata(state.newItem.link);
      if (metadata?.image) {
        setState((prev) => ({
          ...prev,
          newItem: { ...prev.newItem, url: metadata.image },
        }));
      }
      if (metadata?.title && !state.newItem.title) {
        setState((prev) => ({
          ...prev,
          newItem: { ...prev.newItem, title: prev.newItem.title || metadata.title },
        }));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.newItem.link]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fetch link metadata for edit form
  useEffect(() => {
    if (!state.editFormData.link?.trim()) return;
    const timer = setTimeout(async () => {
      const metadata = await fetchLinkMetadata(state.editFormData.link);
      if (metadata?.image) {
        setState((prev) => ({
          ...prev,
          editFormData: { ...prev.editFormData, url: metadata.image },
        }));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.editFormData.link]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [wishlist, items, shareLink] = await Promise.all([
        SelfManagedWishlistService.getWishlist(id),
        SelfManagedWishlistService.getItems(id),
        SelfManagedWishlistService.getShareLink(id),
      ]);

      if (!wishlist.is_self_managed) {
        navigate('/');
        return;
      }

      setState((prev) => ({ ...prev, wishlist, items, shareLink, loading: false }));
    } catch (error) {
      console.error('Load error:', error);
      toast.error(t('messages.failedToLoadWishlist'));
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [id, navigate, t]);

  // Share link
  const handleCopyShareLink = useCallback(async () => {
    if (!id) return;
    setState((prev) => ({ ...prev, generatingLink: true }));
    try {
      let link = state.shareLink;
      if (!link) {
        link = await SelfManagedWishlistService.createShareLink(id);
        setState((prev) => ({ ...prev, shareLink: link }));
      }
      await navigator.clipboard.writeText(link!);
      toast.success(t('messages.shareLinkCopied'));
    } catch (error) {
      console.error('Share link error:', error);
      toast.error(t('messages.failedToGenerateShareLink'));
    } finally {
      setState((prev) => ({ ...prev, generatingLink: false }));
    }
  }, [id, state.shareLink, t]);

  // Add
  const setAddDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      addDialogOpen: open,
      ...(!open ? { newItem: { ...EMPTY_FORM } } : {}),
    }));
  }, []);

  const setNewItem = useCallback((item: ItemFormData) => {
    setState((prev) => ({ ...prev, newItem: item }));
  }, []);

  const handleAddItem = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id || !state.newItem.title.trim()) return;

      setState((prev) => ({ ...prev, adding: true }));
      try {
        const added = await SelfManagedWishlistService.addItem(id, state.newItem);
        setState((prev) => ({
          ...prev,
          items: [added, ...prev.items],
          newItem: { ...EMPTY_FORM },
          addDialogOpen: false,
          adding: false,
        }));
        toast.success(t('messages.itemAdded'));
      } catch (error) {
        console.error('Add item error:', error);
        toast.error(t('messages.failedToAdd'));
        setState((prev) => ({ ...prev, adding: false }));
      }
    },
    [id, state.newItem, t],
  );

  // Edit
  const openEditDialog = useCallback((item: WishlistItem) => {
    setState((prev) => ({
      ...prev,
      selectedEditItem: item,
      editFormData: {
        title: item.title,
        description: item.description || '',
        link: item.link || '',
        url: item.url || '',
        priceRange: item.price_range || '',
        priority: item.priority || null,
        isGiftcard: item.is_giftcard || false,
        claimCap: item.claim_cap ?? null,
      },
      editDialogOpen: true,
    }));
  }, []);

  const setEditDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      editDialogOpen: open,
      ...(!open ? { selectedEditItem: null, editFormData: { ...EMPTY_FORM } } : {}),
    }));
  }, []);

  const setEditFormData = useCallback((data: ItemFormData) => {
    setState((prev) => ({ ...prev, editFormData: data }));
  }, []);

  const handleUpdateItem = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.selectedEditItem) return;

      setState((prev) => ({ ...prev, updating: true }));
      try {
        await SelfManagedWishlistService.updateItem(
          state.selectedEditItem.id,
          state.editFormData,
        );
        setState((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === state.selectedEditItem!.id
              ? {
                  ...item,
                  title: state.editFormData.title,
                  description: state.editFormData.description || null,
                  link: state.editFormData.link || null,
                  url: state.editFormData.url || null,
                  price_range: state.editFormData.priceRange || null,
                  priority: state.editFormData.priority ?? 0,
                  is_giftcard: state.editFormData.isGiftcard,
                  claim_cap: state.editFormData.isGiftcard ? state.editFormData.claimCap : null,
                }
              : item,
          ),
          editDialogOpen: false,
          selectedEditItem: null,
          editFormData: { ...EMPTY_FORM },
          updating: false,
        }));
        toast.success(t('messages.itemUpdated'));
      } catch (error) {
        console.error('Update item error:', error);
        toast.error(t('messages.failedToUpdateItem'));
        setState((prev) => ({ ...prev, updating: false }));
      }
    },
    [state.selectedEditItem, state.editFormData, t],
  );

  // Delete
  const openDeleteDialog = useCallback((item: WishlistItem) => {
    setState((prev) => ({ ...prev, selectedDeleteItem: item, deleteDialogOpen: true }));
  }, []);

  const setDeleteDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      deleteDialogOpen: open,
      ...(!open ? { selectedDeleteItem: null } : {}),
    }));
  }, []);

  const handleDeleteItem = useCallback(async () => {
    if (!state.selectedDeleteItem) return;

    setState((prev) => ({ ...prev, deleting: true }));
    try {
      await SelfManagedWishlistService.deleteItem(state.selectedDeleteItem.id);
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== state.selectedDeleteItem!.id),
        deleteDialogOpen: false,
        selectedDeleteItem: null,
        deleting: false,
      }));
      toast.success(t('messages.itemDeleted'));
    } catch (error) {
      console.error('Delete item error:', error);
      toast.error(t('messages.failedToDeleteItem'));
      setState((prev) => ({ ...prev, deleting: false }));
    }
  }, [state.selectedDeleteItem, t]);

  // Untake
  const openUntakeDialog = useCallback((item: WishlistItem) => {
    setState((prev) => ({ ...prev, selectedUntakeItem: item, untakeDialogOpen: true }));
  }, []);

  const setUntakeDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      untakeDialogOpen: open,
      ...(!open ? { selectedUntakeItem: null } : {}),
    }));
  }, []);

  const openDeleteClaimDialog = useCallback(
    (claimId: string, itemId: string, name: string) => {
      setState((prev) => ({
        ...prev,
        pendingDeleteClaim: { id: claimId, itemId, name },
        deleteClaimDialogOpen: true,
      }));
    },
    [],
  );

  const setDeleteClaimDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      deleteClaimDialogOpen: open,
      ...(!open ? { pendingDeleteClaim: null } : {}),
    }));
  }, []);

  const handleDeleteClaim = useCallback(
    async (claimId: string, itemId: string) => {
      try {
        await SelfManagedWishlistService.deleteClaim(claimId);
        setState((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId
              ? { ...item, claims: item.claims?.filter((c) => c.id !== claimId) }
              : item,
          ),
          selectedEditItem:
            prev.selectedEditItem?.id === itemId
              ? {
                  ...prev.selectedEditItem,
                  claims: prev.selectedEditItem.claims?.filter(
                    (c) => c.id !== claimId,
                  ),
                }
              : prev.selectedEditItem,
        }));
        toast.success(t('messages.claimRemoved'));
      } catch (error) {
        console.error('Delete claim error:', error);
        toast.error(t('messages.failedToRemoveClaim'));
      }
    },
    [t],
  );

  const handleUntakeItem = useCallback(async () => {
    if (!state.selectedUntakeItem) return;

    setState((prev) => ({ ...prev, untaking: true }));
    try {
      await SelfManagedWishlistService.untakeItem(state.selectedUntakeItem.id);
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === state.selectedUntakeItem!.id
            ? { ...item, is_taken: false, taken_by_name: null, taken_at: null }
            : item,
        ),
        untakeDialogOpen: false,
        selectedUntakeItem: null,
        untaking: false,
      }));
      toast.success(t('messages.itemUntaken'));
    } catch (error) {
      console.error('Untake error:', error);
      toast.error(t('messages.failedToUntakeItem'));
      setState((prev) => ({ ...prev, untaking: false }));
    }
  }, [state.selectedUntakeItem, t]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/auth');
      else load();
    });
  }, [navigate, load]);

  return {
    ...state,
    handleCopyShareLink,
    setAddDialogOpen,
    setNewItem,
    handleAddItem,
    openEditDialog,
    setEditDialogOpen,
    setEditFormData,
    handleUpdateItem,
    openDeleteDialog,
    setDeleteDialogOpen,
    handleDeleteItem,
    openUntakeDialog,
    setUntakeDialogOpen,
    handleUntakeItem,
    handleDeleteClaim,
    openDeleteClaimDialog,
    setDeleteClaimDialogOpen,
  };
};
