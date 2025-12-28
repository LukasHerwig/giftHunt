import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'standard' | 'glass';
}

export const BackButton = ({
  to,
  onClick,
  className,
  variant = 'standard',
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-sm border active:opacity-50',
        variant === 'standard'
          ? 'bg-ios-secondary hover:bg-ios-tertiary text-foreground border-ios-separator/10'
          : 'bg-black/20 backdrop-blur-md hover:bg-black/30 text-white border-white/10',
        className
      )}>
      <ChevronLeft className="w-6 h-6" />
    </button>
  );
};
