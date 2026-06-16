import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import { Button } from '@/components/ui/button';
import { X, Undo2 } from 'lucide-react';

interface RemoveClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimerName: string | null;
  onConfirm: () => void;
}

const Content = ({
  claimerName,
  onConfirm,
  onOpenChange,
}: Omit<RemoveClaimDialogProps, 'open'>) => {
  const { t } = useTranslation();

  return (
    <>
      <SheetDialogHeader
        title={t('adminWishlist.editTakenItem.removeClaimTitle')}
        onClose={() => onOpenChange(false)}
        showSubmit={false}
        closeIcon={<X className="w-5 h-5" />}
      />

      <SheetDialogBody>
        {claimerName && (
          <div className="bg-ios-secondary/50 border border-ios-separator/10 p-4 rounded-[20px]">
            <p className="text-[15px] text-foreground mt-2">
              {t('adminWishlist.editTakenItem.removeClaimDescription', {
                name: claimerName,
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
          >
            <Undo2 className="w-4 h-4 mr-2" />
            {t('adminWishlist.editTakenItem.removeClaim')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full h-12 rounded-[12px] text-ios-blue font-semibold"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </SheetDialogBody>
    </>
  );
};

export const RemoveClaimDialog = (props: RemoveClaimDialogProps) => {
  const { open, onOpenChange } = props;

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange}>
      <SheetDialogContent>
        <Content {...props} />
      </SheetDialogContent>
    </SheetDialog>
  );
};
