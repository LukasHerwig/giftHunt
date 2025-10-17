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
} from './components';

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <WishlistHeader wishlist={wishlist} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {items.length === 0 ? (
          <EmptyWishlistState />
        ) : (
          <div className="space-y-3">
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
