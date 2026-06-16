import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Share2, Loader2 } from 'lucide-react';
import { RemoveClaimDialog } from './components/RemoveClaimDialog';
import { useAdminWishlist } from './hooks/useAdminWishlist';
import { BackButton } from '@/components/BackButton';
import { LoadingState } from './components/LoadingState';
import { AccessDeniedState } from './components/AccessDeniedState';
import { ShareLinkInfo } from './components/ShareLinkInfo';
import { SummaryStats } from './components/SummaryStats';
import { AvailableItemsCard } from './components/AvailableItemsCard';
import { TakenItemsCard } from './components/TakenItemsCard';
import { UntakeItemDialog } from './components/UntakeItemDialog';
import { AdminEditItemDialog } from './components/AdminEditItemDialog';
import { AdminDeleteItemDialog } from './components/AdminDeleteItemDialog';
import { Button } from '@/components/ui/button';

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
    editDialogOpen,
    selectedEditItem,
    editFormData,
    updating,
    deleteDialogOpen,
    selectedDeleteItem,
    deleting,
    handleCopyShareLink,
    handleUntakeItem,
    openUntakeDialog,
    setUntakeDialogOpen,
    openEditDialog,
    setEditDialogOpen,
    setEditFormData,
    handleUpdateItem,
    openDeleteDialog,
    setDeleteDialogOpen,
    handleDeleteItem,
    handleDeleteClaim,
    openDeleteClaimDialog,
    deleteClaimDialogOpen,
    pendingDeleteClaim,
    setDeleteClaimDialogOpen,
  } = useAdminWishlist(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-background">
        <Loader2 className="w-8 h-8 animate-spin text-ios-blue" />
        <span className="ml-2 text-foreground">{t('common.loading')}</span>
      </div>
    );
  }

  if (!isAdmin || !wishlist) {
    return <AccessDeniedState />;
  }

  const takenItems = items.filter((item) => {
    const claimCount = item.claims?.length ?? 0;
    const capReached = item.is_giftcard && item.claim_cap != null && claimCount >= item.claim_cap;
    return item.is_taken || (!item.is_giftcard && claimCount > 0) || capReached;
  });

  const availableItems = items.filter((item) => {
    const claimCount = item.claims?.length ?? 0;
    const capReached = item.is_giftcard && item.claim_cap != null && claimCount >= item.claim_cap;
    if (item.is_giftcard) return !capReached;
    return !item.is_taken && claimCount === 0;
  });

  return (
    <div className="min-h-screen bg-ios-background pb-32 pb-safe">
      {/* Immersive Header */}
      <div className="relative h-[45vh] min-h-[350px] w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-ios-blue/5">
          <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-ios-background" />
        </div>

        {/* Top Navigation */}
        <div className="sticky top-0 z-50 w-full pt-[env(safe-area-inset-top)]">
          <div className="mx-auto max-w-4xl w-full px-4 h-14 flex items-center gap-3">
            <BackButton to="/shared-wishlists" variant="glass" />
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
                  {t('adminWishlist.createdBy')} {wishlist.creator_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl w-full px-4 -mt-10 relative z-10">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-10">
          <Button
            onClick={handleCopyShareLink}
            disabled={generatingLink}
            className="flex-1 bg-ios-secondary/80 backdrop-blur-xl hover:bg-ios-tertiary text-foreground rounded-[24px] py-8 flex items-center justify-center gap-3 border border-ios-separator/10 active:scale-95 transition-all">
            {generatingLink ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Share2 className="w-6 h-6" />
            )}
            <span className="text-[17px] font-semibold">
              {shareLink
                ? t('adminWishlist.copyShareLink')
                : t('adminWishlist.generateShareLink')}
            </span>
          </Button>
        </div>

        {/* Share Link Info */}
        {shareLink && <ShareLinkInfo shareLink={shareLink} />}

        {/* Summary Stats */}
        <SummaryStats items={items} />

        <div className="space-y-12 mt-12">
          {/* Available Items */}
          <AvailableItemsCard
            availableItems={availableItems}
            wishlist={wishlist}
            onEditItem={openEditDialog}
            onDeleteItem={openDeleteDialog}
          />

          {/* Taken Items */}
          <TakenItemsCard
            takenItems={takenItems}
            wishlist={wishlist}
            onUntakeItem={openUntakeDialog}
            onEditItem={openEditDialog}
            onDeleteItem={openDeleteDialog}
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

      {/* Edit Item Dialog */}
      <AdminEditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        wishlist={wishlist}
        editItem={editFormData}
        setEditItem={setEditFormData}
        onSubmit={handleUpdateItem}
        updating={updating}
        selectedItem={selectedEditItem}
        onDelete={openDeleteDialog}
        onUntake={openUntakeDialog}
        onRequestDeleteClaim={openDeleteClaimDialog}
      />

      {/* Delete Item Confirmation Dialog */}
      <AdminDeleteItemDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        selectedItem={selectedDeleteItem}
        deleting={deleting}
        onConfirm={handleDeleteItem}
      />

      {/* Remove Claim Confirmation Dialog */}
      <RemoveClaimDialog
        open={deleteClaimDialogOpen}
        onOpenChange={setDeleteClaimDialogOpen}
        claimerName={pendingDeleteClaim?.name ?? null}
        onConfirm={() => {
          if (pendingDeleteClaim) {
            handleDeleteClaim(pendingDeleteClaim.id, pendingDeleteClaim.itemId);
            setDeleteClaimDialogOpen(false);
          }
        }}
      />
    </div>
  );
};

export default AdminWishlist;
