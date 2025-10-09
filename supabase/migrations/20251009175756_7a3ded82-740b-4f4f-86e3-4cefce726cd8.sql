-- Fix Critical Security Issue: Remove permissive profile policy
-- and create secure function for public profile data

-- Step 1: Drop the insecure "Public limited profile view" policy
DROP POLICY IF EXISTS "Public limited profile view" ON public.profiles;

-- Step 2: Create security definer function that returns ONLY safe public fields
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  bio text,
  avatar_url text,
  account_type account_type,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  -- Only return non-sensitive public fields
  -- Excludes: instagram_access_token, instagram_user_id, instagram_token_expires_at,
  --           stripe_connect_account_id, stripe_connect_onboarding_completed,
  --           stripe_connect_charges_enabled, stripe_connect_payouts_enabled, platform_links
  SELECT 
    id,
    display_name,
    bio,
    avatar_url,
    account_type,
    created_at
  FROM public.profiles
  WHERE id = profile_user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile_data(uuid) TO authenticated;

-- Now only the "Users can view own complete profile" policy remains active
-- which allows users to view ALL their own data including sensitive tokens
-- For other users' profiles, applications must use get_public_profile_data() function