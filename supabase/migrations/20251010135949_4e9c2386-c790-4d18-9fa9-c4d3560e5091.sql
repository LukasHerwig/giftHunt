-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create wishlists table
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create wishlist_items table
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link TEXT,
  is_taken BOOLEAN NOT NULL DEFAULT FALSE,
  taken_by_name TEXT,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for wishlists
CREATE POLICY "Users can view their own wishlists"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wishlists"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists"
  ON public.wishlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wishlist_items
-- Owner can only see items that are NOT taken (to keep surprise)
CREATE POLICY "Owners can view non-taken items in their wishlists"
  ON public.wishlist_items FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    ) AND is_taken = FALSE
  );

-- Anyone can view items in wishlists (for public sharing)
CREATE POLICY "Anyone can view wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (TRUE);

-- Owner can add items to their wishlists
CREATE POLICY "Owners can add items to their wishlists"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Owner can update their items (but not if taken)
CREATE POLICY "Owners can update non-taken items"
  ON public.wishlist_items FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    ) AND is_taken = FALSE
  );

-- Owner can delete their items
CREATE POLICY "Owners can delete items from their wishlists"
  ON public.wishlist_items FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Anyone can mark items as taken (for public sharing)
CREATE POLICY "Anyone can mark items as taken"
  ON public.wishlist_items FOR UPDATE
  USING (TRUE)
  WITH CHECK (is_taken = TRUE);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();