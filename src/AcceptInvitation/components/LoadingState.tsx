import { Loader2 } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const LoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4">
        <LanguageSwitcher />
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};
