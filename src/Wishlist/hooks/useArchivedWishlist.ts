import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { WishlistService } from '../services/WishlistService';
import type { ArchivedData } from '../types';

export const useArchivedWishlist = (wishlistId: string, onModeChange: () => void) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<ArchivedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await WishlistService.loadArchivedData(wishlistId));
    } catch (error) {
      console.error('Load archived wishlist error:', error);
      toast.error(t('wishlist.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [wishlistId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const restore = async () => {
    setBusy(true);
    try {
      await WishlistService.unarchiveList(wishlistId);
      toast.success(t('wishlist.toast.restored'), 'wink');
      onModeChange();
    } catch (error) {
      console.error(error);
      toast.error(t('wishlist.toast.restoreFailed'));
    } finally {
      setBusy(false);
    }
  };

  const deleteList = async () => {
    setBusy(true);
    try {
      await WishlistService.deleteList(wishlistId);
      toast.success(t('wishlist.toast.listDeleted'), 'teary');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(t('wishlist.toast.deleteFailed'));
      setBusy(false);
    }
  };

  return {
    loading,
    data,
    busy,
    confirmingDelete,
    restore,
    deleteList,
    askDelete: () => setConfirmingDelete(true),
    cancelDelete: () => setConfirmingDelete(false),
  };
};
