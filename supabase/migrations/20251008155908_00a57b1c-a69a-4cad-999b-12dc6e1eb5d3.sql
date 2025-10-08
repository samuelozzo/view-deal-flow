-- Fix: Enable SECURITY INVOKER mode on payout_requests_user_view
-- This ensures the view respects RLS policies and runs with the querying user's permissions
-- rather than the view creator's permissions (which would bypass RLS)

-- Recreate the view with security_invoker=on
CREATE OR REPLACE VIEW public.payout_requests_user_view
WITH (security_invoker=on)
AS
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

-- Now the view will:
-- 1. Run with the QUERYING user's permissions (security_invoker=on)
-- 2. Respect all RLS policies on the underlying payout_requests table
-- 3. Filter rows through the WHERE clause (user_owns_wallet or admin)
-- 4. Return masked IBANs for all users