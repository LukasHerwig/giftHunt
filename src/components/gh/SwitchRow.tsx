import { cn } from '@/lib/utils';

interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** A full-width row that toggles as a whole. */
export const SwitchRow = ({ label, description, checked, onChange }: SwitchRowProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left">
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="text-[16px] font-semibold leading-6 text-gh-ink">{label}</span>
      {description && <span className="text-[13px] leading-[18px] text-gh-muted">{description}</span>}
    </span>
    <span
      aria-hidden="true"
      className={cn(
        'relative h-7 w-12 flex-none rounded-gh-pill transition-colors motion-reduce:transition-none',
        checked ? 'bg-gh-primary-strong' : 'bg-gh-line-strong',
      )}>
      <span
        className={cn(
          'absolute top-0.5 h-6 w-6 rounded-gh-pill bg-white shadow transition-transform motion-reduce:transition-none',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </span>
  </button>
);
