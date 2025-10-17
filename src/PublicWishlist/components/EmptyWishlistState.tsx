import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

export const EmptyWishlistState = () => {
  const { t } = useTranslation();

  return (
    <Card className="text-center py-12">
      <CardContent>
        <p className="text-muted-foreground">
          {t('publicWishlist.noItemsYet')}
        </p>
      </CardContent>
    </Card>
  );
};
