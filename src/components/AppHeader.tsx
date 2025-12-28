import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from '@/components/ui/button';
import GiftHuntIcon from './GiftHuntIcon';
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
import {
  Settings,
  LogOut,
  Languages,
  User,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const AppHeader = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, setMode, isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 w-full bg-ios-background/80 backdrop-blur-xl border-b border-ios-separator/10">
      <div className="mx-auto max-w-4xl w-full px-4 h-14 flex items-center justify-between relative">
        {/* Logo/Home Link */}
        <Link
          to="/"
          className="flex items-center gap-3 active:opacity-50 transition-opacity">
          <GiftHuntIcon size={28} className="text-ios-blue" />
          <span className="text-[20px] font-bold text-foreground tracking-tight">
            GiftHunt
          </span>
        </Link>

        {/* Action buttons and Hamburger Menu */}
        <div className="flex items-center gap-1 z-10">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground bg-ios-secondary hover:bg-ios-tertiary active:opacity-50 h-10 w-10 rounded-full shadow-sm border border-ios-separator/10">
                <Settings className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-[12px] p-1 bg-ios-secondary/95 backdrop-blur-lg border-ios-separator shadow-2xl">
              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[17px] focus:bg-ios-blue focus:text-white">
                <User className="w-5 h-5" />
                {t('common.profile')}
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[17px] focus:bg-ios-blue focus:text-white data-[state=open]:bg-ios-blue data-[state=open]:text-white">
                  {getCurrentThemeIcon()}
                  <span>{t('theme.appearance')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-40 rounded-[12px] p-1 bg-ios-secondary/95 backdrop-blur-lg border-ios-separator shadow-2xl">
                    <DropdownMenuItem
                      onClick={() => setMode('light')}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[17px] focus:bg-ios-blue focus:text-white">
                      <Sun className="w-5 h-5" />
                      {t('theme.light')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setMode('dark')}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[17px] focus:bg-ios-blue focus:text-white">
                      <Moon className="w-5 h-5" />
                      {t('theme.dark')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setMode('system')}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[17px] focus:bg-ios-blue focus:text-white">
                      <Monitor className="w-5 h-5" />
                      {t('theme.system')}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem
                onClick={toggleLanguage}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[17px] focus:bg-ios-blue focus:text-white">
                <Languages className="w-5 h-5" />
                {i18n.language === 'en' ? 'Svenska' : 'English'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-ios-separator mx-1 my-1" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[17px] text-destructive focus:bg-destructive focus:text-white">
                <LogOut className="w-5 h-5" />
                {t('common.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
