import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { usePublicWishlist } from './hooks/usePublicWishlist';
import { classifyItem, groupItems } from './lib/groupItems';
import {
  LoadingState,
  AccessDeniedState,
  EmptyWishlistState,
  GiverItemRow,
  ItemSheet,
} from './components';
import type { WishlistItem } from './types';

const PublicWishlist = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const {
    wishlist,
    items,
    loading,
    shareLink,
    selectedItemId,
    receipt,
    buyerName,
    nameError,
    claiming,
    claimedIds,
    loadWishlistByToken,
    openItem,
    closeSheet,
    setBuyerName,
    claimItem,
  } = usePublicWishlist(token);

  useEffect(() => {
    loadWishlistByToken();
  }, [loadWishlistByToken]);

  const claimedSet = useMemo(() => new Set(claimedIds), [claimedIds]);
  const groups = useMemo(() => groupItems(items, claimedSet), [items, claimedSet]);

  if (loading) {
    return <LoadingState />;
  }

  if (!wishlist || !shareLink) {
    return <AccessDeniedState />;
  }

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null;
  const selectedKind = selectedItem ? classifyItem(selectedItem, claimedSet) : 'available';

  const renderSection = (
    title: string,
    list: WishlistItem[],
    kind: 'mine' | 'available' | 'taken',
    description?: string,
  ) =>
    list.length > 0 && (
      <section className="flex flex-col gap-3">
        <SectionHeader title={title} count={list.length} description={description} />
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
          {list.map((item) => (
            <li key={item.id}>
              <GiverItemRow item={item} kind={kind} wishlist={wishlist} onOpen={openItem} />
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <main className={cn(PAGE_COLUMN, 'flex flex-col gap-6 pb-10 pt-8 md:gap-8 md:pt-16')}>
        <header className="flex flex-col gap-2">
          {wishlist.creator_name && (
            <p className="text-[13px] leading-[18px] text-gh-muted">
              {t('publicWishlist.fromName', { name: wishlist.creator_name })}
            </p>
          )}
          <h1 className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-gh-ink">
            {wishlist.title}
          </h1>
          {wishlist.description && (
            <p className="max-w-[640px] text-[16px] leading-6 text-gh-ink-2">
              {wishlist.description}
            </p>
          )}
        </header>

        {items.length === 0 ? (
          <EmptyWishlistState creatorName={wishlist.creator_name} />
        ) : (
          <>
            {renderSection(
              t('publicWishlist.sectionMine'),
              groups.mine,
              'mine',
              t('publicWishlist.sectionMineHint'),
            )}
            {renderSection(t('publicWishlist.sectionAvailable'), groups.available, 'available')}
            {renderSection(t('publicWishlist.sectionTaken'), groups.taken, 'taken')}
          </>
        )}

        <footer className="flex flex-col items-center gap-4 pt-4 text-center">
          <p className="text-[14px] leading-5 text-gh-muted">
            {t('publicWishlist.createOwn')}{' '}
            <Link
              to="/auth"
              className="font-semibold text-gh-primary-strong underline underline-offset-4">
              {t('publicWishlist.createOwnLink')}
            </Link>
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </footer>
      </main>

      <ItemSheet
        open={selectedItemId !== null}
        item={selectedItem}
        kind={selectedKind}
        wishlist={wishlist}
        receipt={receipt}
        buyerName={buyerName}
        nameError={nameError}
        claiming={claiming}
        onBuyerNameChange={setBuyerName}
        onClaim={claimItem}
        onClose={closeSheet}
      />
    </div>
  );
};

export default PublicWishlist;
