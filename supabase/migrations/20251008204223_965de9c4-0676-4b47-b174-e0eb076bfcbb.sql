-- Add RESTRICTIVE RLS policy to payout_requests for enhanced security
-- This creates a double-layer protection: both RESTRICTIVE and PERMISSIVE policies must pass

-- Drop existing policies to recreate them with proper setup
DROP POLICY IF EXISTS "Creators can view their own payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can select all payout requests" ON public.payout_requests;

-- Add RESTRICTIVE policy that denies access by default
-- This ensures that even if other checks are bypassed, only wallet owners and admins can access
CREATE POLICY "Restrict payout_requests access to wallet owners and admins"
ON public.payout_requests
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  -- Allow access only if user owns the wallet OR is an admin
  user_owns_wallet(wallet_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Recreate PERMISSIVE policies (these work together with RESTRICTIVE)
CREATE POLICY "Creators can view their own payout requests"
ON public.payout_requests
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_owns_wallet(wallet_id, auth.uid()));

CREATE POLICY "Admins can select all payout requests"
ON public.payout_requests
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure INSERT, UPDATE, and DELETE policies are also properly restrictive
DROP POLICY IF EXISTS "Creators can create payout requests for their wallets" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can update all payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can delete payout requests" ON public.payout_requests;

-- RESTRICTIVE policy for INSERT
CREATE POLICY "Restrict payout_requests creation to wallet owners"
ON public.payout_requests
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  user_owns_wallet(wallet_id, auth.uid()) AND has_role(auth.uid(), 'creator'::app_role)
);

-- PERMISSIVE policy for INSERT
CREATE POLICY "Creators can create payout requests for their wallets"
ON public.payout_requests
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  user_owns_wallet(wallet_id, auth.uid()) AND has_role(auth.uid(), 'creator'::app_role)
);

-- RESTRICTIVE policy for UPDATE (only admins)
CREATE POLICY "Restrict payout_requests updates to admins only"
ON public.payout_requests
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- PERMISSIVE policy for UPDATE
CREATE POLICY "Admins can update all payout requests"
ON public.payout_requests
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RESTRICTIVE policy for DELETE (only admins)
CREATE POLICY "Restrict payout_requests deletion to admins only"
ON public.payout_requests
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- PERMISSIVE policy for DELETE
CREATE POLICY "Admins can delete payout requests"
ON public.payout_requests
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));