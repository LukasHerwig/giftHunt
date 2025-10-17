import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import AppHeader from '@/components/AppHeader';

export const ProfileNotFoundState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('messages.profileNotFound')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
