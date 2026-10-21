import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { AccountHeading } from '@/components/AccountShell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/gh/TextField';
import { validateName, type NameError } from '@/lib/personName';

interface OnboardingStepProps {
  onComplete: (name: string) => Promise<void>;
  loading: boolean;
}

export const OnboardingStep = ({ onComplete, loading }: OnboardingStepProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState<NameError | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    const invalid = validateName(name);
    setError(invalid);
    if (invalid) return;
    await onComplete(name.trim());
  };

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader hideAvatar />
      <main className="mx-auto flex w-full max-w-[440px] flex-col gap-8 px-4 pb-10 pt-10 md:pt-16">
        <AccountHeading title={t('onboarding.title')} lead={t('onboarding.lead')} />
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField
            label={t('onboarding.nameLabel')}
            autoComplete="name"
            placeholder={t('onboarding.namePlaceholder')}
            value={name}
            error={error ? t(`onboarding.errors.${error}`) : undefined}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />
          <Button
            type="submit"
            disabled={loading}
            className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
            {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('onboarding.continue')}
          </Button>
        </form>
      </main>
    </div>
  );
};
