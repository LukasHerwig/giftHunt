import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Save, User } from 'lucide-react';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {t('profile.personalInformation')}
        </CardTitle>
        <CardDescription>
          {t('profile.updateYourPersonalDetails')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="space-y-6">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('profile.email')}</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              {t('profile.emailCannotBeChanged')}
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('profile.fullName')}</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder={t('profile.fullNamePlaceholder')}
              disabled={saving}
              required
              className={
                !fullName.trim() && fullName.length > 0
                  ? 'border-destructive'
                  : ''
              }
            />
            {!fullName.trim() && fullName.length > 0 && (
              <p className="text-sm text-destructive">
                {t('profile.nameRequired')}
              </p>
            )}
          </div>

          {/* Account Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('profile.accountInformation')}
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <span className="font-medium">{t('profile.memberSince')}:</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={saving || !fullName.trim()}
              className="bg-primary hover:bg-primary/90">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('profile.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('profile.saveChanges')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
