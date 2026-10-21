import type { ReactNode } from 'react';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { Peek } from '@/components/brand/Peek';

interface ListSectionProps {
  title: string;
  count?: number;
  children: ReactNode;
}

/** A heading and a card of rows. Pass `<li>`s: each holds one ListRow. */
export const ListSection = ({ title, count, children }: ListSectionProps) => (
  <section className="flex flex-col gap-3">
    <SectionHeader title={title} count={count} />
    <Peek>
      <ul className="m-0 flex list-none flex-col divide-y divide-gh-line overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200 p-0">
        {children}
      </ul>
    </Peek>
  </section>
);
