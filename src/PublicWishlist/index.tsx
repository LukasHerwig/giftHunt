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

      <main className="pb-20">
        <div className="px-4 py-4">
          <InfoSection />
        </div>

        <div className="px-4">
          {items.length === 0 ? (
            <EmptyWishlistState />
          ) : (
            <div className="bg-ios-secondary rounded-[12px] border border-ios-separator overflow-hidden">
              {items.map((item, index) => (
                <div key={item.id}>
                  <WishlistItemCard
                    item={item}
                    wishlist={wishlist}
                    onClaimItem={openClaimDialog}
                  />
                  {index < items.length - 1 && (
                    <div className="ml-16 border-b border-ios-separator" />
                  )}
                </div>
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
