-- Add SELECT policy for creators to view their own payout requests
CREATE POLICY "Creators can view their own payout requests"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (user_owns_wallet(wallet_id, auth.uid()));