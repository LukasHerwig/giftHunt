import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Star, DollarSign, Link as LinkIcon } from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';

interface AvailableItemsCardProps {
  availableItems: WishlistItem[];
  wishlist: Wishlist | null;
}

export const AvailableItemsCard = ({
  availableItems,
  wishlist,
}: AvailableItemsCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">
          {t('adminWishlist.availableItems')} ({availableItems.length})
        </CardTitle>
        <CardDescription>
          {t('adminWishlist.availableItemsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('adminWishlist.allItemsTaken')}
          </p>
        ) : (
          availableItems.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{item.title}</h4>
                    {item.priority === 3 && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">
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
                          ? t('adminWishlist.high')
                          : item.priority === 2
                          ? t('adminWishlist.medium')
                          : t('adminWishlist.low')}
                      </span>
                    )}
                  </div>

                  {wishlist?.enable_links && item.link && (
                    <a
                      href={
                        item.link.startsWith('http')
                          ? item.link
                          : `https://${item.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {t('adminWishlist.viewLink')}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};
