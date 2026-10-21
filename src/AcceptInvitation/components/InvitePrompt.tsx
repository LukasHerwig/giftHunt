import { useTranslation } from 'react-i18next';
import { AccountHeading } from '@/components/AccountShell';
import { Button } from '@/components/ui/button';
import type { InvitationData } from '../types';

interface InvitePromptProps {
  invitation: InvitationData;
  onSignIn: () => void;
  onSignUp: () => void;
}

export const InvitePrompt = ({ invitation, onSignIn, onSignUp }: InvitePromptProps) => {
  const { t } = useTranslation();
  const name = invitation.inviterName;
  return (
    <>
      <AccountHeading
        title={name ? t('acceptInvitation.titleNamed', { name }) : t('acceptInvitation.titleNoName')}
        lead={t('acceptInvitation.lead')}
      />
      <article className="flex flex-col gap-1 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
        <span className="text-[13px] leading-[18px] text-gh-muted">{t('acceptInvitation.listLabel')}</span>
        <h2 className="text-[20px] font-semibold leading-[26px] text-gh-ink">{invitation.title}</h2>
      </article>
      <div className="flex flex-col gap-3">
        <p className="text-[14px] leading-5 text-gh-muted">{t('acceptInvitation.note')}</p>
        <Button type="button" onClick={onSignIn} className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
          {t('acceptInvitation.signIn')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSignUp}
          className="h-[52px] w-full rounded-gh-md text-[16px] font-semibold">
          {t('acceptInvitation.signUp')}
        </Button>
      </div>
    </>
  );
};
