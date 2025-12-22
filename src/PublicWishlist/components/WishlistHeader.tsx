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
    <header className="sticky top-0 z-50 bg-ios-background/80 backdrop-blur-xl border-b border-ios-separator">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <GiftHuntIcon size={24} />
          <span className="text-[17px] font-semibold tracking-tight">
            GiftHunt
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>

      <div className="px-4 py-6 bg-ios-background">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight mb-1">
          {wishlist.title}
        </h1>
        {wishlist.creator_name && (
          <p className="text-[15px] text-ios-label-secondary mb-2">
            {t('publicWishlist.createdBy')} {wishlist.creator_name}
          </p>
        )}
        {wishlist.description && (
          <p className="text-[17px] text-ios-label-primary leading-relaxed">
            {wishlist.description}
          </p>
        )}
      </div>
    </header>
  );
};
