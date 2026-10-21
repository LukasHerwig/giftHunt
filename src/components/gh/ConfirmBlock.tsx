import { useId } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmBlockProps {
  question: string;
  context?: string;
  /** Names what happens: "Ta bort önskningen", never "OK". */
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** An inline confirming question at the bottom of a sheet, replacing its action row. */
export const ConfirmBlock = ({
  question,
  context,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmBlockProps) => {
  const questionId = useId();
  return (
    <div
      role="group"
      aria-labelledby={questionId}
      className={cn(
        'flex flex-col gap-3 rounded-gh-lg border p-4',
        destructive ? 'border-transparent bg-gh-danger-bg' : 'border-gh-line bg-gh-surface-300',
      )}>
      <div className="flex flex-col gap-1">
        <p id={questionId} className="text-[17px] font-semibold leading-[22px] text-gh-ink">
          {question}
        </p>
        {context && <p className="text-[14px] leading-5 text-gh-ink-2">{context}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          variant={destructive ? 'outline' : 'default'}
          className={cn(
            'h-12 w-full gap-2 rounded-gh-md text-[16px] font-semibold',
            destructive && 'border-gh-danger bg-gh-surface-200 text-gh-danger hover:bg-gh-surface-100 hover:text-gh-danger',
          )}>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="h-12 w-full rounded-gh-md text-[16px] font-semibold text-gh-ink">
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
};
