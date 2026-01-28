import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X, Undo2 } from 'lucide-react';
import { WishlistItem } from '../types';

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
    <>
      <SheetDialogHeader
        title={t('untakeItemDialog.title')}
        onClose={() => onOpenChange(false)}
        showSubmit={false}
        closeIcon={<X className="w-5 h-5" />}
      />

      <SheetDialogBody>
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
            disabled={untaking}
          >
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
            disabled={untaking}
          >
            {t('untakeItemDialog.cancel')}
          </Button>
        </div>
      </SheetDialogBody>
    </>
  );
};

export const UntakeItemDialog = (props: UntakeItemDialogProps) => {
  const { open, onOpenChange } = props;

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange}>
      <SheetDialogContent>
        <Content {...props} />
      </SheetDialogContent>
    </SheetDialog>
  );
};
