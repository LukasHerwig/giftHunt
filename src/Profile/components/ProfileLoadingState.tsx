import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export const ProfileLoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ios-background">
      <div className="w-16 h-16 bg-ios-secondary backdrop-blur-xl rounded-[24px] flex items-center justify-center border border-ios-separator/10 shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin text-ios-blue" />
      </div>
      <span className="mt-4 text-[17px] font-medium text-foreground">
        {t('common.loading')}
      </span>
    </div>
  );
};
