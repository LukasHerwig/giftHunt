import { useTranslation } from 'react-i18next';

export const AdminPrivileges = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-muted/50 p-4 rounded-lg">
      <h4 className="font-medium mb-2">
        {t('acceptInvitation.asAdminYouCan')}
      </h4>
      <ul className="text-sm space-y-1 text-muted-foreground">
        <li>• {t('acceptInvitation.seeItemsTaken')}</li>
        <li>• {t('acceptInvitation.shareWishlistLink')}</li>
        <li>• {t('acceptInvitation.coordinateGifts')}</li>
        <li>• {t('acceptInvitation.helpManage')}</li>
      </ul>
    </div>
  );
};