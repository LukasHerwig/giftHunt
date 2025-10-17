import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

export const AccessDeniedState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            {t('adminWishlist.accessDenied')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
