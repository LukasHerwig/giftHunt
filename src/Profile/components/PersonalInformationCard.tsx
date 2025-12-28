import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Calendar, ShieldCheck } from 'lucide-react';
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
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-[13px] font-medium text-ios-gray uppercase tracking-wider px-1">
          {t('profile.personalInformation')}
        </h2>

        <div className="bg-ios-secondary backdrop-blur-xl border border-ios-separator/10 rounded-[24px] overflow-hidden shadow-sm">
          <form onSubmit={onSave} className="divide-y divide-ios-separator/10">
            {/* Full Name */}
            <div className="flex items-center px-6 py-5 group transition-colors hover:bg-ios-tertiary/10">
              <div className="w-10 h-10 bg-ios-blue/10 rounded-full flex items-center justify-center mr-4 group-focus-within:bg-ios-blue/20 transition-colors">
                <User className="w-5 h-5 text-ios-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="fullName"
                  className="text-[13px] text-ios-gray font-medium block mb-1">
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
                  className="border-none bg-transparent p-0 h-auto text-[17px] font-semibold text-foreground focus-visible:ring-0 placeholder:text-ios-gray/50"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="flex items-center px-6 py-5 bg-ios-tertiary/5">
              <div className="w-10 h-10 bg-ios-gray/5 rounded-full flex items-center justify-center mr-4">
                <Mail className="w-5 h-5 text-ios-gray/60" />
              </div>
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="email"
                  className="text-[13px] text-ios-gray font-medium block mb-1">
                  {t('profile.email')}
                </Label>
                <div className="text-[17px] text-foreground/70 font-semibold truncate">
                  {profile.email}
                </div>
              </div>
              <div className="ml-2">
                <ShieldCheck className="w-4 h-4 text-ios-gray/20" />
              </div>
            </div>
          </form>
        </div>
        <p className="text-[13px] text-ios-gray px-4">
          {t('profile.emailCannotBeChanged')}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-[13px] font-medium text-ios-gray uppercase tracking-wider px-1">
          {t('profile.accountInformation')}
        </h2>
        <div className="bg-ios-secondary backdrop-blur-xl border border-ios-separator/10 rounded-[24px] overflow-hidden shadow-sm">
          <div className="flex items-center px-6 py-5">
            <div className="w-10 h-10 bg-ios-gray/10 rounded-full flex items-center justify-center mr-4">
              <Calendar className="w-5 h-5 text-ios-gray" />
            </div>
            <div className="flex justify-between items-center flex-1">
              <span className="text-[17px] font-medium text-foreground">
                {t('profile.memberSince')}
              </span>
              <span className="text-[17px] text-foreground font-semibold">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
