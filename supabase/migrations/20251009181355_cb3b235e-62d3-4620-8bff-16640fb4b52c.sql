-- Fix: Block ALL public access to user_credentials (authenticated + anon roles)
-- The previous policy only blocked 'authenticated' role, not 'anon' role

-- Drop the incomplete policy
DROP POLICY IF EXISTS "Block direct credential access" ON public.user_credentials;

-- Create comprehensive blocking policy for ALL non-service roles
CREATE POLICY "Block all direct credential access"
ON public.user_credentials
FOR ALL
TO PUBLIC
USING (false)
WITH CHECK (false);

-- Note: This blocks both 'authenticated' and 'anon' roles
-- Only service_role can access (via "Service role has full access to credentials" policy)
-- Edge functions use service_role credentials, so they work normally
-- Security definer functions execute with elevated privileges, so they work normally

-- Verify the table is properly locked down
COMMENT ON TABLE public.user_credentials IS 
'SECURITY MODEL: Zero direct access - Maximum protection.
- RLS enabled with DENY ALL policy for PUBLIC (anon + authenticated roles)
- Only service_role can access (for edge functions)
- User access ONLY via SECURITY DEFINER functions:
  * get_user_stripe_account(user_id)
  * get_user_instagram_token(user_id)  
  * set_user_stripe_account(user_id, account_id, ...)
  * set_user_instagram_token(user_id, token, ...)
  * user_has_stripe_connect(user_id)
- Prevents token theft via API, direct queries, or session hijacking
- Defense in depth: even if RLS is bypassed, functions validate access';