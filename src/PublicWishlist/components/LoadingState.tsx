import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export const LoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2">{t('common.loading')}</span>
    </div>
  );
};
