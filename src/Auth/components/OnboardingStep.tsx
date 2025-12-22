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
    <div className="min-h-screen bg-ios-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-ios-blue rounded-full flex items-center justify-center shadow-sm">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('onboarding.welcomeTitle')}
            </h1>
            <p className="text-ios-gray text-lg">
              {t('onboarding.welcomeDescription')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="bg-ios-secondary rounded-[10px] overflow-hidden">
              <div className="px-4">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('onboarding.namePlaceholder')}
                  className="w-full h-12 bg-transparent text-[17px] outline-none placeholder-[#C7C7CC] dark:placeholder-[#48484A]"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <p className="px-4 text-[13px] text-ios-gray">
              {t('onboarding.nameHelpText')}
            </p>
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-[12px] bg-ios-blue text-white text-[17px] font-semibold transition-all active:opacity-70 flex items-center justify-center disabled:opacity-50"
            disabled={loading || !name.trim()}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t('onboarding.continue')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
