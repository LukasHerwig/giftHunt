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
import { AdminEditItemDialog } from './components/AdminEditItemDialog';
import { AdminDeleteItemDialog } from './components/AdminDeleteItemDialog';

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
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
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
      />

      {/* Delete Item Confirmation Dialog */}
      <AdminDeleteItemDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        selectedItem={selectedDeleteItem}
        deleting={deleting}
        onConfirm={handleDeleteItem}
      />
    </div>
  );
};

export default AdminWishlist;
