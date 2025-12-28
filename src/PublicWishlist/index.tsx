import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePublicWishlist } from './hooks/usePublicWishlist';
import {
  LoadingState,
  AccessDeniedState,
  WishlistItemCard,
  ClaimItemDialog,
  EmptyWishlistState,
  InfoSection,
} from './components';
import GiftHuntIcon from '@/components/GiftHuntIcon';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const PublicWishlist = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const {
    wishlist,
    items,
    loading,
    shareLink,
    dialogOpen,
    buyerName,
    claiming,
    loadWishlistByToken,
    claimItem,
    openClaimDialog,
    closeClaimDialog,
    setBuyerName,
  } = usePublicWishlist(token);

  useEffect(() => {
    loadWishlistByToken();
  }, [loadWishlistByToken]);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    claimItem();
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!wishlist || !shareLink) {
    return <AccessDeniedState token={token} />;
  }

  return (
    <div className="min-h-screen bg-ios-background pb-20">
      {/* Immersive Header */}
      <div className="relative h-[45vh] min-h-[350px] w-full overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-ios-blue/40 via-indigo-500/40 to-purple-500/40">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-ios-background" />
        </div>

        {/* Top Navigation */}
        <div className="sticky top-0 z-50 w-full h-14">
          <div className="mx-auto max-w-4xl w-full px-4 h-full flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 active:opacity-50 transition-opacity">
              <GiftHuntIcon size={28} className="text-white drop-shadow-sm" />
              <h1 className="text-[20px] font-bold text-white tracking-tight drop-shadow-sm">
                GiftHunt
              </h1>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle className="bg-black/20 backdrop-blur-md border-white/10 text-white hover:bg-black/30" />
              <LanguageSwitcher className="bg-black/20 backdrop-blur-md border-white/10 text-white hover:bg-black/30" />
            </div>
          </div>
        </div>

        {/* Title Card */}
        <div className="absolute inset-x-0 bottom-16 flex justify-center">
          <div className="w-full max-w-4xl px-4">
            <div className="w-full bg-white/80 dark:bg-white/10 backdrop-blur-2xl border border-ios-separator/10 dark:border-white/20 rounded-[32px] px-8 py-8 flex flex-col items-center justify-center shadow-2xl">
              <h1 className="text-[32px] font-bold text-foreground dark:text-white tracking-tight leading-tight text-center">
                {wishlist.title}
              </h1>
              {wishlist.creator_name && (
                <p className="text-[17px] text-muted-foreground dark:text-white/70 mt-2">
                  {t('publicWishlist.createdBy')} {wishlist.creator_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl w-full -mt-10 relative z-10 px-4">
        <div className="mb-8">
          <InfoSection />
        </div>

        <div>
          {items.length === 0 ? (
            <EmptyWishlistState />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  wishlist={wishlist}
                  onClaimItem={openClaimDialog}
                />
              ))}
            </div>
          )}
        </div>

        <ClaimItemDialog
          isOpen={dialogOpen}
          onClose={closeClaimDialog}
          buyerName={buyerName}
          onBuyerNameChange={setBuyerName}
          onSubmit={handleClaimSubmit}
          claiming={claiming}
        />
      </main>
    </div>
  );
};

export default PublicWishlist;
