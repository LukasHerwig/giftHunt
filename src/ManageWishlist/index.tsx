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
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 pb-20">
      <AppHeader />
      <PageSubheader
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center">
              <ArrowLeft className="w-4 h-4" />
              <span className="ml-2">{t('common.back')}</span>
            </Button>
          </div>
        }
        trailing={
          <div className="flex gap-2">
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
        }
      />

      <main className="container mx-auto px-4 max-w-3xl">
        <ShareLinkWarning hasActiveShareLink={hasActiveShareLink} />

        {(admins.length > 0 || invitations.length > 0) && (
          <AdminStatusSection
            admins={admins}
            invitations={invitations}
            hasActiveShareLink={hasActiveShareLink}
            onRemoveInvitation={handleRemoveInvitation}
            onRemoveAdmin={handleRemoveAdmin}
          />
        )}

        <div
          className={`mb-8 flex gap-2 ${
            isMobile ? 'flex-wrap' : 'justify-between'
          }`}>
          <div className={`flex gap-2 ${isMobile ? 'flex-wrap flex-1' : ''}`}>
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
      </main>
    </div>
  );
};

export default ManageWishlist;
