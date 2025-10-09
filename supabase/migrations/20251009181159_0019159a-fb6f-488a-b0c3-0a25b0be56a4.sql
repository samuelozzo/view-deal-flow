-- Add explicit DENY policy to user_credentials to satisfy security scanner
-- This makes it explicit that authenticated users cannot directly SELECT credentials
-- (This is already the case with RLS enabled and no permissive policy, but making it explicit helps scanners)

-- Create explicit DENY policy for direct credential access
CREATE POLICY "Block direct credential access"
ON public.user_credentials
FOR SELECT
TO authenticated
USING (false);

-- Add table comment explaining the security model
COMMENT ON TABLE public.user_credentials IS 
'SECURITY MODEL: Zero direct access to credentials.
- RLS enabled with explicit DENY policy for authenticated users
- Only accessible via SECURITY DEFINER functions:
  * get_user_stripe_account(user_id)
  * get_user_instagram_token(user_id)  
  * set_user_stripe_account(user_id, account_id, ...)
  * set_user_instagram_token(user_id, token, ...)
  * user_has_stripe_connect(user_id)
- Service role access for edge functions only
- Prevents token theft even if user session is compromised';

-- Add column comments for clarity
COMMENT ON COLUMN public.user_credentials.instagram_access_token IS 'Instagram OAuth token - only accessible via get_user_instagram_token() function';
COMMENT ON COLUMN public.user_credentials.stripe_connect_account_id IS 'Stripe Connect account ID - only accessible via get_user_stripe_account() function';
COMMENT ON COLUMN public.user_credentials.instagram_user_id IS 'Instagram user ID - only accessible via get_user_instagram_token() function';
COMMENT ON COLUMN public.user_credentials.instagram_token_expires_at IS 'Token expiration - only accessible via get_user_instagram_token() function';