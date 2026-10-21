import { useTranslation } from 'react-i18next';
import { AccountHeading } from '@/components/AccountShell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import type { InvitationProblem } from '../lib/invitation';

interface InviteProblemProps {
  problem: InvitationProblem;
  email?: string;
  onHome: () => void;
  onLeave: () => void;
  onRetry: () => void;
}

const wide = 'h-[52px] w-full rounded-gh-md text-[16px] font-semibold';

export const InviteProblem = ({ problem, email, onHome, onLeave, onRetry }: InviteProblemProps) => {
  const { t } = useTranslation();
  const home = (
    <Button type="button" variant="outline" onClick={onHome} className={wide}>
      {t('acceptInvitation.home')}
    </Button>
  );

  if (problem === 'gone') {
    return (
      <EmptyState
        pose="lost"
        size="screen"
        headingAs="h1"
        title={t('acceptInvitation.gone.title')}
        text={t('acceptInvitation.gone.text')}
        action={home}
      />
    );
  }

  if (problem === 'wrongAccount') {
    return (
      <>
        <AccountHeading
          title={t('acceptInvitation.wrongAccount.title')}
          lead={t('acceptInvitation.wrongAccount.text', { email: email ?? '' })}
        />
        <div className="flex flex-col gap-3">
          <Button type="button" onClick={onLeave} className={`${wide} text-[17px]`}>
            {t('acceptInvitation.wrongAccount.signOut')}
          </Button>
          <Button type="button" variant="ghost" onClick={onHome} className={wide}>
            {t('acceptInvitation.home')}
          </Button>
        </div>
      </>
    );
  }

  if (problem === 'unconfirmed') {
    return (
      <>
        <AccountHeading
          title={t('acceptInvitation.unconfirmed.title')}
          lead={t('acceptInvitation.unconfirmed.text')}
        />
        {home}
      </>
    );
  }

  return (
    <>
      <AccountHeading title={t('acceptInvitation.failed.title')} lead={t('acceptInvitation.failed.text')} />
      <div className="flex flex-col gap-3">
        <Button type="button" onClick={onRetry} className={`${wide} text-[17px]`}>
          {t('acceptInvitation.failed.retry')}
        </Button>
        {home}
      </div>
    </>
  );
};
