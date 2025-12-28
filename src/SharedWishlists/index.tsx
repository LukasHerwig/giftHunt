import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth/useAuth';
import { DashboardService } from '@/Dashboard/services/DashboardService';
import { AdminWishlist } from '@/Dashboard/types';
import { Gift, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { toast } from 'sonner';

const SharedWishlists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [adminWishlists, setAdminWishlists] = useState<AdminWishlist[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await DashboardService.getAdminWishlists(user.id);
      setAdminWishlists(data);
    } catch (error) {
      console.error('Error loading shared wishlists:', error);
      toast.error(t('messages.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-ios-background pb-24">
      <AppHeader />

      <main className="mx-auto max-w-4xl w-full">
        <div className="px-4 pt-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-ios-secondary/80 backdrop-blur-md flex items-center justify-center text-ios-blue active:bg-ios-secondary transition-colors border border-ios-separator/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 mb-8">
          <h1 className="text-[34px] font-bold tracking-tight text-foreground">
            {t('navigation.adminAccess')}
          </h1>
        </div>

        <div className="px-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-blue"></div>
            </div>
          ) : adminWishlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-48 h-48 mb-8 relative">
                <div className="absolute inset-0 bg-ios-blue/10 rounded-full blur-3xl" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative">
                    <Gift className="w-24 h-24 text-ios-blue opacity-20 absolute -top-4 -left-4" />
                    <Gift className="w-24 h-24 text-ios-blue opacity-40 absolute top-4 left-4" />
                    <Gift className="w-32 h-32 text-ios-blue relative z-10" />
                  </div>
                </div>
              </div>
              <h3 className="text-[22px] font-bold text-foreground mb-2">
                {t('dashboard.noSharedWishlists')}
              </h3>
              <p className="text-[17px] text-ios-gray max-w-[260px]">
                {t('dashboard.noSharedWishlistsDesc')}
              </p>
            </div>
          ) : (
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
                      {wishlist.title}
                    </h3>
                    <p className="text-[13px] text-ios-gray truncate">
                      {t('dashboard.owner')}: {wishlist.owner_profile?.email}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ios-separator group-active:text-ios-gray transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SharedWishlists;
