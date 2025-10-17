import { useDashboard } from './hooks/useDashboard';
import { DashboardLoadingState } from './components/DashboardLoadingState';
import { EnvironmentIndicator } from './components/EnvironmentIndicator';
import { CreateWishlistDialog } from './components/CreateWishlistDialog';
import { PendingInvitationsSection } from './components/PendingInvitationsSection';
import { CreateWishlistButton } from './components/CreateWishlistButton';
import { MyWishlistsSection } from './components/MyWishlistsSection';
import { AdminWishlistsSection } from './components/AdminWishlistsSection';
import AppHeader from '@/components/AppHeader';

const Dashboard = () => {
  const {
    wishlists,
    adminWishlists,
    pendingInvitations,
    loading,
    createDialogOpen,
    newTitle,
    newDescription,
    enableLinks,
    enablePrice,
    enablePriority,
    creating,
    handleCreateWishlist,
    handleAcceptInvitation,
    setCreateDialogOpen,
    setNewTitle,
    setNewDescription,
    setEnableLinks,
    setEnablePrice,
    setEnablePriority,
  } = useDashboard();

  if (loading) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <EnvironmentIndicator />
      <AppHeader />

      <CreateWishlistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateWishlist}
        newTitle={newTitle}
        onTitleChange={setNewTitle}
        newDescription={newDescription}
        onDescriptionChange={setNewDescription}
        enableLinks={enableLinks}
        onEnableLinksChange={setEnableLinks}
        enablePrice={enablePrice}
        onEnablePriceChange={setEnablePrice}
        enablePriority={enablePriority}
        onEnablePriorityChange={setEnablePriority}
        creating={creating}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <PendingInvitationsSection
          invitations={pendingInvitations}
          onAcceptInvitation={handleAcceptInvitation}
        />

        <CreateWishlistButton onClick={() => setCreateDialogOpen(true)} />

        <MyWishlistsSection wishlists={wishlists} />

        <AdminWishlistsSection adminWishlists={adminWishlists} />
      </main>
    </div>
  );
};

export default Dashboard;
