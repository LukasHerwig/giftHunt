import { useId, type InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  help?: string;
  /** Replaces help; says what went wrong and what to do. */
  error?: string;
}

export const TextField = ({ label, help, error, className, ...input }: TextFieldProps) => {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
        {label}
      </label>
      <div
        className={cn(
          'flex min-h-[48px] items-center rounded-gh-md border bg-gh-surface-300 px-3',
          'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gh-focus-ring',
          error ? 'border-gh-danger' : 'border-gh-line-strong',
        )}>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || help ? messageId : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 text-[16px] leading-6 text-gh-ink outline-none placeholder:text-gh-subtle"
          {...input}
        />
      </div>
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
