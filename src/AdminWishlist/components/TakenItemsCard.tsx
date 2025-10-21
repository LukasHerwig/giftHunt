import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CurrencyBadge } from '@/components/CurrencyBadge';
import {
  Check,
  Star,
  Link as LinkIcon,
  Undo2,
  Edit,
  Trash2,
  MoreVertical,
  User,
} from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';

interface TakenItemsCardProps {
  takenItems: WishlistItem[];
  wishlist: Wishlist | null;
  onUntakeItem: (item: WishlistItem) => void;
  onEditItem: (item: WishlistItem) => void;
  onDeleteItem: (item: WishlistItem) => void;
}

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
            <Card
              key={item.id}
              className="relative border border-border/50 bg-card hover:bg-muted/20 transition-colors">
              <CardContent className="p-3">
                {/* Header with title and status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <h4 className="font-medium truncate">{item.title}</h4>
                    {item.priority === 3 && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                  </div>

                  {/* Actions menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditItem(item)}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t('adminWishlist.editTakenItem.editButton')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDeleteItem(item)}
                        className="text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('adminWishlist.deleteTakenItem.deleteButton')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Meta information row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-wrap gap-2">
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
                    {wishlist?.enable_price && item.price_range && (
                      <CurrencyBadge amount={item.price_range} />
                    )}
                  </div>

                  {/* External link */}
                  {wishlist?.enable_links && item.link && (
                    <a
                      href={
                        item.link.startsWith('http')
                          ? item.link
                          : `https://${item.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm">
                      <LinkIcon className="w-4 h-4" />
                      {t('adminWishlist.viewLink')}
                    </a>
                  )}
                </div>

                {/* Taken by information */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{item.taken_by_name}</span>
                    {item.taken_at && (
                      <span className="text-xs">
                        • {new Date(item.taken_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Primary action button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUntakeItem(item)}
                    className="h-8 px-3 text-xs">
                    <Undo2 className="w-3 h-3 mr-1" />
                    {t('adminWishlist.untakeItem')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};
