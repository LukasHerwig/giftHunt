import { useTranslation } from 'react-i18next';
import { ItemRow } from '@/components/gh/ItemRow';
import { buildMeta, claimLabel } from '../lib/itemFormat';
import type { ItemKind } from '../lib/groupItems';
import type { Wishlist, WishlistItem } from '../types';

interface GiverItemRowProps {
  item: WishlistItem;
  kind: ItemKind;
  wishlist: Wishlist;
  onOpen: (itemId: string) => void;
}

export const GiverItemRow = ({ item, kind, wishlist, onOpen }: GiverItemRowProps) => {
  const { t } = useTranslation();
  const count = item.claim_count ?? 0;
  const showClaims = item.is_giftcard && (count > 0 || item.claim_cap != null);

  return (
    <ItemRow
      title={item.title}
      image={item.url}
      meta={buildMeta(item, wishlist, t)}
      status={
        kind === 'available'
          ? { kind: 'available', label: t('publicWishlist.statusAvailable') }
          : {
              kind: 'taken',
              label: kind === 'mine' ? t('publicWishlist.statusMine') : t('publicWishlist.taken'),
            }
      }
      taken={kind !== 'available'}
      giftCardLabel={item.is_giftcard ? t('publicWishlist.giftCardBadge') : undefined}
      claim={
        showClaims
          ? { count, cap: item.claim_cap, label: claimLabel(count, item.claim_cap, t) }
          : undefined
      }
      onClick={() => onOpen(item.id)}
    />
  );
};
