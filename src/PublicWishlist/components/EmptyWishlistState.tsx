import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { EmptyState } from '@/components/gh/EmptyState';

export const EmptyWishlistState = ({ creatorName }: { creatorName: string | null }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={Gift}
      title={t('publicWishlist.emptyTitle')}
      text={
        creatorName
          ? t('publicWishlist.emptyText', { name: creatorName })
          : t('publicWishlist.emptyTextNoName')
      }
    />
  );
};
