import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipProps {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** A rounded toggle for picking one value among a few. Selected = tint + check + aria-pressed. */
export const Chip = ({ selected = false, onClick, children }: ChipProps) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      'inline-flex min-h-[44px] items-center gap-1 rounded-gh-pill border px-4 text-[14px] font-semibold leading-5',
      'transition-colors active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
      selected
        ? 'border-transparent bg-gh-primary-tint text-gh-primary-strong'
        : 'border-gh-line-strong bg-gh-surface-200 text-gh-ink hover:bg-gh-surface-300',
    )}>
    {selected && <Check className="h-4 w-4" aria-hidden="true" />}
    {children}
  </button>
);
