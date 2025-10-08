-- Add SELECT policy for payout_requests to allow users to view their own payout requests
-- This fixes the security issue where the payout_requests_user_view couldn't work for regular users
-- because the underlying table blocked all SELECT queries for non-admins

CREATE POLICY "Users can view their own payout requests"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (user_owns_wallet(wallet_id, auth.uid()));

-- Now the payout_requests_user_view will work correctly:
-- 1. The view uses security_invoker=on (runs with querying user's permissions)
-- 2. The view has a WHERE clause filtering by wallet ownership or admin
-- 3. The underlying table now has RLS that allows users to see their own requests
-- 4. IBANs are still masked in the view for all users