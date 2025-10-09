-- Allow admins to insert wallet transactions
CREATE POLICY "Admins can create wallet transactions"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow system operations (edge functions) to insert wallet transactions
CREATE POLICY "Service role can create wallet transactions"
ON public.wallet_transactions
FOR INSERT
TO service_role
WITH CHECK (true);