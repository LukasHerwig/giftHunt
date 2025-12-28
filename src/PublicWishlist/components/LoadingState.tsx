import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export const LoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ios-background">
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl p-8 rounded-[32px] border border-ios-separator/10 dark:border-white/10 shadow-xl flex flex-col items-center">
        <Loader2 className="w-10 h-10 animate-spin text-ios-blue mb-4" />
        <span className="text-[17px] font-medium text-ios-label-primary">
          {t('common.loading')}
        </span>
      </div>
    </div>
  );
};
