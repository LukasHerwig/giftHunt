import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { priorityName } from '../lib/itemForm';
import type { ChangedField, FieldChange, FieldValue } from '../types';

/** "Pris  ca 250 kr → ca 300 kr", one row per changed field. */
export const ChangeList = ({ changes }: { changes: FieldChange[] }) => {
  const { t } = useTranslation();

  const formatValue = (field: ChangedField, value: FieldValue | undefined): string => {
    if (value === null || value === undefined || value === '') return t('wishlist.request.emptyValue');
    if (field === 'image') return t('wishlist.request.imageChanged');
    if (field === 'giftcard') return value ? t('wishlist.request.yes') : t('wishlist.request.no');
    if (field === 'priority') {
      const name = priorityName(Number(value));
      return name ? t(`wishlist.form.prio.${name}`) : t('wishlist.request.emptyValue');
    }
    return String(value);
  };

  return (
    <dl className="flex flex-col gap-1">
      {changes.map((change) => (
        <div key={change.field} className="flex flex-wrap items-baseline gap-x-2 text-[14px] leading-5">
          <dt className="text-gh-muted">{t(`wishlist.request.field.${change.field}`)}</dt>
          <dd className="flex flex-wrap items-center gap-x-2 text-gh-ink">
            {change.before !== undefined && (
              <>
                <span className="text-gh-muted line-through">{formatValue(change.field, change.before)}</span>
                <ArrowRight className="h-4 w-4 text-gh-muted" aria-hidden="true" />
              </>
            )}
            <span className="font-semibold">{formatValue(change.field, change.after)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
