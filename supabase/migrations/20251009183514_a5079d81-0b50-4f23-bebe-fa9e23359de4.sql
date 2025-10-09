-- Fix: Allow authenticated users to discover other users' profiles
-- This enables marketplace functionality where creators and businesses can find each other
-- Defense in depth: applications should use public_profiles view for non-sensitive fields

CREATE POLICY "Authenticated users can view all profiles for discovery"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add comment explaining the security model
COMMENT ON TABLE public.profiles IS 
'User profiles with multi-layer access control:
1. RLS Policies:
   - Authenticated users can SELECT all profiles (marketplace discovery)
   - Users can UPDATE/INSERT only their own profile
   - Admins have full access
2. Application Layer:
   - Use public_profiles VIEW for displaying other users (hides sensitive fields)
   - Use profiles table directly only for own profile or admin functions
3. Sensitive fields (stripe_connect_*, tokens) should only be displayed to:
   - The profile owner
   - System administrators
This is defense-in-depth: database allows reading, but applications filter sensitive data.';