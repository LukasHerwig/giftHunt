import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Star, DollarSign, Link as LinkIcon, Undo2 } from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';

interface TakenItemsCardProps {
  takenItems: WishlistItem[];
  wishlist: Wishlist | null;
  onUntakeItem: (item: WishlistItem) => void;
}

export const TakenItemsCard = ({
  takenItems,
  wishlist,
  onUntakeItem,
}: TakenItemsCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-accent">
          {t('adminWishlist.takenItems')} ({takenItems.length})
        </CardTitle>
        <CardDescription>
          {t('adminWishlist.itemsClaimedByGuests')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {takenItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('adminWishlist.noItemsTakenYet')}
          </p>
        ) : (
          takenItems.map((item) => (
            <Card key={item.id} className="p-3 bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <Check className="w-4 h-4 text-primary" />
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
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
                      <LinkIcon className="w-3 h-3" />
                      {t('adminWishlist.viewLink')}
                    </a>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">
                      {t('adminWishlist.takenBy')}:
                    </span>{' '}
                    {item.taken_by_name || t('adminWishlist.anonymous')}
                    {item.taken_at && (
                      <span className="ml-2">
                        {t('adminWishlist.on')}{' '}
                        {new Date(item.taken_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUntakeItem(item)}
                    className="text-xs">
                    <Undo2 className="w-3 h-3 mr-1" />
                    {t('adminWishlist.untakeItem')}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};
