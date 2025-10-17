import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface ErrorStateProps {
  error: string;
  onGoHome: () => void;
}

export const ErrorState = ({ error, onGoHome }: ErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="max-w-md text-center">
        <CardContent className="pt-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t('acceptInvitation.invalidInvitation')}
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={onGoHome}>
            {t('acceptInvitation.goToHome')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};