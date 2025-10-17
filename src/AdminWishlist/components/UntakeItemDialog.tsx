import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { WishlistItem } from '../types';

interface UntakeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: WishlistItem | null;
  untaking: boolean;
  onConfirm: () => Promise<void>;
}

export const UntakeItemDialog = ({
  open,
  onOpenChange,
  selectedItem,
  untaking,
  onConfirm,
}: UntakeItemDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('untakeItemDialog.title')}</DialogTitle>
          <DialogDescription>
            {selectedItem &&
              t('untakeItemDialog.description', {
                title: selectedItem.title,
                takenBy:
                  selectedItem.taken_by_name || t('adminWishlist.anonymous'),
              })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={untaking}>
            {t('untakeItemDialog.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={untaking}>
            {untaking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('adminWishlist.untaking')}
              </>
            ) : (
              t('untakeItemDialog.untake')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
