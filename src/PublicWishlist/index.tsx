import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicWishlist } from './hooks/usePublicWishlist';
import {
  LoadingState,
  AccessDeniedState,
  WishlistHeader,
  WishlistItemCard,
  ClaimItemDialog,
  EmptyWishlistState,
  InfoSection,
} from './components';
import PageSubheader from '@/components/PageSubheader';

const PublicWishlist = () => {
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
    <div className="min-h-screen bg-ios-background">
      <WishlistHeader wishlist={wishlist} />

      <main className="pb-20 max-w-4xl mx-auto">
        <div className="px-4 py-4">
          <InfoSection />
        </div>

        <div className="px-4">
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
