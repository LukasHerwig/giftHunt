import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import type { InvitationRow } from '../types';

interface InvitationCardProps {
  invitation: InvitationRow;
  busy: boolean;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

/** An invitation to organize someone's list: accept or turn it down right on the card. */
export const InvitationCard = ({ invitation, busy, onAccept, onDecline }: InvitationCardProps) => {
  const { t } = useTranslation();
  const [declining, setDeclining] = useState(false);
  const name = invitation.inviterName;

  return (
    <article className="flex flex-col gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{invitation.title}</h3>
        <p className="text-[14px] leading-5 text-gh-ink-2">
          {name ? t('home.invitation.text', { name }) : t('home.invitation.textNoName')}
        </p>
      </div>
      {declining ? (
        <ConfirmBlock
          destructive
          question={t('home.invitation.declineQuestion', { title: invitation.title })}
          context={t('home.invitation.declineContext')}
          confirmLabel={t('home.invitation.declineAction')}
          cancelLabel={t('home.invitation.cancel')}
          loading={busy}
          onConfirm={() => onDecline(invitation.id)}
          onCancel={() => setDeclining(false)}
        />
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setDeclining(true)}
            className="h-[52px] flex-1 rounded-gh-md text-[16px] font-semibold md:flex-none md:px-6">
            {t('home.invitation.decline')}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => onAccept(invitation.id)}
            className="h-[52px] flex-1 gap-2 rounded-gh-md text-[16px] font-semibold md:flex-none md:px-6">
            <Check aria-hidden="true" />
            {t('home.invitation.accept')}
          </Button>
        </div>
      )}
    </article>
  );
};
