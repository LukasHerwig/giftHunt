import { useTranslation } from 'react-i18next';
import { Star, Check, Gift, ExternalLink } from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';

interface WishlistItemCardProps {
  item: WishlistItem;
  wishlist: Wishlist;
  onClaimItem: (itemId: string) => void;
}

export const WishlistItemCard = ({
  item,
  wishlist,
  onClaimItem,
}: WishlistItemCardProps) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => !item.is_taken && onClaimItem(item.id)}
      disabled={item.is_taken}
      className={`relative aspect-square bg-ios-secondary rounded-[24px] overflow-hidden group active:scale-[0.97] transition-all text-left border border-ios-separator/5 shadow-sm ${
        item.is_taken ? 'opacity-50 grayscale-[0.5]' : ''
      }`}>
      {/* Image Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ios-tertiary/10 to-ios-tertiary/30">
        <div className="relative">
          <Gift className="w-12 h-12 text-ios-blue opacity-10 absolute -top-2 -left-2" />
          <Gift className="w-16 h-16 text-ios-blue opacity-20 absolute top-2 left-2" />
          <Gift className="w-20 h-20 text-ios-blue relative z-10" />
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
        <div className="flex flex-col gap-1.5">
          {item.priority === 3 && (
            <div className="bg-white/80 dark:bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-ios-separator/10 dark:border-white/10">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            </div>
          )}
          {wishlist?.enable_price && item.price_range && (
            <div className="bg-white/80 dark:bg-black/20 backdrop-blur-md px-2 py-1 rounded-full border border-ios-separator/10 dark:border-white/10">
              <span className="text-[10px] font-bold text-foreground dark:text-white">
                {item.price_range}
              </span>
            </div>
          )}
          {item.is_taken && (
            <div className="bg-ios-green/20 backdrop-blur-md px-2 py-1 rounded-full border border-ios-green/30 flex items-center gap-1">
              <Check className="w-3 h-3 text-ios-green" />
              <span className="text-[10px] font-bold text-ios-green uppercase tracking-wider">
                {t('publicWishlist.taken')}
              </span>
            </div>
          )}
        </div>

        {item.link && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                item.link?.startsWith('http')
                  ? item.link
                  : `https://${item.link}`,
                '_blank'
              );
            }}
            className="bg-ios-blue/20 backdrop-blur-md p-2 rounded-full border border-ios-blue/30 hover:bg-ios-blue/40 transition-colors">
            <ExternalLink className="w-4 h-4 text-ios-blue" />
          </div>
        )}
      </div>

      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/95 via-white/50 to-transparent dark:from-zinc-900/90 dark:via-zinc-900/50 dark:to-transparent z-10">
        <h4 className="text-[15px] font-bold text-foreground dark:text-white truncate leading-tight">
          {item.title}
        </h4>
        {item.description && (
          <p className="text-[11px] text-muted-foreground dark:text-white/70 line-clamp-1 mt-0.5">
            {item.description}
          </p>
        )}
      </div>
    </button>
  );
};
