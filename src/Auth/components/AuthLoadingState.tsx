import { useTranslation } from 'react-i18next';
import { RosettenLoader } from '@/components/brand';

export const AuthLoadingState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gh-bg">
      <RosettenLoader label={t('common.loading')} size={144} />
    </div>
  );
};
