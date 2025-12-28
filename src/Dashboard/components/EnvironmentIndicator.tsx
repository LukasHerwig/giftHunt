import { useTranslation } from 'react-i18next';

export const EnvironmentIndicator = () => {
  const { t } = useTranslation();

  if (!import.meta.env.VITE_SUPABASE_URL?.includes('127.0.0.1')) {
    return null;
  }

  return (
    <div className="bg-orange-500 text-white text-center py-1 text-[12px] font-semibold uppercase tracking-wider">
      {t('dashboard.localDevMode')}
    </div>
  );
};
