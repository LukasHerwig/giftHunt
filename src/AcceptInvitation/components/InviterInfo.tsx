import { useTranslation } from 'react-i18next';
import { InvitationData } from '../types';

interface InviterInfoProps {
  invitationData: InvitationData;
}

export const InviterInfo = ({ invitationData }: InviterInfoProps) => {
  const { t } = useTranslation();

  if (!invitationData.inviterEmail) return null;

  return (
    <div className="bg-muted/50 border p-3 rounded-lg">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium">{t('acceptInvitation.invitedBy')}:</span>{' '}
        {invitationData.inviterEmail === 'Someone'
          ? t('acceptInvitation.someone')
          : invitationData.inviterEmail}
      </p>
    </div>
  );
};
