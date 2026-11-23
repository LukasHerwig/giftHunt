import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { InitialAvatar } from '@/components/gh/InitialAvatar';
import { TextField } from '@/components/gh/TextField';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import type { HelperEntry } from '../lib/helpers';

interface HelpersSheetProps {
  helpers: HelperEntry[];
  listTitle: string;
  busy: boolean;
  onInvite: (email: string) => Promise<'invalid_email' | boolean>;
  onWithdraw: (invitationId: string) => Promise<void>;
  onRemove: (adminId: string) => Promise<void>;
  onClose: () => void;
}

/** The creator's view of who helps: invite, withdraw, remove. */
export const HelpersSheet = ({
  helpers,
  listTitle,
  busy,
  onInvite,
  onWithdraw,
  onRemove,
  onClose,
}: HelpersSheetProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  /** The row asking "sure?": an admin id or an invitation id. */
  const [confirming, setConfirming] = useState<string | null>(null);

  const people = helpers.filter((h): h is Extract<HelperEntry, { kind: 'helper' }> => h.kind === 'helper');
  const waiting = helpers.filter((h): h is Extract<HelperEntry, { kind: 'pending' }> => h.kind === 'pending');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await onInvite(email);
    setEmailError(result === 'invalid_email');
    if (result === true) setEmail('');
  };

  const confirmed = (action: () => Promise<void>) => async () => {
    await action();
    setConfirming(null);
  };

  const rowButton = 'h-10 shrink-0 rounded-gh-md px-3 text-[15px] font-semibold text-gh-danger hover:text-gh-danger';

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('wishlist.helpers.title')}
      subtitle={listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      <p className="text-[16px] leading-6 text-gh-ink-2">{t('wishlist.helpers.lead')}</p>

      {helpers.length === 0 && (
        <div className="flex flex-col gap-1 rounded-gh-lg bg-gh-surface-300 p-4">
          <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{t('wishlist.helpers.emptyTitle')}</h3>
          <p className="text-[14px] leading-5 text-gh-ink-2">{t('wishlist.helpers.emptyText')}</p>
        </div>
      )}

      {people.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
            {t('wishlist.helpers.sectionHelping')}
          </h3>
          {people.map((person) => (
            <div key={person.adminId} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <InitialAvatar name={person.name} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[16px] font-semibold leading-6 text-gh-ink">{person.name}</span>
                  {person.email && person.email !== person.name && (
                    <span className="truncate text-[13px] leading-[18px] text-gh-muted">{person.email}</span>
                  )}
                </div>
                {confirming !== person.adminId && (
                  <Button type="button" variant="ghost" onClick={() => setConfirming(person.adminId)} className={rowButton}>
                    {t('wishlist.helpers.remove')}
                  </Button>
                )}
              </div>
              {confirming === person.adminId && (
                <ConfirmBlock
                  destructive
                  question={t('wishlist.helpers.removeQuestion', { name: person.name })}
                  context={t('wishlist.helpers.removeContext', { name: person.name })}
                  confirmLabel={t('wishlist.helpers.removeConfirm', { name: person.name })}
                  cancelLabel={t('wishlist.confirm.cancel')}
                  loading={busy}
                  onConfirm={confirmed(() => onRemove(person.adminId))}
                  onCancel={() => setConfirming(null)}
                />
              )}
            </div>
          ))}
        </section>
      )}

      {waiting.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
            {t('wishlist.helpers.sectionWaiting')}
          </h3>
          {waiting.map((invite) => (
            <div key={invite.invitationId} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className="max-w-full truncate text-[16px] font-semibold leading-6 text-gh-ink">{invite.email}</span>
                  <span className="inline-flex min-h-[24px] items-center rounded-gh-pill bg-gh-warning-bg px-2 text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-warning">
                    {t('wishlist.helpers.invited')}
                  </span>
                </div>
                {confirming !== invite.invitationId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirming(invite.invitationId)}
                    className="h-10 shrink-0 rounded-gh-md px-3 text-[15px] font-semibold text-gh-ink">
                    {t('wishlist.helpers.withdraw')}
                  </Button>
                )}
              </div>
              {confirming === invite.invitationId && (
                <ConfirmBlock
                  question={t('wishlist.helpers.withdrawQuestion', { email: invite.email })}
                  context={t('wishlist.helpers.withdrawContext')}
                  confirmLabel={t('wishlist.helpers.withdraw')}
                  cancelLabel={t('wishlist.confirm.cancel')}
                  loading={busy}
                  onConfirm={confirmed(() => onWithdraw(invite.invitationId))}
                  onCancel={() => setConfirming(null)}
                />
              )}
            </div>
          ))}
        </section>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-3 border-t border-gh-line pt-6">
        <TextField
          label={t('wishlist.helpers.inviteLabel')}
          type="email"
          autoComplete="off"
          placeholder={t('wishlist.helpers.emailPlaceholder')}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(false);
          }}
          error={emailError ? t('wishlist.share.errors.invalid_email') : undefined}
        />
        <Button type="submit" disabled={busy} className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
          {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}
          {t('wishlist.helpers.invite')}
        </Button>
        <p className="text-[13px] leading-[18px] text-gh-muted">{t('wishlist.helpers.inviteCaption')}</p>
      </form>
    </ResponsiveSheet>
  );
};
