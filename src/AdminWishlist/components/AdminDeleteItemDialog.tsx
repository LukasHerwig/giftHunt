import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { WishlistItem } from '../types';
import { useIsMobile } from '@/hooks/use-mobile';

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
    <div className="space-y-6 p-4 md:p-0">
      {selectedItem && (
        <div className="bg-ios-secondary/50 border border-ios-separator/10 p-4 rounded-[20px]">
          <p className="text-[17px] font-semibold text-foreground">
            {selectedItem.title}
          </p>
          {selectedItem.description && (
            <p className="text-[15px] text-ios-gray mt-1">
              {selectedItem.description}
            </p>
          )}
          {isTakenItem && selectedItem.taken_by_name && (
            <p className="text-[15px] text-ios-blue mt-2 font-medium">
              {t('adminWishlist.deleteTakenItem.takenBy')}:{' '}
              {selectedItem.taken_by_name}
            </p>
          )}
        </div>
      )}

      <div className="bg-ios-red/10 border border-ios-red/20 p-4 rounded-[20px]">
        <p className="text-[15px] text-ios-red font-medium">
          {isTakenItem
            ? t('adminWishlist.deleteTakenItem.warning')
            : t('adminWishlist.deleteItem.warning')}
        </p>
      </div>

      {isTakenItem && (
        <div className="bg-ios-secondary/50 border border-ios-separator/10 p-4 rounded-[20px]">
          <p className="text-[15px] text-ios-gray font-medium">
            {t('adminWishlist.deleteTakenItem.notifyWarning')}
          </p>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          className="w-full h-12 rounded-[12px] bg-ios-red hover:bg-ios-red/90 text-white font-semibold"
          disabled={deleting}>
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
          className="w-full h-12 rounded-[12px] text-ios-blue font-semibold"
          disabled={deleting}>
          {t('adminWishlist.deleteItem.cancel')}
        </Button>
      </div>
    </div>
  );
};

export const AdminDeleteItemDialog = (props: AdminDeleteItemDialogProps) => {
  const { open, onOpenChange, selectedItem } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isTakenItem = selectedItem?.is_taken;

  const title = isTakenItem
    ? t('adminWishlist.deleteTakenItem.title')
    : t('adminWishlist.deleteItem.title');

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-ios-background border-ios-separator/10">
          <DrawerHeader className="border-b border-ios-separator/10 pb-4 flex flex-row items-center justify-between px-4">
            <div className="w-6" /> {/* Spacer */}
            <DrawerTitle className="text-[17px] font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-ios-red" />
              {title}
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-ios-blue hover:bg-transparent p-0 h-auto w-auto">
              <X className="w-6 h-6" />
            </Button>
          </DrawerHeader>
          <div className="pb-8">
            <Content {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ios-background border-ios-separator/10 sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-[20px] font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-ios-red" />
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full bg-ios-secondary hover:bg-ios-secondary/80">
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        <div className="p-6 pt-4">
          <Content {...props} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
