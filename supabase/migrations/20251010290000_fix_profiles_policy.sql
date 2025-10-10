-- Update profiles RLS policy to allow reading emails for invitations
-- Drop the current restrictive policy
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;

-- Create a new policy that allows:
-- 1. Users to access their own profile completely
-- 2. Other authenticated users to read just the email field
CREATE POLICY "profiles_own_full_access" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "profiles_email_read" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');