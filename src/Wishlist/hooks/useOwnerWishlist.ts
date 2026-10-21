import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { WishlistService } from '../services/WishlistService';
import { toOwnerRequests } from '../lib/changeRequests';
import { buildProposal, validateItemForm } from '../lib/itemForm';
import type {
  ItemFormData,
  ItemFormError,
  OwnerData,
  OwnerItem,
  SettingsValues,
  Sheet,
} from '../types';

export const useOwnerWishlist = (wishlistId: string | undefined) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const [inviteSentTo, setInviteSentTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!wishlistId) {
      setLoading(false);
      return;
    }
    try {
      setData(await WishlistService.loadOwnerData(wishlistId));
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error(t('wishlist.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [wishlistId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const requests = useMemo(
    () => (data ? toOwnerRequests(data.requests, data.items, new Date()) : []),
    [data],
  );
  const pendingItemIds = useMemo(
    () =>
      new Set(
        requests.filter((r) => r.state === 'pending' && r.itemId).map((r) => r.itemId as string),
      ),
    [requests],
  );
  const organizerName =
    data?.organizer.kind === 'accepted'
      ? data.organizer.name || t('wishlist.organizerFallback')
      : null;

  /** Runs an action; maps the known error codes to a toast and reloads when the list changed under us. */
  const run = useCallback(
    async (action: () => Promise<void>, errorKey: string): Promise<boolean> => {
      setBusy(true);
      try {
        await action();
        return true;
      } catch (error) {
        console.error(error);
        const code = error instanceof Error ? error.message : '';
        if (code === 'edit_locked') {
          toast.error(t('wishlist.toast.listShared'));
          setSheet(null);
          await load();
        } else if (code === 'edit_directly') {
          toast.error(t('wishlist.toast.listChanged'));
          setSheet(null);
          await load();
        } else if (code === 'request_pending') {
          toast.error(t('wishlist.toast.requestPending'));
          await load();
        } else if (code === 'item_not_found') {
          toast.error(t('wishlist.toast.itemGone'));
          setSheet(null);
          await load();
        } else if (code === 'invite_pending') {
          toast.error(t('wishlist.toast.invitePending'));
          await load();
        } else {
          toast.error(t(errorKey));
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [t, load],
  );

  const closeSheet = useCallback(() => {
    setSheet(null);
    setInviteSentTo(null);
  }, []);

  const addItem = async (form: ItemFormData): Promise<ItemFormError | null> => {
    const invalid = validateItemForm(form);
    if (invalid) return invalid;
    if (!wishlistId) return null;
    const ok = await run(() => WishlistService.addItem(wishlistId, form), 'wishlist.toast.addFailed');
    if (ok) {
      toast.success(t('wishlist.toast.added'));
      closeSheet();
      await load();
    }
    return null;
  };

  /** Direct while the list is unshared, a change request once it is shared. */
  const saveItem = async (item: OwnerItem, form: ItemFormData): Promise<ItemFormError | null> => {
    const invalid = validateItemForm(form);
    if (invalid) return invalid;
    if (!data) return null;

    if (data.shared) {
      const ready = await WishlistService.withLinkImage(form);
      const proposal = buildProposal(item, ready);
      if (Object.keys(proposal).length === 0) {
        closeSheet();
        return null;
      }
      const ok = await run(
        () => WishlistService.requestEdit(item.id, proposal),
        'wishlist.toast.requestFailed',
      );
      if (ok) {
        toast.success(t('wishlist.toast.requestSent'));
        closeSheet();
        await load();
      }
      return null;
    }

    const ok = await run(() => WishlistService.updateItem(item.id, form), 'wishlist.toast.saveFailed');
    if (ok) {
      toast.success(t('wishlist.toast.saved'));
      closeSheet();
      await load();
    }
    return null;
  };

  const removeItem = async (item: OwnerItem) => {
    if (!data) return;
    const shared = data.shared;
    const ok = await run(
      () => (shared ? WishlistService.requestRemove(item.id) : WishlistService.deleteItem(item.id)),
      shared ? 'wishlist.toast.requestFailed' : 'wishlist.toast.removeFailed',
    );
    if (ok) {
      toast.success(t(shared ? 'wishlist.toast.requestRemoveSent' : 'wishlist.toast.removed'));
      closeSheet();
      await load();
    }
  };

  const withdrawRequest = async (requestId: string) => {
    const ok = await run(
      () => WishlistService.withdrawRequest(requestId),
      'wishlist.toast.withdrawFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.requestWithdrawn'));
      await load();
    }
  };

  const invite = async (email: string): Promise<'invalid_email' | null> => {
    const trimmed = email.trim();
    if (!wishlistId) return null;
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return 'invalid_email';
    const ok = await run(() => WishlistService.invite(wishlistId, trimmed), 'wishlist.toast.inviteFailed');
    if (ok) {
      setInviteSentTo(trimmed);
      await load();
    }
    return null;
  };

  const revokeInvitation = async (invitationId: string) => {
    const ok = await run(
      () => WishlistService.revokeInvitation(invitationId),
      'wishlist.toast.revokeFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.inviteRevoked'));
      await load();
    }
  };

  const removeOrganizer = async () => {
    if (!wishlistId) return;
    const ok = await run(
      () => WishlistService.removeOrganizer(wishlistId),
      'wishlist.toast.organizerRemoveFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.organizerRemoved'));
      await load();
    }
  };

  const saveSettings = async (values: SettingsValues): Promise<'title_required' | null> => {
    if (!wishlistId) return null;
    if (values.title.trim() === '') return 'title_required';
    const ok = await run(
      () => WishlistService.updateSettings(wishlistId, values),
      'wishlist.toast.settingsFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.settingsSaved'));
      closeSheet();
      await load();
    }
    return null;
  };

  const deleteList = async () => {
    if (!wishlistId) return;
    const ok = await run(() => WishlistService.deleteList(wishlistId), 'wishlist.toast.deleteFailed');
    if (ok) {
      toast.success(t('wishlist.toast.listDeleted'));
      navigate('/');
    }
  };

  return {
    loading,
    data,
    requests,
    pendingItemIds,
    organizerName,
    sheet,
    busy,
    inviteSentTo,
    openAdd: () => setSheet({ type: 'add' }),
    openItem: (itemId: string) => setSheet({ type: 'item', itemId }),
    openShare: () => setSheet({ type: 'share' }),
    openSettings: () => setSheet({ type: 'settings' }),
    closeSheet,
    addItem,
    saveItem,
    removeItem,
    withdrawRequest,
    invite,
    revokeInvitation,
    removeOrganizer,
    saveSettings,
    deleteList,
  };
};
