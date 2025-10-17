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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('publicWishlist.claimItem')}</DialogTitle>
          <DialogDescription>
            {t('publicWishlist.claimDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            placeholder={t('publicWishlist.yourNameRequired')}
            value={buyerName}
            onChange={(e) => onBuyerNameChange(e.target.value)}
            className="text-base"
            disabled={claiming}
            required
          />
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
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
        </form>
      </DialogContent>
    </Dialog>
  );
};
