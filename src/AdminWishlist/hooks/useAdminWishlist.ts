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
  ItemFormData,
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
    editDialogOpen: false,
    selectedEditItem: null,
    editFormData: {
      title: '',
      description: '',
      link: '',
      priceRange: '',
      priority: null,
    },
    updating: false,
    deleteDialogOpen: false,
    selectedDeleteItem: null,
    deleting: false,
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

  const openEditDialog = useCallback((item: WishlistItem) => {
    setState((prev) => ({
      ...prev,
      selectedEditItem: item,
      editFormData: {
        title: item.title,
        description: item.description || '',
        link: item.link || '',
        priceRange: item.price_range || '',
        priority: item.priority || null,
      },
      editDialogOpen: true,
    }));
  }, []);

  const setEditDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      editDialogOpen: open,
      ...(open
        ? {}
        : {
            selectedEditItem: null,
            editFormData: {
              title: '',
              description: '',
              link: '',
              priceRange: '',
              priority: null,
            },
          }),
    }));
  }, []);

  const setEditFormData = useCallback((data: ItemFormData) => {
    setState((prev) => ({
      ...prev,
      editFormData: data,
    }));
  }, []);

  const handleUpdateItem = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.selectedEditItem) return;

      setState((prev) => ({ ...prev, updating: true }));
      try {
        await AdminWishlistService.updateItem(state.selectedEditItem.id, {
          title: state.editFormData.title,
          description: state.editFormData.description,
          link: state.editFormData.link,
          price_range: state.editFormData.priceRange,
          priority: state.editFormData.priority || 0,
        });

        // Update local state
        setState((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === state.selectedEditItem!.id
              ? {
                  ...item,
                  title: state.editFormData.title,
                  description: state.editFormData.description || null,
                  link: state.editFormData.link || null,
                  price_range: state.editFormData.priceRange || null,
                  priority: state.editFormData.priority || 0,
                }
              : item
          ),
          editDialogOpen: false,
          selectedEditItem: null,
          editFormData: {
            title: '',
            description: '',
            link: '',
            priceRange: '',
            priority: null,
          },
          updating: false,
        }));

        toast.success(t('messages.itemUpdated'));
      } catch (error) {
        console.error('Update item error:', error);
        toast.error(t('messages.failedToUpdateItem'));
        setState((prev) => ({ ...prev, updating: false }));
      }
    },
    [state.selectedEditItem, state.editFormData, t]
  );

  const openDeleteDialog = useCallback((item: WishlistItem) => {
    setState((prev) => ({
      ...prev,
      selectedDeleteItem: item,
      deleteDialogOpen: true,
    }));
  }, []);

  const setDeleteDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      deleteDialogOpen: open,
      ...(open ? {} : { selectedDeleteItem: null }),
    }));
  }, []);

  const handleDeleteItem = useCallback(async () => {
    if (!state.selectedDeleteItem) return;

    setState((prev) => ({ ...prev, deleting: true }));
    try {
      await AdminWishlistService.deleteItem(state.selectedDeleteItem.id);

      // Update local state
      setState((prev) => ({
        ...prev,
        items: prev.items.filter(
          (item) => item.id !== state.selectedDeleteItem!.id
        ),
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
    openEditDialog,
    setEditDialogOpen,
    setEditFormData,
    handleUpdateItem,
    openDeleteDialog,
    setDeleteDialogOpen,
    handleDeleteItem,
  };
};
