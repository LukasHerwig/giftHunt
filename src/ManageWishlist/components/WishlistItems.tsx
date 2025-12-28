import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ExternalLink,
  Star,
  DollarSign,
  Edit,
  Trash2,
  Gift,
} from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';
import { CurrencyBadge } from '@/components/CurrencyBadge';

interface WishlistItemsProps {
  items: WishlistItem[];
  wishlist: Wishlist | null;
  hasActiveShareLink: boolean;
  onEditItem: (item: WishlistItem) => void;
  onEditDescriptionOnly?: (item: WishlistItem) => void;
  onDeleteItem: (itemId: string) => Promise<void>;
  formatUrl: (url: string) => string;
  onAddItem?: () => void;
}

export const WishlistItems = ({
  items,
  wishlist,
  hasActiveShareLink,
  onEditItem,
  onEditDescriptionOnly,
  onDeleteItem,
  formatUrl,
  onAddItem,
}: WishlistItemsProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Handlers for disabled button clicks (mobile feedback)
  const handleDisabledEditClick = () => {
    if (hasActiveShareLink) {
      toast({
        description: t('messages.editDisabledTooltip'),
        variant: 'destructive',
      });
    }
  };

  const handleDisabledDeleteClick = () => {
    if (hasActiveShareLink) {
      toast({
        description: t('messages.deleteDisabledTooltip'),
        variant: 'destructive',
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="relative w-48 h-48 mb-6">
          <div className="absolute inset-0 bg-ios-blue/10 rounded-full blur-3xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative">
              <Gift className="w-24 h-24 text-ios-blue opacity-20 absolute -top-4 -left-4" />
              <Gift className="w-24 h-24 text-ios-blue opacity-40 absolute top-4 left-4" />
              <Gift className="w-32 h-32 text-ios-blue relative z-10" />
            </div>
          </div>
        </div>

        <h3 className="text-[22px] font-bold text-foreground mb-1">
          {t('manageWishlist.noItemsYet')}
        </h3>
        <p className="text-ios-gray text-[17px] mb-8">
          {t('manageWishlist.createFirstWish')}
        </p>

        <Button
          onClick={onAddItem}
          className="bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full px-8 py-6 text-[17px] font-semibold shadow-lg active:scale-95 transition-all">
          {t('manageWishlist.addItem')}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() =>
            hasActiveShareLink
              ? onEditDescriptionOnly?.(item)
              : onEditItem(item)
          }
          className="relative aspect-square bg-ios-secondary rounded-[24px] overflow-hidden group active:scale-[0.97] transition-all text-left border border-ios-separator/5 shadow-sm">
          {/* Image Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ios-tertiary/10 to-ios-tertiary/30">
            <div className="relative">
              <Gift className="w-12 h-12 text-ios-blue opacity-10 absolute -top-2 -left-2" />
              <Gift className="w-16 h-16 text-ios-blue opacity-20 absolute top-2 left-2" />
              <Gift className="w-20 h-20 text-ios-blue relative z-10" />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              {item.priority === 3 && (
                <div className="bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                </div>
              )}
              {wishlist?.enable_price && item.price_range && (
                <div className="bg-black/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                  <span className="text-[10px] font-bold text-white">
                    {item.price_range}
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
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <h4 className="text-[15px] font-bold text-white truncate leading-tight">
              {item.title}
            </h4>
            {item.description && (
              <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">
                {item.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
