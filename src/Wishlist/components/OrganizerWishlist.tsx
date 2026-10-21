import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useTranslation } from 'react-i18next';
import { Plus, Settings, Share2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import { ItemRow } from '@/components/gh/ItemRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { Segmented } from '@/components/gh/Segmented';
import { useOrganizerWishlist } from '../hooks/useOrganizerWishlist';
import { priorityName } from '../lib/itemForm';
import { hasClaims, takerNames } from '../lib/organizerItems';
import type { ItemWithClaims } from '../types';
import { ItemFormSheet } from './ItemFormSheet';
import { OrganizerItemSheet } from './OrganizerItemSheet';
import { OrganizerRequestCard } from './OrganizerRequestCard';
import { SettingsSheet } from './SettingsSheet';
import { ShareLinkSheet } from './ShareLinkSheet';
import { WishlistLoading } from './WishlistLoading';

interface OrganizerWishlistProps {
  wishlistId: string;
  /** self = the creator of a self-managed list: also adds items and has settings, never requests. */
  mode: 'organizer' | 'self';
}

export const OrganizerWishlist = ({ wishlistId, mode }: OrganizerWishlistProps) => {
  const { t } = useTranslation();
  const wishlist = useOrganizerWishlist(wishlistId);
  const { data, loading, sheet, busy, segment, groups } = wishlist;

  if (loading) return <WishlistLoading />;
  if (!data) {
    return (
      <div className="min-h-screen bg-gh-bg text-gh-ink">
        <AppHeader />
        <EmptyState pose="sad" size="screen" title={t('wishlist.org.toast.loadFailed')} />
      </div>
    );
  }

  const self = mode === 'self';
  const list = data.wishlist;
  const ownerName = data.ownerName ?? t('wishlist.org.ownerFallback');
  const shown = segment === 'available' ? groups.available : groups.taken;
  const entry = (itemId: string): ItemWithClaims | undefined =>
    [...groups.available, ...groups.taken].find((e) => e.item.id === itemId);
  const selected = sheet && 'itemId' in sheet ? entry(sheet.itemId) : undefined;

  const rowStatus = ({ item, claims }: ItemWithClaims) => {
    if (segment === 'available') return { kind: 'available' as const, label: t('publicWishlist.statusAvailable') };
    if (item.is_giftcard) return { kind: 'taken' as const, label: t('wishlist.org.allGave') };
    const names = takerNames(item, claims);
    return {
      kind: 'taken' as const,
      label: names.length > 0 ? t('wishlist.org.takenBy', { name: names.join(', ') }) : t('wishlist.org.pillTaken'),
    };
  };
  const meta = (price: string | null, priority: number | null) => {
    const name = priorityName(priority);
    return [price, name ? t(`wishlist.prioShort.${name}`) : null].filter(Boolean).join(' · ');
  };

  const addButton = (extra: string) => (
    <Button
      type="button"
      onClick={wishlist.openAdd}
      className={`h-[52px] gap-2 rounded-gh-md px-6 text-[17px] font-semibold ${extra}`}>
      <Plus aria-hidden="true" />
      {t('wishlist.addItem')}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader />
      <main className={cn(PAGE_COLUMN, 'flex flex-col gap-6 pb-10 pt-6 md:gap-8 md:pt-12')}>
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="flex max-w-[560px] flex-col gap-2">
            {!self && (
              <p className="text-[13px] leading-[18px] text-gh-muted">
                {t('wishlist.org.eyebrow', { name: ownerName })}
              </p>
            )}
            <h1 className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-gh-ink">{list.title}</h1>
            {list.description && <p className="text-[16px] leading-6 text-gh-ink-2">{list.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={wishlist.openShare}
              className="h-12 gap-2 rounded-gh-md px-4 text-[16px] font-semibold">
              <Share2 aria-hidden="true" />
              {t('wishlist.shareButton')}
            </Button>
            {self && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={wishlist.openSettings}
                  aria-label={t('wishlist.settingsButton')}
                  className="h-12 w-12 rounded-gh-md text-gh-ink">
                  <Settings className="!size-5" aria-hidden="true" />
                </Button>
                <span className="hidden md:inline-flex">{addButton('')}</span>
              </>
            )}
          </div>
        </header>

        {self && <div className="md:hidden">{addButton('w-full')}</div>}

        {!self && wishlist.requests.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeader title={t('wishlist.org.sectionRequests')} count={wishlist.requests.length} />
            <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
              {wishlist.requests.map((request, index) => (
                <OrganizerRequestCard
                  key={request.id}
                  request={request}
                  ownerName={ownerName}
                  primary={index === 0}
                  busy={busy}
                  onResolve={wishlist.resolveRequest}
                />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <div className="md:max-w-[360px]">
            <Segmented
              ariaLabel={t('wishlist.org.segmentLabel')}
              value={segment}
              onChange={(value) => wishlist.setSegment(value as 'available' | 'taken')}
              options={[
                { value: 'available', label: t('wishlist.org.segment.available'), count: groups.available.length },
                { value: 'taken', label: t('wishlist.org.segment.taken'), count: groups.taken.length },
              ]}
            />
          </div>
          {shown.length === 0 ? (
            <EmptyState
              title={t(segment === 'available' ? 'wishlist.org.empty.availableTitle' : 'wishlist.org.empty.takenTitle')}
              text={t(segment === 'available' ? 'wishlist.org.empty.availableText' : 'wishlist.org.empty.takenText')}
            />
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
              {shown.map((e) => {
                const count = e.claims.length;
                const showClaims = e.item.is_giftcard && (count > 0 || e.item.claim_cap != null);
                return (
                  <li key={e.item.id}>
                    <ItemRow
                      title={e.item.title}
                      image={e.item.url}
                      meta={meta(e.item.price_range, e.item.priority)}
                      status={rowStatus(e)}
                      taken={segment === 'taken'}
                      giftCardLabel={e.item.is_giftcard ? t('publicWishlist.giftCardBadge') : undefined}
                      claim={
                        showClaims
                          ? {
                              count,
                              cap: e.item.claim_cap,
                              label:
                                e.item.claim_cap != null
                                  ? t('publicWishlist.claimsOfCap', { count, cap: e.item.claim_cap })
                                  : t('publicWishlist.claimsCount', { count }),
                            }
                          : undefined
                      }
                      onClick={() => wishlist.openItem(e.item.id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {sheet?.type === 'add' && self && (
        <ItemFormSheet
          key="add"
          mode="add"
          shared={false}
          organizerName={null}
          pending={false}
          listTitle={list.title}
          busy={busy}
          onSubmit={wishlist.addItem}
          onRemove={() => undefined}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'item' && selected && (
        <OrganizerItemSheet
          key={selected.item.id}
          item={selected.item}
          claims={selected.claims}
          listTitle={list.title}
          busy={busy}
          onEdit={() => wishlist.openEdit(selected.item.id)}
          onUntake={() => wishlist.untake(selected.item)}
          onRemoveClaim={wishlist.removeClaim}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'edit' && selected && (
        <ItemFormSheet
          key={`edit-${selected.item.id}`}
          mode="edit"
          item={selected.item}
          shared={false}
          organizerName={null}
          pending={false}
          listTitle={list.title}
          note={
            hasClaims(selected.item, selected.claims)
              ? t('wishlist.org.editNote', { names: takerNames(selected.item, selected.claims).join(', ') })
              : undefined
          }
          busy={busy}
          onSubmit={(form) => wishlist.saveItem(selected.item, form)}
          onRemove={() => wishlist.removeItem(selected.item)}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'share' && (
        <ShareLinkSheet
          shareLink={data.shareLink}
          listTitle={list.title}
          busy={busy}
          copied={wishlist.copied}
          onCreate={wishlist.createLink}
          onCopy={wishlist.copyLink}
          onSetActive={wishlist.setLinkActive}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'settings' && self && (
        <SettingsSheet
          wishlist={list}
          busy={busy}
          onSave={wishlist.saveSettings}
          onDelete={wishlist.deleteList}
          onClose={wishlist.closeSheet}
        />
      )}
    </div>
  );
};
