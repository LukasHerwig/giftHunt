import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { InvitationData } from '../types';
import { WishlistInfo } from './WishlistInfo';
import { InviterInfo } from './InviterInfo';
import { AdminPrivileges } from './AdminPrivileges';
import { SignInActions } from './SignInActions';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SuccessStateProps {
  invitationData: InvitationData;
  onSignIn: () => void;
}

export const SuccessState = ({
  invitationData,
  onSignIn,
}: SuccessStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-ios-background">
      <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-ios-green/10 rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-ios-green" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight mb-2">
            {t('acceptInvitation.youveBeenInvited')}
          </h1>
          <p className="text-[17px] text-ios-label-secondary">
            {t('acceptInvitation.invitedToManage')}
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-ios-secondary rounded-[12px] border border-ios-separator overflow-hidden">
            <WishlistInfo invitationData={invitationData} />
            <div className="ml-16 border-b border-ios-separator" />
            <InviterInfo invitationData={invitationData} />
          </div>

          <AdminPrivileges />

          <div className="pt-4">
            <SignInActions onSignIn={onSignIn} />
          </div>
        </div>
      </div>
    </div>
  );
};
