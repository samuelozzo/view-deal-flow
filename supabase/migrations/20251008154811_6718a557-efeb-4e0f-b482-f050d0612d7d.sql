-- Remove creator access to raw payout_requests table with unmasked IBANs
-- Creators should ONLY access masked data via get_my_payout_requests() RPC function

-- 1. Drop the policy that allows creators to SELECT from raw payout_requests
DROP POLICY IF EXISTS "Creators can view their own payout requests" ON public.payout_requests;

-- 2. Drop the duplicate admin SELECT policy
DROP POLICY IF EXISTS "Only admins can view full payout requests with IBAN" ON public.payout_requests;

-- Now only these policies exist on payout_requests:
-- - "Admins can select all payout requests" (SELECT for admins only)
-- - "Admins can update all payout requests" (UPDATE for admins only)
-- - "Admins can delete payout requests" (DELETE for admins only)
-- - "Creators can create payout requests for their wallets" (INSERT for creators)

-- Creators access their payout data ONLY through:
-- - get_my_payout_requests() RPC function (returns masked IBANs)
-- This ensures IBANs are never exposed to creators, even in their own records