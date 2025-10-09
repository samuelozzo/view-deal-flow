-- Fix: Consolidate duplicate RLS policies on payout_requests table
-- Remove confusion and potential security gaps from overlapping policies

-- Step 1: Drop all existing policies on payout_requests
DROP POLICY IF EXISTS "Admins can delete payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can select all payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can update all payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Creators can create payout requests for their wallets" ON public.payout_requests;
DROP POLICY IF EXISTS "Creators can view their own payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Restrict payout_requests access to wallet owners and admins" ON public.payout_requests;
DROP POLICY IF EXISTS "Restrict payout_requests creation to wallet owners" ON public.payout_requests;
DROP POLICY IF EXISTS "Restrict payout_requests deletion to admins only" ON public.payout_requests;
DROP POLICY IF EXISTS "Restrict payout_requests updates to admins only" ON public.payout_requests;

-- Step 2: Create consolidated, clear policies

-- SELECT: Wallet owners can view their own payout requests, admins can view all
CREATE POLICY "payout_requests_select_policy"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (
  -- Wallet owner can see their own requests
  user_owns_wallet(wallet_id, auth.uid())
  OR
  -- Admins can see all requests
  has_role(auth.uid(), 'admin'::app_role)
);

-- INSERT: Only creators who own the wallet can create payout requests
CREATE POLICY "payout_requests_insert_policy"
ON public.payout_requests
FOR INSERT
TO authenticated
WITH CHECK (
  user_owns_wallet(wallet_id, auth.uid())
  AND has_role(auth.uid(), 'creator'::app_role)
);

-- UPDATE: Only admins can update payout requests (for processing)
CREATE POLICY "payout_requests_update_policy"
ON public.payout_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- DELETE: Only admins can delete payout requests
CREATE POLICY "payout_requests_delete_policy"
ON public.payout_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment documenting the security model
COMMENT ON TABLE public.payout_requests IS 
'Stores payout requests including sensitive IBAN data. Access restricted to:
- SELECT: Wallet owner or admin only
- INSERT: Wallet owner with creator role only
- UPDATE: Admin only (for processing requests)
- DELETE: Admin only';

-- Note: The get_my_payout_requests() function provides additional security
-- by masking IBAN numbers when returning payout requests to users