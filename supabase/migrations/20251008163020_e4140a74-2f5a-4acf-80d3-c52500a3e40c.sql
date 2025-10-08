-- SECURITY FIX: Remove user SELECT access to payout_requests table
-- Users should only access payout requests through payout_requests_user_view which masks IBANs
-- Only admins need to see full IBANs to process payouts

-- Drop the user SELECT policy (keeps admin policy intact)
DROP POLICY IF EXISTS "Users can view their own payout requests" ON public.payout_requests;

-- Add explicit GRANT on the view to ensure users can access it
GRANT SELECT ON public.payout_requests_user_view TO authenticated;

-- Security status after this migration:
-- ✅ Users can only see masked IBANs via payout_requests_user_view
-- ✅ Admins can see full IBANs via direct payout_requests table access
-- ✅ Even if a hacker gets another user's wallet_id, they can't query payout_requests directly
-- ✅ The view filters by user_owns_wallet, so users only see their own requests