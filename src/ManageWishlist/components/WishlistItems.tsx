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
import { ExternalLink, Star, DollarSign, Edit, Trash2 } from 'lucide-react';
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
}

export const WishlistItems = ({
  items,
  wishlist,
  hasActiveShareLink,
  onEditItem,
  onEditDescriptionOnly,
  onDeleteItem,
  formatUrl,
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
      <div className="bg-ios-secondary rounded-[12px] border border-ios-separator p-8 text-center">
        <p className="text-ios-gray text-[17px]">
          {t('manageWishlist.noItemsYet')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-ios-secondary rounded-[12px] border border-ios-separator overflow-hidden">
      {items.map((item, index) => (
        <div key={item.id}>
          {index > 0 && <div className="ml-4 border-t border-ios-separator" />}
          <div className="p-4 flex items-start justify-between gap-3 active:bg-ios-tertiary transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-[17px] font-semibold text-foreground break-words">
                  {item.title}
                </h4>
                {item.priority === 3 && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>

              {item.description && (
                <p className="text-[15px] text-ios-gray mb-2 break-words leading-snug">
                  {item.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-2">
                {wishlist?.enable_price && item.price_range && (
                  <CurrencyBadge amount={item.price_range} />
                )}
                {wishlist?.enable_priority &&
                  item.priority &&
                  item.priority > 0 && (
                    <span
                      className={`px-2 py-0.5 text-[12px] font-medium rounded-full ${
                        item.priority === 3
                          ? 'bg-destructive/10 text-destructive'
                          : item.priority === 2
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          : 'bg-ios-tertiary text-ios-gray'
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
                  href={formatUrl(item.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] text-ios-blue hover:underline flex items-center gap-1 break-all">
                  {t('manageWishlist.viewLink')}
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              )}
            </div>

            <div className="flex gap-1 self-center">
              {/* Edit button with conditional functionality */}
              {hasActiveShareLink ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditDescriptionOnly?.(item)}
                      className="text-ios-blue hover:bg-transparent active:opacity-50 h-9 w-9">
                      <Edit className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('messages.editDescriptionOnlyTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditItem(item)}
                  className="text-ios-blue hover:bg-transparent active:opacity-50 h-9 w-9">
                  <Edit className="w-5 h-5" />
                </Button>
              )}
              <AlertDialog>
                {hasActiveShareLink ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span onClick={handleDisabledDeleteClick}>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={hasActiveShareLink}
                          className="text-destructive hover:bg-transparent active:opacity-50 h-9 w-9 disabled:opacity-30">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('messages.deleteDisabledTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={hasActiveShareLink}
                      className="text-destructive hover:bg-transparent active:opacity-50 h-9 w-9 disabled:opacity-30">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                )}
                <AlertDialogContent className="rounded-[14px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-center text-[17px] font-semibold">
                      {t('deleteDialog.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-[13px] text-foreground">
                      {t('deleteDialog.description', {
                        title: item.title,
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-col gap-0 border-t border-ios-separator mt-4">
                    <AlertDialogAction
                      onClick={() => onDeleteItem(item.id)}
                      className="bg-transparent text-destructive hover:bg-transparent active:bg-ios-tertiary font-semibold text-[17px] py-3 rounded-none border-b border-ios-separator">
                      {t('deleteDialog.delete')}
                    </AlertDialogAction>
                    <AlertDialogCancel className="bg-transparent border-none text-ios-blue hover:bg-transparent active:bg-ios-tertiary font-normal text-[17px] py-3 rounded-none">
                      {t('deleteDialog.cancel')}
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
