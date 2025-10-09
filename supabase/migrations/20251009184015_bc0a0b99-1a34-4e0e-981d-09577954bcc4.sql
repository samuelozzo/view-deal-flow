-- Security Fix: Prevent Stripe Connect status exposure to competitors
-- Remove broad policy and enforce using public_profiles view for discovery

-- Drop the overly permissive policy that exposes Stripe Connect flags
DROP POLICY IF EXISTS "Authenticated users can view all profiles for discovery" ON public.profiles;

-- Recreate public_profiles view with SECURITY DEFINER
-- This allows the view to bypass RLS and show safe fields to all authenticated users
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = off)  -- This makes it SECURITY DEFINER
AS SELECT 
  id,
  display_name,
  avatar_url,
  bio,
  account_type,
  created_at
FROM profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add comprehensive comment
COMMENT ON VIEW public.public_profiles IS 
'Public profile view for marketplace user discovery - SECURITY DEFINER mode.
Exposes only non-sensitive fields: display_name, avatar_url, bio, account_type, created_at.

HIDDEN SENSITIVE FIELDS (for privacy and competitive protection):
- stripe_connect_payouts_enabled (prevents competitor poaching)
- stripe_connect_charges_enabled (prevents competitor poaching)
- stripe_connect_onboarding_completed (prevents competitor poaching)
- platform_links (may contain sensitive social media data)

ACCESS MODEL:
- View your own complete profile: Query profiles table directly (allowed by RLS)
- View other users for discovery: Query public_profiles view (safe fields only)
- Admins: Full access to profiles table

DEVELOPER USAGE:
// ✅ CORRECT: View other users
const { data } = await supabase.from("public_profiles").select("*");

// ✅ CORRECT: View own profile (all fields)
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

// ❌ WRONG: Direct query for other users (blocked by RLS)
const { data } = await supabase
  .from("profiles") 
  .select("*")
  .neq("id", user.id);';

-- Add a comment on profiles table explaining the security model
COMMENT ON TABLE public.profiles IS 
'User profiles with multi-layer access control to protect business-sensitive data.

SENSITIVE FIELDS (competitors could use this data):
- stripe_connect_* flags: Indicate payment processing capability
- platform_links: May contain business-critical social media accounts

RLS POLICIES:
- Users: Can view/edit only their own complete profile
- Admins: Full access to all profiles
- Marketplace discovery: Use public_profiles view (hides sensitive fields)

This design prevents:
1. Competitor intelligence gathering (who is processing payments)
2. User poaching (targeting successful payment processors)
3. Social engineering attacks (sensitive platform links)';