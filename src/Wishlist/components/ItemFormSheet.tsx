import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { DangerButton } from '@/components/gh/DangerButton';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import { emptyItemForm, formFromItem } from '../lib/itemForm';
import { ItemFormFields } from './ItemFormFields';
import type { ItemFormData, ItemFormError, OwnerItem } from '../types';

interface ItemFormSheetProps {
  mode: 'add' | 'edit';
  /** The item being edited. */
  item?: OwnerItem;
  /** The list is shared: edits and removals become requests. */
  shared: boolean;
  organizerName: string | null;
  /** This item already has an open request. */
  pending: boolean;
  listTitle: string;
  busy: boolean;
  onSubmit: (form: ItemFormData) => Promise<ItemFormError | null>;
  onRemove: () => void;
  onClose: () => void;
}

/** Mount with a `key` so every open starts from a fresh form. */
export const ItemFormSheet = ({
  mode,
  item,
  shared,
  organizerName,
  pending,
  listTitle,
  busy,
  onSubmit,
  onRemove,
  onClose,
}: ItemFormSheetProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<ItemFormData>(() =>
    mode === 'edit' && item ? formFromItem(item) : emptyItemForm(),
  );
  const [error, setError] = useState<ItemFormError | null>(null);
  const [resolving, setResolving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const asking = shared && mode === 'edit';
  const name = organizerName ?? t('wishlist.organizerFallback');

  const change = (patch: Partial<ItemFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  /** Pasting a link fills the title (if empty) and the picture. */
  const resolveLink = async () => {
    const link = form.link.trim();
    if (!link || form.url) return;
    setResolving(true);
    const metadata = await fetchLinkMetadata(link);
    setResolving(false);
    if (!metadata) return;
    setForm((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : (metadata.title ?? prev.title),
      url: prev.url || (metadata.image ?? ''),
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(await onSubmit(form));
  };

  const primaryLabel =
    mode === 'add'
      ? t('wishlist.form.add')
      : asking
        ? t('wishlist.form.sendRequest', { name })
        : t('wishlist.form.save');

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={mode === 'add' ? t('wishlist.form.addTitle') : t('wishlist.form.editTitle')}
      subtitle={asking ? t('wishlist.form.requestContext', { name }) : listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      {pending ? (
        <>
          <p className="text-[16px] leading-6 text-gh-ink-2">{t('wishlist.form.pendingNote')}</p>
          <Button type="button" variant="outline" onClick={onClose} className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
            {t('wishlist.form.close')}
          </Button>
        </>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <ItemFormFields
            form={form}
            mode={mode}
            error={error}
            resolving={resolving}
            onChange={change}
            onLinkBlur={resolveLink}
          />
          {confirmingRemove ? (
            <ConfirmBlock
              destructive
              question={
                shared
                  ? t('wishlist.confirm.requestRemoveQuestion', { name, title: item?.title })
                  : t('wishlist.confirm.removeQuestion', { title: item?.title })
              }
              context={
                shared
                  ? t('wishlist.confirm.requestRemoveContext', { name })
                  : t('wishlist.confirm.removeContext')
              }
              confirmLabel={shared ? t('wishlist.confirm.requestRemoveAction') : t('wishlist.confirm.removeAction')}
              cancelLabel={t('wishlist.confirm.cancel')}
              loading={busy}
              onConfirm={onRemove}
              onCancel={() => setConfirmingRemove(false)}
            />
          ) : (
            <>
              <Button type="submit" disabled={busy} className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
                {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
                {primaryLabel}
              </Button>
              {mode === 'edit' && (
                <DangerButton onClick={() => setConfirmingRemove(true)}>
                  {shared ? t('wishlist.form.requestRemove', { name }) : t('wishlist.form.remove')}
                </DangerButton>
              )}
            </>
          )}
        </form>
      )}
    </ResponsiveSheet>
  );
};
