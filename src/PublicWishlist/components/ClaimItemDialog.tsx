import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import { Loader2, X, Gift, ExternalLink, Star } from 'lucide-react';
import { WishlistItem, Wishlist } from '../types';

interface ClaimItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  buyerName: string;
  onBuyerNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  claiming: boolean;
  item: WishlistItem | null;
  wishlist: Wishlist | null;
}

interface FormContentProps extends ClaimItemDialogProps {
  t: ReturnType<typeof useTranslation>['t'];
}

const priorityKey = (priority: number) => {
  if (priority === 3) return 'priority.high';
  if (priority === 2) return 'priority.medium';
  return 'priority.low';
};

const FormContent = ({
  onClose,
  buyerName,
  onBuyerNameChange,
  onSubmit,
  claiming,
  item,
  wishlist,
  t,
}: FormContentProps) => (
  <form onSubmit={onSubmit}>
    <SheetDialogHeader
      title={t('publicWishlist.claimItem')}
      onClose={onClose}
      showSubmit={false}
      closeIcon={<X className="w-5 h-5" />}
    />

    <SheetDialogBody>
      {/* Item Details */}
      {item && (
        <div className="space-y-3">
          {/* Image */}
          {item.url ? (
            <div className="w-full h-48 rounded-[20px] overflow-hidden bg-ios-background/50">
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 bg-ios-blue/10 rounded-full blur-3xl" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative">
                    <Gift className="w-14 h-14 text-ios-blue opacity-20 absolute -top-2 -left-2" />
                    <Gift className="w-14 h-14 text-ios-blue opacity-40 absolute top-2 left-2" />
                    <Gift className="w-20 h-20 text-ios-blue relative z-10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <h2 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">
            {item.title}
          </h2>

          {/* Description */}
          {item.description && (
            <p className="text-[15px] text-ios-gray leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Price + Priority row */}
          {((wishlist?.enable_price && item.price_range) ||
            (wishlist?.enable_priority && item.priority > 1)) && (
            <div className="flex items-center gap-2 flex-wrap">
              {wishlist?.enable_price && item.price_range && (
                <span className="bg-ios-background/50 border border-ios-separator/10 rounded-full px-3 py-1 text-[13px] font-semibold text-foreground">
                  {item.price_range}
                </span>
              )}
              {wishlist?.enable_priority && item.priority > 1 && (
                <span className="flex items-center gap-1 bg-ios-background/50 border border-ios-separator/10 rounded-full px-3 py-1 text-[13px] font-semibold text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  {t(priorityKey(item.priority))}
                </span>
              )}
            </div>
          )}

          {/* Link */}
          {wishlist?.enable_links && item.link && (
            <a
              href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-ios-blue text-[15px] font-medium active:opacity-60 transition-opacity w-fit"
            >
              <ExternalLink className="w-4 h-4" />
              {t('publicWishlist.viewItem')}
            </a>
          )}
        </div>
      )}

      {/* Name Input + Claim Button */}
      <div className="space-y-3">
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
        <button
          type="submit"
          disabled={claiming || !buyerName.trim()}
          className="w-full bg-ios-blue rounded-[20px] px-5 py-4 text-[17px] font-semibold text-white disabled:opacity-40 active:opacity-80 transition-opacity flex items-center justify-center gap-2">
          {claiming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('publicWishlist.claiming')}
            </>
          ) : (
            t('publicWishlist.claimButton')
          )}
        </button>
      </div>
    </SheetDialogBody>
  </form>
);

export const ClaimItemDialog = (props: ClaimItemDialogProps) => {
  const { t } = useTranslation();

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
