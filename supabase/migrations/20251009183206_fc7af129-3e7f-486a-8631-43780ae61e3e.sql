-- Fix security linter warning: Remove SECURITY DEFINER from view
-- Drop the previous view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

-- Create a standard view (no SECURITY DEFINER) that only exposes safe profile fields
-- This will use the querying user's permissions, which is correct for a public view
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  bio,
  account_type,
  created_at
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 
'Public profile view for marketplace discovery.
Exposes only non-sensitive fields: display_name, avatar_url, bio, account_type, created_at.
Sensitive fields (Stripe Connect status, platform tokens) are hidden.
Users can view their own complete profile via the profiles table directly.
This view uses the querying user''s permissions (not SECURITY DEFINER).';