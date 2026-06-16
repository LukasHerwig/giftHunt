import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Share2, Loader2, Plus } from 'lucide-react';
import { RemoveClaimDialog } from '@/AdminWishlist/components/RemoveClaimDialog';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { useSelfManagedWishlist } from './hooks/useSelfManagedWishlist';

// Reuse item display + action dialogs from AdminWishlist
import { ShareLinkInfo } from '@/AdminWishlist/components/ShareLinkInfo';
import { SummaryStats } from '@/AdminWishlist/components/SummaryStats';
import { AvailableItemsCard } from '@/AdminWishlist/components/AvailableItemsCard';
import { TakenItemsCard } from '@/AdminWishlist/components/TakenItemsCard';
import { UntakeItemDialog } from '@/AdminWishlist/components/UntakeItemDialog';
import { AdminEditItemDialog } from '@/AdminWishlist/components/AdminEditItemDialog';
import { AdminDeleteItemDialog } from '@/AdminWishlist/components/AdminDeleteItemDialog';

// Reuse add item dialog from ManageWishlist
import { AddItemDialog } from '@/ManageWishlist/components/AddItemDialog';

const SelfManagedWishlist = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const {
    wishlist,
    items,
    loading,
    shareLink,
    generatingLink,
    addDialogOpen,
    newItem,
    adding,
    editDialogOpen,
    selectedEditItem,
    editFormData,
    updating,
    deleteDialogOpen,
    selectedDeleteItem,
    deleting,
    untakeDialogOpen,
    selectedUntakeItem,
    untaking,
    handleCopyShareLink,
    setAddDialogOpen,
    setNewItem,
    handleAddItem,
    openEditDialog,
    setEditDialogOpen,
    setEditFormData,
    handleUpdateItem,
    openDeleteDialog,
    setDeleteDialogOpen,
    handleDeleteItem,
    openUntakeDialog,
    setUntakeDialogOpen,
    handleUntakeItem,
    handleDeleteClaim,
    openDeleteClaimDialog,
    deleteClaimDialogOpen,
    pendingDeleteClaim,
    setDeleteClaimDialogOpen,
  } = useSelfManagedWishlist(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-background">
        <Loader2 className="w-8 h-8 animate-spin text-ios-blue" />
        <span className="ml-2 text-foreground">{t('common.loading')}</span>
      </div>
    );
  }

  if (!wishlist) return null;

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

  // AdminWishlist's item cards expect its own Wishlist type shape — cast since the fields used are the same
  const wishlistForCards = wishlist as unknown as Parameters<typeof AvailableItemsCard>[0]['wishlist'];

  return (
    <div className="min-h-screen bg-ios-background pb-32 pb-safe">
      {/* Immersive Header */}
      <div className="relative h-[45vh] min-h-[350px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-ios-blue/5">
          <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-ios-background" />
        </div>

        <div className="sticky top-0 z-50 w-full pt-[env(safe-area-inset-top)]">
          <div className="mx-auto max-w-4xl w-full px-4 h-14 flex items-center gap-3">
            <BackButton to="/" variant="glass" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-16 flex justify-center">
          <div className="w-full max-w-4xl px-4">
            <div className="w-full bg-white/80 dark:bg-white/10 backdrop-blur-2xl border border-ios-separator/10 dark:border-white/20 rounded-[32px] px-8 py-8 flex items-center justify-center shadow-2xl">
              <h1 className="text-[32px] font-bold text-foreground dark:text-white tracking-tight leading-tight">
                {wishlist.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl w-full px-4 -mt-10 relative z-10">
        {/* Share link button */}
        <div className="mb-10">
          <Button
            onClick={handleCopyShareLink}
            disabled={generatingLink}
            className="w-full bg-ios-secondary/80 backdrop-blur-xl hover:bg-ios-tertiary text-foreground rounded-[24px] py-8 flex items-center justify-center gap-3 border border-ios-separator/10 active:scale-95 transition-all">
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

        {shareLink && <ShareLinkInfo shareLink={shareLink} />}

        <SummaryStats items={items} />

        <div className="space-y-12 mt-12">
          <AvailableItemsCard
            availableItems={availableItems}
            wishlist={wishlistForCards}
            onEditItem={openEditDialog as Parameters<typeof AvailableItemsCard>[0]['onEditItem']}
            onDeleteItem={openDeleteDialog as Parameters<typeof AvailableItemsCard>[0]['onDeleteItem']}
          />
          <TakenItemsCard
            takenItems={takenItems}
            wishlist={wishlistForCards}
            onUntakeItem={openUntakeDialog as Parameters<typeof TakenItemsCard>[0]['onUntakeItem']}
            onEditItem={openEditDialog as Parameters<typeof TakenItemsCard>[0]['onEditItem']}
            onDeleteItem={openDeleteDialog as Parameters<typeof TakenItemsCard>[0]['onDeleteItem']}
          />
        </div>
      </main>

      {/* FAB — add item */}
      <button
        onClick={() => setAddDialogOpen(true)}
        className="fixed bottom-10 right-8 w-16 h-16 bg-ios-secondary/90 backdrop-blur-2xl border border-ios-separator/20 rounded-full flex items-center justify-center text-foreground shadow-2xl active:scale-90 transition-all z-50">
        <Plus className="w-9 h-9" />
      </button>

      {/* Dialogs */}
      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        wishlist={wishlist as unknown as Parameters<typeof AddItemDialog>[0]['wishlist']}
        newItem={newItem}
        setNewItem={setNewItem}
        onSubmit={handleAddItem}
        adding={adding}
      />

      <AdminEditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        wishlist={wishlistForCards}
        editItem={editFormData}
        setEditItem={setEditFormData as Parameters<typeof AdminEditItemDialog>[0]['setEditItem']}
        onSubmit={handleUpdateItem}
        updating={updating}
        selectedItem={selectedEditItem as Parameters<typeof AdminEditItemDialog>[0]['selectedItem']}
        onDelete={openDeleteDialog as Parameters<typeof AdminEditItemDialog>[0]['onDelete']}
        onUntake={openUntakeDialog as Parameters<typeof AdminEditItemDialog>[0]['onUntake']}
        onRequestDeleteClaim={openDeleteClaimDialog}
      />

      <AdminDeleteItemDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        selectedItem={selectedDeleteItem as Parameters<typeof AdminDeleteItemDialog>[0]['selectedItem']}
        deleting={deleting}
        onConfirm={handleDeleteItem}
      />

      <UntakeItemDialog
        open={untakeDialogOpen}
        onOpenChange={setUntakeDialogOpen}
        selectedItem={selectedUntakeItem as Parameters<typeof UntakeItemDialog>[0]['selectedItem']}
        untaking={untaking}
        onConfirm={handleUntakeItem}
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

export default SelfManagedWishlist;
