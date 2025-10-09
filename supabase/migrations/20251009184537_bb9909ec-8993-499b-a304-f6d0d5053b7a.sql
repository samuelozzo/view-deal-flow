-- Security Fix: Revoke anonymous access to public_profiles view
-- Only authenticated users should be able to discover other users

-- Revoke all access from anon role (unauthenticated users)
REVOKE ALL ON public.public_profiles FROM anon;

-- Revoke all access from public role (catch-all)
REVOKE ALL ON public.public_profiles FROM public;

-- Ensure only authenticated users can view profiles
-- Re-grant to be explicit (may already be granted)
GRANT SELECT ON public.public_profiles TO authenticated;

-- Update view comment to reflect authentication requirement
COMMENT ON VIEW public.public_profiles IS 
'Public profile view for authenticated marketplace user discovery - SECURITY DEFINER mode.
Exposes only non-sensitive fields: display_name, avatar_url, bio, account_type, created_at.

AUTHENTICATION REQUIREMENT: 
- ✓ Authenticated users can SELECT (marketplace discovery)
- ✗ Anonymous users CANNOT access (prevents scraping)

HIDDEN SENSITIVE FIELDS (for privacy and competitive protection):
- stripe_connect_payouts_enabled (prevents competitor poaching)
- stripe_connect_charges_enabled (prevents competitor poaching)
- stripe_connect_onboarding_completed (prevents competitor poaching)
- platform_links (may contain sensitive social media data)

ACCESS MODEL:
- View your own complete profile: Query profiles table directly (allowed by RLS)
- View other authenticated users: Query public_profiles view (safe fields only)
- Anonymous users: No access (prevents scraping)
- Admins: Full access to profiles table

SECURITY LAYERS:
1. Authentication required (blocks anonymous scraping)
2. RLS on profiles table (blocks direct sensitive data access)
3. Filtered view (exposes only safe fields)

DEVELOPER USAGE:
// ✅ CORRECT: View other authenticated users
const { data } = await supabase.from("public_profiles").select("*");

// ✅ CORRECT: View own profile (all fields)
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

// ❌ BLOCKED: Anonymous access (must be logged in)
// This will fail with permission error if not authenticated';