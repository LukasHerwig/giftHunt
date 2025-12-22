import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Star, Check, ExternalLink, ChevronRight } from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';
import { CurrencyBadge } from '@/components/CurrencyBadge';

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
    <div
      className={`flex items-center justify-between p-4 active:bg-ios-tertiary transition-colors ${
        item.is_taken ? 'opacity-50' : ''
      }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-[17px] font-medium truncate">{item.title}</h3>
          {item.priority === 3 && (
            <Star className="w-4 h-4 text-ios-yellow fill-current" />
          )}
          {item.is_taken && (
            <span className="flex items-center gap-1 text-[13px] text-ios-label-secondary">
              <Check className="w-3.5 h-3.5 text-ios-green" />
              {t('publicWishlist.taken')}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-[13px] text-ios-label-secondary line-clamp-1 mb-1">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {wishlist?.enable_price && item.price_range && (
            <CurrencyBadge amount={item.price_range} />
          )}
          {wishlist?.enable_priority && item.priority > 0 && (
            <span
              className={`text-[12px] font-medium ${
                item.priority === 3
                  ? 'text-ios-red'
                  : item.priority === 2
                  ? 'text-ios-yellow'
                  : 'text-ios-label-secondary'
              }`}>
              {item.priority === 3
                ? t('priority.high')
                : item.priority === 2
                ? t('priority.medium')
                : t('priority.low')}
            </span>
          )}
          {wishlist?.enable_links && item.link && (
            <a
              href={
                item.link.startsWith('http')
                  ? item.link
                  : `https://${item.link}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-ios-blue hover:underline flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}>
              {t('manageWishlist.viewLink')}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {!item.is_taken && (
        <Button
          onClick={() => onClaimItem(item.id)}
          variant="ghost"
          className="h-auto py-1.5 px-3 text-ios-blue hover:bg-transparent active:opacity-50 font-medium text-[15px] flex items-center gap-1">
          {t('publicWishlist.illGetThis')}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
