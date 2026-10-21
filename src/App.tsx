import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { AuthTester } from '@/components/AuthTester';
import Home from './Home';
import Auth from './Auth';
import Onboarding from './Onboarding';
import Wishlist, { WishlistRedirect } from './Wishlist';
import AcceptInvitation from './AcceptInvitation';
import PublicWishlist from './PublicWishlist';
import Profile from './Profile';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <div id="app-root" className="min-h-screen bg-ios-background">
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.PROD ? '/giftHunt' : ''}>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/shared-wishlists" element={<Navigate to="/" replace />} />
                <Route path="/wishlist/:id" element={<Wishlist />} />
                <Route path="/wishlist/:id/manage" element={<WishlistRedirect />} />
                <Route path="/wishlist/:id/admin" element={<WishlistRedirect />} />
                <Route path="/wishlist/:id/self" element={<WishlistRedirect />} />
                <Route
                  path="/accept-invitation"
                  element={<AcceptInvitation />}
                />
                <Route path="/shared/:token" element={<PublicWishlist />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Temporary testing component - remove after testing */}
              {/* <AuthTester /> */}
            </AuthProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
