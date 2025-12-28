import { useTranslation } from 'react-i18next';
import { InvitationData } from '../types';
import { User } from 'lucide-react';

interface InviterInfoProps {
  invitationData: InvitationData;
}

export const InviterInfo = ({ invitationData }: InviterInfoProps) => {
  const { t } = useTranslation();

  if (!invitationData.inviterEmail) return null;

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="w-10 h-10 rounded-full bg-ios-green/10 flex items-center justify-center flex-shrink-0">
        <User className="w-5 h-5 text-ios-green" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] text-ios-label-secondary">
          {t('acceptInvitation.invitedBy')}
        </p>
        <p className="text-[17px] font-medium truncate">
          {invitationData.inviterEmail === 'Someone'
            ? t('acceptInvitation.someone')
            : invitationData.inviterEmail}
        </p>
      </div>
    </div>
  );
};
