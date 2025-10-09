-- Fix: Allow authenticated users to view basic profile information
-- This enables businesses to discover creators and vice versa
-- Note: Applications should only request non-sensitive fields:
-- (display_name, avatar_url, bio, account_type, created_at)
-- Sensitive fields like Stripe Connect flags should not be exposed to other users

CREATE POLICY "Authenticated users can view basic profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add comment explaining the security model
COMMENT ON TABLE public.profiles IS 
'Profile data access model:
- Users can view ALL profiles (marketplace discovery)
- Users can only UPDATE their own profile
- Applications should use get_public_profile_data() or request only safe fields
- Sensitive fields (stripe_connect_*) should not be exposed in UI to other users
- Defense in depth: application code must filter sensitive fields from display';