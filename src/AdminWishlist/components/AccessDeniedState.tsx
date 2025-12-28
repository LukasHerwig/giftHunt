import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';

export const AccessDeniedState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-ios-background">
      <div className="w-20 h-20 bg-ios-red/10 rounded-[24px] flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-ios-red" />
      </div>
      <h1 className="text-[24px] font-bold text-foreground mb-2 text-center">
        {t('common.error')}
      </h1>
      <p className="text-[17px] text-ios-gray text-center max-w-xs">
        {t('adminWishlist.accessDenied')}
      </p>
    </div>
  );
};
