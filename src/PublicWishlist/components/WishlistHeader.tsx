import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Wishlist } from '../types';
import GiftHuntIcon from '@/components/GiftHuntIcon';
import { ThemeToggle } from '@/components/ThemeToggle';

interface WishlistHeaderProps {
  wishlist: Wishlist;
}

export const WishlistHeader = ({ wishlist }: WishlistHeaderProps) => {
  const { t } = useTranslation();

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="container mx-auto px-4 py-6 text-center">
        <div className="mx-auto flex items-center justify-center mb-4 relative overflow-hidden">
          <GiftHuntIcon size={60} />
        </div>
        <h1 className="text-3xl font-bold mb-2">{wishlist.title}</h1>
        {wishlist.creator_name && (
          <p className="text-sm text-muted-foreground mb-2">
            {t('publicWishlist.createdBy')} {wishlist.creator_name}
          </p>
        )}
        {wishlist.description && (
          <p className="text-muted-foreground text-lg">
            {wishlist.description}
          </p>
        )}
      </div>
    </header>
  );
};
