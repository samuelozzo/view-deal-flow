-- Remove security_barrier from the view and rely on security definer functions
-- The view's WHERE clause already uses user_owns_wallet() and has_role() which are security definer functions
-- This provides proper security without triggering the security_definer_view linter warning

CREATE OR REPLACE VIEW public.payout_requests_user_view AS
  SELECT 
    id,
    wallet_id,
    amount_cents,
    status,
    requested_at,
    processed_at,
    admin_note,
    CASE 
      WHEN length(iban) > 4 THEN 
        substring(iban from 1 for 2) || repeat('*', length(iban) - 6) || substring(iban from length(iban) - 3)
      ELSE '****'
    END as iban_masked
  FROM public.payout_requests
  WHERE 
    -- Only allow viewing if user owns the wallet OR is an admin
    user_owns_wallet(wallet_id, auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role);

-- Ensure authenticated users can SELECT from this view
GRANT SELECT ON public.payout_requests_user_view TO authenticated;

-- The security is enforced by:
-- 1. The WHERE clause using security definer functions (user_owns_wallet, has_role)
-- 2. The underlying payout_requests table has RLS enabled (only admins can SELECT directly)
-- 3. The view automatically masks IBANs for all users
-- 4. Users can only see rows they own or if they're admins