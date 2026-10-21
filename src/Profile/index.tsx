import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { Segmented } from '@/components/gh/Segmented';
import { SwitchRow } from '@/components/gh/SwitchRow';
import { usePlayful } from '@/lib/playful';
import { useTheme, type Mode } from '@/contexts/ThemeContext';
import { AboutSection, ProfileLoading } from './components';
import { useProfile } from './hooks/useProfile';
import { formatMemberSince } from './lib/memberSince';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const { theme, setMode } = useTheme();
  const page = useProfile();
  const [playful, setPlayful] = usePlayful();
  const language = i18n.language?.startsWith('sv') ? 'sv' : 'en';

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader title={t('profile.title')} />
      {page.loading ? (
        <ProfileLoading />
      ) : page.failed || !page.profile ? (
        <EmptyState
          pose="sad"
          size="screen"
          title={t('profile.loadFailed')}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void page.reload()}
              className="h-12 rounded-gh-md px-6 text-[16px] font-semibold">
              {t('profile.retry')}
            </Button>
          }
        />
      ) : (
        <main className={cn(PAGE_COLUMN, 'flex flex-col gap-8 pb-10 pt-6 md:gap-10 md:pt-12')}>
          <AboutSection
            email={page.profile.email}
            fullName={page.fullName}
            error={page.nameError}
            changed={page.changed}
            saving={page.saving}
            onChange={page.setFullName}
            onSubmit={page.save}
          />

          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:gap-6">
            <section className="flex flex-col gap-3">
              <SectionHeader title={t('profile.sectionAppearance')} />
              <Segmented
                ariaLabel={t('profile.sectionAppearance')}
                value={theme.mode}
                onChange={(value) => setMode(value as Mode)}
                options={[
                  { value: 'light', label: t('profile.themeLight') },
                  { value: 'dark', label: t('profile.themeDark') },
                  { value: 'system', label: t('profile.themeSystem') },
                ]}
              />
            </section>
            <section className="flex flex-col gap-3">
              <SectionHeader title={t('profile.sectionLanguage')} />
              <Segmented
                ariaLabel={t('profile.sectionLanguage')}
                value={language}
                onChange={(value) => void i18n.changeLanguage(value)}
                options={[
                  { value: 'sv', label: t('profile.languageSv') },
                  { value: 'en', label: t('profile.languageEn') },
                ]}
              />
            </section>
          </div>

          <div className="overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200">
            <SwitchRow
              label={t('profile.playful')}
              description={t('profile.playfulHelp')}
              checked={playful}
              onChange={setPlayful}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-gh-line pt-6 md:flex-row md:items-center md:justify-between">
            <p className="text-[13px] leading-[18px] text-gh-muted">
              {t('profile.memberSince', { date: formatMemberSince(page.profile.created_at, language) })}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void signOut()}
              className="h-[52px] w-full rounded-gh-md px-6 text-[16px] font-semibold md:w-auto">
              {t('profile.signOut')}
            </Button>
          </div>
        </main>
      )}
    </div>
  );
};

export default Profile;
