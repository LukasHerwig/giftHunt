import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { LogOut, Languages, User, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const itemClass =
  'flex items-center gap-3 px-3 py-2.5 rounded-gh-sm text-[16px] text-gh-ink focus:bg-gh-surface-300 focus:text-gh-ink';
const menuClass =
  'rounded-gh-md p-1 bg-gh-surface-200 border border-gh-line shadow-gh-menu';

const getInitials = (fullName: string | undefined, email: string | undefined) => {
  if (fullName?.trim()) {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
  return email?.[0]?.toUpperCase() ?? '';
};

const AppHeader = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setMode, isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const initials = getInitials(user?.user_metadata?.full_name, user?.email);

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'sv' : 'en';
    i18n.changeLanguage(newLang);
  };

  const getCurrentThemeIcon = () => {
    if (theme.mode === 'system') return <Monitor className="w-5 h-5" />;
    return isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-gh-surface-100/90 backdrop-blur-xl border-b border-gh-line pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-4xl w-full px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="font-brand font-semibold text-[22px] leading-none text-gh-ink tracking-[-0.3px] rounded-gh-sm">
          GiftHunt
        </Link>

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('common.openMenu')}
              className="h-11 w-11 rounded-gh-pill bg-gh-primary-tint text-gh-primary-strong text-[15px] font-semibold flex items-center justify-center active:scale-[0.97] transition-transform">
              {initials || <User className="w-5 h-5" aria-hidden="true" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={`w-56 ${menuClass}`}>
            <DropdownMenuItem
              onClick={() => navigate('/profile')}
              className={itemClass}>
              <User className="w-5 h-5" />
              {t('common.profile')}
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                className={`${itemClass} data-[state=open]:bg-gh-surface-300`}>
                {getCurrentThemeIcon()}
                <span>{t('theme.appearance')}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className={`w-40 ${menuClass}`}>
                  <DropdownMenuItem
                    onClick={() => setMode('light')}
                    className={itemClass}>
                    <Sun className="w-5 h-5" />
                    {t('theme.light')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setMode('dark')}
                    className={itemClass}>
                    <Moon className="w-5 h-5" />
                    {t('theme.dark')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setMode('system')}
                    className={itemClass}>
                    <Monitor className="w-5 h-5" />
                    {t('theme.system')}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={toggleLanguage} className={itemClass}>
              <Languages className="w-5 h-5" />
              {i18n.language === 'en' ? 'Svenska' : 'English'}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gh-line mx-1 my-1" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-gh-sm text-[16px] text-gh-danger focus:bg-gh-danger-bg focus:text-gh-danger">
              <LogOut className="w-5 h-5" />
              {t('common.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
