import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useTranslation } from 'react-i18next';
import { Gift, Plus, Settings, Share2, Users } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import { ItemRow } from '@/components/gh/ItemRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { useOwnerWishlist } from '../hooks/useOwnerWishlist';
import { priorityName } from '../lib/itemForm';
import { ItemFormSheet } from './ItemFormSheet';
import { RequestCard } from './RequestCard';
import { SettingsSheet } from './SettingsSheet';
import { ShareSheet } from './ShareSheet';
import { WishlistLoading } from './WishlistLoading';

interface OwnerWishlistProps {
  wishlistId: string;
}

export const OwnerWishlist = ({ wishlistId }: OwnerWishlistProps) => {
  const { t } = useTranslation();
  const wishlist = useOwnerWishlist(wishlistId);
  const { data, loading, sheet, busy } = wishlist;

  if (loading) return <WishlistLoading />;
  if (!data) {
    return (
      <div className="min-h-screen bg-gh-bg text-gh-ink">
        <AppHeader />
        <EmptyState icon={Gift} size="screen" title={t('wishlist.toast.loadFailed')} />
      </div>
    );
  }

  const { items, organizer, shared } = data;
  const list = data.wishlist;
  const selectedItem = sheet?.type === 'item' ? items.find((i) => i.id === sheet.itemId) : undefined;
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
          </div>
        </header>

        {organizer.kind !== 'none' && (
          <div className="flex items-start gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
            <Users className="mt-0.5 h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              {organizer.kind === 'accepted' ? (
                <>
                  <p className="text-[16px] font-semibold leading-6 text-gh-ink">
                    {t('wishlist.organizerLine', { name: wishlist.organizerName })}
                  </p>
                  <p className="text-[13px] leading-[18px] text-gh-muted">
                    {t('wishlist.organizerLineHint', { name: wishlist.organizerName })}
                  </p>
                </>
              ) : (
                <p className="text-[16px] leading-6 text-gh-ink">
                  {t('wishlist.organizerLinePending', { email: organizer.email })}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="md:hidden">{addButton('w-full')}</div>

        {wishlist.requests.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeader title={t('wishlist.sectionRequests')} count={wishlist.requests.length} />
            <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
              {wishlist.requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  organizerName={wishlist.organizerName ?? t('wishlist.organizerFallback')}
                  busy={busy}
                  onWithdraw={wishlist.withdrawRequest}
                />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <SectionHeader title={t('wishlist.sectionItems')} count={items.length} />
          {items.length === 0 ? (
            <EmptyState
              icon={Gift}
              title={t('wishlist.emptyTitle')}
              text={t('wishlist.emptyText')}
              action={addButton('')}
            />
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
              {items.map((item) => (
                <li key={item.id}>
                  <ItemRow
                    title={item.title}
                    image={item.url}
                    meta={meta(item.price_range, item.priority)}
                    status={
                      wishlist.pendingItemIds.has(item.id)
                        ? { kind: 'pending', label: t('wishlist.pendingChip') }
                        : undefined
                    }
                    giftCardLabel={item.is_giftcard ? t('publicWishlist.giftCardBadge') : undefined}
                    onClick={() => wishlist.openItem(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {sheet?.type === 'add' && (
        <ItemFormSheet
          key="add"
          mode="add"
          shared={shared}
          organizerName={wishlist.organizerName}
          pending={false}
          listTitle={list.title}
          busy={busy}
          onSubmit={wishlist.addItem}
          onRemove={() => undefined}
          onClose={wishlist.closeSheet}
        />
      )}
      {selectedItem && (
        <ItemFormSheet
          key={selectedItem.id}
          mode="edit"
          item={selectedItem}
          shared={shared}
          organizerName={wishlist.organizerName}
          pending={wishlist.pendingItemIds.has(selectedItem.id)}
          listTitle={list.title}
          busy={busy}
          onSubmit={(form) => wishlist.saveItem(selectedItem, form)}
          onRemove={() => wishlist.removeItem(selectedItem)}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'share' && (
        <ShareSheet
          organizer={organizer}
          organizerName={wishlist.organizerName}
          inviteSentTo={wishlist.inviteSentTo}
          inviteEmailFailed={wishlist.inviteEmailFailed}
          listTitle={list.title}
          busy={busy}
          onInvite={wishlist.invite}
          onRevoke={wishlist.revokeInvitation}
          onRemove={wishlist.removeOrganizer}
          onClose={wishlist.closeSheet}
        />
      )}
      {sheet?.type === 'settings' && (
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
