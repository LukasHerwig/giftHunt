import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, Languages, User } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

const AppHeader = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'sv' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-ios-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl w-full px-4 h-14 flex items-center justify-end relative">
        {/* Action buttons and Hamburger Menu */}
        <div className="flex items-center gap-1 z-10">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-ios-label-primary bg-ios-secondary/50 hover:bg-ios-secondary active:opacity-50 h-10 w-10 rounded-full">
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
