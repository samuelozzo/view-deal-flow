-- Complete security fix: Remove deprecated sensitive columns from profiles table
-- All edge functions now use the secure user_credentials table and security definer functions

-- Drop the deprecated sensitive columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS instagram_access_token,
DROP COLUMN IF EXISTS instagram_token_expires_at,
DROP COLUMN IF EXISTS instagram_user_id,
DROP COLUMN IF EXISTS stripe_connect_account_id;

-- The profiles table now only contains non-sensitive public profile data:
-- id, account_type, display_name, avatar_url, bio, created_at, updated_at,
-- stripe_connect_onboarding_completed, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, platform_links

-- All sensitive tokens are now exclusively in the user_credentials table which has:
-- - NO direct SELECT policies (only service_role can access)
-- - Access only through security definer functions (get_user_stripe_account, get_user_instagram_token, etc.)
-- - Protection even if user credentials are compromised