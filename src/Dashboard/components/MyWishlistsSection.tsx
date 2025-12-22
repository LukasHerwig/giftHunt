import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronRight } from 'lucide-react';
import { Wishlist } from '../types';

interface MyWishlistsSectionProps {
  wishlists: Wishlist[];
}

export const MyWishlistsSection = ({ wishlists }: MyWishlistsSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <h2 className="text-[13px] font-medium text-ios-gray uppercase tracking-wider">
        {t('navigation.myWishlists')}
      </h2>

      {wishlists.length === 0 ? (
        <div className="p-8 bg-ios-secondary rounded-[20px] text-center space-y-3 border border-ios-separator/10">
          <Gift className="w-12 h-12 mx-auto text-ios-gray/50" />
          <div className="space-y-1">
            <h3 className="text-[17px] font-semibold">
              {t('dashboard.noWishlistsYet')}
            </h3>
            <p className="text-[15px] text-ios-gray">
              {t('dashboard.createFirstWishlist')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {wishlists.map((wishlist) => (
            <button
              key={wishlist.id}
              className="w-full bg-ios-secondary rounded-[24px] overflow-hidden text-left flex flex-col active:scale-[0.98] transition-all shadow-lg border border-ios-separator/10 group"
              onClick={() => navigate(`/wishlist/${wishlist.id}/manage`)}>
              {/* Image Area */}
              <div className="relative h-48 w-full bg-gradient-to-br from-ios-blue/20 via-ios-blue/5 to-ios-secondary flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-ios-secondary via-transparent to-transparent" />
                <Gift className="w-12 h-12 text-ios-blue relative z-10 opacity-50" />

                {/* Item Count Badge */}
                <div className="absolute top-4 right-4 bg-ios-blue text-white px-3 py-1 rounded-full text-[13px] font-bold shadow-lg">
                  {t('dashboard.itemCount_other', {
                    count: wishlist.item_count || 0,
                  })}
                </div>
              </div>

              <div className="p-5 pt-2">
                <h3 className="text-[22px] font-bold text-foreground leading-tight">
                  {wishlist.title}
                </h3>
                {wishlist.description && (
                  <p className="text-[15px] text-ios-gray mt-1 line-clamp-1">
                    {wishlist.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
