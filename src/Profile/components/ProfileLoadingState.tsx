import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

export const ProfileLoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    </div>
  );
};
