import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

export const SharedWishlistsLink = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/shared-wishlists')}
      className="w-full bg-ios-secondary/50 rounded-[20px] px-4 py-6 flex items-center gap-3 active:bg-ios-secondary transition-colors border border-ios-separator/10 group">
      <Users className="w-5 h-5 text-ios-blue" />
      <span className="text-[17px] font-semibold text-foreground">
        {t('navigation.adminAccess')}
      </span>
    </button>
  );
};
