import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { InvitationData } from '../types';
import { WishlistInfo } from './WishlistInfo';
import { InviterInfo } from './InviterInfo';
import { AdminPrivileges } from './AdminPrivileges';
import { SignInActions } from './SignInActions';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
          <CardTitle className="text-2xl">
            {t('acceptInvitation.youveBeenInvited')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('acceptInvitation.invitedToManage')}
            </p>

            <WishlistInfo invitationData={invitationData} />
            <InviterInfo invitationData={invitationData} />
            <AdminPrivileges />
            <SignInActions onSignIn={onSignIn} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
