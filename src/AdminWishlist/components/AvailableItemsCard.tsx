import { useState } from 'react';
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
  Link as LinkIcon,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';
import { CurrencyBadge } from '@/components/CurrencyBadge';

interface AvailableItemsCardProps {
  availableItems: WishlistItem[];
  wishlist: Wishlist | null;
  onEditItem: (item: WishlistItem) => void;
  onDeleteItem: (item: WishlistItem) => void;
}

const AvailableItemCard = ({
  item,
  wishlist,
  onEditItem,
  onDeleteItem,
}: {
  item: WishlistItem;
  wishlist: Wishlist | null;
  onEditItem: (item: WishlistItem) => void;
  onDeleteItem: (item: WishlistItem) => void;
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Collapsed Header - Always visible */}
        <div
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            {/* Left side - Title and basic info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate text-sm">{item.title}</h4>
                {item.priority === 3 && (
                  <Star className="w-3 h-3 text-yellow-500 dark:text-yellow-400 fill-current flex-shrink-0" />
                )}
              </div>
                {item.description && (
              <div className="text-xs text-muted-foreground">
                  {item.description}
              </div>
                )}
            </div>

            {/* Right side - Expand button */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-2 border-t bg-muted/20">
            {/* Description */}
            {item.description && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="space-y-3">
              {/* Priority */}
              {wishlist?.enable_priority && item.priority > 0 && (
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">
                    {t('adminWishlist.priority')}:
                  </span>
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
                </div>
              )}

              {/* Price */}
              {wishlist?.enable_price && item.price_range && (
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">
                    {t('adminWishlist.price')}:
                  </span>
                  <CurrencyBadge amount={item.price_range} />
                </div>
              )}

              {/* Link */}
              {wishlist?.enable_links && item.link && (
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">
                    {t('adminWishlist.link')}:
                  </span>
                  <a
                    href={
                      item.link.startsWith('http')
                        ? item.link
                        : `https://${item.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    <span className="text-xs">
                      {t('adminWishlist.viewLink')}
                    </span>
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEditItem(item)}
                className="w-full justify-center">
                <Edit className="w-4 h-4 mr-2" />
                {t('adminWishlist.editItem.editButton')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteItem(item)}
                className="w-full justify-center">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('adminWishlist.deleteItem.deleteButton')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
            <AvailableItemCard
              key={item.id}
              item={item}
              wishlist={wishlist}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
