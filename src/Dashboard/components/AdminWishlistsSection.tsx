import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
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
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        {t('navigation.adminAccess')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {adminWishlists.map((wishlist) => (
          <Card
            key={wishlist.id}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/30"
            onClick={() => navigate(`/wishlist/${wishlist.id}/admin`)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {wishlist.title}
                  </CardTitle>
                  {wishlist.description && (
                    <CardDescription className="text-base line-clamp-2">
                      {wishlist.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-row items-end gap-1 shrink-0">
                  <Badge variant="secondary">{t('dashboard.admin')}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {t('dashboard.itemCount', {
                      count: wishlist.item_count || 0,
                    })}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  <span>
                    {t('dashboard.owner')}: {wishlist.owner_profile?.email}
                  </span>
                </span>
                <span className="text-primary font-medium hover:underline">
                  {t('dashboard.manageAction')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
