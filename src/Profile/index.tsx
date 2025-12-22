import { useTranslation } from 'react-i18next';
import { useProfile } from './hooks/useProfile';
import { ProfileLoadingState } from './components/ProfileLoadingState';
import { ProfileNotFoundState } from './components/ProfileNotFoundState';
import { PersonalInformationCard } from './components/PersonalInformationCard';
import AppHeader from '@/components/AppHeader';
import PageSubheader from '@/components/PageSubheader';

const Profile = () => {
  const { t } = useTranslation();
  const { profile, loading, saving, fullName, handleSave, setFullName } =
    useProfile();

  if (loading) {
    return <ProfileLoadingState />;
  }

  if (!profile) {
    return <ProfileNotFoundState />;
  }

  return (
    <div className="min-h-screen bg-ios-background">
      <AppHeader />

      <PageSubheader
        title={t('profile.title')}
        description={t('profile.description')}
      />

      <main className="pb-20">
        <PersonalInformationCard
          profile={profile}
          fullName={fullName}
          onFullNameChange={setFullName}
          onSave={handleSave}
          saving={saving}
        />
      </main>
    </div>
  );
};

export default Profile;
