import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { DangerButton } from '@/components/gh/DangerButton';
import { EmptyState } from '@/components/gh/EmptyState';
import { ItemRow } from '@/components/gh/ItemRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { useArchivedWishlist } from '../hooks/useArchivedWishlist';
import { priorityName } from '../lib/itemForm';
import { WishlistLoading } from './WishlistLoading';

interface ArchivedWishlistProps {
  wishlistId: string;
  onModeChange: () => void;
}

/** The owner's read-only view of an archived list: a banner with Restore, the wishes, Delete. */
export const ArchivedWishlist = ({ wishlistId, onModeChange }: ArchivedWishlistProps) => {
  const { t } = useTranslation();
  const archived = useArchivedWishlist(wishlistId, onModeChange);
  const { data, loading, busy } = archived;

  if (loading) return <WishlistLoading />;
  if (!data) {
    return (
      <div className="min-h-screen bg-gh-bg text-gh-ink">
        <AppHeader />
        <EmptyState pose="sad" size="screen" title={t('wishlist.toast.loadFailed')} />
      </div>
    );
  }

  const { wishlist, items } = data;
  const meta = (price: string | null, priority: number | null) => {
    const name = priorityName(priority);
    return [price, name ? t(`wishlist.prioShort.${name}`) : null].filter(Boolean).join(' · ');
  };

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader />
      <main className={cn(PAGE_COLUMN, 'flex flex-col gap-6 pb-10 pt-6 md:gap-8 md:pt-12')}>
        <h1 className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-gh-ink">{wishlist.title}</h1>

        <article className="flex flex-col gap-3 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4 md:max-w-[560px]">
          <div className="flex flex-col gap-1">
            <h2 className="text-[17px] font-semibold leading-[22px] text-gh-ink">{t('wishlist.archived.title')}</h2>
            <p className="text-[14px] leading-5 text-gh-ink-2">{t('wishlist.archived.text')}</p>
          </div>
          <Button
            type="button"
            onClick={() => void archived.restore()}
            disabled={busy}
            className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('wishlist.archived.restore')}
          </Button>
        </article>

        <section className="flex flex-col gap-3">
          <SectionHeader title={t('wishlist.sectionItems')} count={items.length} />
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <ItemRow
                  title={item.title}
                  image={item.url}
                  meta={meta(item.price_range, item.priority)}
                  giftCardLabel={item.is_giftcard ? t('publicWishlist.giftCardBadge') : undefined}
                />
              </li>
            ))}
          </ul>
        </section>

        <DangerButton onClick={archived.askDelete}>{t('wishlist.settingsSheet.delete')}</DangerButton>
      </main>

      {archived.confirmingDelete && (
        <ResponsiveSheet
          open
          onOpenChange={(next) => {
            if (!next) archived.cancelDelete();
          }}
          title={t('wishlist.settingsSheet.delete')}
          subtitle={wishlist.title}
          closeLabel={t('wishlist.form.close')}
          showTitleOnMobile>
          <ConfirmBlock
            destructive
            question={t('wishlist.settingsSheet.deleteQuestion', { title: wishlist.title })}
            context={t('wishlist.settingsSheet.deleteContext')}
            confirmLabel={t('wishlist.settingsSheet.deleteAction')}
            cancelLabel={t('wishlist.confirm.cancel')}
            loading={busy}
            onConfirm={() => void archived.deleteList()}
            onCancel={archived.cancelDelete}
          />
        </ResponsiveSheet>
      )}
    </div>
  );
};
