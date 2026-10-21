import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { TextField } from '@/components/gh/TextField';
import type { NameError } from '@/lib/personName';

interface AboutSectionProps {
  email: string;
  fullName: string;
  error: NameError | null;
  changed: boolean;
  saving: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export const AboutSection = ({ email, fullName, error, changed, saving, onChange, onSubmit }: AboutSectionProps) => {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <SectionHeader title={t('profile.sectionAbout')} />
      <TextField
        label={t('profile.name')}
        value={fullName}
        autoComplete="name"
        placeholder={t('profile.namePlaceholder')}
        error={error ? t(`profile.errors.${error}`) : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <TextField label={t('profile.email')} value={email} readOnly disabled help={t('profile.emailHelp')} />
      <div>
        <Button
          type="submit"
          disabled={!changed || saving}
          className="h-[52px] w-full gap-2 rounded-gh-md px-6 text-[17px] font-semibold md:w-auto">
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          {t('profile.save')}
        </Button>
      </div>
    </form>
  );
};
