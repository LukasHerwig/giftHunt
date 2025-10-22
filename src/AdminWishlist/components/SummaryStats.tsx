import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WishlistItem } from '../types';

interface SummaryStatsProps {
  items: WishlistItem[];
}

export const SummaryStats = ({ items }: SummaryStatsProps) => {
  const { t } = useTranslation();

  const takenItems = items.filter((item) => item.is_taken);
  const availableItems = items.filter((item) => !item.is_taken);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('adminWishlist.summary')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {items.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('adminWishlist.totalItems')}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {availableItems.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('adminWishlist.available')}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {takenItems.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('adminWishlist.taken')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
