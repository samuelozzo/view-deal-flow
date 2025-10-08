-- Fix conflicting RLS policies on payout_requests table
-- Separate admin ALL policy into specific policies and add creator SELECT access

-- 1. Drop the conflicting "ALL" command policy for admins
DROP POLICY IF EXISTS "Admins can view and update all payout requests" ON public.payout_requests;

-- 2. Create separate admin policies for better granular control
CREATE POLICY "Admins can select all payout requests"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all payout requests"
ON public.payout_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payout requests"
ON public.payout_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Allow creators to SELECT their own payout requests
-- This enables them to view their payout history
-- The payout_requests_user_view will automatically show masked IBANs for non-admin users
CREATE POLICY "Creators can view their own payout requests"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (
  user_owns_wallet(wallet_id, auth.uid()) 
  AND has_role(auth.uid(), 'creator'::app_role)
);