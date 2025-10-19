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

interface WishlistItemsProps {
  items: WishlistItem[];
  wishlist: Wishlist | null;
  hasActiveShareLink: boolean;
  onEditItem: (item: WishlistItem) => void;
  onDeleteItem: (itemId: string) => Promise<void>;
  formatUrl: (url: string) => string;
}

export const WishlistItems = ({
  items,
  wishlist,
  hasActiveShareLink,
  onEditItem,
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
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {t('manageWishlist.noItemsYet')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
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
                </div>

                {item.description && (
                  <p className="text-sm text-muted-foreground mb-2 break-words">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-2">
                  {wishlist?.enable_price && item.price_range && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                      <DollarSign className="w-3 h-3" />
                      {item.price_range}
                    </span>
                  )}
                  {wishlist?.enable_priority &&
                    item.priority &&
                    item.priority > 0 && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.priority === 3
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            : item.priority === 2
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
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
                    className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                    {t('manageWishlist.viewLink')}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
              </div>
              <div className="flex gap-1">
                {/* Edit button with conditional tooltip */}
                {hasActiveShareLink ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span onClick={handleDisabledEditClick}>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={hasActiveShareLink}
                          className="text-muted-foreground hover:text-foreground flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('messages.editDisabledTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditItem(item)}
                    disabled={hasActiveShareLink}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <AlertDialog>
                  {hasActiveShareLink ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span onClick={handleDisabledDeleteClick}>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={hasActiveShareLink}
                            className="text-destructive hover:text-destructive flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Trash2 className="w-4 h-4" />
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
                        size="sm"
                        disabled={hasActiveShareLink}
                        className="text-destructive hover:text-destructive flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                  )}
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('deleteDialog.title')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deleteDialog.description', {
                          title: item.title,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t('deleteDialog.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteItem(item.id)}
                        className="bg-destructive hover:bg-destructive/90">
                        {t('deleteDialog.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
