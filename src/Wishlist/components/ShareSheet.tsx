import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Loader2, MailCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { DangerButton } from '@/components/gh/DangerButton';
import { TextField } from '@/components/gh/TextField';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import type { OrganizerState } from '../types';

interface ShareSheetProps {
  organizer: OrganizerState;
  organizerName: string | null;
  inviteSentTo: string | null;
  listTitle: string;
  busy: boolean;
  onInvite: (email: string) => Promise<'invalid_email' | null>;
  onRevoke: (invitationId: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

/** Dela means: invite an organizer who shares the list for you. The owner never sees a link. */
export const ShareSheet = ({
  organizer,
  organizerName,
  inviteSentTo,
  listTitle,
  busy,
  onInvite,
  onRevoke,
  onRemove,
  onClose,
}: ShareSheetProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setEmailError((await onInvite(email)) === 'invalid_email');
  };

  const done = (
    <Button type="button" variant="outline" onClick={onClose} className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
      {t('wishlist.share.done')}
    </Button>
  );

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('wishlist.share.title')}
      subtitle={listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      {inviteSentTo ? (
        <>
          <div className="flex flex-col items-center gap-2 py-4 text-center text-gh-ink">
            <MailCheck
              className="h-12 w-12 text-gh-primary-strong duration-300 animate-in zoom-in-90 motion-reduce:animate-none"
              aria-hidden="true"
            />
            <h3 className="mt-2 text-[22px] font-bold leading-7">{t('wishlist.share.sentTitle')}</h3>
            <p className="text-[16px] leading-6 text-gh-ink-2">
              {t('wishlist.share.sentLead', { email: inviteSentTo })}
            </p>
            <p className="text-[13px] leading-[18px] text-gh-muted">{t('wishlist.share.sentNote')}</p>
          </div>
          {done}
        </>
      ) : organizer.kind === 'none' ? (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <h3 className="text-[18px] font-bold leading-6 text-gh-ink">{t('wishlist.share.inviteTitle')}</h3>
            <p className="text-[16px] leading-6 text-gh-ink-2">{t('wishlist.share.inviteLead')}</p>
          </div>
          <TextField
            label={t('wishlist.share.email')}
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(false);
            }}
            error={emailError ? t('wishlist.share.errors.invalid_email') : undefined}
          />
          <Button type="submit" disabled={busy} className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('wishlist.share.invite')}
          </Button>
        </form>
      ) : organizer.kind === 'pending' ? (
        <>
          <div className="flex items-start gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
            <Clock className="mt-0.5 h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{t('wishlist.share.pendingTitle')}</h3>
              <p className="text-[14px] leading-5 text-gh-ink-2">
                {t('wishlist.share.pendingText', { email: organizer.email })}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onRevoke(organizer.invitationId)}
            className="h-12 w-full rounded-gh-md text-[16px] font-semibold">
            {t('wishlist.share.revoke')}
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
            <Users className="mt-0.5 h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">
                {t('wishlist.share.acceptedTitle', { name: organizerName })}
              </h3>
              <p className="text-[14px] leading-5 text-gh-ink-2">
                {t('wishlist.share.acceptedText', { name: organizerName })}
              </p>
            </div>
          </div>
          {confirmingRemove ? (
            <ConfirmBlock
              destructive
              question={t('wishlist.share.removeQuestion', { name: organizerName })}
              context={t('wishlist.share.removeContext')}
              confirmLabel={t('wishlist.share.removeAction')}
              cancelLabel={t('wishlist.confirm.cancel')}
              loading={busy}
              onConfirm={onRemove}
              onCancel={() => setConfirmingRemove(false)}
            />
          ) : (
            <DangerButton onClick={() => setConfirmingRemove(true)}>
              {t('wishlist.share.removeOrganizer')}
            </DangerButton>
          )}
        </>
      )}
    </ResponsiveSheet>
  );
};
