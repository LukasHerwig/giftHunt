import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export const DashboardLoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ios-background gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-ios-blue" />
      <span className="text-[17px] text-ios-gray font-medium">
        {t('common.loading')}
      </span>
    </div>
  );
};
