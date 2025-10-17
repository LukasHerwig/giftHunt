import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface SignInActionsProps {
  onSignIn: () => void;
}

export const SignInActions = ({ onSignIn }: SignInActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('acceptInvitation.signInToAccept')}
      </p>

      <Button
        onClick={onSignIn}
        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
        size="lg">
        {t('acceptInvitation.signInCreateAccount')}
      </Button>

      <p className="text-xs text-muted-foreground">
        {t('acceptInvitation.afterSignInInfo')}
      </p>
    </div>
  );
};