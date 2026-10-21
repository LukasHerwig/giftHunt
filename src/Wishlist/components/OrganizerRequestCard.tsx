import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/gh/StatusPill';
import { TextArea } from '@/components/gh/TextArea';
import { ChangeList } from './ChangeList';
import type { OrganizerRequest } from '../types';

interface OrganizerRequestCardProps {
  request: OrganizerRequest;
  ownerName: string;
  /** Only the first card's "Godkänn" is the page's primary action. */
  primary: boolean;
  busy: boolean;
  onResolve: (request: OrganizerRequest, approve: boolean, message: string) => void;
}

/** The owner's change as the organizer decides it: before → after, is it taken, answer with an optional message. */
export const OrganizerRequestCard = ({ request, ownerName, primary, busy, onResolve }: OrganizerRequestCardProps) => {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState('');

  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
    new Date(request.when),
  );
  const lead =
    request.kind === 'remove'
      ? t('wishlist.org.request.removeLead', { name: ownerName })
      : t('wishlist.org.request.editLead', { name: ownerName });
  const pill = request.claimed
    ? request.claimedBy
      ? t('wishlist.org.takenBy', { name: request.claimedBy })
      : t('wishlist.org.pillTaken')
    : t('publicWishlist.statusAvailable');

  return (
    <article className="flex flex-col gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{request.itemTitle}</h3>
        <p className="text-[13px] leading-[18px] text-gh-muted">
          {lead} · {t('wishlist.request.sent', { date })}
        </p>
      </header>

      <div>
        <StatusPill status={request.claimed ? 'taken' : 'available'}>{pill}</StatusPill>
      </div>

      {request.changes.length > 0 ? (
        <ChangeList changes={request.changes} />
      ) : (
        <p className="text-[14px] leading-5 text-gh-ink-2">{t('wishlist.org.request.removeNote')}</p>
      )}

      <TextArea
        label={`${t('wishlist.org.request.messageLabel', { name: ownerName })} ${t('wishlist.form.optional')}`}
        help={t('wishlist.org.request.messageHelp', { name: ownerName })}
        rows={2}
        maxLength={500}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => onResolve(request, false, message)}
          className="h-12 flex-1 rounded-gh-md px-3 text-[15px] font-semibold">
          {t('wishlist.org.request.keep')}
        </Button>
        <Button
          type="button"
          variant={primary ? 'default' : 'outline'}
          disabled={busy}
          onClick={() => onResolve(request, true, message)}
          className="h-12 flex-1 rounded-gh-md px-3 text-[15px] font-semibold">
          {t('wishlist.org.request.approve')}
        </Button>
      </div>
    </article>
  );
};
