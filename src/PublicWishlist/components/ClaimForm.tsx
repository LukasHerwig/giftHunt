import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/gh/TextField';
import type { Wishlist, WishlistItem } from '../types';

interface ClaimFormProps {
  item: WishlistItem;
  wishlist: Wishlist;
  buyerName: string;
  nameError: boolean;
  claiming: boolean;
  onBuyerNameChange: (name: string) => void;
  onSubmit: () => void;
}

export const ClaimForm = ({
  item,
  wishlist,
  buyerName,
  nameError,
  claiming,
  onBuyerNameChange,
  onSubmit,
}: ClaimFormProps) => {
  const { t } = useTranslation();
  const organizer = wishlist.organizer_name;

  let help: string;
  if (item.is_giftcard) {
    help =
      item.claim_cap != null
        ? t('publicWishlist.giftCardHelpLeft', {
            count: Math.max(item.claim_cap - (item.claim_count ?? 0), 0),
          })
        : t('publicWishlist.giftCardHelpUnlimited');
  } else {
    help = organizer
      ? t('publicWishlist.nameHelp', { name: organizer })
      : t('publicWishlist.nameHelpNoOrganizer');
  }

  const error = nameError
    ? organizer
      ? t('publicWishlist.nameError', { name: organizer })
      : t('publicWishlist.nameErrorNoOrganizer')
    : undefined;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}>
      <TextField
        label={t('publicWishlist.yourName')}
        value={buyerName}
        onChange={(event) => onBuyerNameChange(event.target.value)}
        autoComplete="name"
        enterKeyHint="done"
        disabled={claiming}
        help={help}
        error={error}
      />
      <Button
        type="submit"
        disabled={claiming}
        className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
        {claiming ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            {t('publicWishlist.claiming')}
          </>
        ) : item.is_giftcard ? (
          t('publicWishlist.claimButtonGiftCard')
        ) : (
          t('publicWishlist.claimButton')
        )}
      </Button>
    </form>
  );
};
