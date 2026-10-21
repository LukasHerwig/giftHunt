import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/gh/Chip';
import { SwitchRow } from '@/components/gh/SwitchRow';
import { TextArea } from '@/components/gh/TextArea';
import { TextField } from '@/components/gh/TextField';
import type { ItemFormData, ItemFormError } from '../types';

const PRIORITIES: { value: number | null; key: 'none' | 'low' | 'medium' | 'high' }[] = [
  { value: null, key: 'none' },
  { value: 1, key: 'low' },
  { value: 2, key: 'medium' },
  { value: 3, key: 'high' },
];

interface ItemFormFieldsProps {
  form: ItemFormData;
  mode: 'add' | 'edit';
  error: ItemFormError | null;
  resolving: boolean;
  onChange: (patch: Partial<ItemFormData>) => void;
  onLinkBlur: () => void;
}

/** Title first, everything else optional. Shared by adding and editing. */
export const ItemFormFields = ({ form, mode, error, resolving, onChange, onLinkBlur }: ItemFormFieldsProps) => {
  const { t } = useTranslation();
  const optional = t('wishlist.form.optional');
  const titleError =
    error === 'title_required' || error === 'title_too_long'
      ? t(`wishlist.form.errors.${error}`)
      : undefined;
  const capError = error === 'claim_cap_invalid' ? t('wishlist.form.errors.claim_cap_invalid') : undefined;

  return (
    <>
      <TextField
        label={mode === 'add' ? t('wishlist.form.titleAsk') : t('wishlist.form.title')}
        placeholder={mode === 'add' ? t('wishlist.form.titlePlaceholder') : undefined}
        value={form.title}
        onChange={(e) => onChange({ title: e.target.value })}
        error={titleError}
        autoComplete="off"
      />
      <TextField
        label={`${t('wishlist.form.link')} ${optional}`}
        inputMode="url"
        autoCapitalize="none"
        autoComplete="off"
        value={form.link}
        // A new link means a new picture: clear the old one so it is fetched again.
        onChange={(e) => onChange({ link: e.target.value, url: '' })}
        onBlur={onLinkBlur}
        help={resolving ? t('wishlist.form.linkLoading') : t('wishlist.form.linkHelp')}
      />
      <TextField
        label={`${t('wishlist.form.price')} ${optional}`}
        value={form.priceRange}
        onChange={(e) => onChange({ priceRange: e.target.value })}
        autoComplete="off"
      />
      <TextArea
        label={`${t('wishlist.form.description')} ${optional}`}
        value={form.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
          {t('wishlist.form.priority')} <span className="font-normal text-gh-muted">{optional}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map(({ value, key }) => (
            <Chip key={key} selected={form.priority === value} onClick={() => onChange({ priority: value })}>
              {t(`wishlist.form.prio.${key}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200">
        <SwitchRow
          label={t('wishlist.form.giftCard')}
          description={t('wishlist.form.giftCardHelp')}
          checked={form.isGiftcard}
          onChange={(checked) => onChange({ isGiftcard: checked, claimCap: checked ? form.claimCap : null })}
        />
      </div>
      {form.isGiftcard && (
        <TextField
          label={`${t('wishlist.form.claimCap')} ${optional}`}
          type="number"
          min={1}
          inputMode="numeric"
          value={form.claimCap ?? ''}
          onChange={(e) => onChange({ claimCap: e.target.value === '' ? null : Number(e.target.value) })}
          help={t('wishlist.form.claimCapHelp')}
          error={capError}
        />
      )}
    </>
  );
};
