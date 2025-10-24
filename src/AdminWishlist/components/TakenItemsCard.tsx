import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CurrencyBadge } from '@/components/CurrencyBadge';
import {
  Check,
  Star,
  Link as LinkIcon,
  Undo2,
  Edit,
  Trash2,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';

interface TakenItemsCardProps {
  takenItems: WishlistItem[];
  wishlist: Wishlist | null;
  onUntakeItem: (item: WishlistItem) => void;
  onEditItem: (item: WishlistItem) => void;
  onDeleteItem: (item: WishlistItem) => void;
}

const TakenItemCard = ({
  item,
  wishlist,
  onUntakeItem,
  onEditItem,
  onDeleteItem,
}: {
  item: WishlistItem;
  wishlist: Wishlist | null;
  onUntakeItem: (item: WishlistItem) => void;
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
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <h4 className="font-medium truncate text-sm">{item.title}</h4>
                {item.priority === 3 && (
                  <Star className="w-3 h-3 text-yellow-500 dark:text-yellow-400 fill-current flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="truncate">{item.taken_by_name}</span>
              </div>
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
            <div className="space-y-3 pt-2">
              {/* Taken by details */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('adminWishlist.takenBy')}:
                </span>
                <span className="text-right font-medium flex items-center gap-1">
                  {item.taken_by_name}
                  {item.taken_at && (
                    <>
                      <span className="mx-1 text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.taken_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </span>
              </div>

              {/* Priority */}
              {wishlist?.enable_priority && item.priority > 0 && (
                <div className="flex items-center justify-between text-sm">
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('adminWishlist.price')}:
                  </span>
                  <CurrencyBadge amount={item.price_range} />
                </div>
              )}

              {/* Link */}
              {wishlist?.enable_links && item.link && (
                <div className="flex items-center justify-between text-sm">
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
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUntakeItem(item)}
                className="w-full justify-center">
                <Undo2 className="w-4 h-4 mr-2" />
                {t('adminWishlist.untakeItem')}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditItem(item)}
                  className="w-full justify-center">
                  <Edit className="w-4 h-4 mr-2" />
                  {t('adminWishlist.editTakenItem.editButton')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteItem(item)}
                  className="w-full justify-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('adminWishlist.deleteTakenItem.deleteButton')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const TakenItemsCard = ({
  takenItems,
  wishlist,
  onUntakeItem,
  onEditItem,
  onDeleteItem,
}: TakenItemsCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">
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
            <TakenItemCard
              key={item.id}
              item={item}
              wishlist={wishlist}
              onUntakeItem={onUntakeItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
