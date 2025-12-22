import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { AdminWishlist } from '../types';

interface AdminWishlistsSectionProps {
  adminWishlists: AdminWishlist[];
}

export const AdminWishlistsSection = ({
  adminWishlists,
}: AdminWishlistsSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (adminWishlists.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3">
        {adminWishlists.map((wishlist) => (
          <button
            key={wishlist.id}
            className="w-full bg-ios-secondary/50 rounded-[16px] px-4 py-4 flex items-center gap-3 active:bg-ios-secondary transition-colors border border-ios-separator/10 group"
            onClick={() => navigate(`/wishlist/${wishlist.id}/admin`)}>
            <div className="w-10 h-10 rounded-full bg-ios-green/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-ios-green" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[17px] font-semibold text-foreground">
                {t('navigation.adminAccess')}
              </h3>
              <p className="text-[13px] text-ios-gray truncate">
                {wishlist.title} • {wishlist.owner_profile?.email}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-ios-separator group-active:text-ios-gray transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
