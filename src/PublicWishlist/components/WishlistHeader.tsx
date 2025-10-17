import { Gift } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Wishlist } from '../types';

interface WishlistHeaderProps {
  wishlist: Wishlist;
}

export const WishlistHeader = ({ wishlist }: WishlistHeaderProps) => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="container mx-auto px-4 py-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{wishlist.title}</h1>
        {wishlist.description && (
          <p className="text-muted-foreground text-lg">
            {wishlist.description}
          </p>
        )}
      </div>
    </header>
  );
};
