-- Security Fix: Block direct access to payout_requests to prevent IBAN exposure
-- Users must use get_my_payout_requests_masked() function for secure access

-- Drop all existing policies on payout_requests
DROP POLICY IF EXISTS "payout_requests_select_policy" ON public.payout_requests;
DROP POLICY IF EXISTS "payout_requests_insert_policy" ON public.payout_requests;
DROP POLICY IF EXISTS "payout_requests_update_policy" ON public.payout_requests;
DROP POLICY IF EXISTS "payout_requests_delete_policy" ON public.payout_requests;

-- Create a single policy that blocks ALL direct access for regular users
-- This forces developers to use get_my_payout_requests_masked() which hides IBANs
CREATE POLICY "Block direct access to payout_requests"
ON public.payout_requests
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Service role still has full access (needed for edge functions)
CREATE POLICY "Service role has full access to payout_requests"
ON public.payout_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admin role still has full access (needed for admin dashboard)
CREATE POLICY "Admins have full access to payout_requests"
ON public.payout_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add table comment explaining the security model
COMMENT ON TABLE public.payout_requests IS 
'Payout requests containing sensitive IBAN bank account numbers.
SECURITY MODEL:
- Direct table access is BLOCKED for regular users to prevent IBAN exposure
- Users must call get_my_payout_requests_masked() function which returns masked IBANs
- Service role: Full access (for edge functions processing payouts)
- Admins: Full access (for reviewing and approving payout requests)
- Regular users: NO direct access - must use secure functions

DEVELOPER NOTE: Never query this table directly from the frontend.
Always use: supabase.rpc("get_my_payout_requests_masked")';

-- Update the masked function comment to clarify its security role
COMMENT ON FUNCTION public.get_my_payout_requests_masked() IS 
'Secure function for users to view their own payout requests with masked IBANs.
Returns: id, wallet_id, amount_cents, status, requested_at, processed_at, admin_note, iban_masked
IBAN masking: Shows only first 2 and last 4 characters (e.g., "IT**************1234")
This is the ONLY way regular users should access payout request data.';