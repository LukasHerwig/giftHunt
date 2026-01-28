import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { WishlistItem } from '../types';

interface AdminDeleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: WishlistItem | null;
  deleting: boolean;
  onConfirm: () => Promise<void>;
}

const Content = ({
  selectedItem,
  deleting,
  onConfirm,
  onOpenChange,
}: Omit<AdminDeleteItemDialogProps, 'open'>) => {
  const { t } = useTranslation();
  const isTakenItem = selectedItem?.is_taken;

  return (
    <>
      <SheetDialogHeader
        title={
          isTakenItem
            ? t('adminWishlist.deleteTakenItem.title')
            : t('adminWishlist.deleteItem.title')
        }
        onClose={() => onOpenChange(false)}
        showSubmit={false}
        closeIcon={<X className="w-5 h-5" />}
      />

      <SheetDialogBody>
        {selectedItem && (
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 p-5 rounded-[20px] shadow-sm">
            <p className="text-[17px] font-semibold text-card-foreground">
              {selectedItem.title}
            </p>
            {selectedItem.description && (
              <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">
                {selectedItem.description}
              </p>
            )}
            {isTakenItem && selectedItem.taken_by_name && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[15px] text-ios-blue font-medium">
                  {t('adminWishlist.deleteTakenItem.takenBy')}:{' '}
                  {selectedItem.taken_by_name}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 p-5 rounded-[20px]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-[15px] text-destructive dark:text-destructive-foreground font-medium leading-relaxed">
              {isTakenItem
                ? t('adminWishlist.deleteTakenItem.warning')
                : t('adminWishlist.deleteItem.warning')}
            </p>
          </div>
        </div>

        {isTakenItem && (
          <div className="bg-muted/50 border border-border/40 p-5 rounded-[20px]">
            <p className="text-[15px] text-muted-foreground font-medium leading-relaxed">
              {t('adminWishlist.deleteTakenItem.notifyWarning')}
            </p>
          </div>
        )}

        <div className="space-y-3 pt-3">
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="w-full h-12 rounded-[14px] font-semibold text-[17px] shadow-sm active:scale-[0.98] transition-transform"
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('adminWishlist.deleteItem.deleteButton')
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full h-12 rounded-[14px] text-ios-blue hover:bg-ios-blue/10 dark:hover:bg-ios-blue/20 font-semibold text-[17px] active:scale-[0.98] transition-all"
            disabled={deleting}
          >
            {t('adminWishlist.deleteItem.cancel')}
          </Button>
        </div>
      </SheetDialogBody>
    </>
  );
};

export const AdminDeleteItemDialog = (props: AdminDeleteItemDialogProps) => {
  const { open, onOpenChange } = props;

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange}>
      <SheetDialogContent>
        <Content {...props} />
      </SheetDialogContent>
    </SheetDialog>
  );
};
