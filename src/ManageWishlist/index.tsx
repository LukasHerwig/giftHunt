import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import AppHeader from '@/components/AppHeader';
import PageSubheader from '@/components/PageSubheader';

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
    <div className="min-h-screen bg-ios-background pb-20">
      <AppHeader />
      <div className="sticky top-11 z-40 w-full bg-ios-secondary/80 backdrop-blur-xl border-b border-ios-separator">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between relative">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-ios-blue hover:bg-transparent active:opacity-50 p-0 h-auto font-normal text-[17px] z-10">
            <ArrowLeft className="w-5 h-5 mr-1" />
            {t('common.back')}
          </Button>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
              {wishlist?.title || t('manageWishlist.title')}
            </h2>
          </div>

          <div className="z-10">
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
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-3xl pt-6">
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

        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-[13px] font-medium text-ios-gray uppercase tracking-wider px-4 mb-2">
            {t('manageWishlist.items')}
          </h3>
          <AddItemDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            wishlist={wishlist}
            newItem={newItem}
            setNewItem={setNewItem}
            onSubmit={handleAddItem}
            adding={adding}
          />
        </div>

        <div className="hidden">
          <EditItemDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            wishlist={wishlist}
            editItem={editItem}
            setEditItem={setEditItem}
            onSubmit={handleUpdateItem}
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
        </div>

        <WishlistItems
          items={items}
          wishlist={wishlist}
          hasActiveShareLink={hasActiveShareLink}
          onEditItem={handleEditItem}
          onEditDescriptionOnly={handleEditDescriptionOnly}
          onDeleteItem={handleDeleteItem}
          formatUrl={formatUrl}
        />

        {canInviteAdmin && (
          <div className="mt-8 px-4">
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(true)}
              className="w-full py-6 rounded-[12px] border-ios-separator bg-ios-secondary text-ios-blue font-medium text-[17px] hover:bg-ios-tertiary active:opacity-70 transition-all">
              {t('manageWishlist.inviteAdmin')}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageWishlist;
