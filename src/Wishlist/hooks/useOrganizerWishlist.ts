import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { errorCode } from '../lib/errorCode';
import type { HelperEntry } from '../lib/helpers';
import { validateItemForm } from '../lib/itemForm';
import { leavesWhenListGone } from '../lib/mode';
import { splitItems } from '../lib/organizerItems';
import { toOrganizerRequests } from '../lib/organizerRequests';
import { OrganizerService, shareUrl } from '../services/OrganizerService';
import { WishlistService } from '../services/WishlistService';
import type {
  ClaimRow,
  ItemFormData,
  ItemFormError,
  OrganizerData,
  OrganizerItem,
  OrganizerRequest,
  Mode,
  OrganizerSheet,
  SettingsValues,
} from '../types';

export type Segment = 'available' | 'taken';

export const useOrganizerWishlist = (
  wishlistId: string | undefined,
  onModeChange?: () => void,
  mode: Mode = 'organizer',
) => {
  /** Helpers are loaded only for the creator of a self-managed list. */
  const loadsHelpers = mode === 'self';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<OrganizerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<OrganizerSheet>(null);
  const [segment, setSegment] = useState<Segment>('available');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpers, setHelpers] = useState<HelperEntry[]>([]);
  // A second tap while an action runs must not start a second one (busy only updates after a render).
  const running = useRef(false);

  const load = useCallback(async () => {
    if (!wishlistId) {
      setLoading(false);
      return;
    }
    try {
      const loaded = await OrganizerService.loadOrganizerData(wishlistId);
      setData(loaded);
      if (loadsHelpers) {
        setHelpers(await OrganizerService.loadHelpers(wishlistId, loaded.wishlist.creator_id));
      }
    } catch (error) {
      console.error('Load organizer wishlist error:', error);
      if (leavesWhenListGone(mode, errorCode(error))) {
        // Removed from the list while the screen was open: the page resolves its mode again and goes Home.
        toast.error(t('wishlist.helper.toast.notOnList'), 'lost');
        onModeChange?.();
        return;
      }
      toast.error(t('wishlist.org.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [wishlistId, loadsHelpers, mode, onModeChange, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(
    () => (data ? splitItems(data.items, data.claims) : { available: [], taken: [] }),
    [data],
  );
  const requests = useMemo(
    () => (data ? toOrganizerRequests(data.requests, data.items, data.claims, new Date()) : []),
    [data],
  );

  /** Runs an action; known error codes become a clear toast and, where the list changed under us, a reload. */
  const run = useCallback(
    async (action: () => Promise<void>, errorKey: string): Promise<boolean> => {
      if (running.current) return false;
      running.current = true;
      setBusy(true);
      try {
        await action();
        return true;
      } catch (error) {
        console.error(error);
        const code = errorCode(error);
        if (code === 'not_pending' || code === 'request_not_found') {
          toast.error(t('wishlist.org.toast.requestAnswered'), 'lost');
          await load();
        } else if (code === 'item_not_found' || code === 'edit_locked') {
          toast.error(t('wishlist.org.toast.itemGone'), 'lost');
          setSheet(null);
          await load();
        } else if (code === 'claim_not_found') {
          toast.error(t('wishlist.org.toast.claimGone'), 'lost');
          await load();
        } else if (code === 'share_link_not_found') {
          toast.error(t('wishlist.org.toast.linkGone'), 'lost');
          await load();
        } else if (code === 'invite_pending') {
          toast.error(t('wishlist.helpers.toast.invitePending'));
          await load();
        } else if (code === 'cannot_invite_self') {
          toast.error(t('wishlist.helpers.toast.inviteSelf'));
        } else if (code === 'already_helper') {
          toast.error(t('wishlist.helpers.toast.alreadyHelper'));
          await load();
        } else if (code === 'not_helper') {
          toast.error(t('wishlist.helpers.toast.helperGone'), 'lost');
          await load();
        } else {
          toast.error(t(errorKey));
        }
        return false;
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [t, load],
  );

  const closeSheet = useCallback(() => setSheet(null), []);

  /** Self-managed lists only: an invited organizer cannot add items (the database refuses it). */
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

  const saveItem = async (item: OrganizerItem, form: ItemFormData): Promise<ItemFormError | null> => {
    const invalid = validateItemForm(form);
    if (invalid) return invalid;
    const ok = await run(() => WishlistService.updateItem(item.id, form), 'wishlist.toast.saveFailed');
    if (ok) {
      toast.success(t('wishlist.toast.saved'), 'wink');
      closeSheet();
      await load();
    }
    return null;
  };

  const removeItem = async (item: OrganizerItem) => {
    const ok = await run(() => WishlistService.deleteItem(item.id), 'wishlist.toast.removeFailed');
    if (ok) {
      toast.success(t('wishlist.toast.removed'), 'teary');
      closeSheet();
      await load();
    }
  };

  const untake = async (item: OrganizerItem) => {
    const ok = await run(() => OrganizerService.untake(item.id), 'wishlist.org.toast.untakeFailed');
    if (ok) {
      toast.success(t('wishlist.org.toast.madeFree'), 'wink');
      closeSheet();
      await load();
    }
  };

  const removeClaim = async (claim: ClaimRow) => {
    const ok = await run(
      () => OrganizerService.removeClaim(claim.id),
      'wishlist.org.toast.removeClaimFailed',
    );
    if (ok) {
      toast.success(t('wishlist.org.toast.claimRemoved'), 'teary');
      await load();
    }
  };

  const resolveRequest = async (request: OrganizerRequest, approve: boolean, message: string) => {
    const ok = await run(
      () => OrganizerService.resolveRequest(request.id, approve, message),
      'wishlist.org.toast.resolveFailed',
    );
    if (ok) {
      toast.success(t(approve ? 'wishlist.org.toast.approved' : 'wishlist.org.toast.kept'), 'wink');
      await load();
    }
  };

  const createLink = async () => {
    if (!wishlistId) return;
    const ok = await run(() => OrganizerService.createShareLink(wishlistId).then(() => undefined), 'wishlist.org.toast.linkFailed');
    if (ok) await load();
  };

  const setLinkActive = async (active: boolean) => {
    if (!wishlistId) return;
    const ok = await run(
      () => OrganizerService.setShareLinkActive(wishlistId, active).then(() => undefined),
      'wishlist.org.toast.linkFailed',
    );
    if (ok) {
      toast.success(t(active ? 'wishlist.org.toast.linkOn' : 'wishlist.org.toast.linkOff'), active ? 'happy' : 'sleep');
      await load();
    }
  };

  /** Never says "copied" unless the browser really copied it. */
  const copyLink = async () => {
    if (!data?.shareLink) return;
    try {
      await navigator.clipboard.writeText(shareUrl(data.shareLink.token));
      setCopied(true);
      toast.success(t('wishlist.org.toast.linkCopied'), 'wink');
      window.setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Copy link error:', error);
      toast.error(t('wishlist.org.toast.copyFailed'));
    }
  };

  /** Settings and deleting the list: self-managed lists only. */
  const saveSettings = async (values: SettingsValues): Promise<'title_required' | null> => {
    if (!wishlistId) return null;
    if (values.title.trim() === '') return 'title_required';
    const ok = await run(
      () => WishlistService.updateSettings(wishlistId, values),
      'wishlist.toast.settingsFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.settingsSaved'), 'wink');
      closeSheet();
      await load();
    }
    return null;
  };

  const deleteList = async () => {
    if (!wishlistId) return;
    const ok = await run(() => WishlistService.deleteList(wishlistId), 'wishlist.toast.deleteFailed');
    if (ok) {
      toast.success(t('wishlist.toast.listDeleted'), 'teary');
      navigate('/');
    }
  };


  const archiveList = async () => {
    if (!wishlistId) return;
    const ok = await run(() => WishlistService.archiveList(wishlistId), 'wishlist.toast.archiveFailed');
    if (ok) {
      toast.success(t('wishlist.toast.archived'), 'sleep');
      closeSheet();
      onModeChange?.();
    }
  };

  /** A helper steps down: the list is no longer theirs to open. */
  const leaveList = async () => {
    if (!wishlistId || !data) return;
    const title = data.wishlist.title;
    // not_helper: the creator already removed them, so they are off the list either way.
    let alreadyOff = false;
    const ok = await run(async () => {
      try {
        await OrganizerService.leave(wishlistId);
      } catch (error) {
        if (errorCode(error) !== 'not_helper') throw error;
        alreadyOff = true;
      }
    }, 'wishlist.helper.toast.leaveFailed');
    if (ok && alreadyOff) {
      toast.error(t('wishlist.helper.toast.notOnList'), 'lost');
      navigate('/');
    } else if (ok) {
      toast.success(t('wishlist.helper.toast.left', { title }), 'teary');
      navigate('/');
    }
  };

  /** Self-managed lists only. Returns whether the invitation went out (the form clears on true). */
  const inviteHelper = async (email: string): Promise<'invalid_email' | boolean> => {
    const trimmed = email.trim();
    if (!wishlistId) return false;
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return 'invalid_email';
    let emailSent = true;
    const ok = await run(async () => {
      emailSent = (await WishlistService.invite(wishlistId, trimmed)).emailSent;
    }, 'wishlist.toast.inviteFailed');
    if (ok) {
      if (emailSent) toast.success(t('wishlist.helpers.toast.invited', { email: trimmed }), 'wink');
      else toast.error(t('wishlist.share.sentFailedLead', { email: trimmed }));
      await load();
    }
    return ok;
  };

  const withdrawHelperInvite = async (invitationId: string) => {
    const ok = await run(
      () => WishlistService.revokeInvitation(invitationId),
      'wishlist.toast.revokeFailed',
    );
    if (ok) {
      toast.success(t('wishlist.toast.inviteRevoked'), 'teary');
      await load();
    }
  };

  const removeHelper = async (adminId: string) => {
    if (!wishlistId) return;
    const ok = await run(
      () => OrganizerService.removeHelper(wishlistId, adminId),
      'wishlist.helpers.toast.removeFailed',
    );
    if (ok) {
      toast.success(t('wishlist.helpers.toast.removed'), 'teary');
      await load();
    }
  };

  return {
    loading,
    helpers,
    data,
    groups,
    requests,
    sheet,
    segment,
    busy,
    copied,
    setSegment,
    openAdd: () => setSheet({ type: 'add' }),
    openItem: (itemId: string) => setSheet({ type: 'item', itemId }),
    openEdit: (itemId: string) => setSheet({ type: 'edit', itemId }),
    openShare: () => setSheet({ type: 'share' }),
    openSettings: () => setSheet({ type: 'settings' }),
    openHelpers: () => setSheet({ type: 'helpers' }),
    closeSheet,
    addItem,
    saveItem,
    removeItem,
    untake,
    removeClaim,
    resolveRequest,
    createLink,
    setLinkActive,
    copyLink,
    saveSettings,
    deleteList,
    archiveList,
    leaveList,
    inviteHelper,
    withdrawHelperInvite,
    removeHelper,
  };
};
