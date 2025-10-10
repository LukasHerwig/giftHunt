-- Drop all existing policies on profiles and create a simple one
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_full_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_email_read" ON public.profiles;

-- Create a single simple policy that allows authenticated users to read profiles
CREATE POLICY "profiles_authenticated_read" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert/update their own profile
CREATE POLICY "profiles_own_modify" ON public.profiles
    FOR ALL USING (auth.uid() = id);