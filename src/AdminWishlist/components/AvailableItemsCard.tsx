import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Star,
  DollarSign,
  Link as LinkIcon,
  Edit2,
  Trash2,
  Edit,
} from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';
import { CurrencyBadge } from '@/components/CurrencyBadge';

interface AvailableItemsCardProps {
  availableItems: WishlistItem[];
  wishlist: Wishlist | null;
  onEditItem: (item: WishlistItem) => void;
  onDeleteItem: (item: WishlistItem) => void;
}

export const AvailableItemsCard = ({
  availableItems,
  wishlist,
  onEditItem,
  onDeleteItem,
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
                      <CurrencyBadge amount={item.price_range} />
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

                {/* Admin Action Buttons */}
                <div className="flex gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditItem(item)}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    title={t('adminWishlist.editItem.editButton')}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteItem(item)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title={t('adminWishlist.deleteItem.deleteButton')}>
                    <Trash2 className="w-3 h-3" />
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
