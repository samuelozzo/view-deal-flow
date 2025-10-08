-- Fix payout_requests_user_view security by granting proper access
-- Views cannot have RLS policies in PostgreSQL, but we can grant permissions

-- 1. Grant SELECT permission to authenticated users on the view
GRANT SELECT ON public.payout_requests_user_view TO authenticated;

-- 2. Recreate the view with security_barrier to prevent information leakage
CREATE OR REPLACE VIEW public.payout_requests_user_view 
WITH (security_barrier = true)
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

-- This view now has built-in access control in the WHERE clause
-- It will only return rows that the current user is authorized to see