import { useDashboard } from './hooks/useDashboard';
import { DashboardLoadingState } from './components/DashboardLoadingState';
import { EnvironmentIndicator } from './components/EnvironmentIndicator';
import { CreateWishlistDialog } from './components/CreateWishlistDialog';
import { PendingInvitationsSection } from './components/PendingInvitationsSection';
import { CreateWishlistButton } from './components/CreateWishlistButton';
import { MyWishlistsSection } from './components/MyWishlistsSection';
import { SharedWishlistsLink } from './components/SharedWishlistsLink';
import AppHeader from '@/components/AppHeader';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-ios-background pb-24">
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

      <main className="mx-auto max-w-4xl w-full">
        <div className="px-4 pt-4 mb-8">
          <h1 className="text-[34px] font-bold tracking-tight text-foreground">
            {t('dashboard.title')}
          </h1>
        </div>

        <div className="px-4 space-y-6">
          <PendingInvitationsSection
            invitations={pendingInvitations}
            onAcceptInvitation={handleAcceptInvitation}
          />

          <SharedWishlistsLink />

          <MyWishlistsSection
            wishlists={wishlists}
            onCreateClick={() => setCreateDialogOpen(true)}
          />
        </div>
      </main>

      <div className="fixed bottom-8 right-6 z-50">
        <CreateWishlistButton onClick={() => setCreateDialogOpen(true)} />
      </div>
    </div>
  );
};

export default Dashboard;
