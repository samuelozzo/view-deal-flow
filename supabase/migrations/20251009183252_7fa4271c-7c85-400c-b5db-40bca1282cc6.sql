-- Fix: Set SECURITY INVOKER on public_profiles view
-- By default, PostgreSQL views use SECURITY DEFINER (permissions of creator)
-- We need SECURITY INVOKER (permissions of querying user) to respect RLS
ALTER VIEW public.public_profiles SET (security_invoker = on);

COMMENT ON VIEW public.public_profiles IS 
'Public profile view for marketplace discovery with SECURITY INVOKER.
Exposes only non-sensitive fields: display_name, avatar_url, bio, account_type, created_at.
Sensitive fields (Stripe Connect status, platform tokens) are hidden.
Users can view their own complete profile via the profiles table directly.
This view uses SECURITY INVOKER to respect RLS policies of the querying user.';