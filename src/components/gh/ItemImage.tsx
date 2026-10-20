import { useState } from 'react';
import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemImageProps {
  src?: string | null;
  alt?: string;
  /** Sizes and shapes the box, e.g. "h-14 w-14 rounded-gh-sm". */
  className?: string;
  iconClassName?: string;
}

/** The item's picture, or a gift icon when it has none or fails to load. */
export const ItemImage = ({ src, alt = '', className, iconClassName = 'h-6 w-6' }: ItemImageProps) => {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn(
        'relative flex flex-none items-center justify-center overflow-hidden bg-gh-surface-300 text-gh-muted',
        className,
      )}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Gift className={iconClassName} aria-hidden="true" />
      )}
    </span>
  );
};
