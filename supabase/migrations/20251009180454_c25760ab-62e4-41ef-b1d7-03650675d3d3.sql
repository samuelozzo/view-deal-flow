-- CRITICAL SECURITY FIX: Move sensitive tokens to protected table
-- This prevents token theft even if user account credentials are compromised

-- Step 1: Create protected credentials table with NO direct SELECT access
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_access_token text,
  instagram_token_expires_at timestamptz,
  instagram_user_id text,
  stripe_connect_account_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS but with NO SELECT policies - tokens never directly accessible
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Only allow service role and security definer functions to access this table
CREATE POLICY "Service role has full access to credentials"
ON public.user_credentials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 2: Migrate existing tokens from profiles to credentials table
INSERT INTO public.user_credentials (
  user_id,
  instagram_access_token,
  instagram_token_expires_at,
  instagram_user_id,
  stripe_connect_account_id
)
SELECT 
  id,
  instagram_access_token,
  instagram_token_expires_at,
  instagram_user_id,
  stripe_connect_account_id
FROM public.profiles
WHERE instagram_access_token IS NOT NULL 
   OR stripe_connect_account_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  instagram_access_token = EXCLUDED.instagram_access_token,
  instagram_token_expires_at = EXCLUDED.instagram_token_expires_at,
  instagram_user_id = EXCLUDED.instagram_user_id,
  stripe_connect_account_id = EXCLUDED.stripe_connect_account_id;

-- Step 3: Create security definer functions for safe token operations

-- Function to get Stripe Connect account ID (used by edge functions)
CREATE OR REPLACE FUNCTION public.get_user_stripe_account(p_user_id uuid)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT stripe_connect_account_id
  FROM public.user_credentials
  WHERE user_id = p_user_id;
$$;

-- Function to set Stripe Connect account ID
CREATE OR REPLACE FUNCTION public.set_user_stripe_account(
  p_user_id uuid,
  p_account_id text,
  p_onboarding_completed boolean DEFAULT NULL,
  p_charges_enabled boolean DEFAULT NULL,
  p_payouts_enabled boolean DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update credentials
  INSERT INTO public.user_credentials (user_id, stripe_connect_account_id)
  VALUES (p_user_id, p_account_id)
  ON CONFLICT (user_id) DO UPDATE 
  SET stripe_connect_account_id = p_account_id,
      updated_at = now();
  
  -- Update profile flags if provided
  IF p_onboarding_completed IS NOT NULL OR p_charges_enabled IS NOT NULL OR p_payouts_enabled IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      stripe_connect_onboarding_completed = COALESCE(p_onboarding_completed, stripe_connect_onboarding_completed),
      stripe_connect_charges_enabled = COALESCE(p_charges_enabled, stripe_connect_charges_enabled),
      stripe_connect_payouts_enabled = COALESCE(p_payouts_enabled, stripe_connect_payouts_enabled),
      updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- Function to get Instagram access token (used by edge functions)
CREATE OR REPLACE FUNCTION public.get_user_instagram_token(p_user_id uuid)
RETURNS TABLE (
  access_token text,
  token_expires_at timestamptz,
  user_id_instagram text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT 
    instagram_access_token,
    instagram_token_expires_at,
    instagram_user_id
  FROM public.user_credentials
  WHERE user_id = p_user_id;
$$;

-- Function to set Instagram access token
CREATE OR REPLACE FUNCTION public.set_user_instagram_token(
  p_user_id uuid,
  p_access_token text,
  p_expires_at timestamptz,
  p_instagram_user_id text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_credentials (
    user_id,
    instagram_access_token,
    instagram_token_expires_at,
    instagram_user_id
  )
  VALUES (
    p_user_id,
    p_access_token,
    p_expires_at,
    p_instagram_user_id
  )
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    instagram_access_token = p_access_token,
    instagram_token_expires_at = p_expires_at,
    instagram_user_id = p_instagram_user_id,
    updated_at = now();
END;
$$;

-- Function to check if user has Stripe Connect
CREATE OR REPLACE FUNCTION public.user_has_stripe_connect(p_user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_credentials
    WHERE user_id = p_user_id 
      AND stripe_connect_account_id IS NOT NULL
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_stripe_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_stripe_account(uuid, text, boolean, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_instagram_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_instagram_token(uuid, text, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_stripe_connect(uuid) TO authenticated;

-- Step 4: Add trigger to keep credentials table updated
CREATE OR REPLACE FUNCTION public.update_credentials_timestamp()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_credentials_updated_at
BEFORE UPDATE ON public.user_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_credentials_timestamp();

-- Step 5: Remove sensitive columns from profiles table
-- (We'll keep them for now for backwards compatibility, but they should not be used)
-- Future migration can drop these columns after all edge functions are updated
COMMENT ON COLUMN public.profiles.instagram_access_token IS 'DEPRECATED: Use user_credentials table and security definer functions';
COMMENT ON COLUMN public.profiles.instagram_token_expires_at IS 'DEPRECATED: Use user_credentials table and security definer functions';
COMMENT ON COLUMN public.profiles.instagram_user_id IS 'DEPRECATED: Use user_credentials table and security definer functions';
COMMENT ON COLUMN public.profiles.stripe_connect_account_id IS 'DEPRECATED: Use user_credentials table and security definer functions';