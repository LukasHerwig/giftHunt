import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { WishlistItem } from '../types';

interface AdminDeleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: WishlistItem | null;
  deleting: boolean;
  onConfirm: () => Promise<void>;
}

export const AdminDeleteItemDialog = ({
  open,
  onOpenChange,
  selectedItem,
  deleting,
  onConfirm,
}: AdminDeleteItemDialogProps) => {
  const { t } = useTranslation();
  const isTakenItem = selectedItem?.is_taken;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {isTakenItem
              ? t('adminWishlist.deleteTakenItem.title')
              : t('adminWishlist.deleteItem.title')}
          </DialogTitle>
          <DialogDescription>
            {isTakenItem
              ? t('adminWishlist.deleteTakenItem.description')
              : t('adminWishlist.deleteItem.description')}
          </DialogDescription>
        </DialogHeader>

        {selectedItem && (
          <div className="bg-muted p-3 rounded-md">
            <p className="font-medium">{selectedItem.title}</p>
            {selectedItem.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedItem.description}
              </p>
            )}
            {isTakenItem && selectedItem.taken_by_name && (
              <p className="text-sm text-primary mt-1 font-medium">
                {t('adminWishlist.deleteTakenItem.takenBy')}:{' '}
                {selectedItem.taken_by_name}
              </p>
            )}
          </div>
        )}

        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
          <p className="text-sm text-destructive font-medium">
            {isTakenItem
              ? t('adminWishlist.deleteTakenItem.warning')
              : t('adminWishlist.deleteItem.warning')}
          </p>
        </div>

        {isTakenItem && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              {t('adminWishlist.deleteTakenItem.notifyWarning')}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={deleting}>
            {t('adminWishlist.deleteItem.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="flex-1"
            disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('adminWishlist.deleteItem.deleting')}
              </>
            ) : (
              t('adminWishlist.deleteItem.deleteButton')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
