-- Security Fix: Restrict sensitive profile data exposure
-- Drop the overly permissive policy that exposes Stripe Connect fields
DROP POLICY IF EXISTS "Authenticated users can view basic profile data" ON public.profiles;

-- Create a view that only exposes safe profile fields
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Add a more restrictive policy that users can only see full profile data for themselves
-- Other users will need to use the public_profiles view
CREATE POLICY "Users can view their own complete profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can still view all profiles (existing policy remains)
-- "Admins can view all profiles" policy already exists

-- Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 
'Public profile view for marketplace discovery.
Exposes only non-sensitive fields: display_name, avatar_url, bio, account_type, created_at.
Sensitive fields (Stripe Connect status, platform tokens) are hidden.
Users can view their own complete profile via the profiles table directly.';

-- Add metadata validation comment for wallet_transactions
COMMENT ON COLUMN public.wallet_transactions.metadata IS 
'SECURITY: Do not store PII in metadata.
Prohibited data:
- Email addresses, phone numbers, full names
- Credit card numbers, CVV, expiration dates
- Street addresses, postal codes
- SSN, tax IDs, government IDs
- Passwords, tokens, API keys
Safe data examples:
- Transaction references (order_id, invoice_number)
- System flags (webhook_processed, manual_adjustment)
- Non-sensitive context (payment_method_type, currency)';
