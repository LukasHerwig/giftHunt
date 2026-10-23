import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { DangerButton } from '@/components/gh/DangerButton';
import { SwitchRow } from '@/components/gh/SwitchRow';
import { TextArea } from '@/components/gh/TextArea';
import { TextField } from '@/components/gh/TextField';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import type { SettingsValues, Wishlist } from '../types';

interface SettingsSheetProps {
  wishlist: Wishlist;
  busy: boolean;
  onSave: (values: SettingsValues) => Promise<'title_required' | null>;
  onDelete: () => void;
  onArchive: () => void;
  onClose: () => void;
}

export const SettingsSheet = ({ wishlist, busy, onSave, onDelete, onArchive, onClose }: SettingsSheetProps) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<SettingsValues>({
    title: wishlist.title,
    description: wishlist.description ?? '',
    enableLinks: wishlist.enable_links,
    enablePrice: wishlist.enable_price,
    enablePriority: wishlist.enable_priority,
  });
  const [titleError, setTitleError] = useState(false);
  const [confirming, setConfirming] = useState<'archive' | 'delete' | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTitleError((await onSave(values)) === 'title_required');
  };

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={confirming === 'archive' ? t('wishlist.settingsSheet.archive') : t('wishlist.settingsSheet.title')}
      subtitle={wishlist.title}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {confirming !== 'archive' && (
          <>
            <TextField
              label={t('wishlist.settingsSheet.listTitle')}
              value={values.title}
              onChange={(e) => {
                setValues({ ...values, title: e.target.value });
                setTitleError(false);
              }}
              error={titleError ? t('wishlist.settingsSheet.errors.title_required') : undefined}
              autoComplete="off"
            />
            <TextArea
              label={`${t('wishlist.settingsSheet.listDescription')} ${t('wishlist.form.optional')}`}
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
            <div className="divide-y divide-gh-line overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200">
              <SwitchRow
                label={t('wishlist.settingsSheet.links')}
                description={t('wishlist.settingsSheet.linksHelp')}
                checked={values.enableLinks}
                onChange={(enableLinks) => setValues({ ...values, enableLinks })}
              />
              <SwitchRow
                label={t('wishlist.settingsSheet.price')}
                description={t('wishlist.settingsSheet.priceHelp')}
                checked={values.enablePrice}
                onChange={(enablePrice) => setValues({ ...values, enablePrice })}
              />
              <SwitchRow
                label={t('wishlist.settingsSheet.priority')}
                description={t('wishlist.settingsSheet.priorityHelp')}
                checked={values.enablePriority}
                onChange={(enablePriority) => setValues({ ...values, enablePriority })}
              />
            </div>
          </>
        )}
        {confirming === 'archive' ? (
          <>
            <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[16px] leading-6 text-gh-ink">
              {!wishlist.is_self_managed && <li>{t('wishlist.settingsSheet.archiveOrganizer')}</li>}
              <li>{t('wishlist.settingsSheet.archiveLink')}</li>
              <li>{t('wishlist.settingsSheet.archiveRequests')}</li>
            </ul>
            <p className="text-[14px] leading-5 text-gh-ink-2">{t('wishlist.settingsSheet.archiveKept')}</p>
            <ConfirmBlock
              question={t('wishlist.settingsSheet.archiveQuestion', { title: wishlist.title })}
              context={t(wishlist.is_self_managed ? 'wishlist.settingsSheet.archiveContextSelf' : 'wishlist.settingsSheet.archiveContext')}
              confirmLabel={t('wishlist.settingsSheet.archiveAction')}
              cancelLabel={t('wishlist.confirm.cancel')}
              loading={busy}
              onConfirm={onArchive}
              onCancel={() => setConfirming(null)}
            />
          </>
        ) : confirming === 'delete' ? (
          <ConfirmBlock
            destructive
            question={t('wishlist.settingsSheet.deleteQuestion', { title: wishlist.title })}
            context={t('wishlist.settingsSheet.deleteContext')}
            confirmLabel={t('wishlist.settingsSheet.deleteAction')}
            cancelLabel={t('wishlist.confirm.cancel')}
            loading={busy}
            onConfirm={onDelete}
            onCancel={() => setConfirming(null)}
          />
        ) : (
          <>
            <Button type="submit" disabled={busy} className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
              {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
              {t('wishlist.settingsSheet.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming('archive')}
              className="h-12 w-full gap-2 rounded-gh-md text-[16px] font-semibold">
              <Archive aria-hidden="true" />
              {t('wishlist.settingsSheet.archive')}
            </Button>
            <DangerButton onClick={() => setConfirming('delete')}>{t('wishlist.settingsSheet.delete')}</DangerButton>
          </>
        )}
      </form>
    </ResponsiveSheet>
  );
};
