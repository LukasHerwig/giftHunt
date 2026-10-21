import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/gh/Segmented';
import { TextArea } from '@/components/gh/TextArea';
import { TextField } from '@/components/gh/TextField';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import type { ListKind, NewListError, NewListForm } from '../types';

interface NewListSheetProps {
  busy: boolean;
  onSubmit: (form: NewListForm) => Promise<NewListError | null>;
  onClose: () => void;
}

/** Mount it when it opens so every open starts empty. */
export const NewListSheet = ({ busy, onSubmit, onClose }: NewListSheetProps) => {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ListKind>('own');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<NewListError | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(await onSubmit({ kind, title, description }));
  };

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('home.new.title')}
      closeLabel={t('home.new.close')}
      showTitleOnMobile>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Segmented
          ariaLabel={t('home.new.kindLabel')}
          value={kind}
          onChange={(value) => setKind(value as ListKind)}
          options={[
            { value: 'own', label: t('home.new.own') },
            { value: 'other', label: t('home.new.other') },
          ]}
        />
        <p className="text-[14px] leading-5 text-gh-muted">
          {kind === 'own' ? t('home.new.ownHint') : t('home.new.otherHint')}
        </p>
        <TextField
          label={t('home.new.name')}
          placeholder={t('home.new.namePlaceholder')}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          error={error ? t(`home.new.errors.${error}`) : undefined}
          autoComplete="off"
        />
        <TextArea
          label={`${t('home.new.description')} ${t('home.new.optional')}`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit" disabled={busy} className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {t('home.new.create')}
        </Button>
      </form>
    </ResponsiveSheet>
  );
};
