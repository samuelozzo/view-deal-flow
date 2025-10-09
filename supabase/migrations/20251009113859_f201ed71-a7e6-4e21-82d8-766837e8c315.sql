-- Allow admins to update offers (needed for updating claimed_reward_cents)
CREATE POLICY "Admins can update all offers"
ON public.offers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));