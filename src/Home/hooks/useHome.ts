import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/useAuth';
import { errorCode } from '@/Wishlist/lib/errorCode';
import { firstName, toInvitationRows, toOrganizedRows, toOwnedRows } from '../lib/homeRows';
import { validateNewList } from '../lib/newList';
import { HomeService } from '../services/HomeService';
import type { HomeData, NewListError, NewListForm } from '../types';

export const useHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const email = user?.email ?? '';
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // A second tap while an action runs must not start a second one.
  const running = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setData(await HomeService.loadHome(userId, email));
    } catch (error) {
      console.error('Load home error:', error);
      toast.error(t('home.toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [userId, email, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const owned = useMemo(() => toOwnedRows(data?.owned ?? []), [data]);
  const organized = useMemo(() => toOrganizedRows(data?.organized ?? []), [data]);
  const invitations = useMemo(() => toInvitationRows(data?.invitations ?? []), [data]);
  const greetingName = firstName(user?.user_metadata?.full_name as string | undefined);

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
        if (code === 'invitation_not_found' || code === 'already_accepted' || code === 'invitation_expired') {
          toast.error(t('home.toast.invitationGone'));
          await load();
        } else if (code === 'admin_already_exists') {
          toast.error(t('home.toast.organizerExists'));
          await load();
        } else if (code === 'email_not_confirmed') {
          toast.error(t('home.toast.emailNotConfirmed'));
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

  const createList = async (form: NewListForm): Promise<NewListError | null> => {
    const invalid = validateNewList(form);
    if (invalid) return invalid;
    if (!userId) return null;
    let id = '';
    const ok = await run(async () => {
      id = await HomeService.createList(userId, form);
    }, 'home.toast.createFailed');
    if (ok) {
      toast.success(t('home.toast.created'));
      navigate(`/wishlist/${id}`);
    }
    return null;
  };

  const acceptInvitation = async (invitationId: string) => {
    const ok = await run(() => HomeService.acceptInvitation(invitationId), 'home.toast.acceptFailed');
    if (ok) {
      toast.success(t('home.toast.accepted'));
      await load();
    }
  };

  const declineInvitation = async (invitationId: string) => {
    const ok = await run(() => HomeService.declineInvitation(invitationId), 'home.toast.declineFailed');
    if (ok) {
      toast.success(t('home.toast.declined'));
      await load();
    }
  };

  return {
    loading,
    owned,
    organized,
    invitations,
    greetingName,
    sheetOpen,
    busy,
    openSheet: () => setSheetOpen(true),
    closeSheet: () => setSheetOpen(false),
    createList,
    acceptInvitation,
    declineInvitation,
  };
};
