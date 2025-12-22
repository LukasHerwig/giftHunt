import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, Mail, Calendar } from 'lucide-react';
import { ProfileData } from '../types';

interface PersonalInformationCardProps {
  profile: ProfileData;
  fullName: string;
  onFullNameChange: (name: string) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export const PersonalInformationCard = ({
  profile,
  fullName,
  onFullNameChange,
  onSave,
  saving,
}: PersonalInformationCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 space-y-8">
      <section>
        <h2 className="text-[13px] font-normal text-ios-label-secondary uppercase tracking-wider mb-2 ml-4">
          {t('profile.personalInformation')}
        </h2>
        <div className="bg-ios-secondary rounded-[12px] border border-ios-separator overflow-hidden">
          <form onSubmit={onSave}>
            {/* Email (read-only) */}
            <div className="flex items-center px-4 py-3 border-b border-ios-separator bg-ios-tertiary/30">
              <Mail className="w-5 h-5 text-ios-label-tertiary mr-3" />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="email"
                  className="text-[13px] text-ios-label-secondary block mb-0.5">
                  {t('profile.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="border-none bg-transparent p-0 h-auto text-[17px] text-ios-label-tertiary focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="flex items-center px-4 py-3">
              <User className="w-5 h-5 text-ios-blue mr-3" />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="fullName"
                  className="text-[13px] text-ios-label-secondary block mb-0.5">
                  {t('profile.fullName')}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => onFullNameChange(e.target.value)}
                  placeholder={t('profile.fullNamePlaceholder')}
                  disabled={saving}
                  required
                  className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-label-tertiary"
                />
              </div>
            </div>
          </form>
        </div>
        <p className="text-[13px] text-ios-label-secondary mt-2 ml-4">
          {t('profile.emailCannotBeChanged')}
        </p>
      </section>

      <section>
        <h2 className="text-[13px] font-normal text-ios-label-secondary uppercase tracking-wider mb-2 ml-4">
          {t('profile.accountInformation')}
        </h2>
        <div className="bg-ios-secondary rounded-[12px] border border-ios-separator overflow-hidden">
          <div className="flex items-center px-4 py-4">
            <Calendar className="w-5 h-5 text-ios-label-secondary mr-3" />
            <div className="flex justify-between items-center flex-1">
              <span className="text-[17px]">{t('profile.memberSince')}</span>
              <span className="text-[17px] text-ios-label-secondary">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-4">
        <Button
          onClick={onSave}
          disabled={saving || !fullName.trim()}
          className="w-full h-12 rounded-[12px] bg-ios-blue hover:bg-ios-blue/90 text-white font-semibold text-[17px] flex items-center justify-center gap-2">
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {t('profile.saveChanges')}
        </Button>
      </div>
    </div>
  );
};
