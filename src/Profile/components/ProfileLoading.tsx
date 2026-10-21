import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const ProfileLoading = () => {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t('profile.loading')}
      className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pb-10 pt-6 md:px-8 md:pt-12">
      <Skeleton className="h-6 w-2/5 bg-gh-surface-300" />
      <Skeleton className="h-[52px] w-full rounded-gh-md bg-gh-surface-300" />
      <Skeleton className="h-[52px] w-full rounded-gh-md bg-gh-surface-300" />
      <Skeleton className="h-6 w-2/5 bg-gh-surface-300" />
      <Skeleton className="h-12 w-full rounded-gh-md bg-gh-surface-300" />
    </div>
  );
};
