import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/useAuth';
import { OrganizerWishlist, OwnerWishlist, WishlistLoading } from './components';
import { resolveMode } from './lib/mode';
import { WishlistService } from './services/WishlistService';
import type { Mode } from './types';

/**
 * One address for a wishlist, whoever opens it: the owner, the invited organizer
 * and the creator of a self-managed list each get their own mode; anyone else goes Home.
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
  if (mode === 'organizer' || mode === 'self') return <OrganizerWishlist wishlistId={id} mode={mode} />;
  return <Navigate to="/" replace />;
};

/** Old addresses (/manage, /admin, /self) land on the new one. */
export const WishlistRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/wishlist/${id}` : '/'} replace />;
};

export default Wishlist;
