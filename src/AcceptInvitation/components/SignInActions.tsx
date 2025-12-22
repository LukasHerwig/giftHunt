import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface SignInActionsProps {
  onSignIn: () => void;
}

export const SignInActions = ({ onSignIn }: SignInActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-[15px] text-ios-label-secondary text-center px-4">
        {t('acceptInvitation.signInToAccept')}
      </p>

      <Button
        onClick={onSignIn}
        className="w-full h-12 rounded-[12px] bg-ios-blue hover:bg-ios-blue/90 text-white font-semibold text-[17px]">
        {t('acceptInvitation.signInCreateAccount')}
      </Button>

      <p className="text-[13px] text-ios-label-secondary text-center px-4">
        {t('acceptInvitation.afterSignInInfo')}
      </p>
    </div>
  );
};
