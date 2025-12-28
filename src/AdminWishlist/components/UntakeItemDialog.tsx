import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
import { Loader2, X, Undo2 } from 'lucide-react';
import { WishlistItem } from '../types';
import { useIsMobile } from '@/hooks/use-mobile';

interface UntakeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: WishlistItem | null;
  untaking: boolean;
  onConfirm: () => Promise<void>;
}

const Content = ({
  selectedItem,
  untaking,
  onConfirm,
  onOpenChange,
}: Omit<UntakeItemDialogProps, 'open'>) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-4 md:p-0">
      {selectedItem && (
        <div className="bg-ios-secondary/50 border border-ios-separator/10 p-4 rounded-[20px]">
          <p className="text-[17px] font-semibold text-foreground">
            {selectedItem.title}
          </p>
          <p className="text-[15px] text-ios-gray mt-2">
            {t('untakeItemDialog.description', {
              title: selectedItem.title,
              takenBy:
                selectedItem.taken_by_name || t('adminWishlist.anonymous'),
            })}
          </p>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          className="w-full h-12 rounded-[12px] bg-ios-red hover:bg-ios-red/90 text-white font-semibold"
          disabled={untaking}>
          {untaking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('untakeItemDialog.untake')
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="w-full h-12 rounded-[12px] text-ios-blue font-semibold"
          disabled={untaking}>
          {t('untakeItemDialog.cancel')}
        </Button>
      </div>
    </div>
  );
};

export const UntakeItemDialog = (props: UntakeItemDialogProps) => {
  const { open, onOpenChange } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-ios-background border-ios-separator/10">
          <DrawerHeader className="border-b border-ios-separator/10 pb-4 flex flex-row items-center justify-between px-4">
            <div className="w-6" /> {/* Spacer */}
            <DrawerTitle className="text-[17px] font-semibold flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-ios-blue" />
              {t('untakeItemDialog.title')}
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
            <Undo2 className="w-5 h-5 text-ios-blue" />
            {t('untakeItemDialog.title')}
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
