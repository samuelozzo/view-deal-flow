-- Allow admins to update wallets
CREATE POLICY "Admins can update all wallets"
ON public.wallets
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role (edge functions) to update wallets
CREATE POLICY "Service role can update wallets"
ON public.wallets
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);