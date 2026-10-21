import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, User } from 'lucide-react';
import { useAuth } from '@/components/auth/useAuth';
import { useProfileName } from '@/components/useProfileName';
import { initials } from '@/lib/personName';
import { cn } from '@/lib/utils';
import { PAGE_COLUMN } from '@/components/pageColumn';

const ProfileAvatar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const name = useProfileName();
  const label = initials(name, user?.email);
  return (
    <Link
      to="/profile"
      aria-label={t('common.profile')}
      className="flex h-11 w-11 items-center justify-center rounded-gh-pill bg-gh-primary-tint text-[15px] font-semibold text-gh-primary-strong transition-transform active:scale-[0.97]">
      {label || <User className="h-5 w-5" aria-hidden="true" />}
    </Link>
  );
};

interface AppHeaderProps {
  /** A page title with a back button to Home instead of the wordmark (Profile). */
  title?: string;
  /** No avatar, for the screen before the person has a name (onboarding). */
  hideAvatar?: boolean;
}

const AppHeader = ({ title, hideAvatar = false }: AppHeaderProps) => {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gh-line bg-gh-surface-100/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className={cn(PAGE_COLUMN, 'flex h-14 items-center justify-between')}>
        {title ? (
          <div className="flex items-center gap-1">
            <Link
              to="/"
              aria-label={t('common.back')}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-gh-pill text-gh-ink">
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </Link>
            <h1 className="text-[20px] font-bold leading-6 tracking-[-0.3px] text-gh-ink">{title}</h1>
          </div>
        ) : (
          <Link
            to="/"
            className="rounded-gh-sm font-brand text-[22px] font-semibold leading-none tracking-[-0.3px] text-gh-ink">
            GiftHunt
          </Link>
        )}
        {!hideAvatar && <ProfileAvatar />}
      </div>
    </header>
  );
};

export default AppHeader;
