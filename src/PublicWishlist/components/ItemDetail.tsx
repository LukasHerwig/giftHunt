import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { ClaimProgress } from '@/components/gh/ClaimProgress';
import { GiftCardBadge } from '@/components/gh/GiftCardBadge';
import { ItemImage } from '@/components/gh/ItemImage';
import { StatusPill } from '@/components/gh/StatusPill';
import { buildMeta, claimLabel, toStoreUrl } from '../lib/itemFormat';
import type { ItemKind } from '../lib/groupItems';
import type { Wishlist, WishlistItem } from '../types';

interface ItemDetailProps {
  item: WishlistItem;
  kind: ItemKind;
  wishlist: Wishlist;
}

export const ItemDetail = ({ item, kind, wishlist }: ItemDetailProps) => {
  const { t } = useTranslation();
  const organizer = wishlist.organizer_name;
  const meta = buildMeta(item, wishlist, t);
  const count = item.claim_count ?? 0;
  const showClaims = item.is_giftcard && (count > 0 || item.claim_cap != null);
  const note =
    kind === 'taken'
      ? t('publicWishlist.takenNote')
      : kind === 'mine'
        ? organizer
          ? t('publicWishlist.mineNote', { name: organizer })
          : t('publicWishlist.mineNoteNoOrganizer')
        : null;

  return (
    <div className="flex flex-col gap-4 text-gh-ink">
      <ItemImage
        src={item.url}
        alt=""
        className={`aspect-[4/3] max-h-[280px] w-full rounded-gh-lg ${kind !== 'available' ? 'opacity-70' : ''}`}
        iconClassName="h-10 w-10"
      />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <StatusPill status={kind === 'available' ? 'available' : 'taken'}>
            {kind === 'available'
              ? t('publicWishlist.statusAvailable')
              : kind === 'mine'
                ? t('publicWishlist.statusMine')
                : t('publicWishlist.taken')}
          </StatusPill>
          {item.is_giftcard && <GiftCardBadge label={t('publicWishlist.giftCardBadge')} />}
        </div>
        <h2 className="text-[22px] font-bold leading-7">{item.title}</h2>
        {meta && <p className="text-[13px] leading-[18px] text-gh-muted">{meta}</p>}
      </div>
      {showClaims && (
        <ClaimProgress
          count={count}
          cap={item.claim_cap}
          label={claimLabel(count, item.claim_cap, t)}
        />
      )}
      {item.description && (
        <p className="text-[16px] leading-6 text-gh-ink-2">{item.description}</p>
      )}
      {wishlist.enable_links && item.link && (
        <a
          href={toStoreUrl(item.link)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] w-fit items-center gap-2 text-[16px] font-semibold text-gh-primary-strong underline underline-offset-4">
          {t('publicWishlist.openStore')}
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" />
        </a>
      )}
      {note && <p className="text-[13px] leading-[18px] text-gh-muted">{note}</p>}
    </div>
  );
};
