import { useId, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  help?: string;
  error?: string;
}

export const TextArea = ({ label, help, error, rows = 3, className, ...input }: TextAreaProps) => {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || help ? messageId : undefined}
        className={cn(
          'min-h-[48px] w-full resize-y rounded-gh-md border bg-gh-surface-300 px-3 py-3 text-[16px] leading-6 text-gh-ink outline-none',
          'placeholder:text-gh-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gh-focus-ring',
          error ? 'border-gh-danger' : 'border-gh-line-strong',
        )}
        {...input}
      />
      {(error || help) && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={cn(
            'flex items-start gap-1 text-[13px] leading-[18px]',
            error ? 'text-gh-danger' : 'text-gh-muted',
          )}>
          {error && <AlertCircle className="mt-px h-4 w-4 flex-none" aria-hidden="true" />}
          <span>{error ?? help}</span>
        </p>
      )}
    </div>
  );
};
