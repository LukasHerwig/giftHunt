import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth/useAuth';
import { DashboardService } from '@/Dashboard/services/DashboardService';
import { AdminWishlist } from '@/Dashboard/types';
import { Gift, ChevronRight, Users } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { BackButton } from '@/components/BackButton';
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
    <div className="min-h-screen bg-ios-background pb-24 pb-safe">
      {/* Simple Navigation Header */}
      <div className="sticky top-0 z-50 bg-ios-background/80 backdrop-blur-xl border-b border-ios-separator/10 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-4xl w-full px-4 h-14 flex items-center gap-3">
          <BackButton to="/" />
          <h1 className="text-[20px] font-bold text-foreground tracking-tight">
            {t('navigation.adminAccess')}
          </h1>
        </div>
      </div>

      <main className="mx-auto max-w-4xl w-full px-4 pt-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-[34px] font-bold tracking-tight text-foreground">
            {t('navigation.adminAccess')}
          </h1>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-blue"></div>
            </div>
          ) : adminWishlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6 bg-ios-secondary/30 backdrop-blur-xl rounded-[32px] border border-ios-separator/10">
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
                  className="w-full bg-ios-secondary/50 backdrop-blur-xl rounded-[24px] px-6 py-5 flex items-center gap-4 active:bg-ios-secondary transition-all border border-ios-separator/10 group shadow-sm"
                  onClick={() => navigate(`/wishlist/${wishlist.id}/admin`)}>
                  <div className="w-12 h-12 rounded-full bg-ios-green/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-ios-green" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-[19px] font-bold text-foreground tracking-tight">
                      {wishlist.title}
                    </h3>
                    <p className="text-[15px] text-ios-gray truncate">
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
