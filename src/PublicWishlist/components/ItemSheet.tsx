import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { ClaimForm } from './ClaimForm';
import { ClaimReceipt } from './ClaimReceipt';
import { ItemDetail } from './ItemDetail';
import type { ItemKind } from '../lib/groupItems';
import type { Receipt, Wishlist, WishlistItem } from '../types';

interface ItemSheetProps {
  open: boolean;
  item: WishlistItem | null;
  kind: ItemKind;
  wishlist: Wishlist;
  receipt: Receipt | null;
  buyerName: string;
  nameError: boolean;
  claiming: boolean;
  onBuyerNameChange: (name: string) => void;
  onClaim: () => void;
  onClose: () => void;
}

/**
 * One surface for every item: a claim form while it is available, a read-only
 * view once it is taken (so a returning giver still finds the store link), and
 * a receipt right after the giver claimed it.
 */
export const ItemSheet = ({
  open,
  item,
  kind,
  wishlist,
  receipt,
  buyerName,
  nameError,
  claiming,
  onBuyerNameChange,
  onClaim,
  onClose,
}: ItemSheetProps) => {
  const { t } = useTranslation();

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('publicWishlist.sheetTitle')}
      subtitle={wishlist.title}
      closeLabel={t('publicWishlist.closeSheet')}>
      {receipt ? (
        <ClaimReceipt receipt={receipt} wishlist={wishlist} onDone={onClose} />
      ) : item ? (
        <>
          <ItemDetail item={item} kind={kind} wishlist={wishlist} />
          {kind === 'available' ? (
            <ClaimForm
              item={item}
              wishlist={wishlist}
              buyerName={buyerName}
              nameError={nameError}
              claiming={claiming}
              onBuyerNameChange={onBuyerNameChange}
              onSubmit={onClaim}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
              {t('publicWishlist.close')}
            </Button>
          )}
        </>
      ) : null}
    </ResponsiveSheet>
  );
};
