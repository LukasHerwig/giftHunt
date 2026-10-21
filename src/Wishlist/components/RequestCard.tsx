import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/gh/StatusPill';
import { ChangeList } from './ChangeList';
import type { OwnerRequest } from '../types';

interface RequestCardProps {
  request: OwnerRequest;
  organizerName: string;
  busy: boolean;
  onWithdraw: (requestId: string) => void;
}

/** The owner's view of a change request: what was asked, then a neutral answer. */
export const RequestCard = ({ request, organizerName, busy, onWithdraw }: RequestCardProps) => {
  const { t, i18n } = useTranslation();

  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
    new Date(request.when),
  );
  const lead = request.kind === 'remove' ? t('wishlist.request.removeLead') : t('wishlist.request.editLead');
  const when =
    request.state === 'pending'
      ? t('wishlist.request.sent', { date })
      : t('wishlist.request.answered', { date });

  return (
    <article className="flex flex-col gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{request.itemTitle}</h3>
        <p className="text-[13px] leading-[18px] text-gh-muted">
          {lead} · {when}
        </p>
      </header>

      {request.changes.length > 0 && <ChangeList changes={request.changes} />}

      {request.state === 'pending' ? (
        <div className="flex flex-col items-start gap-3">
          <StatusPill status="pending">{t('wishlist.request.pending')}</StatusPill>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onWithdraw(request.id)}
            className="h-11 rounded-gh-md px-4 text-[15px] font-semibold">
            {t('wishlist.request.withdraw')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[16px] font-semibold leading-6 text-gh-ink">
            {request.state === 'applied'
              ? t('wishlist.request.applied')
              : t('wishlist.request.kept', { name: organizerName })}
          </p>
          {request.message && (
            <div className="rounded-gh-md bg-gh-surface-300 p-3">
              <p className="text-[12px] font-semibold leading-4 text-gh-muted">
                {t('wishlist.request.messageFrom', { name: organizerName })}
              </p>
              <p className="text-[15px] leading-[22px] text-gh-ink">{request.message}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
};
