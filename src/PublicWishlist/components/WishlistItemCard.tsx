import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Check, DollarSign, ExternalLink } from 'lucide-react';
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
    <Card
      className={`transition-all ${
        item.is_taken ? 'opacity-60 bg-muted/50' : 'hover:shadow-md'
      }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg break-words">
                {item.title}
              </CardTitle>
              {item.priority === 3 && (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              )}
              {item.is_taken && (
                <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" />
                  {t('publicWishlist.taken')}
                </span>
              )}
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground mb-2 break-words">
                {item.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-2">
              {wishlist?.enable_price && item.price_range && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  <DollarSign className="w-3 h-3" />
                  {item.price_range}
                </span>
              )}
              {wishlist?.enable_priority && item.priority > 0 && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    item.priority === 3
                      ? 'bg-destructive/10 text-destructive'
                      : item.priority === 2
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                  {item.priority === 3
                    ? t('priority.high')
                    : item.priority === 2
                    ? t('priority.medium')
                    : t('priority.low')}
                </span>
              )}
            </div>

            {wishlist?.enable_links && item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                {t('manageWishlist.viewLink')}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            )}
          </div>
          {!item.is_taken && (
            <Button
              onClick={() => onClaimItem(item.id)}
              className="flex-shrink-0">
              {t('publicWishlist.illGetThis')}
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};
