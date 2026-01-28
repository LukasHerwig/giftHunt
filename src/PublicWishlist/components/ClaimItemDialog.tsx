import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import { Loader2, X, Check, Gift } from 'lucide-react';

interface ClaimItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  buyerName: string;
  onBuyerNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  claiming: boolean;
}

interface FormContentProps extends ClaimItemDialogProps {
  t: ReturnType<typeof useTranslation>['t'];
}

const FormContent = ({
  onClose,
  buyerName,
  onBuyerNameChange,
  onSubmit,
  claiming,
  t,
}: FormContentProps) => (
  <form onSubmit={onSubmit}>
    <SheetDialogHeader
      title={t('publicWishlist.claimItem')}
      onClose={onClose}
      submitDisabled={claiming || !buyerName.trim()}
      loading={claiming}
      closeIcon={<X className="w-5 h-5" />}
      submitIcon={
        claiming ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )
      }
    />

    <SheetDialogBody>
      {/* Icon Placeholder */}
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 relative">
          <div className="absolute inset-0 bg-ios-blue/10 rounded-full blur-3xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative">
              <Gift className="w-24 h-24 text-ios-blue opacity-20 absolute -top-4 -left-4" />
              <Gift className="w-24 h-24 text-ios-blue opacity-40 absolute top-4 left-4" />
              <Gift className="w-32 h-32 text-ios-blue relative z-10" />
            </div>
          </div>
        </div>
        <p className="text-center text-[15px] text-ios-gray max-w-[260px] mt-4">
          {t('publicWishlist.claimDescription')}
        </p>
      </div>

      {/* Name Input */}
      <div className="space-y-6">
        <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
          <input
            placeholder={t('publicWishlist.yourNameRequired')}
            value={buyerName}
            onChange={(e) => onBuyerNameChange(e.target.value)}
            className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
            disabled={claiming}
            required
          />
        </div>
      </div>
    </SheetDialogBody>
  </form>
);

export const ClaimItemDialog = (props: ClaimItemDialogProps) => {
  const { t } = useTranslation();

  // Handle the different prop naming (isOpen vs open)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  return (
    <SheetDialog open={props.isOpen} onOpenChange={handleOpenChange}>
      <SheetDialogContent>
        <FormContent {...props} t={t} />
      </SheetDialogContent>
    </SheetDialog>
  );
};
