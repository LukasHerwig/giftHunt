import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const WishlistLoading = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gh-bg">
      <div
        role="status"
        aria-label={t('wishlist.loading')}
        className={cn(PAGE_COLUMN, 'flex flex-col gap-6 pb-10 pt-8 md:pt-12')}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-3/4 bg-gh-surface-300" />
          <Skeleton className="h-5 w-full max-w-[420px] bg-gh-surface-300" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-gh-lg bg-gh-surface-300" />
          ))}
        </div>
      </div>
    </div>
  );
};
