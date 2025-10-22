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
import {
  Gift,
  Menu,
  LogOut,
  Languages,
  User,
  Search,
  Target,
} from 'lucide-react';
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
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 ios-header-safe-area relative">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-blue-400 flex items-center justify-center relative overflow-hidden shadow-lg">
            <Search className="w-8 h-8 text-white z-10" />
            <div className="absolute inset-0 flex items-center justify-center -translate-x-0.5 -translate-y-0.5">
              <Gift className="w-3 h-3 text-white animate-pulse z-20" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">GiftHunt</h1>
        </div>

        {/* Action buttons and Hamburger Menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('common.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleLanguage}
                className="flex items-center gap-2">
                <Languages className="w-4 h-4" />
                {i18n.language === 'en' ? 'Svenska' : 'English'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
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
