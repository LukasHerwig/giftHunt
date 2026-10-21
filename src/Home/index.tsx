import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gift, Plus, Users } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { EnvironmentIndicator } from '@/components/EnvironmentIndicator';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import { ListRow } from '@/components/gh/ListRow';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { StatusPill } from '@/components/gh/StatusPill';
import { HomeLoading, InvitationCard, ListSection, NewListSheet } from './components';
import { useHome } from './hooks/useHome';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const home = useHome();
  const { owned, organized, invitations } = home;

  const open = (id: string) => navigate(`/wishlist/${id}`);
  const itemsLabel = (count: number) => t('home.items', { count });

  const noLists = owned.length === 0 && organized.length === 0;

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <EnvironmentIndicator />
      <AppHeader />
      {home.loading ? (
        <HomeLoading />
      ) : home.failed ? (
        <EmptyState
          icon={Gift}
          size="screen"
          title={t('home.toast.loadFailed')}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void home.reload()}
              className="h-12 rounded-gh-md px-6 text-[16px] font-semibold">
              {t('home.retry')}
            </Button>
          }
        />
      ) : (
        <main className={cn(PAGE_COLUMN, 'flex flex-col gap-8 pb-10 pt-6 md:gap-10 md:pt-12')}>
          <h1 className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-gh-ink">
            {home.greetingName ? t('home.greeting', { name: home.greetingName }) : t('home.greetingNoName')}
          </h1>

          {invitations.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader title={t('home.sectionInvitations')} count={invitations.length} />
              {invitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  busy={home.busy}
                  onAccept={home.acceptInvitation}
                  onDecline={home.declineInvitation}
                />
              ))}
            </section>
          )}

          {noLists ? (
            <EmptyState
              icon={Gift}
              size="screen"
              title={t('home.empty.title')}
              text={t('home.empty.text')}
              action={
                <Button
                  type="button"
                  onClick={home.openSheet}
                  className="h-[52px] gap-2 rounded-gh-md px-6 text-[17px] font-semibold">
                  <Plus aria-hidden="true" />
                  {t('home.empty.action')}
                </Button>
              }
            />
          ) : (
            <>
              <ListSection title={t('home.sectionMine')} count={owned.length || undefined}>
                {owned.map((row) => (
                  <li key={row.id}>
                    <ListRow
                      icon={row.selfManaged ? Users : Gift}
                      title={row.title}
                      subtitle={[
                        itemsLabel(row.itemCount),
                        row.selfManaged
                          ? t('home.youOrganize')
                          : row.organizerName
                            ? t('home.organizerLine', { name: row.organizerName })
                            : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      chevron
                      onClick={() => open(row.id)}
                    />
                  </li>
                ))}
                <li>
                  <ListRow add icon={Plus} title={t('home.newList')} onClick={home.openSheet} />
                </li>
              </ListSection>

              {organized.length > 0 && (
                <ListSection title={t('home.sectionOrganize')} count={organized.length}>
                  {organized.map((row) => (
                    <li key={row.id}>
                      <ListRow
                        icon={Users}
                        title={row.title}
                        subtitle={[row.ownerName, itemsLabel(row.itemCount)].filter(Boolean).join(' · ')}
                        trailing={
                          row.requestCount > 0 ? (
                            <StatusPill status="pending">
                              {t('home.requests', { count: row.requestCount })}
                            </StatusPill>
                          ) : undefined
                        }
                        chevron
                        onClick={() => open(row.id)}
                      />
                    </li>
                  ))}
                </ListSection>
              )}
            </>
          )}
        </main>
      )}

      {home.sheetOpen && (
        <NewListSheet key="new" busy={home.busy} onSubmit={home.createList} onClose={home.closeSheet} />
      )}
    </div>
  );
};

export default Home;
