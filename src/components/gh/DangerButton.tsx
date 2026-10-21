import type { ButtonHTMLAttributes } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DangerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/** Destructive actions are rust, never the pastel accent: full width, at the bottom of a sheet. */
export const DangerButton = ({ loading, children, className, disabled, ...props }: DangerButtonProps) => (
  <Button
    type="button"
    variant="outline"
    disabled={disabled || loading}
    className={cn(
      'h-12 w-full gap-2 rounded-gh-md border-gh-danger bg-transparent text-[16px] font-semibold text-gh-danger hover:bg-gh-danger-bg hover:text-gh-danger',
      className,
    )}
    {...props}>
    {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
    {children}
  </Button>
);
