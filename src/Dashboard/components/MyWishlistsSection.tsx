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
import { Gift, Plus } from 'lucide-react';
import { Wishlist } from '../types';

interface MyWishlistsSectionProps {
  wishlists: Wishlist[];
}

export const MyWishlistsSection = ({ wishlists }: MyWishlistsSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5" />
        {t('navigation.myWishlists')}
      </h2>
      {wishlists.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {t('dashboard.noWishlistsYet')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('dashboard.createFirstWishlist')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {wishlists.map((wishlist) => (
            <Card
              key={wishlist.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-primary/10 hover:border-primary/30"
              onClick={() => navigate(`/wishlist/${wishlist.id}/manage`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-primary" />
                      {wishlist.title}
                    </CardTitle>
                    {wishlist.description && (
                      <CardDescription className="text-base line-clamp-2">
                        {wishlist.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {t('dashboard.itemCount', {
                      count: wishlist.item_count || 0,
                    })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    {t('dashboard.createdOn', {
                      date: new Date(wishlist.created_at).toLocaleDateString(),
                    })}
                  </span>
                  <span className="text-primary font-medium hover:underline">
                    {t('dashboard.manageAction')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
