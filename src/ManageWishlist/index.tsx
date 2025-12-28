import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Edit2, Share2, Trash2, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BackButton } from '@/components/BackButton';

import { useManageWishlist } from './hooks';
import {
  AddItemDialog,
  EditItemDialog,
  EditLimitedDialog,
  InviteAdminDialog,
  SettingsDialog,
  AdminStatusSection,
  WishlistItems,
  ShareLinkWarning,
} from './components';

const ManageWishlist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const {
    // State
    items,
    wishlist,
    setWishlist,
    loading,
    admins,
    invitations,
    hasActiveShareLink,

    // Dialog states
    dialogOpen,
    setDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editDescriptionDialogOpen,
    setEditDescriptionDialogOpen,
    inviteDialogOpen,
    setInviteDialogOpen,
    settingsDialogOpen,
    setSettingsDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,

    // Form states
    newItem,
    setNewItem,
    editingItem,
    editItem,
    setEditItem,
    editingDescriptionItem,
    editDescription,
    setEditDescription,
    editLinkLimited,
    setEditLinkLimited,
    editPriceRangeLimited,
    setEditPriceRangeLimited,
    editPriorityLimited,
    setEditPriorityLimited,
    inviteEmail,
    setInviteEmail,
    settings,
    setSettings,

    // Loading states
    adding,
    updating,
    inviting,
    updatingSettings,

    // Actions
    handleAddItem,
    handleEditItem,
    handleUpdateItem,
    handleEditDescriptionOnly,
    handleUpdateDescriptionOnly,
    handleDeleteItem,
    handleInviteAdmin,
    handleRemoveInvitation,
    handleRemoveAdmin,
    handleUpdateSettings,
    handleDeleteWishlist,

    // Utilities
    formatUrl,
    canInviteAdmin,
  } = useManageWishlist(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">{t('manageWishlist.loading')}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-background pb-32">
      {/* Immersive Header */}
      <div className="relative h-[45vh] min-h-[350px] w-full overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-ios-blue/40 via-purple-500/40 to-pink-500/40">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-ios-background" />
        </div>

        {/* Top Navigation */}
        <div className="sticky top-0 z-50 w-full h-14">
          <div className="mx-auto max-w-4xl w-full px-4 h-full flex items-center gap-3">
            <BackButton to="/" variant="glass" />
          </div>
        </div>

        {/* Title Card */}
        <div className="absolute inset-x-0 bottom-16 px-4 flex justify-center">
          <div className="w-full max-w-4xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] px-8 py-8 flex items-center justify-center shadow-2xl">
            <h1 className="text-[32px] font-bold text-white tracking-tight leading-tight">
              {wishlist?.title || t('manageWishlist.title')}
            </h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-4xl -mt-10 relative z-10">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-10">
          <Button
            onClick={() => setInviteDialogOpen(true)}
            className="flex-1 bg-ios-secondary/80 backdrop-blur-xl hover:bg-ios-tertiary text-foreground rounded-[24px] py-8 flex items-center justify-center gap-3 border border-ios-separator/10 active:scale-95 transition-all">
            <Share2 className="w-6 h-6" />
            <span className="text-[17px] font-semibold">
              {t('manageWishlist.invite')}
            </span>
          </Button>
          <Button
            onClick={() => setSettingsDialogOpen(true)}
            className="flex-1 bg-ios-secondary/80 backdrop-blur-xl hover:bg-ios-tertiary text-foreground rounded-[24px] py-8 flex items-center justify-center gap-3 border border-ios-separator/10 active:scale-95 transition-all">
            <Edit2 className="w-6 h-6" />
            <span className="text-[17px] font-semibold">
              {t('common.edit')}
            </span>
          </Button>
        </div>

        <ShareLinkWarning hasActiveShareLink={hasActiveShareLink} />

        {(admins.length > 0 || invitations.length > 0) && (
          <div className="mb-8">
            <AdminStatusSection
              admins={admins}
              invitations={invitations}
              hasActiveShareLink={hasActiveShareLink}
              onRemoveInvitation={handleRemoveInvitation}
              onRemoveAdmin={handleRemoveAdmin}
            />
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-[13px] font-normal text-ios-label-secondary uppercase tracking-wider mb-2 ml-4">
            {t('manageWishlist.items')}
          </h3>

          <WishlistItems
            items={items}
            wishlist={wishlist}
            hasActiveShareLink={hasActiveShareLink}
            onEditItem={handleEditItem}
            onEditDescriptionOnly={handleEditDescriptionOnly}
            onDeleteItem={handleDeleteItem}
            formatUrl={formatUrl}
            onAddItem={() => setDialogOpen(true)}
          />
        </div>

        {/* Dialogs (Hidden) */}
        <div className="hidden">
          <AddItemDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            wishlist={wishlist}
            newItem={newItem}
            setNewItem={setNewItem}
            onSubmit={handleAddItem}
            adding={adding}
          />

          <EditItemDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            wishlist={wishlist}
            editItem={editItem}
            setEditItem={setEditItem}
            onSubmit={handleUpdateItem}
            onDelete={() => {
              if (editingItem) {
                handleDeleteItem(editingItem.id);
                setEditDialogOpen(false);
              }
            }}
            updating={updating}
          />

          <EditLimitedDialog
            open={editDescriptionDialogOpen}
            onOpenChange={setEditDescriptionDialogOpen}
            item={editingDescriptionItem}
            wishlist={wishlist}
            description={editDescription}
            setDescription={setEditDescription}
            link={editLinkLimited}
            setLink={setEditLinkLimited}
            priceRange={editPriceRangeLimited}
            setPriceRange={setEditPriceRangeLimited}
            priority={editPriorityLimited}
            setPriority={setEditPriorityLimited}
            onSubmit={handleUpdateDescriptionOnly}
            onDelete={() => {
              if (editingDescriptionItem) {
                handleDeleteItem(editingDescriptionItem.id);
                setEditDescriptionDialogOpen(false);
              }
            }}
            updating={updating}
          />

          <InviteAdminDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            canInviteAdmin={canInviteAdmin}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            onSubmit={handleInviteAdmin}
            inviting={inviting}
          />

          <SettingsDialog
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
            wishlist={wishlist}
            setWishlist={setWishlist}
            settings={settings}
            setSettings={setSettings}
            onSubmit={handleUpdateSettings}
            onDeleteWishlist={handleDeleteWishlist}
            updatingSettings={updatingSettings}
            deleteDialogOpen={deleteDialogOpen}
            setDeleteDialogOpen={setDeleteDialogOpen}
          />
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-10 right-8 w-16 h-16 bg-ios-secondary/90 backdrop-blur-2xl border border-ios-separator/20 rounded-full flex items-center justify-center text-foreground shadow-2xl active:scale-90 transition-all z-50">
        <Plus className="w-9 h-9" />
      </button>
    </div>
  );
};

export default ManageWishlist;
