import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AccessDeniedStateProps {
  token?: string;
}

export const AccessDeniedState = ({ token }: AccessDeniedStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <CardContent className="pt-6">
          <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            {t('publicWishlist.accessNotAvailable')}
          </h3>
          <p className="text-muted-foreground">
            {!token
              ? t('publicWishlist.requiresShareLink')
              : t('publicWishlist.invalidShareLink')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
