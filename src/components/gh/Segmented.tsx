import { cn } from '@/lib/utils';

interface SegmentedOption {
  value: string;
  label: string;
  count?: number;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

/** Two or three views side by side, e.g. "Lediga · Tagna", with counts in the segment. */
export const Segmented = ({ options, value, onChange, ariaLabel }: SegmentedProps) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className="flex w-full gap-1 rounded-gh-md bg-gh-surface-300 p-1">
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-gh-sm border px-3 text-[15px] font-semibold leading-5',
            'transition-colors motion-reduce:transition-none',
            selected
              ? 'border-gh-line bg-gh-surface-200 text-gh-ink'
              : 'border-transparent text-gh-ink-2 hover:text-gh-ink',
          )}>
          {option.label}
          {option.count != null && (
            <span className={cn('text-[13px]', selected ? 'text-gh-primary-strong' : 'text-gh-muted')}>
              {option.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
