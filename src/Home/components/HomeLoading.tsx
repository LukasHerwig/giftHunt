import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const HomeLoading = () => {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t('home.loading')}
      className={cn(PAGE_COLUMN, 'flex flex-col gap-8 pb-10 pt-6 md:pt-12')}>
      <Skeleton className="h-9 w-3/5 bg-gh-surface-300" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-2/5 bg-gh-surface-300" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-gh-lg bg-gh-surface-300" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-1/2 bg-gh-surface-300" />
        <Skeleton className="h-[72px] w-full rounded-gh-lg bg-gh-surface-300" />
      </div>
    </div>
  );
};
