import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfile } from './hooks/useProfile';
import { ProfileLoadingState } from './components/ProfileLoadingState';
import { ProfileNotFoundState } from './components/ProfileNotFoundState';
import { PersonalInformationCard } from './components/PersonalInformationCard';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, loading, saving, fullName, handleSave, setFullName } =
    useProfile();

  if (loading) {
    return <ProfileLoadingState />;
  }

  if (!profile) {
    return <ProfileNotFoundState />;
  }

  return (
    <div className="min-h-screen bg-ios-background pb-32 pb-safe">
      {/* Simple Navigation Header */}
      <div className="sticky top-0 z-50 bg-ios-background/80 backdrop-blur-xl border-b border-ios-separator/10 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-4xl w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/" />
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">
              {t('profile.title')}
            </h1>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className="bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full px-6 h-10 font-semibold shadow-lg active:scale-95 transition-all">
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t('common.save')}
              </div>
            )}
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-4xl mt-8 relative z-10">
        {/* Profile Summary Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-ios-secondary backdrop-blur-xl border border-ios-separator/10 rounded-full flex items-center justify-center mb-4 shadow-xl">
            <span className="text-[36px] font-bold text-foreground">
              {fullName.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <h2 className="text-[24px] font-bold text-foreground tracking-tight">
            {fullName || t('profile.fullNamePlaceholder')}
          </h2>
          <p className="text-[15px] text-ios-gray mt-1">{profile.email}</p>
        </div>

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
