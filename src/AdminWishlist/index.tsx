import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminWishlist } from './hooks/useAdminWishlist';
import { LoadingState } from './components/LoadingState';
import { AccessDeniedState } from './components/AccessDeniedState';
import { AdminWishlistHeader } from './components/AdminWishlistHeader';
import { ShareLinkInfo } from './components/ShareLinkInfo';
import { SummaryStats } from './components/SummaryStats';
import { AvailableItemsCard } from './components/AvailableItemsCard';
import { TakenItemsCard } from './components/TakenItemsCard';
import { UntakeItemDialog } from './components/UntakeItemDialog';

const AdminWishlist = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const {
    wishlist,
    items,
    loading,
    isAdmin,
    shareLink,
    generatingLink,
    untakeDialogOpen,
    selectedUntakeItem,
    untaking,
    handleCopyShareLink,
    handleUntakeItem,
    openUntakeDialog,
    setUntakeDialogOpen,
  } = useAdminWishlist(id);

  if (loading) {
    return <LoadingState />;
  }

  if (!isAdmin || !wishlist) {
    return <AccessDeniedState />;
  }

  const takenItems = items.filter((item) => item.is_taken);
  const availableItems = items.filter((item) => !item.is_taken);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <AdminWishlistHeader
        generatingLink={generatingLink}
        shareLink={shareLink}
        onCopyShareLink={handleCopyShareLink}
      />

      <main className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Share Link Info */}
        {shareLink && <ShareLinkInfo shareLink={shareLink} />}

        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-bold">{wishlist.title}</h1>
          {wishlist.creator_name && (
            <p className="text-lg text-muted-foreground mt-1">
              {t('adminWishlist.createdBy')} {wishlist.creator_name}
            </p>
          )}
        </div>

        {/* Summary Stats */}
        <SummaryStats items={items} />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Items */}
          <AvailableItemsCard
            availableItems={availableItems}
            wishlist={wishlist}
          />

          {/* Taken Items */}
          <TakenItemsCard
            takenItems={takenItems}
            wishlist={wishlist}
            onUntakeItem={openUntakeDialog}
          />
        </div>
      </main>

      {/* Untake Item Confirmation Dialog */}
      <UntakeItemDialog
        open={untakeDialogOpen}
        onOpenChange={setUntakeDialogOpen}
        selectedItem={selectedUntakeItem}
        untaking={untaking}
        onConfirm={handleUntakeItem}
      />
    </div>
  );
};

export default AdminWishlist;
