import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const InviteLoading = () => {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('acceptInvitation.loading')} className="flex flex-col gap-6">
      <Skeleton className="h-9 w-4/5 bg-gh-surface-300" />
      <Skeleton className="h-6 w-full bg-gh-surface-300" />
      <Skeleton className="h-[72px] w-full rounded-gh-lg bg-gh-surface-300" />
    </div>
  );
};
