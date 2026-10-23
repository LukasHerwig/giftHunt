import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/gh/ListRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import type { ArchivedRow } from '../types';

interface ArchivedSectionProps {
  rows: ArchivedRow[];
  onOpen: (id: string) => void;
}

/** The owner's archived lists, folded away until asked for. */
export const ArchivedSection = ({ rows, onOpen }: ArchivedSectionProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <SectionHeader title={t('home.sectionArchived')} count={rows.length} />
        <Button
          type="button"
          variant="ghost"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="h-11 gap-1 rounded-gh-md px-3 text-[15px] font-semibold text-gh-primary-strong">
          {open ? t('home.archivedHide') : t('home.archivedShow')}
          <Chevron aria-hidden="true" />
        </Button>
      </div>
      {open && (
        <ul className="m-0 flex list-none flex-col divide-y divide-gh-line overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200 p-0">
          {rows.map((row) => (
            <li key={row.id}>
              <ListRow
                muted
                icon={Archive}
                title={row.title}
                subtitle={[t('home.items', { count: row.itemCount }), t('home.archivedLabel')].join(' · ')}
                chevron
                onClick={() => onOpen(row.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
