import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

export const SharedWishlistsLink = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/shared-wishlists')}
      className="w-full bg-ios-secondary/50 rounded-[16px] px-4 py-4 flex items-center gap-3 active:bg-ios-secondary transition-colors border border-ios-separator/10 group mb-6">
      <div className="w-10 h-10 rounded-full bg-ios-blue/10 flex items-center justify-center shrink-0">
        <Users className="w-5 h-5 text-ios-blue" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="text-[17px] font-semibold text-foreground">
          {t('navigation.adminAccess')}
        </h3>
      </div>
      <ChevronRight className="w-5 h-5 text-ios-separator group-active:text-ios-gray transition-colors" />
    </button>
  );
};
