import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClaimProgress } from '@/components/gh/ClaimProgress';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { StatusPill } from '@/components/gh/StatusPill';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { priorityName } from '../lib/itemForm';
import { isItemTaken, takerNames } from '../lib/organizerItems';
import { toStoreUrl } from '../lib/storeUrl';
import type { ClaimRow, OrganizerItem } from '../types';

type Confirm = { type: 'untake' } | { type: 'claim'; claim: ClaimRow } | null;

interface OrganizerItemSheetProps {
  item: OrganizerItem;
  claims: ClaimRow[];
  listTitle: string;
  busy: boolean;
  onEdit: () => void;
  onUntake: () => void;
  onRemoveClaim: (claim: ClaimRow) => void;
  onClose: () => void;
}

/** One item for the organizer: its status, who took or gave, and the fixes (make free, remove a gift, edit). */
export const OrganizerItemSheet = ({
  item,
  claims,
  listTitle,
  busy,
  onEdit,
  onUntake,
  onRemoveClaim,
  onClose,
}: OrganizerItemSheetProps) => {
  const { t, i18n } = useTranslation();
  const [confirm, setConfirm] = useState<Confirm>(null);

  const taken = isItemTaken(item, claims.length);
  const names = takerNames(item, claims);
  const date = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(new Date(iso));
  const prio = priorityName(item.priority);
  const meta = [item.price_range, prio ? t(`wishlist.prioShort.${prio}`) : null].filter(Boolean).join(' · ');
  const pill = taken
    ? item.is_giftcard
      ? t('wishlist.org.allGave')
      : names.length > 0
        ? t('wishlist.org.takenBy', { name: names.join(', ') })
        : t('wishlist.org.pillTaken')
    : t('publicWishlist.statusAvailable');
  const canUntake = !item.is_giftcard && taken;

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={item.title}
      subtitle={listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={taken ? 'taken' : 'available'}>{pill}</StatusPill>
        {item.is_giftcard && (
          <ClaimProgress
            count={claims.length}
            cap={item.claim_cap}
            label={
              item.claim_cap != null
                ? t('publicWishlist.claimsOfCap', { count: claims.length, cap: item.claim_cap })
                : t('publicWishlist.claimsCount', { count: claims.length })
            }
          />
        )}
      </div>
      {meta && <p className="text-[14px] leading-5 text-gh-muted">{meta}</p>}
      {item.description && <p className="text-[16px] leading-6 text-gh-ink-2">{item.description}</p>}
      {item.link && (
        <Button asChild variant="outline" className="h-11 w-full rounded-gh-md text-[15px] font-semibold">
          <a href={toStoreUrl(item.link)} target="_blank" rel="noopener noreferrer">
            {t('wishlist.org.sheet.openStore')}
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      )}

      {claims.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-[15px] font-semibold leading-5 text-gh-ink">{t('wishlist.org.sheet.givenBy')}</h3>
          <ul className="m-0 flex list-none flex-col overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200 p-0">
            {claims.map((claim) => (
              <li
                key={claim.id}
                className="flex min-h-[56px] items-center gap-3 border-t border-gh-line py-1 pl-4 pr-2 first:border-t-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold leading-6 text-gh-ink">{claim.claimer_name}</p>
                  <p className="text-[13px] leading-[18px] text-gh-muted">{date(claim.claimed_at)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirm({ type: 'claim', claim })}
                  className="h-11 rounded-gh-md px-3 text-[14px] font-semibold text-gh-ink">
                  {t('wishlist.org.sheet.removeClaim')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canUntake && item.taken_at && (
        <p className="text-[13px] leading-[18px] text-gh-muted">
          {t('wishlist.org.sheet.takenOn', { date: date(item.taken_at) })}
        </p>
      )}

      {confirm?.type === 'untake' ? (
        <ConfirmBlock
          destructive
          question={t('wishlist.org.sheet.untakeQuestion', { title: item.title })}
          context={
            names.length > 0
              ? t('wishlist.org.sheet.untakeContext', { name: names.join(', ') })
              : t('wishlist.org.sheet.untakeContextNoName')
          }
          confirmLabel={t('wishlist.org.sheet.untakeAction')}
          cancelLabel={t('wishlist.confirm.cancel')}
          loading={busy}
          onConfirm={onUntake}
          onCancel={() => setConfirm(null)}
        />
      ) : confirm?.type === 'claim' ? (
        <ConfirmBlock
          destructive
          question={t('wishlist.org.sheet.removeClaimQuestion', { name: confirm.claim.claimer_name })}
          context={t('wishlist.org.sheet.removeClaimContext', { name: confirm.claim.claimer_name })}
          confirmLabel={t('wishlist.org.sheet.removeClaimAction')}
          cancelLabel={t('wishlist.confirm.cancel')}
          loading={busy}
          onConfirm={() => {
            onRemoveClaim(confirm.claim);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            className="h-12 w-full gap-2 rounded-gh-md text-[16px] font-semibold">
            <Pencil aria-hidden="true" />
            {t('wishlist.org.sheet.edit')}
          </Button>
          {canUntake && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirm({ type: 'untake' })}
              className="h-12 w-full rounded-gh-md text-[16px] font-semibold">
              {t('wishlist.org.sheet.untake')}
            </Button>
          )}
        </div>
      )}
    </ResponsiveSheet>
  );
};
