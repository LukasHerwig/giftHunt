import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, User, ArrowRight } from 'lucide-react';

interface OnboardingStepProps {
  onComplete: (name: string) => Promise<void>;
  loading: boolean;
}

export const OnboardingStep = ({
  onComplete,
  loading,
}: OnboardingStepProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await onComplete(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">
              {t('onboarding.welcomeTitle')}
            </CardTitle>
            <CardDescription className="mt-2">
              {t('onboarding.welcomeDescription')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('onboarding.nameLabel')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onboarding.namePlaceholder')}
                className="h-12 text-base"
                disabled={loading}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t('onboarding.nameHelpText')}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-primary hover:bg-primary/90"
              disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('onboarding.saving')}
                </>
              ) : (
                <>
                  {t('onboarding.continue')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
