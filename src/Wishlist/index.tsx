import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/useAuth';
import { OwnerWishlist, WishlistLoading } from './components';
import { modePath, resolveMode } from './lib/mode';
import { WishlistService } from './services/WishlistService';
import type { Mode } from './types';

/**
 * One address for a wishlist, whoever opens it. Owners get the owner screen;
 * until phase 4c organizers and self-managed owners are sent on to the screens
 * that still serve them, and everyone else goes Home.
 */
const Wishlist = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const userId = user?.id;
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!id || !userId) {
        if (!cancelled) setMode('none');
        return;
      }
      try {
        const wishlist = await WishlistService.loadWishlist(id);
        const isOrganizer = wishlist ? await WishlistService.isOrganizer(id, userId) : false;
        if (!cancelled) setMode(resolveMode({ wishlist, userId, isOrganizer }));
      } catch (error) {
        console.error('Resolve wishlist mode error:', error);
        if (!cancelled) setMode('none');
      }
    };
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  if (!id || mode === null) return <WishlistLoading />;
  if (mode === 'owner') return <OwnerWishlist wishlistId={id} />;
  return <Navigate to={modePath(mode, id)} replace />;
};

/** Old bookmarks of /wishlist/:id/manage land on the new address. */
export const ManageRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/wishlist/${id}` : '/'} replace />;
};

export default Wishlist;
