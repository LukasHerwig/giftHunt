import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface ClaimItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  buyerName: string;
  onBuyerNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  claiming: boolean;
}

export const ClaimItemDialog = ({
  isOpen,
  onClose,
  buyerName,
  onBuyerNameChange,
  onSubmit,
  claiming,
}: ClaimItemDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-t-[20px] sm:rounded-[20px] border-none bg-ios-secondary/95 backdrop-blur-xl p-0 overflow-hidden max-w-[500px]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-[17px] font-semibold">
            {t('publicWishlist.claimItem')}
          </DialogTitle>
          <DialogDescription className="text-center text-[13px] text-ios-label-secondary">
            {t('publicWishlist.claimDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="p-6 pt-2 space-y-6">
          <div className="bg-ios-background rounded-[10px] border border-ios-separator overflow-hidden">
            <Input
              placeholder={t('publicWishlist.yourNameRequired')}
              value={buyerName}
              onChange={(e) => onBuyerNameChange(e.target.value)}
              className="border-none bg-transparent h-12 px-4 text-[17px] focus-visible:ring-0 placeholder:text-ios-label-tertiary"
              disabled={claiming}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full h-12 rounded-[12px] bg-ios-blue hover:bg-ios-blue/90 text-white font-semibold text-[17px]"
              disabled={claiming || !buyerName.trim()}>
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('publicWishlist.claiming')}
                </>
              ) : (
                t('publicWishlist.claimButton')
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full h-12 text-ios-blue hover:bg-transparent active:bg-ios-tertiary font-normal text-[17px]"
              disabled={claiming}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
